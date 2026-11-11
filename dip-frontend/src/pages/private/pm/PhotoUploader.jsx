import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ImageCropperModal from '../../../components/common/ImageCropperModal';

const dataURLToFile = (dataURL, fileName = 'photo.jpg') => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime, lastModified: Date.now() });
};

const PhotoUploader = ({ photos, setPhotos }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImage, setEditorImage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const uploadOriginalFile = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { error } = await supabase.storage
        .from('prf-evidence')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('prf-evidence')
        .getPublicUrl(fileName);

      setPhotos((prevPhotos) => [...prevPhotos, publicUrlData.publicUrl]);
    } catch (e) {
      console.error('Error uploading image:', e);
      alert(`Erro ao enviar imagem: ${e.message}`);
    }
  };

  const closeEditor = () => {
    if (editorImage.startsWith('blob:')) {
      URL.revokeObjectURL(editorImage);
    }
    setEditorOpen(false);
    setEditorImage('');
    setPendingFile(null);
  };

  const handleCropComplete = async (croppedDataUrl) => {
    if (!pendingFile) return;

    const editedFile = dataURLToFile(croppedDataUrl, pendingFile.name || 'photo.jpg');
    await uploadOriginalFile(editedFile);
    closeEditor();
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        console.log('Dimensões originais da foto:', {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });

        const objectUrl = URL.createObjectURL(file);
        setPendingFile(file);
        setEditorImage(objectUrl);
        setEditorOpen(true);
      };
      img.src = URL.createObjectURL(file);
    }

    e.target.value = '';
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
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
        </div>

        <ImageCropperModal
          imageSrc={editorImage}
          isOpen={editorOpen}
          onClose={closeEditor}
          onCropComplete={handleCropComplete}
          aspect={4 / 3}
          showPreview
        />
    </div>
  );
};

export default PhotoUploader;
