import React from 'react';
import { ExternalLink, Video } from 'lucide-react';
import { getInvestigationVideoMedia } from '../../utils/investigationProofMedia';

const ProofVideoPlayer = ({ url, title, compact = false }) => {
  const media = getInvestigationVideoMedia(url);

  if (!media.url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        <Video size={32} className="opacity-50" />
      </div>
    );
  }

  if (media.isDirectVideo) {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        className={`w-full ${compact ? 'h-full object-cover' : 'max-h-[34rem] rounded-xl bg-black'}`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  if (media.embedUrl) {
    return (
      <iframe
        src={media.embedUrl}
        title={title || 'Video'}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  if (media.fallbackIframeUrl) {
    return (
      <iframe
        src={media.fallbackIframeUrl}
        title={title || 'Video'}
        className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 p-4">
      <Video size={36} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          window.open(media.externalUrl, '_blank', 'noopener,noreferrer');
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        <ExternalLink size={16} />
        Abrir video
      </button>
    </div>
  );
};

export default ProofVideoPlayer;
