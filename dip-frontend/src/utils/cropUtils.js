/**
 * Configurações padrão para crop
 */
export const CROP_DEFAULTS = {
    quality: 0.85,
    mimeType: 'image/jpeg',
    maxSize: 1200,
    minSize: 140
};

/**
 * Presets de tamanhos comuns
 */
export const PRESET_SIZES = {
    profile: { width: 300, height: 300, label: 'Perfil (300x300)', aspect: 1 },
    document: { width: 800, height: 600, label: 'Documento (800x600)', aspect: 4/3 },
    banner: { width: 1200, height: 400, label: 'Banner (1200x400)', aspect: 3 },
    status: { width: 540, height: 960, label: 'Status (9:16)', aspect: 9/16 },
    landscape: { width: 1200, height: 630, label: 'Paisagem (16:9)', aspect: 16/9 }
};

/**
 * Cria uma imagem a partir de URL com tratamento de erro
 */
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => {
            console.error('Erro ao carregar imagem para crop:', error);
            reject(new Error('Não foi possível carregar a imagem. Verifique o formato.'));
        });
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Converte graus para radianos
 */
export const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180;
};

/**
 * Calcula as dimensões do bounding box de uma imagem rotacionada
 */
export const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

/**
 * Valida as dimensões do crop
 */
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

/**
 * Redimensiona canvas mantendo proporção
 */
const resizeCanvas = (canvas, maxSize) => {
    let { width, height } = canvas;
    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }
    return { width, height };
};

/**
 * Função principal para crop de imagem
 * @param {string} imageSrc - URL da imagem em base64
 * @param {Object} pixelCrop - Área a ser cortada { x, y, width, height }
 * @param {number} rotation - Rotação em graus
 * @param {Object} options - Opções { quality, mimeType, maxSize }
 * @returns {Promise<string>} - Imagem cortada em base64
 */
const resolveOutputMimeType = (imageSrc, mimeType) => {
    if (typeof imageSrc === 'string' && imageSrc.startsWith('data:image/png')) {
        return 'image/png';
    }
    if (typeof imageSrc === 'string' && imageSrc.startsWith('data:image/webp')) {
        return 'image/webp';
    }
    return mimeType || 'image/jpeg';
};

const getNonTransparentBounds = (imageData, width, height, margin = 0) => {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    const { data } = imageData;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 8) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < 0 || maxY < 0) {
        return { x: 0, y: 0, width, height };
    }

    const safeMargin = Math.max(0, Math.round(margin));
    const x = Math.max(0, minX - safeMargin);
    const y = Math.max(0, minY - safeMargin);
    const cropWidth = Math.min(width - x, maxX - minX + 1 + safeMargin * 2);
    const cropHeight = Math.min(height - y, maxY - minY + 1 + safeMargin * 2);

    return { x, y, width: cropWidth, height: cropHeight };
};

const getAlphaCoverage = (imageData, x, y, width, height) => {
    if (!width || !height) return 0;

    const { data, width: sourceWidth } = imageData;
    let visiblePixels = 0;

    for (let py = 0; py < height; py += 1) {
        for (let px = 0; px < width; px += 1) {
            const sx = x + px;
            const sy = y + py;
            if (sx < 0 || sy < 0 || sx >= sourceWidth || sy >= imageData.height) {
                continue;
            }
            const alpha = data[(sy * sourceWidth + sx) * 4 + 3];
            if (alpha > 8) {
                visiblePixels += 1;
            }
        }
    }

    return visiblePixels;
};

const getCroppedImg = async (
    imageSrc,
    pixelCrop,
    rotation = 0,
    options = {}
) => {
    if (!imageSrc) {
        throw new Error('Imagem não fornecida');
    }

    if (!pixelCrop || typeof pixelCrop.x !== 'number' || typeof pixelCrop.y !== 'number' || typeof pixelCrop.width !== 'number' || typeof pixelCrop.height !== 'number') {
        throw new Error('Área de corte não definida. Selecione uma área válida.');
    }

    const { quality, mimeType, maxSize } = { ...CROP_DEFAULTS, ...options };
    const outputMimeType = resolveOutputMimeType(imageSrc, mimeType);
    const image = await createImage(imageSrc);

    const rotRad = getRadianAngle(rotation);
    const { width: rotatedWidth, height: rotatedHeight } = rotateSize(image.width, image.height, rotation);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Contexto 2D não suportado');
    }

    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;

    if (outputMimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
        throw new Error('Contexto 2D não suportado no canvas final');
    }

    const safeWidth = Math.max(1, Math.round(pixelCrop.width));
    const safeHeight = Math.max(1, Math.round(pixelCrop.height));
    const safeX = Math.max(0, Math.round(pixelCrop.x));
    const safeY = Math.max(0, Math.round(pixelCrop.y));

    croppedCanvas.width = safeWidth;
    croppedCanvas.height = safeHeight;

    if (outputMimeType === 'image/jpeg') {
        croppedCtx.fillStyle = '#ffffff';
        croppedCtx.fillRect(0, 0, safeWidth, safeHeight);
    }

    croppedCtx.drawImage(
        canvas,
        safeX,
        safeY,
        safeWidth,
        safeHeight,
        0,
        0,
        safeWidth,
        safeHeight
    );

    if (maxSize && (croppedCanvas.width > maxSize || croppedCanvas.height > maxSize)) {
        const { width, height } = resizeCanvas(croppedCanvas, maxSize);
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = width;
        resizedCanvas.height = height;
        if (outputMimeType === 'image/jpeg') {
            resizedCtx.fillStyle = '#ffffff';
            resizedCtx.fillRect(0, 0, width, height);
        }
        resizedCtx.drawImage(croppedCanvas, 0, 0, width, height);
        return resizedCanvas.toDataURL(outputMimeType, quality);
    }

    return croppedCanvas.toDataURL(outputMimeType, quality);
};

export default getCroppedImg;