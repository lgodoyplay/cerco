import pdfMake from "./pdf";

// Função para garantir que as fontes estejam carregadas antes de gerar (Mantido para compatibilidade)
const ensureFontsConfigured = () => true;

// --- CONFIGURAÇÃO DE ESTILOS ---
const styles = {
    headerBlock: {
        alignment: 'center',
        margin: [0, 0, 0, 20]
    },
    headerText: {
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 2, 0, 0],
        color: '#000000'
    },
    docTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 5],
        decoration: 'underline'
    },
    docSubtitle: {
        fontSize: 12,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
    },
    sectionTitle: {
        fontSize: 12,
        bold: true,
        fillColor: '#eeeeee',
        margin: [0, 15, 0, 10],
        padding: 5
    },
    normalText: {
        fontSize: 11,
        alignment: 'justify',
        margin: [0, 0, 0, 5],
        lineHeight: 1.3
    },
    tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
        fillColor: '#e5e7eb',
        alignment: 'left',
        margin: [0, 4, 0, 4]
    },
    tableCell: {
        fontSize: 10,
        color: 'black',
        alignment: 'left',
        margin: [0, 4, 0, 4]
    },
    footer: {
        fontSize: 8,
        alignment: 'center',
        color: '#666666',
        margin: [0, 10, 0, 0]
    }
};

export const DEFAULT_TEMPLATE_LAYOUTS = {
    investigation: {
        coverTopLineY: 170,
        coverBottomLineY: 620
    },
    arrest: {},
    bo: {},
    wanted: {}
};

export const DEFAULT_PAGE_HEADER_CONFIG = {
    line1: 'ESTADO DA EUFORIA',
    line2: 'SECRETARIA DE SEGURANCA PUBLICA',
    line3: 'CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGACAO DE NARCOTICOS'
};

export const DEFAULT_INVESTIGATION_COVER_CONFIG = {
    eyebrow1: 'POLICIA CIVIL DO ESTADO DA EUFORIA',
    eyebrow2: 'DEPARTAMENTO DE INVESTIGACOES CRIMINAIS',
    title: 'RELATORIO FINAL DE INQUERITO POLICIAL',
    footer: '"Servir e Proteger com Justica e Integridade"'
};

export const DEFAULT_INVESTIGATION_NUMBER_CONFIG = {
    segment: '8',
    tribunal: '26',
    unit: '0001'
};

export const DEFAULT_INVESTIGATION_COVER_TEMPLATE = `<p class="ql-align-center"><strong>POLÍCIA CIVIL DO ESTADO DA EUFORIA</strong></p>
<p class="ql-align-center"><strong>DEPARTAMENTO DE INVESTIGAÇÕES CRIMINAIS</strong></p>
<p class="ql-align-center"><br></p>
<p class="ql-align-center"><strong>RELATÓRIO FINAL DE INQUÉRITO POLICIAL</strong></p>
<p class="ql-align-center"><br></p>
<p class="ql-align-center">PROTOCOLO Nº {numero_inquerito}</p>
<p class="ql-align-center"><br></p>
<p class="ql-align-center">"Servir e Proteger com Justiça e Integridade"</p>`;

export const getMergedTemplateLayout = (type = 'investigation', layoutConfig = {}) => ({
    ...(DEFAULT_TEMPLATE_LAYOUTS[type] || {}),
    ...(layoutConfig || {})
});

export const getMergedPageHeaderConfig = (headerConfig = {}) => ({
    ...DEFAULT_PAGE_HEADER_CONFIG,
    ...(headerConfig || {})
});

export const getMergedInvestigationNumberConfig = (numberConfig = {}) => ({
    ...DEFAULT_INVESTIGATION_NUMBER_CONFIG,
    ...(numberConfig || {})
});

export const getMergedInvestigationCoverConfig = (coverConfig = {}) => ({
    ...DEFAULT_INVESTIGATION_COVER_CONFIG,
    ...(coverConfig || {})
});

// --- FUNÇÕES AUXILIARES ---

// Converter URL de imagem para Base64 com timeout e validação
const getBase64ImageFromURL = (url) => {
    return new Promise((resolve) => {
        // Timeout de 5 segundos para evitar travamento
        const timer = setTimeout(() => {
            console.warn("Timeout ao carregar imagem:", url);
            resolve(null);
        }, 5000);

        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL("image/jpeg", 0.7); // Compressão leve (0.7) para reduzir tamanho
                
                // Validação básica do dataURL
                if (dataURL && dataURL.startsWith('data:image')) {
                    resolve(dataURL);
                } else {
                    console.warn("Imagem gerou base64 inválido:", url);
                    resolve(null);
                }
            } catch (e) {
                console.warn("Erro ao processar imagem no canvas (possível taint):", url, e);
                resolve(null);
            }
        };

        img.onerror = _error => {
            clearTimeout(timer);
            console.warn("Erro de rede/carregamento da imagem:", url); // Não loga o objeto erro completo para evitar ruído
            resolve(null);
        };

        try {
            img.src = url;
        } catch (_error) {
            clearTimeout(timer);
            console.warn("URL de imagem inválida:", url);
            resolve(null);
        }
    });
};

