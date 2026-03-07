'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

export default function FileUploader({
  onFileSelect,
  accept = '*',
  maxSizeMB = 10,
  label = 'Upload file',
  description,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      {selectedFile ? (
        <div className="flex items-center gap-3 p-3 border border-border bg-muted/30">
          <div className="w-8 h-8 flex items-center justify-center bg-muted flex-shrink-0">
            {isImage ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border cursor-pointer transition-colors',
            isDragging && 'border-primary bg-muted/50',
            'hover:border-primary/60 hover:bg-muted/30'
          )}
        >
          <Upload size={20} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-foreground">
              Drop file here or <span className="text-primary font-medium underline">browse</span>
            </p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            <p className="text-xs text-muted-foreground mt-1">Max size: {maxSizeMB}MB</p>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
