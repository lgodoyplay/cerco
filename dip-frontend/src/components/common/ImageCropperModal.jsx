import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Square, RectangleHorizontal, LayoutTemplate, RectangleVertical, ScanLine } from 'lucide-react';
import getCroppedImg from '../../utils/cropUtils';
import clsx from 'clsx';

const DEFAULT_FREE_CROP_SIZE = { width: 260, height: 260 };

const createCropSizeFromAspect = (ratio) => {
  if (!ratio || Number.isNaN(ratio)) return DEFAULT_FREE_CROP_SIZE;

  const base = 300;
  if (ratio >= 1) {
    return {
      width: base,
      height: Math.max(160, Math.round(base / ratio))
    };
  }

  return {
    width: Math.max(160, Math.round(base * ratio)),
    height: base
  };
};

const ImageCropperModal = ({ imageSrc, isOpen, onClose, onCropComplete, aspect: initialAspect = 4 / 3, forceAspect = false }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(initialAspect);
  const [freeCrop, setFreeCrop] = useState(false);
  const [freeCropSize, setFreeCropSize] = useState(createCropSizeFromAspect(initialAspect));
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAspectSelected = (targetAspect) => Math.abs(aspect - targetAspect) < 0.01;

  // Reset aspect when modal opens or initialAspect changes
  useEffect(() => {
    if (isOpen) {
        setAspect(initialAspect);
        setFreeCrop(false);
        setFreeCropSize(createCropSizeFromAspect(initialAspect));
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
    }
  }, [isOpen, initialAspect]);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const selectPresetAspect = (nextAspect) => {
    setFreeCrop(false);
    setAspect(nextAspect);
    setFreeCropSize(createCropSizeFromAspect(nextAspect));
  };

  const enableFreeCrop = () => {
    setFreeCrop(true);
  };

  const handleFreeCropSizeChange = (field, value) => {
    const numericValue = Number(value);
    setFreeCropSize((prev) => {
      const next = {
        ...prev,
        [field]: numericValue
      };
      setAspect(next.width / next.height);
      return next;
    });
  };

  const handleSave = async () => {
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
      console.error(e);
      alert('Erro ao cortar imagem');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Ajustar Enquadramento
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
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
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6 bg-slate-900 overflow-y-auto">
          
          <div className="flex flex-col gap-6">
            
            {/* Aspect Ratio Selector (only if not forced) */}
            {!forceAspect && (
                <div className="flex justify-center gap-2">
                    <button 
                        onClick={() => selectPresetAspect(1)}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                            !freeCrop && aspect === 1 ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <Square size={14} /> 1:1 (Quadrado)
                    </button>
                    <button 
                        onClick={() => selectPresetAspect(4/3)}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                            !freeCrop && isAspectSelected(4/3) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <LayoutTemplate size={14} /> 4:3 (Padrão)
                    </button>
                    <button 
                        onClick={() => selectPresetAspect(9/16)}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                            !freeCrop && isAspectSelected(9/16) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <RectangleVertical size={14} /> 9:16 (Status)
                    </button>
                    <button 
                        onClick={() => selectPresetAspect(16/9)}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                            !freeCrop && isAspectSelected(16/9) ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <RectangleHorizontal size={14} /> 16:9 (Largo)
                    </button>
                    <button 
                        onClick={enableFreeCrop}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                            freeCrop ? "bg-federal-600 border-federal-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                    >
                        <ScanLine size={14} /> Livre
                    </button>
                </div>
            )}

            {!forceAspect && freeCrop && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Largura da seleção</span>
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
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Altura da seleção</span>
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
                  />
                </div>
                <p className="md:col-span-2 text-xs text-slate-500">
                  No modo livre, voce escolhe manualmente o tamanho da area de corte e posiciona a imagem do jeito que quiser.
                </p>
              </div>
            )}

            {/* Zoom Control */}
            <div className="flex items-center gap-4">
              <ZoomOut size={16} className="text-slate-400" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-federal-500"
              />
              <ZoomIn size={16} className="text-slate-400" />
            </div>

            {/* Rotation Control */}
            <div className="flex items-center justify-center">
                <button 
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                    <RotateCw size={14} /> Rotacionar
                </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
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
