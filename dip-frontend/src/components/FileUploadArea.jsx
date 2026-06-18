
import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import clsx from 'clsx';

const FileUploadArea = ({ label, id, fileUrl, onUpload, onRemove, required = false, accept = "image/*,.pdf" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(id, reader.result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
    e.target.value = ''; 
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {label}
          {required && <span className="text-red-500 text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Obrigatório</span>}
          {!required && <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Opcional</span>}
        </label>
        {fileUrl && (
          <button 
            type="button" 
            onClick={() => onRemove(id)}
            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Remover
          </button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative h-40 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group",
          fileUrl 
            ? "border-emerald-500/50 bg-emerald-900/10" 
            : isDragging 
              ? "border-federal-400 bg-federal-900/20 scale-[1.02]" 
              : "border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />

        {fileUrl ? (
          <div className="relative w-full h-full group-hover:opacity-75 transition-opacity flex items-center justify-center p-4">
            <FileText size={48} className="text-federal-500" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm">
              <span className="text-white text-xs font-bold flex items-center gap-2">
                <Upload size={16} /> Alterar Arquivo
              </span>
            </div>
            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
              <CheckCircle size={16} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4 text-center">
            <div className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
              isDragging ? "bg-federal-500/20 text-federal-400" : "bg-slate-800 text-slate-600 group-hover:text-slate-400"
            )}>
              <Upload size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400 block mb-1">
              {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste'}
            </span>
            <span className="text-[10px] text-slate-600 block">
              PDF, PNG, JPG (Max 5MB)
            </span>
          </div>
        )}
      </div>
      
      {/* Validation Status */}
      {!fileUrl && required && (
        <div className="flex items-center gap-1.5 text-amber-500/80 text-xs animate-pulse">
          <AlertCircle size={12} />
          <span>Arquivo pendente</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