// Formatar data
const formatDate = (dateStr) => {
    if (!dateStr) return "Não informada";
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProofTypeLabel = (type) => {
    const labels = {
        image: 'Imagem',
        video: 'Vídeo',
        link: 'Link',
        file: 'Arquivo',
        text: 'Texto'
    };

    return labels[type] || (type ? String(type).charAt(0).toUpperCase() + String(type).slice(1) : 'Documento');
};

const isImageProof = (proof = {}) => {
    const type = String(proof?.type || '').trim().toLowerCase();
    const content = String(proof?.content || '').toLowerCase();

    return (
        type === 'image' ||
        type === 'imagem' ||
        type === 'foto' ||
        type === 'fotografia' ||
        /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(content)
    );
};

const buildProofAttachmentHtml = (proof) => {
    if (!proof?.content) return '[Arquivo vinculado]';

    if (proof.type === 'link' || proof.type === 'video' || proof.type === 'file' || proof.type === 'image') {
        const safeUrl = escapeHtml(proof.content);
        return `<a href="${safeUrl}">Arquivo vinculado</a>`;
    }

    return escapeHtml('[Arquivo vinculado]');
};

const buildInvestigationProofsHtml = (proofs = []) => {
    if (!proofs.length) {
        return `<p><strong>PROVA 001 - Nenhuma prova catalogada</strong></p>
<p>Tipo: Não informado</p>
<p>Data de Inserção: Não informada</p>
<p>Responsável: Sistema</p>
<p>Descrição:</p>
<p>Nenhuma prova foi inserida na pasta até o momento da geração do relatório.</p>
<p>Anexo: [Arquivo vinculado]</p>`;
    }

    return proofs.map((proof, index) => {
        const proofNumber = String(index + 1).padStart(3, '0');
        const attachmentNote = isImageProof(proof)
            ? `${proof.content ? `<img src="${escapeHtml(proof.content)}" alt="${escapeHtml(proof.title || 'Imagem da prova')}" style="display:block;max-width:100%;max-height:320px;object-fit:contain;margin:12px auto;border-radius:6px;" />` : ''}<span>Imagem vinculada ao sistema.</span>`
            : buildProofAttachmentHtml(proof);
        return `<p><strong>PROVA ${proofNumber} - ${escapeHtml(proof.title || 'Sem título')}</strong></p>
<p>Tipo: ${escapeHtml(getProofTypeLabel(proof.type))}</p>
<p>Data de Inserção: ${escapeHtml(formatDate(proof.createdAt))}</p>
<p>Responsável: ${escapeHtml(proof.author || 'Agente')}</p>
<p>Descrição:</p>
<p>${escapeHtml(proof.description || proof.content || 'Sem descrição informada.')}</p>
<p>Anexo: ${attachmentNote}</p>
<p><br></p>`;
    }).join('');
};

const buildInvestigationProofBlocksPdf = (proofs = []) => {
    if (!proofs.length) {
        return [{ text: 'Nenhuma prova anexada.', style: 'normalText', italics: true }];
    }

    return proofs.flatMap((proof, index) => {
        const proofNumber = String(index + 1).padStart(3, '0');
        const block = [
            { text: `PROVA ${proofNumber} - ${proof.title || 'Sem título'}`, bold: true, fontSize: 11, margin: [0, index === 0 ? 0 : 14, 0, 6] },
            { text: `Tipo: ${getProofTypeLabel(proof.type)}`, style: 'normalText', margin: [0, 0, 0, 2] },
            { text: `Data de Inserção: ${formatDate(proof.createdAt)}`, style: 'normalText', margin: [0, 0, 0, 2] },
            { text: `Responsável: ${proof.author || 'Agente'}`, style: 'normalText', margin: [0, 0, 0, 6] },
            { text: 'Descrição:', style: 'normalText', bold: true, margin: [0, 0, 0, 2] },
            { text: proof.description || proof.content || 'Sem descrição informada.', style: 'normalText', margin: [0, 0, 0, 6] }
        ];

        if (isImageProof(proof) && proof.imgData) {
            block.push(
                { text: 'Anexo fotográfico:', style: 'normalText', bold: true, margin: [0, 0, 0, 6] },
                { image: proof.imgData, fit: [420, 300], alignment: 'center', margin: [0, 0, 0, 8] }
            );
        } else if (proof.type === 'link' || proof.type === 'video') {
            block.push({ text: `Anexo: ${proof.content || 'Link não informado'}`, link: proof.content || undefined, color: '#2563eb', decoration: 'underline', fontSize: 10, margin: [0, 0, 0, 8] });
        } else if (proof.type === 'file') {
            block.push({ text: `Anexo: ${proof.content || 'Arquivo vinculado'}`, fontSize: 10, italics: true, color: '#4b5563', margin: [0, 0, 0, 8] });
        } else {
            block.push({ text: 'Anexo: [Arquivo vinculado]', fontSize: 10, margin: [0, 0, 0, 8] });
        }

        return block;
    });
};

const buildInvestigationProofsText = (proofs = []) => {
    if (!proofs.length) return 'Nenhuma prova anexada.';

    return proofs.map((proof, index) =>
        `${String(index + 1).padStart(3, '0')} - ${proof.title || 'Sem título'} | ${getProofTypeLabel(proof.type)} | ${formatDate(proof.createdAt)} | ${proof.author || 'Agente'}`
    ).join('\n');
};

const onlyDigits = (value = '') => String(value || '').replace(/\D/g, '');

const modulo97 = (digits) => {
    let remainder = 0;
    for (const digit of String(digits)) {
        remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder;
};

export const formatInvestigationNumber = (data = {}, numberConfig = {}) => {
    const config = getMergedInvestigationNumberConfig(numberConfig);
    const year = String(new Date(data.createdAt || data.created_at || Date.now()).getFullYear()).padStart(4, '0').slice(-4);
    const sequential = onlyDigits(data.id).padStart(7, '0').slice(-7);
    const segment = onlyDigits(config.segment).padStart(1, '0').slice(-1);
    const tribunal = onlyDigits(config.tribunal).padStart(2, '0').slice(-2);
    const unit = onlyDigits(config.unit).padStart(4, '0').slice(-4);
    const baseNumber = `${sequential}${year}${segment}${tribunal}${unit}`;
    const verifier = String(98 - (modulo97(`${baseNumber}00`) % 97)).padStart(2, '0').slice(-2);

    return `${sequential}-${verifier}.${year}.${segment}.${tribunal}.${unit}`;
};

const replaceTemplateVariables = (templateStr = '', variables = {}) => {
    let processedHtml = templateStr || '';

    Object.keys(variables).forEach(key => {
        const regex = new RegExp(key, 'g');
        processedHtml = processedHtml.replace(regex, variables[key] || '');
    });

    return processedHtml;
};

const normalizeInvestigationTemplateHtml = (templateStr = '') => {
    if (!templateStr) return '';

    let normalized = templateStr.replace(/&nbsp;/gi, ' ');

    normalized = normalized.replace(/<p[^>]*>\s*(?:<strong>)?\s*POL[ÍI]CIA\s+CIVIL\s+DO\s+ESTADO\s+DA\s+EUFORIA\s*(?:<\/strong>)?\s*<\/p>\s*/i, '');
    normalized = normalized.replace(/<p[^>]*>\s*(?:<strong>)?\s*DEPARTAMENTO\s+DE\s+INVESTIGA[ÇC][ÕO]ES\s+CRIMINAIS\s*(?:<\/strong>)?\s*<\/p>\s*/i, '');
    normalized = normalized.replace(/<p[^>]*>\s*<br>\s*<\/p>\s*/i, '');
    normalized = normalized.replace(/<p[^>]*>\s*(?:<strong>)?\s*RELAT[ÓO]RIO\s+FINAL\s+DE\s+INQU[ÉE]RITO\s+POLICIAL\s*(?:<\/strong>)?\s*<\/p>\s*/i, '');
    normalized = normalized.replace(/<p[^>]*>\s*(?:<strong>)?\s*POL[ÍI]CIA\s+CIVIL\s+DO\s+ESTADO\s+DA\s+EUFORIA\s*(?:<\/strong>)?\s*<\/p>\s*<p[^>]*>\s*"Servir\s+e\s+Proteger\s+com\s+Justi[çc]a\s+e\s+Integridade"\s*<\/p>\s*$/i, '');

    return normalized.trim();
};

const getDocumentVariables = (data, user, type = 'investigation', investigationNumberConfig = {}) => {
    if (type === 'investigation') {
        const listaProvas = buildInvestigationProofsText(data.proofs || []);
        const blocoProvas = buildInvestigationProofsHtml(data.proofs || []);
        const investigationNumber = formatInvestigationNumber(data, investigationNumberConfig);

        return {
            '{numero_inquerito}': investigationNumber,
            '{data_abertura}': formatDate(data.createdAt),
            '{status}': data.status,
            '{delegacia}': data.delegaciaResponsavel || 'Delegacia Central de Investigacoes',
            '{nome_agente}': data.investigator ? data.investigator.nome : (user?.nome || 'Agente Responsavel'),
            '{nome_investigado}': data.nomeInvestigado || (Array.isArray(data.involved) ? data.involved.join(', ') : (data.involved || 'Nao informado')),
            '{cpf_investigado}': data.cpfInvestigado || 'Nao informado',
            '{data_nascimento}': data.dataNascimento ? formatDate(data.dataNascimento) : 'Nao informado',
            '{endereco}': data.enderecoInvestigado || 'Nao informado',
            '{telefone}': data.telefoneInvestigado || 'Nao informado',
            '{relato_fatos}': data.description || 'Conforme informacoes e provas anexadas.',
            '{lista_provas}': listaProvas,
            '{bloco_provas}': blocoProvas,
            '{data_conclusao}': formatDate(data.closedAt || new Date()),
            '{nome_delegado}': data.nomeDelegado || 'Delegado Responsavel',
            '{nome_detido}': Array.isArray(data.involved) ? data.involved.join(', ') : 'Nao informado',
            '{data_atual}': new Date().toLocaleDateString('pt-BR'),
            '{local_prisao}': 'Local da Ocorrencia',
            '{doc_detido}': 'RG/CPF nao informado',
            '{protocolo}': `${new Date().getFullYear()}.${data.id}`,
            '{natureza_ocorrencia}': 'Investigacao Criminal',
            '{nome_comunicante}': user?.nome || 'Agente Responsavel',
            '{conclusao}': 'Conforme relatorio de provas em anexo.',
            '{assinatura_agente}': user?.nome || 'Agente',
            '{cargo_agente}': 'Investigador CIVIL EUFORIA'
        };
    }

    if (type === 'bo') {
        return {
            '{numero_inquerito}': data.id,
            '{data_abertura}': formatDate(data.created_at),
            '{status}': data.status || 'Registrado',
            '{nome_investigado}': 'N/A',
            '{cpf_investigado}': 'N/A',
            '{nome_detido}': 'N/A',
            '{data_atual}': new Date().toLocaleDateString('pt-BR'),
            '{local_prisao}': data.localizacao || 'Nao informado',
            '{doc_detido}': 'N/A',
            '{protocolo}': `BO Nº ${data.id}/${new Date().getFullYear()}`,
            '{natureza_ocorrencia}': 'Ocorrencia Policial',
            '{nome_comunicante}': data.comunicante || 'Anonimo',
            '{relato_fatos}': data.descricao || 'Sem descricao.',
            '{conclusao}': 'Registro realizado para fins legais.',
            '{assinatura_agente}': user?.nome || 'Agente de Plantao',
            '{cargo_agente}': 'Agente da CIVIL EUFORIA'
        };
    }

    if (type === 'arrest') {
        return {
            '{numero_inquerito}': data.id,
            '{data_abertura}': formatDate(data.date || data.created_at),
            '{status}': 'Detido',
            '{nome_investigado}': data.name,
            '{cpf_investigado}': data.passport || 'Nao informado',
            '{nome_detido}': data.name,
            '{data_atual}': new Date().toLocaleDateString('pt-BR'),
            '{local_prisao}': 'Delegacia Central',
            '{doc_detido}': data.passport || 'Nao informado',
            '{protocolo}': `AP Nº ${data.id}/${new Date().getFullYear()}`,
            '{natureza_ocorrencia}': data.articles || data.reason || 'Detencao',
            '{nome_comunicante}': data.officer || 'Agente',
            '{relato_fatos}': data.reason || data.description || 'Sem observacoes adicionais.',
            '{conclusao}': 'Individuo detido e a disposicao da justica.',
            '{assinatura_agente}': data.officer || user?.nome || 'Agente Responsavel',
            '{cargo_agente}': 'Agente da CIVIL EUFORIA'
        };
    }

    return {};
};

const buildPreviewHeaderHtml = (headerConfig = {}) => {
    const header = getMergedPageHeaderConfig(headerConfig);

    return `
        <div class="pdf-preview-page-header">
            <div class="pdf-preview-page-header-text">${escapeHtml(header.line1)}</div>
            <div class="pdf-preview-page-header-text">${escapeHtml(header.line2)}</div>
            <div class="pdf-preview-page-header-text">${escapeHtml(header.line3)}</div>
        </div>
    `;
};

const buildPdfHeaderContent = (headerConfig = {}) => {
    const header = getMergedPageHeaderConfig(headerConfig);

    return [
        { text: header.line1, style: 'headerText' },
        { text: header.line2, style: 'headerText' },
        { text: header.line3, style: 'headerText' }
    ];
};

const getAlignment = (node) => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return undefined;

    const styleAttr = (node.getAttribute('style') || '').toLowerCase();
    const classAttr = node.getAttribute('class') || '';

    if (styleAttr.includes('text-align: center') || classAttr.includes('ql-align-center')) return 'center';
    if (styleAttr.includes('text-align: right') || classAttr.includes('ql-align-right')) return 'right';
    if (styleAttr.includes('text-align: justify') || classAttr.includes('ql-align-justify')) return 'justify';
    if (styleAttr.includes('text-align: left') || classAttr.includes('ql-align-left')) return 'left';

    return undefined;
};

const applyInlineStyles = (node, item) => {
    if (!item || node.nodeType !== Node.ELEMENT_NODE) return item;

    const tag = node.tagName.toLowerCase();
    const styleAttr = (node.getAttribute('style') || '').toLowerCase();

    if (tag === 'strong' || tag === 'b' || styleAttr.includes('font-weight: bold') || styleAttr.includes('font-weight:bold')) {
        item.bold = true;
    }

    if (tag === 'em' || tag === 'i' || styleAttr.includes('font-style: italic') || styleAttr.includes('font-style:italic')) {
        item.italics = true;
    }

    if (tag === 'u' || styleAttr.includes('text-decoration: underline')) {
        item.decoration = item.decoration ? [].concat(item.decoration, 'underline') : 'underline';
    }

    if (tag === 's' || tag === 'strike' || styleAttr.includes('text-decoration: line-through')) {
        item.decoration = item.decoration ? [].concat(item.decoration, 'lineThrough') : 'lineThrough';
    }

    if (tag === 'a') {
        const href = node.getAttribute('href');
        if (href) {
            item.link = href;
            item.color = item.color || '#2563eb';
            item.decoration = item.decoration || 'underline';
        }
    }

    return item;
};

const parseInlineNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const tag = node.tagName.toLowerCase();

    if (tag === 'br') {
        return '\n';
    }

    if (tag === 'img') {
        return '';
    }

    const children = Array.from(node.childNodes)
        .map(parseInlineNode)
        .filter(item => item !== null && item !== undefined && item !== '');

    if (tag === 'span' || tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i' || tag === 'u' || tag === 's' || tag === 'strike' || tag === 'a') {
        const inlineItem = {
            text: children.length <= 1 ? (children[0] || '') : children
        };
        return applyInlineStyles(node, inlineItem);
    }

    return children.length <= 1 ? (children[0] || '') : children;
};

const parseBlockNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        return text && text.trim() ? { text: text.trim() } : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tag = node.tagName.toLowerCase();
    const classAttr = node.getAttribute('class') || '';
    const alignment = getAlignment(node);

    if (node.hasAttribute('data-proof-block-placeholder')) {
        return { __proofBlockPlaceholder: true };
    }

    if (tag === 'div' && classAttr.includes('divider-blot')) {
        return {
            canvas: [
                { type: 'line', x1: 0, y1: 0, x2: 500, y2: 0, lineWidth: 1 }
            ],
            margin: [0, 10, 0, 10]
        };
    }

    if (tag === 'hr') {
        return {
            canvas: [
                { type: 'line', x1: 0, y1: 0, x2: 500, y2: 0, lineWidth: 1 }
            ],
            margin: [0, 10, 0, 10]
        };
    }

    if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(node.children)
            .filter(child => child.tagName && child.tagName.toLowerCase() === 'li')
            .map(li => {
                const parsed = Array.from(li.childNodes)
                    .map(parseInlineNode)
                    .filter(item => item !== null && item !== undefined && item !== '');
                return parsed.length <= 1 ? (parsed[0] || '') : parsed;
            });

        return tag === 'ul' ? { ul: items } : { ol: items };
    }

    if (tag === 'p' || tag === 'div') {
        const parsed = Array.from(node.childNodes)
            .map(parseInlineNode)
            .filter(item => item !== null && item !== undefined && item !== '');
        const paragraph = { text: parsed.length <= 1 ? (parsed[0] || '') : parsed };
        if (alignment) paragraph.alignment = alignment;
        return paragraph;
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
        const level = parseInt(tag.charAt(1), 10);
        const sizes = [24, 20, 18, 16, 14, 12];
        const parsed = Array.from(node.childNodes)
            .map(parseInlineNode)
            .filter(item => item !== null && item !== undefined && item !== '');
        const heading = {
            text: parsed.length <= 1 ? (parsed[0] || '') : parsed,
            fontSize: sizes[level - 1],
            bold: true,
            margin: [0, 10, 0, 5]
        };
        if (alignment) heading.alignment = alignment;
        return heading;
    }

    const fallback = Array.from(node.childNodes)
        .map(parseBlockNode)
        .filter(Boolean);

    if (fallback.length === 1) return fallback[0];
    if (fallback.length > 1) return fallback;
    return null;
};

