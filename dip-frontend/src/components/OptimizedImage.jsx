import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * OptimizedImage - Componente para imagens otimizadas com progressive loading
 * 
 * Features:
 * - Lazy loading (IntersectionObserver)
 * - Blur hash placeholder
 * - Responsive images (srcset)
 * - Fallback para WebP/JPG
 * - Error handling
 * 
 * Uso:
 * <OptimizedImage
 *   src="https://cdn.example.com/image.webp"
 *   thumbnail="https://cdn.example.com/image-th.webp"
 *   blurHash={base64Hash}
 *   alt="Foto de prisão"
 *   width={800}
 *   height={600}
 * />
 */
const OptimizedImage = ({
  src,
  thumbnail = null,
  blurHash = null,
  alt = 'Image',
  width,
  height,
  className = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [displaySrc, setDisplaySrc] = useState(thumbnail || null);

  useEffect(() => {
    // Lazy load com IntersectionObserver
    const img = new Image();
    
    img.onload = () => {
      setDisplaySrc(src);
      setIsLoaded(true);
      setShowPlaceholder(false);
      onLoad?.();
    };

    img.onerror = () => {
      setIsError(true);
      setShowPlaceholder(false);
      onError?.();
    };

    // Iniciar carregamento
    img.src = src;
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : 'auto'
      }}
    >
      {/* Blur Hash Placeholder */}
      {showPlaceholder && blurHash && (
        <div
          className="absolute inset-0 bg-slate-400 animate-pulse"
          style={{
            backgroundImage: `url(${blurHash})`,
            backgroundSize: 'cover',
            filter: 'blur(20px)'
          }}
        />
      )}

      {/* Imagem Real */}
      {displaySrc && !isError && (
        <img
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}

      {/* Error State */}
      {isError && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-xs text-red-400">Erro ao carregar imagem</p>
          </div>
        </div>
      )}

      {/* Loading Indicator (opcional) */}
      {showPlaceholder && !blurHash && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}
    </div>
  );
};

export default OptimizedImage;

// ======================== RESPONSIVE IMAGE COMPONENT ========================
/**
 * ResponsiveImage - Usa srcset para carregar imagem apropriada por device
 * 
 * Usa multiplas resoluções geradas no backend
 */
export const ResponsiveImage = ({
  srcset, // "image-sm.webp 400w, image-md.webp 800w, image-lg.webp 1200w"
  thumbnail = null,
  alt = 'Image',
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <picture className={`relative block ${className}`}>
      <source srcSet={srcset} type="image/webp" />
      <img
        srcSet={srcset}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </picture>
  );
};

// ======================== LIGHTBOX COMPONENT ========================
/**
 * ImageLightbox - Galeria modal para visualizar fotos em alta resolução
 * 
 * Uso:
 * <ImageLightbox
 *   images={[
 *     { thumb: 'url-th', full: 'url-full', alt: 'Rosto' },
 *     { thumb: 'url-th', full: 'url-full', alt: 'Bolsa' }
 *   ]}
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 * />
 */
export const ImageLightbox = ({ images = [], isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  const current = images[currentIndex];
  const hasNext = currentIndex < images.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
      >
        ✕
      </button>

      {/* Image Container */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <OptimizedImage
          src={current?.full || current?.thumb}
          alt={current?.alt || 'Image'}
          className="max-w-4xl max-h-screen rounded-lg"
        />
      </div>

      {/* Info */}
      <div className="absolute bottom-4 left-4 text-white text-sm">
        {currentIndex + 1} / {images.length}
        {current?.alt && ` - ${current.alt}`}
      </div>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
        >
          ›
        </button>
      )}
    </div>
  );
};

// ======================== IMAGE GALLERY COMPONENT ========================
/**
 * ImageGallery - Grade de miniaturas com lightbox
 */
export const ImageGallery = ({ images = [], columns = 4 }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <>
      <div className={`grid grid-cols-${columns} gap-2`}>
        {images.map((image, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedIndex(idx);
              setLightboxOpen(true);
            }}
            className="relative group overflow-hidden rounded-lg aspect-square cursor-pointer"
          >
            <OptimizedImage
              src={image.thumb}
              alt={image.alt}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-lg">🔍</span>
            </div>
          </button>
        ))}
      </div>

      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={selectedIndex}
      />
    </>
  );
};
