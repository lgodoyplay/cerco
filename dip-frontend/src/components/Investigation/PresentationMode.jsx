import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import ProofVideoPlayer from '../investigations/ProofVideoPlayer';
import { normalizeInvestigationProofUrl } from '../../utils/investigationProofMedia';
import clsx from 'clsx';

const PresentationMode = ({ proofs = [], isOpen, onClose, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [autoplayInterval, setAutoplayInterval] = useState(null);

    const currentProof = proofs[currentIndex];

    // Autoplay
    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                setCurrentIndex(i => (i + 1) % proofs.length);
            }, 5000);
            setAutoplayInterval(interval);
        } else if (autoplayInterval) {
            clearInterval(autoplayInterval);
            setAutoplayInterval(null);
        }

        return () => {
            if (autoplayInterval) clearInterval(autoplayInterval);
        };
    }, [isPlaying, proofs.length]);

    // Teclas de atalho
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(proofs.length - 1, i + 1));
            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(p => !p);
            }
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, z + 0.1));
            if (e.key === '-') setZoom(z => Math.max(0.5, z - 0.1));
            if (e.key === 'r') setRotation(r => r + 90);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, proofs.length]);

    // Reset quando muda de prova
    useEffect(() => {
        setZoom(1);
        setRotation(0);
    }, [currentIndex]);

    if (!isOpen || !currentProof) return null;

    const handleDownload = () => {
        if (currentProof.type === 'image' && currentProof.content) {
            const a = document.createElement('a');
            a.href = currentProof.content;
            a.download = `${currentProof.title || 'prova'}.jpg`;
            a.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
            
            {/* Header minimal */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="text-white text-sm">
                    {currentIndex + 1} / {proofs.length} - {currentProof.title}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(p => !p)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-16">
                {currentProof.type === 'image' && currentProof.content && (
                    <img
                        src={currentProof.content}
                        alt={currentProof.title}
                        className="max-w-full max-h-full object-contain"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s'
                        }}
                    />
                )}

                {currentProof.type === 'video' && currentProof.content && (
                    <div className="w-full max-w-4xl">
                        <ProofVideoPlayer url={currentProof.content} title={currentProof.title} />
                    </div>
                )}

                {currentProof.type === 'link' && currentProof.content && (
                    <div className="text-center">
                        <a
                            href={currentProof.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-2xl text-federal-400 hover:text-federal-300"
                        >
                            {normalizeInvestigationProofUrl(currentProof.content)}
                        </a>
                    </div>
                )}

                {currentProof.type === 'text' && currentProof.content && (
                    <div className="max-w-3xl text-center">
                        <p className="text-2xl text-white whitespace-pre-wrap">
                            {currentProof.content}
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-4 z-10 bg-gradient-to-t from-black/50 to-transparent">
                <button
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                    <ChevronLeft size={20} />
                </button>

                {currentProof.type === 'image' && (
                    <>
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <span className="text-white text-sm font-mono w-16 text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            onClick={() => setRotation(r => r + 90)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <RotateCw size={20} />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Download size={20} />
                        </button>
                    </>
                )}

                <button
                    onClick={() => setCurrentIndex(i => Math.min(proofs.length - 1, i + 1))}
                    disabled={currentIndex === proofs.length - 1}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                    className="h-full bg-federal-500 transition-all"
                    style={{ width: `${((currentIndex + 1) / proofs.length) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default PresentationMode;