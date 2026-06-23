import React from 'react';
import { Image, Video, Link as LinkIcon, FileText, File, User, ExternalLink, ZoomIn, Trash2, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import ProofVideoPlayer from './ProofVideoPlayer';
import { normalizeInvestigationProofUrl } from '../../utils/investigationProofMedia';

const ProofCard = ({ proof, onClick, onDelete, onEdit, canEdit }) => {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all group">
      
      {/* Image Preview */}
      {proof.type === 'image' && proof.content && (
        <div 
          className={clsx("h-48 w-full bg-slate-950 relative overflow-hidden", isViewable && "cursor-pointer")}
          onClick={() => isViewable && onClick && onClick(proof)}
        >
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
        <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <ProofVideoPlayer url={proof.content} title={proof.title} compact />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent opacity-90" />
          {onClick && (
            <button
              type="button"
              onClick={() => onClick(proof)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors"
              title="Abrir prova"
            >
              <ZoomIn size={16} className="text-white" />
            </button>
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded">
              {new Date(proof.createdAt).toLocaleDateString()}
            </span>
            {canEdit && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(proof);
                  }}
                  className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                  title="Editar prova"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Tem certeza que deseja deletar esta prova?')) {
                      onDelete && onDelete(proof.id);
                    }
                  }}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Deletar prova"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <h4 className="text-white font-bold text-lg mb-2">{proof.title}</h4>
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{proof.description}</p>

        {/* Special Content Display */}
        {proof.type === 'link' && (
          <div className="text-blue-400 text-xs flex items-center gap-1 mb-4 break-all">
            <ExternalLink size={12} /> {normalizeInvestigationProofUrl(proof.content)}
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

        {isViewable && onClick && (
          <button
            type="button"
            onClick={() => onClick(proof)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <ZoomIn size={16} />
            Abrir prova
          </button>
        )}
      </div>
    </div>
  );
};

export default ProofCard;
