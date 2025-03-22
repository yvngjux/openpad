import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
}

export async function processPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true
    });
    
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
    
    return fullText.trim() || 'No text could be extracted from this PDF';
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
}

export async function processImage(file: File, useGoogleVision = false): Promise<string> {
  if (useGoogleVision) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process with Vision API');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data.text;
    } catch (error) {
      console.error('Error processing image with Google Vision:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  } else {
    throw new Error('Image processing is currently not available without Google Vision API');
  }
}

export async function processFile(file: File, useGoogleVision = false): Promise<string> {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return processPDF(file);
  }

  if (fileType.startsWith('image/')) {
    return processImage(file, true); // Always use Google Vision for images
  }

  throw new Error('Unsupported file type. Please upload a PDF or image file.');
} 