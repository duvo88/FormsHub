import React, { useRef, useState } from 'react';
import { ACCEPTED_FILE_TYPES, validateFiles, FILE_UPLOAD_HELPER_TEXT } from '../utils/validation';

interface Props {
  files: File[] | null;
  onFilesChange: (files: File[] | null) => void;
  error?: string;
  onErrorClear?: () => void;
}

export default function FileUploadField({ files, onFilesChange, error, onErrorClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (fileList: FileList) => {
    const result = validateFiles(fileList);
    if (!result.valid) {
      setSizeError(result.error);
      return;
    }
    setSizeError('');
    const allFiles = [...(files || []), ...result.files];
    onFilesChange(allFiles);
    if (onErrorClear) onErrorClear();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (!files) return;
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated.length > 0 ? updated : null);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    onFilesChange(null);
    setSizeError('');
  };

  return (
    <div className="file-upload-field">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#F26522' : '#9EA5AB'}`,
          borderRadius: 4,
          padding: '18px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#fff4ef' : '#eaf0ff',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <span style={{ fontSize: 14, color: '#444' }}>
          Drag &amp; drop files here or{' '}
          <span style={{ color: '#F26522', textDecoration: 'underline', fontWeight: 600 }}>browse</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </div>

      {/* Selected files list */}
      {files && files.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
          {files.map((file, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 2px',
                borderBottom: '1px solid #e8ecf0',
                fontSize: 14,
                color: '#0b1220',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(i)}
                aria-label={`Remove ${file.name}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F26522', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {sizeError && <span className="error-message">{sizeError}</span>}
      {error && <span className="error-message">{error}</span>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div className="helperText">{FILE_UPLOAD_HELPER_TEXT}</div>
        {files && files.length > 0 && (
          <a href="#" onClick={handleClearAll} style={{ color: '#F26522', textDecoration: 'underline', fontSize: 14, whiteSpace: 'nowrap', marginLeft: 16 }}>
            Clear all
          </a>
        )}
      </div>
    </div>
  );
}
