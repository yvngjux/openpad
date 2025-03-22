// Declare PDF.js types
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const MAX_PAGES = 15;
const BATCH_SIZE = 2;
const PAGE_TIMEOUT = 45000;
const MAX_RETRIES = 2;

export async function extractPDFContent(file: File): Promise<string> {
  try {
    console.log(`Starting to process PDF: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create blob URL
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Load PDF.js script dynamically
    if (!window.pdfjsLib) {
      await loadPDFScript();
    }
    
    // Load the PDF document
    const loadingTask = window.pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Check page limit
    if (numPages > MAX_PAGES) {
      URL.revokeObjectURL(url);
      return '❌ This document is too large. Please upload a PDF with 15 pages or fewer.';
    }
    
    let fullText = '';
    let failedPages = 0;
    
    // Process pages in batches
    for (let startPage = 1; startPage <= numPages; startPage += BATCH_SIZE) {
      const endPage = Math.min(startPage + BATCH_SIZE - 1, numPages);
      
      // Process pages sequentially within batch to reduce memory pressure
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        let pageText = '';
        let retryCount = 0;
        let success = false;
        
        while (retryCount <= MAX_RETRIES && !success) {
          try {
            pageText = await processPageWithTimeout(pdf, pageNum);
            success = true;
          } catch (error) {
            retryCount++;
            
            if (retryCount > MAX_RETRIES) {
              pageText = `[Error processing page ${pageNum}]\n`;
              failedPages++;
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        fullText += pageText + '\n\n';
        
        // Check if too many pages are failing
        if (failedPages > Math.min(3, Math.floor(numPages * 0.2))) {
          URL.revokeObjectURL(url);
          return '❌ Unable to read this PDF. Please ensure the document contains selectable text and try again.';
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Clean up
    URL.revokeObjectURL(url);
    return fullText.trim();
  } catch (error: any) {
    console.error('Fatal error parsing PDF:', error);
    return '❌ Unable to process this PDF. Please try with a different document.';
  }
}

async function processPageWithTimeout(pdf: any, pageNum: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let isResolved = false;
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`Timeout processing page ${pageNum}`));
      }
    }, PAGE_TIMEOUT);

    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      if (!textContent || !textContent.items) {
        throw new Error(`Invalid text content structure for page ${pageNum}`);
      }
      
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .filter(Boolean)
        .join(' ');
      
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve(pageText || `[Empty page ${pageNum}]`);
      }
    } catch (error) {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(error);
      }
    }
  });
}

async function loadPDFScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded and initialized
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      resolve();
      return;
    }

    // Load main script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = () => {
      // Wait a bit to ensure pdfjsLib is available
      setTimeout(() => {
        if (!window.pdfjsLib) {
          reject(new Error('PDF.js library not found after script load'));
          return;
        }

        // Load worker script
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        workerScript.async = true;

        workerScript.onload = () => {
          // Initialize worker
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerScript.src;
          resolve();
        };

        workerScript.onerror = () => {
          reject(new Error('Failed to load PDF.js worker script'));
        };

        document.head.appendChild(workerScript);
      }, 100);
    };

    script.onerror = () => {
      reject(new Error('Failed to load PDF.js main script'));
    };

    document.head.appendChild(script);
  });
} 