import React from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/dropzone';
import { X, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadModal({ isOpen, onClose, onFilesSelected }: FileUploadModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-50 w-full max-w-md"
          >
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_0_32px_-8px_rgba(0,0,0,0.12)]">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-medium text-gray-900">Upload Files</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close upload dialog"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <Dropzone
                maxFiles={10}
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/x-excel': ['.xls'],
                  'application/x-msexcel': ['.xls'],
                  'text/csv': ['.csv'],
                  'image/*': ['.png', '.jpg', '.jpeg'],
                  'text/plain': ['.txt'],
                }}
                onDrop={(acceptedFiles) => {
                  onFilesSelected(acceptedFiles);
                  onClose();
                }}
                className="min-h-[200px] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="rounded-full bg-blue-50 p-3">
                    <UploadCloud className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="mb-1 text-base font-medium text-gray-900">
                      Drop your files here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse from your computer
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Accepts PDF, Excel, CSV, images, and text files
                  </p>
                </div>
                <DropzoneContent />
              </Dropzone>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 