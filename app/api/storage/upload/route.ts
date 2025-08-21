import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: { accessKeyId: process.env.B2_KEY_ID!, secretAccessKey: process.env.B2_APPLICATION_KEY! },
  forcePathStyle: true,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const filename = (form.get("filename") as string) || "upload.bin";
    const type = (form.get("type") as string) || "application/octet-stream";
    if (!file) return NextResponse.json({ error: "file missing" }, { status: 400 });

    const key = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: bytes, ContentType: type }));
    const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/s3/get?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ 
    publicUrl: `http://localhost:3000/api/s3/get?key=${encodeURIComponent(key)}`,
    key: key // Add this line to return the raw B2 key
  });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 }); }
}
