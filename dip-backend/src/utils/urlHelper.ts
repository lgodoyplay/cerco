/**
 * Centralizado URL helper para arquivos de upload
 * Facilita migração futura para CDN ou cloud storage
 */

export const getImageUrl = (filename: string | null | undefined, bucket = 'uploads'): string | null => {
  if (!filename) return null;
  
  const baseUrl = process.env.CDN_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/${bucket}/${filename}`;
};

export const getUploadPath = (filename: string): string => {
  if (!filename) throw new Error('Filename is required');
  return `/uploads/${filename}`;
};

/**
 * Extrai nome do arquivo da URL
 * Útil para deleção posterior
 */
export const extractFilenameFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1];
};
