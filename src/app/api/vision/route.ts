import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';

const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [result] = await client.textDetection(buffer);
    
    return NextResponse.json({
      text: result.textAnnotations?.[0]?.description || 'No text found in image'
    });
  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
} 