import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: { accessKeyId: process.env.B2_KEY_ID!, secretAccessKey: process.env.B2_APPLICATION_KEY! },
  forcePathStyle: true,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return new Response("Missing key", { status: 400 });

    console.log('S3 GET: Fetching key:', key);

    const obj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    
    if (!obj.Body) {
      return new Response("Object not found", { status: 404 });
    }

    // Convert stream to buffer for faster response
    const stream = obj.Body as any;
    const chunks: Uint8Array[] = [];
    const reader = stream.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);
    const contentType = obj.ContentType || "application/octet-stream";
    
    console.log('S3 GET: Returning buffer of size:', buffer.length);
    
    return new Response(buffer, { 
      headers: { 
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      } 
    });
  } catch (error) {
    console.error('S3 GET Error:', error);
    return new Response("Internal server error", { status: 500 });
  }
}