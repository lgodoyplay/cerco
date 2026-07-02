import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// REGISTRA AS FONTES NO PDFMAKE
pdfMake.vfs = pdfFonts.vfs;

// Configuração padrão de fontes
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

// Cache de imagens para evitar recarregamento
const imageCache = new Map();

// Timeout padrão para carregamento de imagens (2 segundos)
const IMAGE_LOAD_TIMEOUT = 2000;

/**
 * Carrega uma imagem de URL e converte para Base64 com cache
 * @param {string} url - URL da imagem
 * @param {number} timeout - Timeout em ms (padrão: 2000)
 * @returns {Promise<string|null>} - Data URL da imagem ou null
 */
export const getBase64ImageFromURL = (url, timeout = IMAGE_LOAD_TIMEOUT) => {
    if (!url) return Promise.resolve(null);
    
    // Verificar cache primeiro
    if (imageCache.has(url)) {
        return Promise.resolve(imageCache.get(url));
    }

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            console.warn("Timeout ao carregar imagem:", url);
            resolve(null);
        }, timeout);

        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;
                
                // Redimensionar se muito grande
                let { width, height } = img;
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compressão adaptativa baseada no tamanho
                const quality = width * height > 100000 ? 0.6 : 0.8;
                const dataURL = canvas.toDataURL("image/jpeg", quality);
                
                if (dataURL && dataURL.startsWith('data:image')) {
                    imageCache.set(url, dataURL);
                    resolve(dataURL);
                } else {
                    console.warn("Imagem gerou base64 inválido:", url);
                    resolve(null);
                }
            } catch (e) {
                console.warn("Erro ao processar imagem no canvas:", url, e);
                resolve(null);
            }
        };

        img.onerror = () => {
            clearTimeout(timer);
            console.warn("Erro de rede/carregamento da imagem:", url);
            resolve(null);
        };

        try {
            img.src = url;
        } catch (e) {
            clearTimeout(timer);
            console.warn("URL de imagem inválida:", url);
            resolve(null);
        }
    });
};

/**
 * Limpa o cache de imagens
 */
export const clearImageCache = () => {
    imageCache.clear();
};

/**
 * Valida dados obrigatórios
 * @param {Object} data - Dados a validar
 * @param {string[]} requiredFields - Campos obrigatórios
 * @throws {Error} Se campo obrigatório estiver ausente
 */
export const validateRequiredFields = (data, requiredFields = []) => {
    if (!data) {
        throw new Error('Dados não fornecidos');
    }
    
    const missing = requiredFields.filter(field => 
        data[field] === undefined || data[field] === null || data[field] === ''
    );
    
    if (missing.length > 0) {
        throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
    
    return true;
};

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} dateStr - Data a formatar
 * @returns {string} Data formatada
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return "Não informada";
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return "Data inválida";
    }
};

/**
 * Escapa HTML para texto seguro
 * @param {string} value - Valor a escapar
 * @returns {string} Valor escapado
 */
export const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');

/**
 * Gera e baixa um PDF automaticamente.
 * @param {Object} docDefinition - Definição do documento pdfMake.
 * @param {string} filename - Nome do arquivo para download.
 * @param {Object} options - Opções adicionais (open: boolean para visualizar)
 */
export const gerarPDF = (docDefinition, filename = 'documento.pdf', options = {}) => {
    try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        if (options.open) {
            pdfDocGenerator.open();
        } else {
            pdfDocGenerator.download(filename);
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF. Verifique o console.");
    }
};

/**
 * Gera PDF com tratamento de loading
 * @param {Function} generatorFn - Função que gera o PDF
 * @param {Function} setLoading - Setter para estado de loading
 */
export const generatePDFWithLoading = async (generatorFn, setLoading) => {
    if (setLoading) setLoading(true);
    try {
        await generatorFn();
    } catch (error) {
        console.error("Erro na geração do PDF:", error);
        alert("Erro ao gerar o documento. Tente novamente.");
    } finally {
        if (setLoading) setLoading(false);
    }
};

export default pdfMake;