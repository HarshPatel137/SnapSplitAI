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

const systemPrompt = `You are an expert receipt parser specializing in extracting accurate data from restaurant and retail receipts.

ANALYSIS PROCESS:
1. Scan the entire receipt image carefully
2. Identify the merchant name (usually at the top)
3. Look for the date (various formats accepted)
4. Find ALL line items that represent actual products/food/drinks purchased
5. For each item, extract: name, quantity, and individual unit price
6. Calculate running subtotal to verify accuracy
7. Extract tax and tip percentages if present

CRITICAL EXTRACTION RULES:
- ONLY extract actual purchased items (food, drinks, products)
- EXCLUDE: taxes, tips, service charges, discounts, totals, subtotals
- If quantity is not explicitly shown, default to qty = 1  
- For bundled items (e.g., "2 Burgers $25.98"), calculate per-unit price (12.99 each)
- If an item shows multiple quantities, extract as separate entries OR use the qty field correctly
- Prices must be positive numbers (use 0 only if truly unclear)
- Names should be descriptive but concise

VALIDATION REQUIREMENTS:
- Your extracted items subtotal should approximately match the receipt's subtotal
- All prices must be reasonable for the item type
- Quantities must be positive integers
- Tax percentage should be decimal format (0.0875 for 8.75%)
- Tip percentage should be decimal format (0.18 for 18%)

SPECIAL CASES:
- Multiple sizes/options: Include size in name ("Large Coffee", "Medium Fries")  
- Combo meals: Break down into individual items if possible
- Unclear prices: Make best estimate based on similar items and context
- Foreign currency: Convert to USD if possible, otherwise specify currency

Return ONLY valid JSON with no explanations:

{
  "merchant": "Restaurant Name",
  "date": "2024-01-01", 
  "currency": "USD",
  "items": [
    {"name": "Item Name", "qty": 1, "price": 12.99}
  ],
  "taxPct": 0.0875,
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
  model: "gpt-5o-mini", // Instead of gpt-4o-mini
  messages: [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { 
          type: "text", 
          text: `Please analyze this receipt image carefully and extract all items with their exact quantities and prices. 
          
          Step-by-step process:
          1. First identify all line items (food/drink items only, ignore taxes, tips, service charges)
          2. For each item, find the exact quantity (if not shown, assume 1)
          3. Find the exact price per item (not total if multiple quantities)
          4. Calculate subtotal to verify accuracy
          5. Extract tax percentage and tip percentage if shown
          6. Return only the JSON object with no explanations` 
        },
        { 
          type: "image_url", 
          image_url: { 
            url: base64Image,
            detail: "high" // Important for better image analysis
          } 
        },
      ],
    },
  ],
  response_format: { type: "json_object" },
  temperature: 1, // Use 0 for more consistent results
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