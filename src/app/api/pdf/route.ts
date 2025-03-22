import { NextResponse } from 'next/server';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Configure the worker
if (typeof window === 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
}

// Ensure route handler only runs at runtime
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return NextResponse.json({
      text: fullText.trim() || 'No text found in PDF'
    });
  } catch (error) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
} 