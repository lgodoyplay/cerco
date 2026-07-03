import React, { useState, useEffect } from 'react';
import { X, Download, Share2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, ExternalLink } from 'lucide-react';
import ProofVideoPlayer from '../investigations/ProofVideoPlayer';
import { normalizeInvestigationProofUrl } from '../../utils/investigationProofMedia';
import clsx from 'clsx';

const ProofPreviewModal = ({ 
    proof, 
    isOpen, 
    onClose, 
    onPrevious, 
    onNext,
    hasPrevious,
    hasNext
}) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Reset zoom/rotation quando muda de prova
    useEffect(() => {
        if (proof) {
            setZoom(1);
            setRotation(0);
        }
    }, [proof]);

    if (!isOpen || !proof) return null;

    const handleDownload = () => {
        if (proof.type === 'image' && proof.content) {
            const a = document.createElement('a');
            a.href = proof.content;
            a.download = `${proof.title || 'prova'}.jpg`;
            a.click();
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: proof.title,
                    text: proof.description,
                    url: proof.content
                });
            } catch (e) {
                console.log('Share cancelled');
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                    <div>
                        <h3 className="text-lg font-bold text-white">{proof.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {proof.author} • {new Date(proof.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {hasPrevious && (
                            <button
                                onClick={onPrevious}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Prova anterior"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        {hasNext && (
                            <button
                                onClick={onNext}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Próxima prova"
                            >
                                <ChevronRight size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {proof.type === 'image' && proof.content && (
                        <div className="flex flex-col items-center">
                            <div className="relative max-w-full">
                                <img
                                    src={proof.content}
                                    alt={proof.title}
                                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </div>
                            
                            {/* Image Controls */}
                            <div className="flex items-center gap-4 mt-4">
                                <button
                                    onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Diminuir zoom"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <span className="text-xs text-slate-400 font-mono w-16 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Aumentar zoom"
                                >
                                    <ZoomIn size={16} />
                                </button>
                                <button
                                    onClick={() => setRotation(r => r + 90)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Rotacionar"
                                >
                                    <RotateCw size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {proof.type === 'video' && proof.content && (
                        <div className="max-w-2xl mx-auto">
                            <ProofVideoPlayer url={proof.content} title={proof.title} />
                        </div>
                    )}

                    {proof.type === 'link' && proof.content && (
                        <div className="text-center py-8">
                            <a
                                href={proof.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                            >
                                <ExternalLink size={18} />
                                Abrir Link
                            </a>
                            <p className="text-xs text-slate-500 mt-4 break-all">
                                {normalizeInvestigationProofUrl(proof.content)}
                            </p>
                        </div>
                    )}

                    {proof.type === 'text' && proof.content && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                            <p className="text-slate-300 whitespace-pre-wrap">{proof.content}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950">
                    <p className="text-sm text-slate-400 mb-4">{proof.description}</p>
                    
                    <div className="flex items-center gap-3">
                        {proof.type === 'image' && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        )}
                        
                        {navigator.share && (
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                            >
                                <Share2 size={16} />
                                Compartilhar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProofPreviewModal;