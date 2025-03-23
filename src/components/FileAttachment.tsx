import React from 'react';
import { FileText, Image, File, Table, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileAttachmentProps {
  fileName: string;
  fileType: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export function FileAttachment({
  fileName,
  fileType,
  onRemove,
  showRemoveButton = true
}: FileAttachmentProps) {
  const getFileIcon = () => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (type.includes('image')) {
      return <Image className="w-4 h-4 text-blue-500" />;
    } else if (type.includes('excel') || type.includes('spreadsheet') || fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.csv')) {
      return <Table className="w-4 h-4 text-green-500" />;
    } else if (type.includes('word') || type.includes('document') || fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="inline-flex items-center mr-2 px-3 py-1.5 bg-gray-100 rounded-lg group hover:bg-gray-200 transition-colors"
    >
      <div className="flex items-center gap-2 max-w-[280px]">
        {getFileIcon()}
        <span className="text-sm text-gray-700 truncate">
          {fileName}
        </span>
      </div>
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-300/50 transition-colors"
          aria-label={`Remove ${fileName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
} 