/**
 * PHASE 3 - UX/Performance Improvements
 * 
 * Recursos avançados de imagem:
 * 1. Thumbnail generation automática (200x200)
 * 2. Blur hash para progressive loading
 * 3. Múltiplas resoluções para responsividade
 * 4. WebP + fallback para navegadores antigos
 */

import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

// ======================== THUMBNAIL GENERATION ========================
/**
 * Gera thumbnail 200x200px para galeria rápida
 * @param imageBuffer Buffer da imagem original
 * @returns Buffer da thumbnail
 */
export const generateThumbnail = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 70 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('❌ Erro ao gerar thumbnail:', error);
    throw error;
  }
};

/**
 * Gera múltiplas resoluções para responsive images
 * Útil para: mobile (400px), tablet (800px), desktop (1200px)
 */
export const generateResponsiveImages = async (imageBuffer: Buffer) => {
  const sizes = [
    { name: 'sm', width: 400 },
    { name: 'md', width: 800 },
    { name: 'lg', width: 1200 }
  ];

  const images: { [key: string]: Buffer } = {};

  for (const size of sizes) {
    images[size.name] = await sharp(imageBuffer)
      .resize(size.width, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  }

  return images;
};

// ======================== BLUR HASH (LQIP) ========================
/**
 * Gera Blur Hash (Low Quality Image Placeholder)
 * Exibe placeholder borrado enquanto carrega imagem real
 * 
 * Instalação: npm install blurhash
 * 
 * Uso Frontend:
 * ```jsx
 * import { decode } from 'blurhash';
 * 
 * const ImageWithBlur = ({ hash, src }) => {
 *   const pixels = decode(hash, 32, 32);
 *   const canvas = ...render pixels to canvas...
 *   return (
 *     <div style={{backgroundImage: `url(${canvas.toDataURL()})`}}>
 *       <img src={src} onLoad={() => showFull()} />
 *     </div>
 *   );
 * };
 * ```
 */
export const generateBlurHash = async (imageBuffer: Buffer): Promise<string> => {
  try {
    // Redimensionar para análise rápida
    const thumb = await sharp(imageBuffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Importar blurhash (instalar separadamente)
    // const { encode } = require('blurhash');
    // const hash = encode(thumb.data, 100, 100, 4, 4);
    // return hash;

    // Por enquanto, retornar hash simples (SHA256 da imagem)
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  } catch (error) {
    console.error('❌ Erro ao gerar blur hash:', error);
    return 'placeholder'; // Fallback
  }
};

// ======================== SRCSET GENERATION ========================
/**
 * Gera srcset HTML para responsive images
 * Exemplo: "image-sm.webp 400w, image-md.webp 800w, image-lg.webp 1200w"
 */
export const generateSrcSet = (baseUrl: string, filename: string): string => {
  const sizes = ['sm', 'md', 'lg'];
  const name = filename.replace('.webp', '');
  
  return sizes
    .map(size => `${baseUrl}/${name}-${size}.webp ${400 + (400 * (sizes.indexOf(size)))}w`)
    .join(', ');
};

// ======================== IMAGE METADATA ========================
/**
 * Extrai informações da imagem (dimensões, EXIF, etc)
 */
export const getImageMetadata = async (imageBuffer: Buffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      isProgressive: metadata.isProgressive,
      pages: metadata.pages,
      pageHeight: metadata.pageHeight,
      loop: metadata.loop,
      pageDuration: metadata.pageDuration,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  } catch (error) {
    console.error('❌ Erro ao extrair metadata:', error);
    return null;
  }
};

// ======================== AVIF SUPPORT (Future) ========================
/**
 * AVIF é 20% menor que WebP
 * Suportado em: Chrome 85+, Firefox 93+, Safari 16+
 * 
 * Uso: <picture>
 *   <source srcset="image.avif" type="image/avif">
 *   <source srcset="image.webp" type="image/webp">
 *   <img src="image.jpg">
 * </picture>
 */
export const generateAVIF = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    // Requer libavif (compilação adicional)
    // Implementar quando suporte melhorar
    return imageBuffer; // Fallback: retorna original
  } catch (error) {
    console.error('❌ AVIF não suportado nesta compilação', error);
    return imageBuffer;
  }
};

// ======================== BATCH PROCESSING ========================
/**
 * Processa múltiplas imagens em paralelo
 * Cria: original (WebP), thumbnail, responsive sizes, blur hash
 */
export const processImageBatch = async (file: Express.Multer.File, userId: string) => {
  try {
    const baseId = uuid();

    const [
      processedWebP,
      thumbnail,
      responsiveImages,
      blurHash,
      metadata
    ] = await Promise.all([
      sharp(file.buffer).rotate().webp({ quality: 80 }).toBuffer(),
      generateThumbnail(file.buffer),
      generateResponsiveImages(file.buffer),
      generateBlurHash(file.buffer),
      getImageMetadata(file.buffer)
    ]);

    return {
      id: baseId,
      original: {
        buffer: processedWebP,
        size: processedWebP.length,
        format: 'webp'
      },
      thumbnail: {
        buffer: thumbnail,
        size: thumbnail.length,
        format: 'webp'
      },
      responsive: responsiveImages,
      blurHash,
      metadata
    };
  } catch (error) {
    console.error('❌ Erro ao processar batch:', error);
    throw error;
  }
};

// ======================== CDN OPTIMIZATION ========================
/**
 * Exemplo: usar Cloudflare, AWS CloudFront ou Supabase CDN
 * 
 * URLs otimizadas:
 * - Original: https://cdn.example.com/arrests/user-id/uuid.webp
 * - Thumbnail: https://cdn.example.com/arrests/user-id/uuid-th.webp
 * - Responsive: https://cdn.example.com/arrests/user-id/uuid-sm.webp (400w)
 *               https://cdn.example.com/arrests/user-id/uuid-md.webp (800w)
 *               https://cdn.example.com/arrests/user-id/uuid-lg.webp (1200w)
 * 
 * Com Cloudflare Image Optimization:
 * https://cdn.example.com/arrests/user-id/uuid.webp?width=400&quality=80&format=webp
 */

export const buildOptimizedUrl = (
  baseUrl: string,
  filename: string,
  options?: {
    width?: number;
    quality?: number;
    format?: string;
    thumbnail?: boolean;
  }
): string => {
  let url = `${baseUrl}/${filename}`;

  if (options?.thumbnail) {
    url = url.replace('.webp', '-th.webp');
  }

  // Para Cloudflare Image Optimization:
  // url += `?width=${options?.width || 'auto'}&quality=${options?.quality || 80}&format=${options?.format || 'webp'}`;

  return url;
};
