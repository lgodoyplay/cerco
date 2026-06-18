import React from 'react';
import { Image, Video, Link as LinkIcon, FileText, File, Calendar, User, ExternalLink, ZoomIn } from 'lucide-react';
import clsx from 'clsx';

const ProofCard = ({ proof, onClick }) => {
  const getIcon = () => {
    switch (proof.type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'link': return LinkIcon;
      case 'text': return FileText;
      default: return File;
    }
  };

  const Icon = getIcon();
  const isViewable = proof.type === 'image' || proof.type === 'video' || proof.type === 'link';

  return (
    <div 
      className={clsx(
        "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all group",
        isViewable ? "hover:border-federal-500/50 cursor-pointer hover:shadow-lg hover:shadow-federal-900/20" : "hover:border-federal-500/30"
      )}
      onClick={() => isViewable && onClick && onClick(proof)}
    >
      
      {/* Image Preview */}
      {proof.type === 'image' && proof.content && (
        <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
          <img 
            src={proof.content} 
            alt={proof.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
          {isViewable && (
            <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={16} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Video Preview Placeholder */}
      {proof.type === 'video' && proof.content && (
        <div className="h-48 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
          <div className="text-slate-500 flex flex-col items-center gap-2">
            <Video size={48} className="opacity-50" />
            <span className="text-xs">Vídeo</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
          {isViewable && (
            <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={16} className="text-white" />
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={clsx("p-2 rounded-lg bg-slate-800 text-slate-400", {
              'bg-blue-500/10 text-blue-400': proof.type === 'link',
              'bg-emerald-500/10 text-emerald-400': proof.type === 'image',
              'bg-purple-500/10 text-purple-400': proof.type === 'video',
            })}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{proof.type}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded">
            {new Date(proof.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Content */}
        <h4 className="text-white font-bold text-lg mb-2">{proof.title}</h4>
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{proof.description}</p>

        {/* Special Content Display */}
        {proof.type === 'link' && (
          <div className="text-blue-400 text-xs flex items-center gap-1 mb-4 break-all">
            <ExternalLink size={12} /> {proof.content}
          </div>
        )}

        {proof.type === 'text' && proof.content && proof.content !== proof.description && (
          <div className="bg-slate-950 p-3 rounded-lg text-xs text-slate-300 font-mono mb-4 line-clamp-4 border border-slate-800">
            "{proof.content}"
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800 text-slate-500 text-xs">
          <User size={14} />
          <span>{proof.author}</span>
        </div>
      </div>
    </div>
  );
};

export default ProofCard;
