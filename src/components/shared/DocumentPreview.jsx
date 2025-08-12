// src/components/shared/DocumentPreview.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';

// Универсальный предпросмотр:
// mode="markdown": textarea + live preview (react-markdown)
// mode="files": dropzone + превью изображений, pdf, иконка для прочих

function FileCard({ file }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="text-sm font-medium break-all">{file.name}</div>
      <div className="text-xs opacity-70">{file.type} • {(file.size/1024).toFixed(1)} KB</div>

      {isImage && url && (
        <img src={url} alt={file.name} className="max-h-40 rounded-lg border" />
      )}

      {isPdf && url && (
        <iframe
          title={file.name}
          src={url}
          className="w-full h-56 rounded-lg border"
        />
      )}

      {!isImage && !isPdf && (
        <div className="text-xs opacity-70">No preview</div>
      )}
    </div>
  );
}

export default function DocumentPreview({
  mode = 'markdown',
  value,
  onChange,
  multiple = false,
}) {
  if (mode === 'markdown') {
    return (
      <div className="grid md:grid-cols-2 gap-3">
        <textarea
          className="w-full rounded-xl border px-3 py-2 min-h-[160px]"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Write markdown here…"
        />
        <div className="rounded-xl border p-3 prose prose-sm max-w-none">
          <ReactMarkdown>{value || '_Nothing to preview_'}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // mode === 'files'
  const [files, setFiles] = useState(() => (Array.isArray(value) ? value : []).filter(Boolean));

  useEffect(() => {
    if (Array.isArray(value)) setFiles(value);
  }, [value]);

  const onDrop = useCallback((accepted) => {
    const next = multiple ? [...files, ...accepted] : (accepted[0] ? [accepted[0]] : []);
    setFiles(next);
    onChange?.(next);
  }, [files, multiple, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-4 cursor-pointer ${isDragActive ? 'bg-violet-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-sm opacity-80">
          Drop files here, or click to select
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((f, i) => (
          <FileCard key={i} file={f} />
        ))}
      </div>

      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm rounded-xl border px-3 py-1"
            onClick={() => { setFiles([]); onChange?.([]); }}
          >
            Clear files
          </button>
        </div>
      )}
    </div>
  );
}
