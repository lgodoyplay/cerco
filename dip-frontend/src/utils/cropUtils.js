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
const getCroppedImg = async (
    imageSrc,
    pixelCrop,
    rotation = 0,
    options = {}
) => {
    // Validação de entrada
    if (!imageSrc) {
        throw new Error('Imagem não fornecida');
    }
    
    if (!pixelCrop || typeof pixelCrop.x !== 'number') {
        throw new Error('Área de corte não definida. Selecione uma área válida.');
    }

    const { quality, mimeType, maxSize } = { ...CROP_DEFAULTS, ...options };
    
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Contexto 2D não suportado');
    }

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // Configurar canvas com tamanho do bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Transformações
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Desenhar imagem
    ctx.drawImage(image, 0, 0);

    // Extrair área cortada
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // Criar canvas final
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    
    if (!finalCtx) {
        throw new Error('Contexto 2D não suportado no canvas final');
    }

    finalCanvas.width = pixelCrop.width;
    finalCanvas.height = pixelCrop.height;
    finalCtx.putImageData(data, 0, 0);

    // Redimensionar se necessário
    if (maxSize && (finalCanvas.width > maxSize || finalCanvas.height > maxSize)) {
        const { width, height } = resizeCanvas(finalCanvas, maxSize);
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = width;
        resizedCanvas.height = height;
        resizedCtx.drawImage(finalCanvas, 0, 0, width, height);
        return resizedCanvas.toDataURL(mimeType, quality);
    }

    return finalCanvas.toDataURL(mimeType, quality);
};

export default getCroppedImg;