import React, { useState } from 'react';
import { X, Save, Image, Video, Link as LinkIcon, FileText, File } from 'lucide-react';
import ImageUploadArea from '../ImageUploadArea';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const AddProofModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [type, setType] = useState('image');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '' // URL, Text, or DataURL
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (id, dataUrl, file) => {
    setFormData(prev => ({ ...prev, content: dataUrl, file: file }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, content: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, type, author: user?.username || 'Agente Federal', authorId: user?.id });
    // Reset
    setFormData({ title: '', description: '', content: '' });
    setType('image');
    onClose();
  };

  const types = [
    { id: 'image', icon: Image, label: 'Imagem' },
    { id: 'video', icon: Video, label: 'Vídeo' },
    { id: 'link', icon: LinkIcon, label: 'Link' },
    { id: 'text', icon: FileText, label: 'Texto' },
    { id: 'file', icon: File, label: 'Arquivo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">Adicionar Nova Prova</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {types.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border",
                  type === t.id 
                    ? "bg-federal-600 border-federal-500 text-white" 
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Common Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Prova</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Ex: Foto do local do crime"
              required
            />
          </div>

          {/* Dynamic Content Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Conteúdo da Prova</label>
            
            {type === 'image' && (
              <ImageUploadArea 
                id="proof_content"
                label="Upload de Imagem"
                image={formData.content}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                required
              />
            )}

            {type === 'video' && (
              <input
                type="text"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="URL do vídeo (YouTube, Drive, etc)"
                required
              />
            )}

            {type === 'link' && (
              <input
                type="url"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="https://..."
                required
              />
            )}

            {(type === 'text' || type === 'file') && (
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                placeholder={type === 'file' ? "Cole o link do arquivo ou descreva onde encontrá-lo..." : "Cole o texto ou depoimento aqui..."}
                required
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição Detalhada</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
              placeholder="Contexto, observações importantes..."
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
            >
              <Save size={18} />
              Adicionar Prova
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProofModal;
