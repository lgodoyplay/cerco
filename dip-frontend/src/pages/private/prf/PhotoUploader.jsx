import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ImageCropperModal from '../../../components/common/ImageCropperModal';

const PhotoUploader = ({ photos, setPhotos }) => {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);

  const processFileForCrop = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result);
      setOriginalFile(file);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Process only the first file if multiple selected (since we need to crop one by one)
    // Or iterate? Iterating with modal is hard. Let's process the first one for crop.
    // Ideally we should allow selecting one by one.
    const file = files[0];
    processFileForCrop(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImageBase64) => {
    try {
      // Upload cropped image
      const res = await fetch(croppedImageBase64);
      const blob = await res.blob();
      const fileName = `${Date.now()}-${originalFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('prf-evidence')
        .upload(fileName, blob, {
           contentType: 'image/jpeg'
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('prf-evidence')
        .getPublicUrl(fileName);

      setPhotos([...photos, publicUrlData.publicUrl]);
      setCropModalOpen(false);
      setTempImage(null);
      setOriginalFile(null);
    } catch (e) {
      console.error('Error uploading cropped image:', e);
      alert(`Erro ao enviar imagem: ${e.message}`);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  return (
    <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-400">Fotos (Evidências/Estado do Veículo)</label>
        
        <ImageCropperModal
          isOpen={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          imageSrc={tempImage}
          onCropComplete={handleCropComplete}
          aspect={16/9} // Landscape for vehicle photos
        />

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
                {/* Removed multiple to enforce one-by-one cropping */}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
        </div>
    </div>
  );
};

export default PhotoUploader;
