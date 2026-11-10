import { supabase } from './supabase';

export const getAvatarPublicUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  const value = avatarUrl.trim();

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  const normalizedPath = value
    .replace(/^\/+/, '')
    .replace(/^avatars\//i, '')
    .replace(/^public\/avatars\//i, '');

  if (!normalizedPath) {
    return null;
  }

  const { data, error } = supabase.storage.from('avatars').getPublicUrl(normalizedPath);

  if (error || !data?.publicUrl) {
    console.warn('Avatar URL inválida:', { avatarUrl, normalizedPath, error });
    return null;
  }

  return data.publicUrl;
};
