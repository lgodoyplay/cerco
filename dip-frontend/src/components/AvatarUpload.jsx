import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAvatarPublicUrl } from '../lib/avatar';
import { Camera, Loader2, User } from 'lucide-react';
import ImageCropperModal from './common/ImageCropperModal';

const dataURLToFile = (dataURL, fileName = 'avatar.jpg') => {
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

const AvatarUpload = ({ url, onUpload, size = 150, editable = true }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImage, setEditorImage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  const downloadImage = async (path) => {
    try {
      const publicUrl = getAvatarPublicUrl(path);
      if (!publicUrl) {
        setAvatarUrl(null);
        return;
      }
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.log('Error resolving image: ', error.message);
    }
  };

  const uploadOriginalFile = async (file) => {
    try {
      setUploading(true);

      const safeExt = (file.name?.split('.').pop() || 'png').toLowerCase();
      const mimeType = file.type || (safeExt === 'png' ? 'image/png' : 'image/jpeg');
      const fileName = `${Date.now()}.${safeExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: mimeType });

      if (uploadError) {
        throw uploadError;
      }

      const uploadedUrl = getAvatarPublicUrl(filePath);
      setAvatarUrl(uploadedUrl);
      onUpload(uploadedUrl);
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      alert(error.message || 'Não foi possível salvar a foto.');
    } finally {
      setUploading(false);
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

  const handleCropComplete = async (croppedImage) => {
    if (!pendingFile) return;

    const editedFile = dataURLToFile(croppedImage, pendingFile.name || 'avatar.jpg');
    await uploadOriginalFile(editedFile);
    closeEditor();
  };

  const handleFileSelect = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const img = new Image();

    img.onload = () => {
      console.log('Dimensões originais do avatar:', {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });

      const objectUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setEditorImage(objectUrl);
      setEditorOpen(true);
    };

    img.onerror = () => {
      alert('Não foi possível ler a imagem original para enviar.');
    };

    img.src = URL.createObjectURL(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-xl"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <User size={size * 0.5} />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="animate-spin text-federal-500" size={32} />
          </div>
        )}
      </div>

      {editable && (
        <div className="relative">
          <label 
            htmlFor="single" 
            className="flex items-center gap-2 px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white rounded-lg cursor-pointer transition-colors shadow-lg font-bold text-sm"
          >
            <Camera size={18} />
            {uploading ? 'Enviando...' : 'Enviar Foto'}
          </label>
          <input
            style={{
              visibility: 'hidden',
              position: 'absolute',
            }}
            type="file"
            id="single"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>
      )}

      <ImageCropperModal
        imageSrc={editorImage}
        isOpen={editorOpen}
        onClose={closeEditor}
        onCropComplete={handleCropComplete}
        aspect={1}
        showPreview
      />
    </div>
  );
};

export default AvatarUpload;
