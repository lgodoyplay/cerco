export const CROP_DEFAULTS = {
  quality: 0.92,
  mimeType: 'image/jpeg',
  maxSize: 1600,
  minSize: 140,
};

export const PRESET_SIZES = {
  profile: { width: 300, height: 300, label: 'Perfil (300x300)', aspect: 1 },
  document: { width: 800, height: 600, label: 'Documento (800x600)', aspect: 4 / 3 },
  banner: { width: 1200, height: 400, label: 'Banner (1200x400)', aspect: 3 },
  status: { width: 540, height: 960, label: 'Status (9:16)', aspect: 9 / 16 },
  landscape: { width: 1200, height: 630, label: 'Paisagem (16:9)', aspect: 16 / 9 },
};

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem para recortar.'));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

export const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

export const rotateSize = (width, height, rotation) => {
  const rotateInRadians = getRadianAngle(rotation);

  return {
    width: Math.round(Math.abs(Math.cos(rotateInRadians) * width) + Math.abs(Math.sin(rotateInRadians) * height)),
    height: Math.round(Math.abs(Math.sin(rotateInRadians) * width) + Math.abs(Math.cos(rotateInRadians) * height)),
  };
};

export const validateCropDimensions = (width, height) => {
  if (!width || !height) return 'Dimensões inválidas';

  if (width < CROP_DEFAULTS.minSize || height < CROP_DEFAULTS.minSize) {
    return `Dimensões mínimas: ${CROP_DEFAULTS.minSize}x${CROP_DEFAULTS.minSize}px`;
  }

  const ratio = width / height;
  if (ratio > 10 || ratio < 0.1) {
    return 'Proporção muito irregular. Ajuste a seleção.';
  }

  return null;
};

const resolveOutputMimeType = (imageSrc, mimeType) => {
  if (typeof imageSrc === 'string') {
    if (imageSrc.startsWith('data:image/png')) return 'image/png';
    if (imageSrc.startsWith('data:image/webp')) return 'image/webp';
  }

  return mimeType || 'image/jpeg';
};

const normalizeCrop = (pixelCrop) => {
  if (!pixelCrop || typeof pixelCrop.x !== 'number' || typeof pixelCrop.y !== 'number' || typeof pixelCrop.width !== 'number' || typeof pixelCrop.height !== 'number') {
    throw new Error('Área de corte não definida. Selecione uma região válida.');
  }

  const x = Math.max(0, Math.round(pixelCrop.x));
  const y = Math.max(0, Math.round(pixelCrop.y));
  const width = Math.max(1, Math.round(pixelCrop.width));
  const height = Math.max(1, Math.round(pixelCrop.height));

  return { x, y, width, height };
};

const resizeCanvas = (canvas, maxSize) => {
  let { width, height } = canvas;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

const prepareCanvas = (canvas, ctx, width, height, mimeType) => {
  ctx.clearRect(0, 0, width, height);

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
};

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, options = {}) => {
  if (!imageSrc) {
    throw new Error('Imagem não fornecida.');
  }

  const { quality, mimeType, maxSize } = { ...CROP_DEFAULTS, ...options };
  const outputMimeType = resolveOutputMimeType(imageSrc, mimeType);
  const crop = normalizeCrop(pixelCrop);
  const image = await createImage(imageSrc);

  const safeRotation = ((rotation % 360) + 360) % 360;
  const rotatedDimensions = rotateSize(image.width, image.height, safeRotation);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Contexto 2D não suportado pelo navegador.');
  }

  canvas.width = rotatedDimensions.width;
  canvas.height = rotatedDimensions.height;
  prepareCanvas(canvas, ctx, canvas.width, canvas.height, outputMimeType);

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(getRadianAngle(safeRotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Contexto 2D do canvas final não suportado.');
  }

  croppedCanvas.width = crop.width;
  croppedCanvas.height = crop.height;
  prepareCanvas(croppedCanvas, croppedCtx, crop.width, crop.height, outputMimeType);

  croppedCtx.drawImage(
    canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  if (maxSize && (croppedCanvas.width > maxSize || croppedCanvas.height > maxSize)) {
    const resized = resizeCanvas(croppedCanvas, maxSize);
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');

    resizedCanvas.width = resized.width;
    resizedCanvas.height = resized.height;
    prepareCanvas(resizedCanvas, resizedCtx, resized.width, resized.height, outputMimeType);

    resizedCtx.drawImage(croppedCanvas, 0, 0, resized.width, resized.height);
    return resizedCanvas.toDataURL(outputMimeType, quality);
  }

  return croppedCanvas.toDataURL(outputMimeType, quality);
};

export default getCroppedImg;