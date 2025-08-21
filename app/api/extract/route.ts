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

const improvedSystemPrompt = `You are an expert receipt parser specializing in extracting accurate data from restaurant and retail receipts.
Return ONLY valid JSON with no explanations:

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
    
    // Try multiple models in order of preference
    const models = [
      { name: "gpt-5-mini", useNewParams: true },
      { name: "gpt-4o", useNewParams: false },
      { name: "gpt-4o-mini", useNewParams: false }
    ];

    let lastError: any = null;

    for (const modelConfig of models) {
      try {
        console.log(`Trying model: ${modelConfig.name}`);
        
        const requestParams: any = {
          model: modelConfig.name,
          messages: [
            { role: "system", content: improvedSystemPrompt },
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `Please analyze this receipt image carefully and extract all items with their exact quantities and prices. Return only valid JSON.` 
                },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: base64Image,
                    detail: "high"
                  } 
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        };

        // Use appropriate parameters for each model
        if (modelConfig.useNewParams) {
          requestParams.temperature = 1;
          requestParams.max_completion_tokens = 1500;
        } else {
          requestParams.temperature = 0.1;
          requestParams.max_tokens = 1500;
        }

        const resp = await client.chat.completions.create(requestParams);
        
        console.log('Full OpenAI response:', JSON.stringify(resp, null, 2));
        
        const raw = resp.choices[0]?.message?.content;
        
        if (!raw) {
          console.warn(`${modelConfig.name} returned empty response, trying next model...`);
          lastError = new Error(`${modelConfig.name} returned empty response`);
          continue;
        }

        console.log(`Raw ${modelConfig.name} response:`, raw);
        console.log('Raw response length:', raw.length);
        
        // More robust JSON cleaning
        let cleaned = raw.replace(/```json|```/g, "").trim();
        
        // Handle potential incomplete responses
        if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
          console.warn('Response appears incomplete, attempting to fix...');
          const lastBraceIndex = cleaned.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            cleaned = cleaned.substring(0, lastBraceIndex + 1);
          }
        }
        
        console.log('Cleaned JSON string:', cleaned);
        
        let json;
        try {
          json = JSON.parse(cleaned);
          console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (parseError) {
          console.error('JSON parse error with', modelConfig.name, ':', parseError);
          console.error('Problematic string:', cleaned);
          
          // Try alternative parsing approaches
          try {
            const fixedJson = cleaned
              .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
              .replace(/,\s*$/, '') // Remove trailing comma at end
              .replace(/\n/g, ' ') // Remove newlines
              .replace(/\s+/g, ' '); // Normalize whitespace
            
            json = JSON.parse(fixedJson);
            console.log('Successfully parsed with fixes:', json);
          } catch (secondError) {
            console.error(`Failed to parse JSON from ${modelConfig.name}, trying next model...`);
            lastError = new Error(`Invalid JSON from ${modelConfig.name}: ${parseError}`);
            continue;
          }
        }

        // If we got here, we have valid JSON - validate and return
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
        console.log(`Extraction successful with ${modelConfig.name}:`, data);
        
        return NextResponse.json({ data, model_used: modelConfig.name });

      } catch (modelError) {
        console.error(`Error with ${modelConfig.name}:`, modelError);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed
    throw new Error(`All models failed. Last error: ${lastError?.message || lastError}`);

  } catch (e: any) {
    console.error("EXTRACT_ERROR:", e);
    return NextResponse.json({ 
      error: String(e?.message || e),
      details: "Receipt parsing failed with all attempted models"
    }, { status: 500 });
  }
}