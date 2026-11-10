import { useState, useCallback, useEffect } from 'react';
import { CROP_DEFAULTS } from '../utils/cropUtils';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeDegree = (value) => ((value % 360) + 360) % 360;

const getDefaultState = (initialAspect) => ({
  crop: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
  aspect: initialAspect,
  freeCrop: false,
  freeCropSize: { width: 260, height: 260 },
  croppedAreaPixels: null,
  isProcessing: false,
});

const useImageCropper = (initialAspect = 4 / 3) => {
  const [state, setState] = useState(() => getDefaultState(initialAspect));
  const [history, setHistory] = useState([]);

  const cloneState = useCallback((value) => ({
    ...value,
    crop: value.crop ? { ...value.crop } : { x: 0, y: 0 },
    freeCropSize: value.freeCropSize ? { ...value.freeCropSize } : { width: 260, height: 260 },
    croppedAreaPixels: value.croppedAreaPixels ? { ...value.croppedAreaPixels } : null,
  }), []);

  useEffect(() => {
    setState(getDefaultState(initialAspect));
    setHistory([]);
  }, [initialAspect]);

  const pushHistory = useCallback(() => {
    setHistory((current) => [...current.slice(-4), cloneState(state)]);
  }, [cloneState, state]);

  const setCrop = useCallback((next) => {
    setState((current) => ({
      ...current,
      crop: typeof next === 'function' ? next(current.crop) : next,
    }));
  }, []);

  const setZoom = useCallback((next) => {
    setState((current) => ({
      ...current,
      zoom: clamp(Number(typeof next === 'function' ? next(current.zoom) : next) || 1, 1, 3),
    }));
  }, []);

  const setRotation = useCallback((next) => {
    setState((current) => ({
      ...current,
      rotation: normalizeDegree(Number(typeof next === 'function' ? next(current.rotation) : next) || 0),
    }));
    pushHistory();
  }, [pushHistory]);

  const setAspect = useCallback((nextAspect) => {
    setState((current) => ({ ...current, aspect: nextAspect, freeCrop: false }));
    pushHistory();
  }, [pushHistory]);

  const setCroppedAreaPixels = useCallback((pixels) => {
    setState((current) => ({ ...current, croppedAreaPixels: pixels || null }));
  }, []);

  const setIsProcessing = useCallback((isProcessing) => {
    setState((current) => ({ ...current, isProcessing }));
  }, []);

  const selectPresetAspect = useCallback((nextAspect) => {
    setState((current) => ({
      ...current,
      aspect: nextAspect,
      freeCrop: false,
      freeCropSize: {
        width: 260,
        height: Math.max(140, Math.round(260 / nextAspect)),
      },
    }));
    pushHistory();
  }, [pushHistory]);

  const enableFreeCrop = useCallback(() => {
    setState((current) => ({ ...current, freeCrop: true }));
    pushHistory();
  }, [pushHistory]);

  const handleFreeCropSizeChange = useCallback((field, value) => {
    const numericValue = Number(value);
    setState((current) => {
      const nextSize = {
        ...current.freeCropSize,
        [field]: clamp(numericValue, CROP_DEFAULTS.minSize, 420),
      };

      return {
        ...current,
        freeCropSize: nextSize,
        aspect: nextSize.width / nextSize.height,
      };
    });
    pushHistory();
  }, [pushHistory]);

  const reset = useCallback(() => {
    setHistory([]);
    setState(getDefaultState(initialAspect));
  }, [initialAspect]);

  const undo = useCallback(() => {
    if (!history.length) return;

    const previous = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setState(previous);
  }, [history]);

  const isAspectSelected = useCallback((targetAspect) => Math.abs(state.aspect - targetAspect) < 0.01, [state.aspect]);

  return {
    ...state,
    setCrop,
    setZoom,
    setRotation,
    setAspect,
    setCroppedAreaPixels,
    setIsProcessing,
    selectPresetAspect,
    enableFreeCrop,
    handleFreeCropSizeChange,
    undo,
    reset,
    canUndo: history.length > 0,
    isAspectSelected,
  };
};

export default useImageCropper;