const htmlToPdfmakeContent = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return Array.from(doc.body.childNodes)
        .map(parseBlockNode)
        .flat()
        .filter(item => item !== null && item !== undefined);
};

export const buildTemplatePreviewHtml = (data, user, templateStr = '', type = 'investigation', layoutConfig = {}, pageHeaderConfig = {}, coverConfig = {}, coverTemplate = '', investigationNumberConfig = {}) => {
    const layout = getMergedTemplateLayout(type, layoutConfig);
    const cover = getMergedInvestigationCoverConfig(coverConfig);
    const variables = getDocumentVariables(data, user, type, investigationNumberConfig);
    const sourceTemplate = type === 'investigation'
        ? normalizeInvestigationTemplateHtml(templateStr)
        : templateStr;
    const processedHtml = replaceTemplateVariables(sourceTemplate, variables);
    const processedCoverHtml = replaceTemplateVariables(coverTemplate || DEFAULT_INVESTIGATION_COVER_TEMPLATE, variables);

    const contentPage = `
        <section class="pdf-preview-page pdf-preview-body-page">
            ${buildPreviewHeaderHtml(pageHeaderConfig)}
            <div class="pdf-preview-page-content">${processedHtml}</div>
            <div class="pdf-preview-page-footer">
                <div class="pdf-preview-page-footer-text">Documento oficial gerado pelo sistema</div>
            </div>
        </section>
    `;

    if (type !== 'investigation') {
        return contentPage;
    }

    return `
        <section class="pdf-preview-page pdf-preview-cover-page">
            <div class="pdf-preview-cover-content">
                ${processedCoverHtml}
            </div>
        </section>
        ${contentPage}
    `;
};

