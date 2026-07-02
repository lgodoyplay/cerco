import { useState, useCallback, useEffect } from 'react';
import { PRESET_SIZES, CROP_DEFAULTS } from '../utils/cropUtils';

/**
 * Hook customizado para gerenciar estado do cropper de imagem
 * @param {number} initialAspect - Proporção inicial (padrão: 4/3)
 * @returns {Object} Estado e funções do cropper
 */
const useImageCropper = (initialAspect = 4/3) => {
    // Estado centralizado
    const [state, setState] = useState({
        crop: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
        aspect: initialAspect,
        freeCrop: false,
        freeCropSize: { width: 260, height: 260 },
        croppedAreaPixels: null,
        isProcessing: false
    });

    // History para undo/redo
    const [history, setHistory] = useState([]);

    // Reset quando abre ou muda aspect inicial
    useEffect(() => {
        reset();
    }, [initialAspect]);

    // Salvar no histórico
    const saveToHistory = useCallback(() => {
        setHistory(h => [...h.slice(-9), { ...state }]); // Manter últimos 10 estados
    }, [state]);

    // Setters com histórico
    const setCrop = useCallback((crop) => {
        saveToHistory();
        setState(s => ({ ...s, crop }));
    }, [saveToHistory]);

    const setZoom = useCallback((zoom) => {
        saveToHistory();
        setState(s => ({ ...s, zoom: Math.max(1, Math.min(3, zoom)) }));
    }, [saveToHistory]);

    const setRotation = useCallback((rotation) => {
        saveToHistory();
        setState(s => ({ ...s, rotation: ((rotation % 360) + 360) % 360 }));
    }, [saveToHistory]);

    const setAspect = useCallback((aspect) => {
        saveToHistory();
        setState(s => ({ ...s, aspect, freeCrop: false }));
    }, [saveToHistory]);

    const setCroppedAreaPixels = useCallback((pixels) => {
        setState(s => ({ ...s, croppedAreaPixels: pixels }));
    }, []);

    const setIsProcessing = useCallback((isProcessing) => {
        setState(s => ({ ...s, isProcessing }));
    }, []);

    // Presets de aspecto
    const selectPresetAspect = useCallback((nextAspect) => {
        saveToHistory();
        setState(s => ({
            ...s,
            aspect: nextAspect,
            freeCrop: false,
            freeCropSize: {
                width: 260,
                height: Math.round(260 / nextAspect)
            }
        }));
    }, [saveToHistory]);

    // Free crop
    const enableFreeCrop = useCallback(() => {
        saveToHistory();
        setState(s => ({ ...s, freeCrop: true }));
    }, [saveToHistory]);

    const handleFreeCropSizeChange = useCallback((field, value) => {
        const numericValue = Number(value);
        saveToHistory();
        setState(s => {
            const next = {
                ...s,
                freeCropSize: {
                    ...s.freeCropSize,
                    [field]: Math.max(CROP_DEFAULTS.minSize, Math.min(420, numericValue))
                }
            };
            next.aspect = next.freeCropSize.width / next.freeCropSize.height;
            return next;
        });
    }, [saveToHistory]);

    // Undo/Redo
    const undo = useCallback(() => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(h => h.slice(0, -1));
            setState(prev);
        }
    }, [history]);

    const reset = useCallback(() => {
        setHistory([]);
        setState({
            crop: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
            aspect: initialAspect,
            freeCrop: false,
            freeCropSize: { width: 260, height: 260 },
            croppedAreaPixels: null,
            isProcessing: false
        });
    }, [initialAspect]);

    // Helpers
    const isAspectSelected = useCallback((targetAspect) => {
        return Math.abs(state.aspect - targetAspect) < 0.01;
    }, [state.aspect]);

    return {
        // Estado
        ...state,
        // Setters
        setCrop,
        setZoom,
        setRotation,
        setAspect,
        setCroppedAreaPixels,
        setIsProcessing,
        // Actions
        selectPresetAspect,
        enableFreeCrop,
        handleFreeCropSizeChange,
        undo,
        reset,
        canUndo: history.length > 0,
        // Helpers
        isAspectSelected
    };
};

export default useImageCropper;