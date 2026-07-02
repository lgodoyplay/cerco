import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Square, LayoutTemplate, RectangleVertical, RectangleHorizontal, ScanLine, Undo2, Eye } from 'lucide-react';
import getCroppedImg from '../../utils/cropUtils';
import useImageCropper from '../../hooks/useImageCropper';
import clsx from 'clsx';

const ImageCropperModal = ({ 
    imageSrc, 
    isOpen, 
    onClose, 
    onCropComplete, 
    aspect: initialAspect = 4 / 3, 
    forceAspect = false,
    showPreview = true
}) => {
    const {
        crop,
        zoom,
        rotation,
        aspect,
        freeCrop,
        freeCropSize,
        croppedAreaPixels,
        isProcessing,
        setCrop,
        setZoom,
        setRotation,
        setCroppedAreaPixels,
        setIsProcessing,
        selectPresetAspect,
        enableFreeCrop,
        handleFreeCropSizeChange,
        undo,
        canUndo,
        isAspectSelected
    } = useImageCropper(initialAspect);

    // Teclas de atalho
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
            if (e.key === 'Enter' && croppedAreaPixels && !isProcessing) {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'r' && !isProcessing) {
                e.preventDefault();
                setRotation(r => r + 90);
            }
            if (e.key === 'z' && canUndo && !isProcessing) {
                e.preventDefault();
                undo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, croppedAreaPixels, isProcessing, undo, canUndo, setRotation]);

    // Gerar preview em tempo real
    const [previewUrl, setPreviewUrl] = useState(null);
    
    useEffect(() => {
        if (imageSrc && croppedAreaPixels && !isProcessing) {
            const generatePreview = async () => {
                try {
                    const preview = await getCroppedImg(
                        imageSrc,
                        croppedAreaPixels,
                        rotation,
                        { quality: 0.5, maxSize: 120 }
                    );
                    setPreviewUrl(preview);
                } catch {
                    setPreviewUrl(null);
                }
            };
            generatePreview();
        }
    }, [imageSrc, croppedAreaPixels, rotation, isProcessing]);

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            alert('Selecione uma área para cortar');
            return;
        }

        try {
            setIsProcessing(true);
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
            onClose();
        } catch (e) {
            console.error('Erro ao cortar imagem:', e);
            alert(`Erro ao cortar imagem: ${e.message || 'Tente novamente.'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cropper-title"
        >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                    <h3 id="cropper-title" className="text-lg font-bold text-white flex items-center gap-2">
                        Ajustar Enquadramento
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative h-64 sm:h-96 bg-black w-full">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        cropSize={freeCrop ? freeCropSize : undefined}
                        onCropChange={setCrop}
                        onCropComplete={setCroppedAreaPixels}
                        onZoomChange={setZoom}
                        objectFit="contain"
                    />
                    
                    {/* Preview em tempo real */}
                    {showPreview && previewUrl && (
                        <div 
                            className="absolute top-2 right-2 w-20 h-20 border-2 border-federal-500 rounded-lg overflow-hidden shadow-lg"
                            title="Preview do corte"
                        >
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 space-y-6 bg-slate-900 overflow-y-auto">
                    
                    <div className="flex flex-col gap-6">
                        
                        {/* Aspect Ratio Selector (only if not forced) */}
                        {!forceAspect && (
                            <div className="flex flex-wrap justify-center gap-2">
                                <button 
                                    onClick={() => selectPresetAspect(1)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                        !freeCrop && isAspectSelected(1) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                    )}
                                    aria-label="Proporção 1:1 (Quadrado)"
                                >
                                    <Square size={14} /> 1:1
                                </button>
                                <button 
                                    onClick={() => selectPresetAspect(4/3)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                        !freeCrop && isAspectSelected(4/3) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                    )}
                                    aria-label="Proporção 4:3 (Padrão)"
                                >
                                    <LayoutTemplate size={14} /> 4:3
                                </button>
                                <button 
                                    onClick={() => selectPresetAspect(9/16)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                        !freeCrop && isAspectSelected(9/16) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                    )}
                                    aria-label="Proporção 9:16 (Status)"
                                >
                                    <RectangleVertical size={14} /> 9:16
                                </button>
                                <button 
                                    onClick={() => selectPresetAspect(16/9)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                        !freeCrop && isAspectSelected(16/9) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                    )}
                                    aria-label="Proporção 16:9 (Largo)"
                                >
                                    <RectangleHorizontal size={14} /> 16:9
                                </button>
                                <button 
                                    onClick={enableFreeCrop}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                        freeCrop ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                    )}
                                    aria-label="Modo livre"
                                >
                                    <ScanLine size={14} /> Livre
                                </button>
                            </div>
                        )}

                        {/* Free crop size controls */}
                        {!forceAspect && freeCrop && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                        <span>Largura</span>
                                        <span>{freeCropSize.width}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={140}
                                        max={420}
                                        step={10}
                                        value={freeCropSize.width}
                                        onChange={(e) => handleFreeCropSizeChange('width', e.target.value)}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-federal-500"
                                        aria-label="Ajustar largura"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                        <span>Altura</span>
                                        <span>{freeCropSize.height}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={140}
                                        max={420}
                                        step={10}
                                        value={freeCropSize.height}
                                        onChange={(e) => handleFreeCropSizeChange('height', e.target.value)}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-federal-500"
                                        aria-label="Ajustar altura"
                                    />
                                </div>
                                <p className="md:col-span-2 text-xs text-slate-500">
                                    No modo livre, você escolhe manualmente o tamanho da área de corte.
                                </p>
                            </div>
                        )}

                        {/* Zoom Control */}
                        <div className="flex items-center gap-4">
                            <ZoomOut size={16} className="text-slate-400" aria-label="Zoom out" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-label="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-federal-500"
                            />
                            <ZoomIn size={16} className="text-slate-400" aria-label="Zoom in" />
                        </div>

                        {/* Rotation Control */}
                        <div className="flex items-center justify-center gap-3">
                            <button 
                                onClick={() => setRotation(r => r + 90)}
                                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                                aria-label="Rotacionar 90° (R)"
                                title="Rotacionar (R)"
                            >
                                <RotateCw size={14} /> Rotacionar
                            </button>
                            
                            {canUndo && (
                                <button 
                                    onClick={undo}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                                    aria-label="Desfazer (Z)"
                                    title="Desfazer (Z)"
                                >
                                    <Undo2 size={14} /> Desfazer
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Cancelar"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || !croppedAreaPixels}
                            className="flex-1 px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            aria-label="Confirmar corte (Enter)"
                        >
                            {isProcessing ? 'Processando...' : (
                                <>
                                    <Check size={18} /> Confirmar Corte
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;