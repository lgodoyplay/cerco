import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from '../../utils/cropUtils';

const ImageCropperModal = ({ imageSrc, isOpen, onClose, onCropComplete, aspect = 4 / 3 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Ajustar Imagem
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-80 sm:h-96 bg-black w-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6 bg-slate-900">
          
          <div className="flex flex-col gap-4">
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

            <div className="flex items-center justify-center">
                <button 
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                    <RotateCw size={14} /> Rotacionar
                </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
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
                  <Check size={18} /> Confirmar
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
