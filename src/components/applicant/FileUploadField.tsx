import React, { useState, useRef } from 'react';
import { UploadedFileRecord } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  RefreshCw,
  File,
  Check
} from 'lucide-react';

interface FileUploadFieldProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  allowedExtensions?: string[];
  maxFileSizeMb?: number;
  value?: UploadedFileRecord;
  onChange: (fileRecord: UploadedFileRecord | null) => void;
  error?: string;
  disabled?: boolean;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  label,
  description,
  required = false,
  allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
  maxFileSizeMb = 5,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const formatExtensions = allowedExtensions.map(ext => ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`);

  const handleFileSelection = (file: File) => {
    setLocalError(null);

    // 1. File Type / Extension Validation
    const fileName = file.name;
    const fileExt = '.' + fileName.split('.').pop()?.toLowerCase();
    const isAllowedExt = formatExtensions.includes(fileExt);

    if (!isAllowedExt) {
      const err = `Invalid file type. Allowed formats: ${formatExtensions.join(', ')}`;
      setLocalError(err);
      return;
    }

    // 2. File Size Validation
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > maxFileSizeMb) {
      const err = `File size (${fileSizeMb.toFixed(1)} MB) exceeds the maximum allowed limit of ${maxFileSizeMb} MB.`;
      setLocalError(err);
      return;
    }

    // 3. Upload simulation with progress tracking
    setUploadProgress(15);
    const fileId = 'file-' + Date.now().toString(36);

    const tempRecord: UploadedFileRecord = {
      id: fileId,
      fieldId: id,
      fileName: file.name,
      fileSizeMb: parseFloat(fileSizeMb.toFixed(2)),
      fileType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
    };

    onChange(tempRecord);

    let current = 25;
    const interval = setInterval(() => {
      current += 25;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadProgress(null);
          onChange({
            ...tempRecord,
            status: 'completed',
            fileUrl: URL.createObjectURL(file),
          });
        }, 150);
      }
    }, 100);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setLocalError(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayedError = error || localError;

  return (
    <div className="space-y-1.5" id={`field-container-${id}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <span className="text-[10px] text-slate-600">
          Max {maxFileSizeMb}MB • {formatExtensions.slice(0, 4).join(', ')}
        </span>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept={formatExtensions.join(',')}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Upload Box / Uploaded State */}
      {!value || value.status === 'error' ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50/70' 
              : displayedError
              ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/70'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-800">
              <span className="text-indigo-600 hover:underline">Click to upload document</span> or drag & drop
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Supported formats: {formatExtensions.join(', ')} (Up to {maxFileSizeMb} MB)
            </div>
          </div>
        </div>
      ) : value.status === 'uploading' || uploadProgress !== null ? (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-indigo-900 font-semibold truncate max-w-[80%]">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <span className="truncate">{value.fileName}</span>
            </div>
            <span className="text-indigo-700 font-bold">{uploadProgress || 50}%</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress || 50}%` }}
            />
          </div>
          <div className="text-[10px] text-indigo-700">Uploading & validating file checksum...</div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1.5">
                <span className="truncate">{value.fileName}</span>
                <span className="inline-flex items-center text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                  <Check className="w-3 h-3 mr-0.5" /> Validated
                </span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                {value.fileSizeMb} MB • Uploaded {new Date(value.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {value.fileUrl && (
              <a
                href={value.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                title="Preview Document"
              >
                <Eye className="w-4 h-4" />
              </a>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Remove & Replace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message display */}
      {displayedError && (
        <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}
    </div>
  );
};
