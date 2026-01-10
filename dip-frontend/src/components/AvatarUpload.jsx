import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Loader2, User } from 'lucide-react';

const AvatarUpload = ({ url, onUpload, size = 150, editable = true }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  const downloadImage = async (path) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
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
            {uploading ? 'Enviando...' : 'Alterar Foto'}
          </label>
          <input
            style={{
              visibility: 'hidden',
              position: 'absolute',
            }}
            type="file"
            id="single"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
