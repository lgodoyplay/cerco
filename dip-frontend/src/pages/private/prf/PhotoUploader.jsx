import React from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

const PhotoUploader = ({ photos, setPhotos }) => {
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPhotos = [];

    for (const file of files) {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('prf-evidence')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading:', error);
        alert(`Erro ao enviar imagem: ${error.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('prf-evidence')
        .getPublicUrl(fileName);

      newPhotos.push(publicUrlData.publicUrl);
    }

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  return (
    <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-400">Fotos (Evidências/Estado do Veículo)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((url, index) => (
                <div key={index} className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden group border border-slate-700">
                    <img src={url} alt={`Evidence ${index}`} className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 hover:border-slate-600 transition-all group">
                <Camera className="text-slate-600 group-hover:text-slate-400 mb-2 transition-colors" />
                <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Adicionar Foto</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
        </div>
    </div>
  );
};

export default PhotoUploader;