const buildInvestigationCoverContent = (data, layoutConfig = {}, coverConfig = {}, coverTemplate = '', investigationNumberConfig = {}) => {
    const layout = getMergedTemplateLayout('investigation', layoutConfig);
    const cover = getMergedInvestigationCoverConfig(coverConfig);
    const variables = getDocumentVariables(data, null, 'investigation', investigationNumberConfig);
    const processedCoverHtml = replaceTemplateVariables(coverTemplate || DEFAULT_INVESTIGATION_COVER_TEMPLATE, variables);
    const coverContent = htmlToPdfmakeContent(processedCoverHtml);

    return {
        stack: coverContent.length ? coverContent : [
            { text: cover.eyebrow1, alignment: 'center', bold: true, fontSize: 16, margin: [0, 180, 0, 12] },
            { text: cover.eyebrow2, alignment: 'center', bold: true, fontSize: 13, margin: [0, 0, 0, 100] },
            { text: cover.title, alignment: 'center', bold: true, fontSize: 20, margin: [0, 0, 0, 20] },
            { text: `PROTOCOLO Nº ${String(data.id || '0001')}/${new Date().getFullYear()}`, alignment: 'center', fontSize: 11, margin: [0, 0, 0, 230] },
            { text: cover.footer, alignment: 'center', italics: true, fontSize: 11, color: '#444444' }
        ],
        margin: [0, 180, 0, 0],
        pageBreak: 'after'
    };
};

