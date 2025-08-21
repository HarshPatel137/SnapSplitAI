import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

// -------- More forgiving JSON schema
const Item = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1).default(1),
  price: z.number().nonnegative().default(0),
});
const ExtractSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  currency: z.string().default("USD"),
  items: z.array(Item).min(1),
  taxPct: z.number().min(0).max(0.5).optional(),
  tipPct: z.number().min(0).max(0.5).optional(),
});

const systemPrompt = `You are a meticulous receipt parser. Extract data from receipts and return ONLY a JSON object.

CRITICAL REQUIREMENTS:
- Every item MUST have "name" (string), "qty" (positive integer), and "price" (positive number)
- If qty is missing, assume qty = 1
- If price is unclear, check again and try to make a best estimate as a positive number
- Always ensure the subtotal returned is the same as the one on the receipt, if not check all prices of previous items with the image and revalute thier price until the subtotal matches the subtotal from the image.
- taxPct and tipPct should be exact decimals (e.g., 0.13 for 13%)
- Only include actual food/drink items, not taxes, tips, or totals
- Return valid JSON only, no explanations, only return final values per item 

Example format:
{
  "merchant": "Restaurant Name",
  "date": "2024-01-01",
  "currency": "USD",
  "items": [
    {"name": "Burger", "qty": 1, "price": 12.99},
    {"name": "Fries", "qty": 2, "price": 4.50}
  ],
  "taxPct": 0.13,
  "tipPct": 0.18
}`;

// Initialize S3 client for B2 (matching your existing config)
const s3Client = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: { 
    accessKeyId: process.env.B2_KEY_ID!, 
    secretAccessKey: process.env.B2_APPLICATION_KEY! 
  },
  forcePathStyle: true,
});

async function getImageFromB2AsBase64(key: string): Promise<string> {
  try {
    console.log('Fetching image directly from B2:', key);
    console.log('Using bucket:', process.env.S3_BUCKET);
    
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No image data received from B2');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log('Image size from B2:', buffer.length, 'bytes');
    
    const base64 = buffer.toString('base64');
    const contentType = response.ContentType || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('B2 fetch error:', error);
    throw new Error(`Failed to fetch image from B2: ${error}`);
  }
}

async function downloadImageAsBase64(url: string): Promise<string> {
  console.log('Downloading image from:', url);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Downloaded image size:', arrayBuffer.byteLength, 'bytes');
    
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Download error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, key } = body;
    
    if (!imageUrl && !key) {
      throw new Error("Either imageUrl or key is required");
    }

    console.log('Extract API called with:', { imageUrl: !!imageUrl, key: !!key });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    let base64Image: string;
    
    // Try direct B2 access first if key is provided
    if (key) {
      console.log('Using direct B2 access with key:', key);
      base64Image = await getImageFromB2AsBase64(key);
    } else {
      console.log('Using URL download method');
      base64Image = await downloadImageAsBase64(imageUrl);
    }

    console.log('Sending to OpenAI...');
    
    const resp = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract items from this receipt and return ONLY JSON matching the schema." },
            { 
              type: "image_url", 
              image_url: { 
                url: base64Image 
              } 
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1000,
    });

    const raw = resp.choices[0]?.message?.content;
    if (!raw) throw new Error("Model returned empty response");

    console.log('Raw OpenAI response:', raw);
    
    const cleaned = raw.replace(/```json|```/g, "").trim();
    console.log('Cleaned JSON string:', cleaned);
    
    let json;
    try {
      json = JSON.parse(cleaned);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Invalid JSON response from AI: ${parseError}`);
    }

    // Validate and fix the data before Zod validation
    if (json.items && Array.isArray(json.items)) {
      json.items = json.items.map((item: any, index: number) => {
        console.log(`Processing item ${index}:`, item);
        
        return {
          name: item.name || `Item ${index + 1}`,
          qty: typeof item.qty === 'number' && item.qty > 0 ? item.qty : 1,
          price: typeof item.price === 'number' && item.price >= 0 ? item.price : 0
        };
      });
      
      console.log('Fixed items:', json.items);
    }

    // Validate strictly with Zod
    const data = ExtractSchema.parse(json);
    console.log('Extraction successful:', data);
    
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("EXTRACT_ERROR:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}