import * as XLSX from 'xlsx';
import { extractPDFContent } from './pdfUtils';

const MAX_FILE_SIZE_MB = 10;
const MAX_TEXT_LENGTH = 50000; // characters

interface FileProcessingResult {
  success: boolean;
  content: string;
  error?: string;
}

export async function extractFileContent(file: File): Promise<string> {
  try {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `❌ File is too large (${fileSizeMB.toFixed(1)}MB). Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`;
    }

    // Process based on file type
    const result = await processFile(file);
    
    if (!result.success) {
      return `❌ ${result.error}`;
    }

    if (result.content.length > MAX_TEXT_LENGTH) {
      return `❌ Extracted content is too long. Please upload a smaller file or reduce the content.`;
    }

    return result.content.trim();
  } catch (error: any) {
    console.error('Error processing file:', error);
    return '❌ Unable to process this file. Please try with a different file.';
  }
}

async function processFile(file: File): Promise<FileProcessingResult> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Handle PDFs
  if (fileType === 'application/pdf') {
    const content = await extractPDFContent(file);
    // If the content starts with ❌, it's an error message
    if (content.startsWith('❌')) {
      return { success: false, content: '', error: content.substring(2) };
    }
    return { success: true, content };
  }

  // Handle Excel files
  if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileType === 'application/x-excel' ||
      fileType === 'application/x-msexcel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsb') ||
      fileName.endsWith('.xlsm')) {
    return await processExcelFile(file);
  }

  // Handle text files
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await processTextFile(file);
  }

  // Handle images
  if (fileType.startsWith('image/')) {
    return await processImage(file);
  }

  return {
    success: false,
    content: '',
    error: 'Unsupported file type. Please upload a PDF, Excel, text file, or image.'
  };
}

async function processExcelFile(file: File): Promise<FileProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    
    let content = '';
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Get sheet range
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const maxRows = Math.min(range.e.r + 1, 1000); // Limit to 1000 rows
      
      // Add sheet name if there are multiple sheets
      if (workbook.SheetNames.length > 1) {
        content += `Sheet: ${sheetName}\n`;
      }
      
      // Convert to readable format with headers
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd',
        range: 0
      });
      
      // Process rows
      for (let i = 0; i < Math.min(jsonData.length, maxRows); i++) {
        const row = jsonData[i];
        if (Array.isArray(row)) {
          const rowText = row
            .map(cell => {
              if (cell === null || cell === undefined) return '';
              return cell.toString().trim();
            })
            .filter(cell => cell.length > 0)
            .join('\t');
          
          if (rowText.length > 0) {
            content += rowText + '\n';
          }
        }
      }
      
      content += '\n';
    }
    
    if (!content.trim()) {
      return {
        success: false,
        content: '',
        error: 'The Excel file appears to be empty or contains no readable data.'
      };
    }
    
    return { success: true, content: content.trim() };
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      content: '',
      error: 'Unable to read Excel file. Please ensure it\'s a valid Excel document.'
    };
  }
}

async function processTextFile(file: File): Promise<FileProcessingResult> {
  try {
    const text = await file.text();
    return { success: true, content: text };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: 'Unable to read text file. Please ensure it\'s a valid text document.'
    };
  }
}

async function processImage(file: File): Promise<FileProcessingResult> {
  try {
    // For images, we'll return a message explaining that we can only see the image
    // but can't extract text without OCR capabilities
    return {
      success: true,
      content: `[This is an image file: ${file.name}]\n\nI can see that you've shared an image, but I can only process text content. If this image contains text you'd like me to read, please consider:\n1. Converting it to a PDF with text recognition (OCR)\n2. Typing out the important text\n3. Using a text-based format instead`
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: 'Unable to process this image. Please try with a different file.'
    };
  }
} 