// Gerar Brasão (Placeholder Base64 - Imagem Transparente de 1x1 pixel para evitar erro)
const coatOfArmsBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Gerar Documento
export const generateProfessionalPDF = async (data, user, templateStr = null, type = 'investigation', layoutConfig = {}, pageHeaderConfig = {}, coverConfig = {}, coverTemplate = '', investigationNumberConfig = {}) => {
    console.log(`Iniciando geração de PDF Profissional (${type})...`, data);
    try {
        // Garantir configuração de VFS
        ensureFontsConfigured();
        
        // Carregar imagem de fundo em base64
        // @ts-ignore: TypeScript false positive
        const getBase64FromLocalImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.naturalWidth;
                    canvas.height = this.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(this, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = src;
            });
        };
        
        // Carregar o fundo
        let backgroundBase64;
        try {
            backgroundBase64 = await getBase64FromLocalImage('/PDF/fundo.png');
        } catch (e) {
            console.warn('Erro ao carregar imagem de fundo:', e);
            backgroundBase64 = null;
        }

        // Preparar dados de imagens (assíncrono) - Apenas se houver provas (investigation) ou imagens (arrest/bo)
        let processedProofs = [];
        let validImages = [];

        // Lógica de imagens baseada no tipo
        if (type === 'investigation' && data.proofs && data.proofs.length > 0) {
            processedProofs = await Promise.all(data.proofs.map(async (proof) => {
                let imgData = null;
                if (isImageProof(proof) && proof.content) {
                    try {
                        imgData = await getBase64ImageFromURL(proof.content);
                        if (!imgData || typeof imgData !== 'string' || !imgData.startsWith('data:image')) {
                             imgData = null;
                        }
                    } catch (_error) {
                        imgData = null;
                    }
                }
                return { ...proof, imgData };
            }));
            validImages = processedProofs.filter(p => p.imgData);
        } else if (type === 'arrest' && data.images && data.images.face) {
            // Processar imagem do preso
             try {
                const imgData = await getBase64ImageFromURL(data.images.face);
                if (imgData && typeof imgData === 'string' && imgData.startsWith('data:image')) {
                    validImages = [{ title: 'FOTO DO DETIDO', imgData, description: 'Registro fotográfico principal.' }];
                }
            } catch (_error) {
                console.warn("Erro ao carregar foto do preso");
            }
        } else if (type === 'wanted' && (data.image || (data.images && data.images.proof1))) {
            try {
                const imgUrl = data.image || (data.images && data.images.proof1);
                const imgData = await getBase64ImageFromURL(imgUrl);
                if (imgData && typeof imgData === 'string' && imgData.startsWith('data:image')) {
                    validImages = [{ title: 'FOTO DO PROCURADO', imgData, description: 'Registro fotográfico.' }];
                }
            } catch (_error) {
                console.warn("Erro ao carregar foto do procurado");
            }
        }

        // Definição de Variáveis e Conteúdo Padrão baseada no Tipo
        let variables = {};
        let standardContent = [];
        let docTitle = '';
        let docRef = '';
        let templateHasProofPlaceholder = false;
        // --- HEADER PADRÃO ---
        const officialHeader = [
            (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                image: coatOfArmsBase64, width: 40, alignment: 'center', margin: [0, 0, 0, 5]
            } : null,
            ...buildPdfHeaderContent(pageHeaderConfig)
        ];

        const mergedLayout = getMergedTemplateLayout(type, layoutConfig);

        if (type === 'investigation') {
            docTitle = 'RELATÓRIO FINAL DE INQUÉRITO POLICIAL';
            docRef = `PROTOCOLO Nº ${formatInvestigationNumber(data, investigationNumberConfig)}`;
            templateHasProofPlaceholder = Boolean(templateStr && (templateStr.includes('{bloco_provas}') || templateStr.includes('{lista_provas}')));
            
            // Criar lista de provas formatada
            const listaProvas = buildInvestigationProofsText(data.proofs || []);
            const blocoProvas = buildInvestigationProofsHtml(data.proofs || []);
            
            variables = {
                ...getDocumentVariables(data, user, type, investigationNumberConfig),
                '{lista_provas}': listaProvas,
                '{bloco_provas}': blocoProvas
            };

            standardContent = [
                ...officialHeader,

                { text: docTitle, style: 'docTitle' },
                { text: docRef, style: 'docSubtitle' },

                // --- IDENTIFICAÇÃO ---
                { text: '1. DADOS GERAIS', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['25%', '75%'],
                        body: [
                            [{ text: 'UNIDADE:', style: 'tableHeader' }, { text: 'CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS', style: 'tableCell' }],
                            [{ text: 'NATUREZA:', style: 'tableHeader' }, { text: 'Investigação Criminal', style: 'tableCell' }],
                            [{ text: 'STATUS:', style: 'tableHeader' }, { text: data.status.toUpperCase(), style: 'tableCell', bold: true }],
                            [{ text: 'PRIORIDADE:', style: 'tableHeader' }, { text: data.priority.toUpperCase(), style: 'tableCell' }],
                            [{ text: 'RESPONSÁVEL:', style: 'tableHeader' }, { text: data.investigator ? data.investigator.nome.toUpperCase() : (user?.nome || 'NÃO ATRIBUÍDO').toUpperCase(), style: 'tableCell' }],
                            [{ text: 'DATA INSTAURAÇÃO:', style: 'tableHeader' }, { text: formatDate(data.createdAt), style: 'tableCell' }]
                        ]
                    },
                    layout: 'noBorders'
                },

                // --- ENVOLVIDOS ---
                { text: '2. PARTES ENVOLVIDAS', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['100%'],
                        body: [
                           [{ text: Array.isArray(data.involved) ? data.involved.join(', ') : (data.involved || 'Não informado.'), style: 'tableCell' }]
                        ]
                    },
                    layout: 'noBorders'
                },

                // --- RELATO ---
                { text: '3. RELATO DOS FATOS', style: 'sectionTitle' },
                { text: data.description || 'Nenhuma descrição fornecida.', style: 'normalText' },

                // --- DILIGÊNCIAS ---
                { text: '4. HISTÓRICO E DILIGÊNCIAS', style: 'sectionTitle' },
                { ul: [`Abertura da investigação em ${formatDate(data.createdAt)}.`, `Análise inicial das evidências.`, data.status === 'Finalizada' ? `Encerramento e conclusão em ${formatDate(data.closedAt)}.` : 'Investigação em andamento.'], style: 'normalText', margin: [10, 0, 0, 0] }
            ];

        } else if (type === 'bo') {
            docTitle = 'BOLETIM DE OCORRÊNCIA';
            docRef = `BO Nº ${data.id}/${new Date().getFullYear()}`;
            
            variables = getDocumentVariables(data, user, type);

            standardContent = [
                ...officialHeader,

                { text: docTitle, style: 'docTitle' },
                { text: docRef, style: 'docSubtitle' },

                { text: '1. DADOS DA OCORRÊNCIA', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['25%', '75%'],
                        body: [
                            [{ text: 'LOCAL:', style: 'tableHeader' }, { text: data.localizacao || 'Não informado', style: 'tableCell' }],
                            [{ text: 'COMUNICANTE:', style: 'tableHeader' }, { text: data.comunicante || 'Anônimo', style: 'tableCell' }],
                            [{ text: 'DATA/HORA:', style: 'tableHeader' }, { text: formatDate(data.created_at), style: 'tableCell' }],
                            [{ text: 'NATUREZA:', style: 'tableHeader' }, { text: 'Registro de Ocorrência', style: 'tableCell' }]
                        ]
                    },
                    layout: 'noBorders'
                },

                { text: '2. NARRATIVA DOS FATOS', style: 'sectionTitle' },
                { text: data.descricao || 'Nenhuma descrição fornecida.', style: 'normalText' }
            ];

        } else if (type === 'arrest') {
            docTitle = 'AUTO DE PRISÃO';
            docRef = `AP Nº ${data.id}/${new Date().getFullYear()}`;
            
            variables = getDocumentVariables(data, user, type);

            standardContent = [
                ...officialHeader,

                { text: docTitle, style: 'docTitle' },
                { text: docRef, style: 'docSubtitle' },

                { text: '1. QUALIFICAÇÃO DO CONDUZIDO', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['25%', '75%'],
                        body: [
                            [{ text: 'NOME COMPLETO:', style: 'tableHeader' }, { text: data.name.toUpperCase(), style: 'tableCell', bold: true }],
                            [{ text: 'DOCUMENTO:', style: 'tableHeader' }, { text: data.passport || 'Não informado', style: 'tableCell' }],
                            [{ text: 'DATA:', style: 'tableHeader' }, { text: formatDate(data.date || data.created_at), style: 'tableCell' }]
                        ]
                    },
                    layout: 'noBorders'
                },

                { text: '2. TIPIFICAÇÃO PENAL', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['25%', '75%'],
                        body: [
                            [{ text: 'INCIDÊNCIA:', style: 'tableHeader' }, { text: data.articles || 'Não especificado', style: 'tableCell' }]
                        ]
                    },
                    layout: 'noBorders'
                },

                { text: '3. HISTÓRICO DA PRISÃO', style: 'sectionTitle' },
                { text: data.reason || data.description || 'Sem observações.', style: 'normalText' }
            ];
        } else if (type === 'wanted') {
            docTitle = 'MANDADO DE BUSCA E CAPTURA';
            docRef = `WANTED - ${data.id}/${new Date().getFullYear()}`;
            
            variables = {
                '{nome_procurado}': data.name,
                '{crime}': data.crime || data.reason || 'Não especificado',
                '{recompensa}': data.reward || 'Não informada',
                '{periculosidade}': data.dangerLevel || data.status || 'Desconhecida',
                '{data_registro}': formatDate(data.date || data.created_at),
                '{assinatura_agente}': user?.nome || 'CIVIL EUFORIA',
                '{cargo_agente}': 'Investigador CIVIL EUFORIA'
            };

            standardContent = [
                ...officialHeader,

                { text: 'PROCURADO', style: 'docTitle', color: '#dc2626' },
                { text: `REF: ${docRef}`, style: 'docSubtitle' },
                
                validImages.length > 0 && validImages[0].imgData ? {
                    image: validImages[0].imgData,
                    width: 200,
                    alignment: 'center',
                    margin: [0, 10, 0, 20]
                } : null,

                { text: data.name.toUpperCase(), style: 'headerBlock', fontSize: 22, bold: true },
                
                {
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [{ text: 'CRIME / MOTIVO', style: 'tableHeader', alignment: 'center', fillColor: '#fca5a5' }, { text: 'PERICULOSIDADE', style: 'tableHeader', alignment: 'center', fillColor: '#fca5a5' }],
                            [{ text: data.crime || data.reason || 'Não informado', style: 'tableCell', alignment: 'center', fontSize: 12, bold: true }, { text: (data.dangerLevel || data.status || 'N/A').toUpperCase(), style: 'tableCell', alignment: 'center', fontSize: 12, bold: true, color: '#dc2626' }],
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 0, 0, 20]
                },

                {
                    table: {
                        widths: ['100%'],
                        body: [
                            [{ text: 'RECOMPENSA', style: 'tableHeader', alignment: 'center', fillColor: '#6ee7b7' }],
                            [{ text: data.reward ? `R$ ${data.reward}` : 'A DEFINIR', style: 'tableCell', alignment: 'center', fontSize: 18, bold: true, color: '#059669', margin: [0, 10, 0, 10] }]
                        ]
                    },
                    layout: 'noBorders'
                },

                { text: '\n\n', fontSize: 1 },
                { text: 'Qualquer informação sobre o paradeiro deste indivíduo deve ser comunicada imediatamente às autoridades da CIVIL EUFORIA.', style: 'normalText', alignment: 'center', italics: true }
            ].filter(Boolean);
            
            validImages = []; // Evitar duplicação
        }

        // Processar Template Personalizado (se houver)
        let customContent = null;
        if (templateStr) {
            // Primeiro substituir as variáveis!
            let processedHtml = templateStr;
            if (type === 'investigation') {
                processedHtml = normalizeInvestigationTemplateHtml(processedHtml);
                processedHtml = processedHtml.replace(/\{bloco_provas\}/g, '<div data-proof-block-placeholder="true"></div>');
            }
            processedHtml = replaceTemplateVariables(processedHtml, variables);

            customContent = htmlToPdfmakeContent(processedHtml);

            if (type === 'investigation' && templateHasProofPlaceholder) {
                const proofBlocks = buildInvestigationProofBlocksPdf(processedProofs);
                customContent = customContent.flatMap((item) => item && item.__proofBlockPlaceholder ? proofBlocks : [item]);
            }
        }

        // Definir Conteúdo Final
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [85, 118, 57, 57],
            background: function(currentPage, pageCount) {
                if (backgroundBase64) {
                    return {
                        image: backgroundBase64,
                        width: 595,
                        height: 842
                    };
                }
                return null;
            },
            
            // Cabeçalho em todas as páginas
            header: (currentPage) => {
                if (customContent && type !== 'investigation') return null;
                if (type === 'investigation' && currentPage === 1) return null;
                return {
                    stack: [
                        ...buildPdfHeaderContent(pageHeaderConfig).map((item, index) => index === 0
                            ? { ...item, margin: [0, 26, 0, 0] }
                            : item
                        )
                    ]
                };
            },

            // Rodapé com paginação
            footer: (currentPage, pageCount) => {
                if (customContent && type !== 'investigation') return null;
                if (type === 'investigation' && currentPage === 1) return null;
                return {
                    columns: [
                        { text: `Documento Oficial - Uso Interno | ${docTitle} Nº ${data.id}`, alignment: 'left', fontSize: 10, margin: [85, 0, 0, 0] },
                        { text: `Emitido em: ${new Date().toLocaleDateString('pt-BR')} | Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 10, margin: [0, 0, 57, 0] }
                    ]
                };
            },

            content: [
                ...(type === 'investigation' ? [buildInvestigationCoverContent(data, mergedLayout, coverConfig, coverTemplate, investigationNumberConfig)] : []),
                // Se tiver template customizado, usa ele. Se não, usa o padrão.
                ...(customContent ? customContent : standardContent),

                // --- PROVAS E EVIDÊNCIAS DINÂMICAS DO INQUÉRITO ---
                (type === 'investigation' && !templateHasProofPlaceholder) ? [
                    { text: customContent ? 'REGISTRO DE PROVAS' : '5. PROVAS COLETADAS', style: 'sectionTitle', tocItem: !customContent },
                    ...buildInvestigationProofBlocksPdf(processedProofs)
                ] : [],

                // --- CONCLUSÃO E ASSINATURAS (Se não customizado) ---
                ...(customContent ? [] : [
                    { text: type === 'investigation' ? '7. CONCLUSÃO' : 'CONCLUSÃO', style: 'sectionTitle', tocItem: true },
                    { text: variables['{conclusao}'], style: 'normalText' },
                    { text: "Sendo o que cumpria relatar, submeto à consideração superior.", style: 'normalText', margin: [0, 10, 0, 0] },

                    { text: '___________________________________________________', style: 'signatureLine', margin: [0, 40, 0, 0] },
                    { text: variables['{assinatura_agente}'].toUpperCase(), alignment: 'center', bold: true, fontSize: 12 },
                    { text: 'INVESTIGADOR CIVIL EUFORIA', alignment: 'center', fontSize: 10 },
                    { text: `MATRÍCULA: ${user?.badge || 'CIVIL EUFORIA-000'}`, alignment: 'center', fontSize: 10 }
                ])
            ],

            styles: styles,
            defaultStyle: { font: 'Roboto' }
        };

        // Gerar e Baixar
        pdfMake.createPdf(docDefinition).download(`${docTitle.replace(/ /g, '_')}_${data.id}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF Profissional:", error);
        alert("Erro ao gerar o documento PDF. Verifique o console.");
    }
};
