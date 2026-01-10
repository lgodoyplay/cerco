import pdfMake from "./pdf";

// Função para garantir que as fontes estejam carregadas antes de gerar (Mantido para compatibilidade)
const ensureFontsConfigured = () => true;

// --- CONFIGURAÇÃO DE ESTILOS ---
const styles = {
    header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
    },
    subHeader: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 5, 0, 5]
    },
    title: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 10]
    },
    sectionTitle: {
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10],
        color: '#000000',
        decoration: 'underline'
    },
    normalText: {
        fontSize: 12,
        alignment: 'justify',
        margin: [0, 0, 0, 5],
        lineHeight: 1.5
    },
    smallText: {
        fontSize: 10,
        alignment: 'left',
        color: '#333333'
    },
    tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'white',
        fillColor: '#2d3748', // Dark gray/blue style
        alignment: 'center',
        margin: [0, 5, 0, 5]
    },
    tableCell: {
        fontSize: 10,
        color: 'black',
        alignment: 'left',
        margin: [0, 5, 0, 5]
    },
    signatureLine: {
        margin: [0, 50, 0, 10],
        alignment: 'center',
        bold: true
    },
    footer: {
        fontSize: 9,
        italics: true,
        alignment: 'center',
        color: '#555555'
    }
};

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

        img.onerror = error => {
            clearTimeout(timer);
            console.warn("Erro de rede/carregamento da imagem:", url); // Não loga o objeto erro completo para evitar ruído
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

// Formatar data
const formatDate = (dateStr) => {
    if (!dateStr) return "Não informada";
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

// Gerar Brasão (Placeholder Base64 - Imagem Transparente de 1x1 pixel para evitar erro)
// O anterior estava corrompido
const coatOfArmsBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Gerar Documento
export const generateProfessionalPDF = async (investigation, user) => {
    console.log("Iniciando geração de PDF Profissional (ABNT)...", investigation);
    try {
        // Garantir configuração de VFS
        ensureFontsConfigured();

        // Preparar dados de imagens (assíncrono)
        let processedProofs = [];
        if (investigation.proofs && investigation.proofs.length > 0) {
            // Processar em paralelo para ser rápido
            processedProofs = await Promise.all(investigation.proofs.map(async (proof) => {
                let imgData = null;
                if (proof.type === 'image' && proof.content) {
                    try {
                        imgData = await getBase64ImageFromURL(proof.content);
                        // Validação extra: se não for string válida ou vazia, anula
                        if (!imgData || typeof imgData !== 'string' || !imgData.startsWith('data:image')) {
                             console.warn(`Imagem inválida descartada para prova ${proof.id}`);
                             imgData = null;
                        }
                    } catch (e) {
                        console.warn(`Falha ao carregar imagem da prova ${proof.id}:`, e);
                        imgData = null;
                    }
                }
                return { ...proof, imgData };
            }));
        }
        
        // Filtra imagens válidas para evitar erro do pdfmake
        const validImages = processedProofs.filter(p => p.imgData);

        // Definir Conteúdo
        const docDefinition = {
            pageSize: 'A4',
            // Margens ABNT: Superior/Esquerda 3cm (approx 85pt), Inferior/Direita 2cm (approx 57pt)
            // [left, top, right, bottom]
            pageMargins: [85, 85, 57, 57], 
            
            // Cabeçalho em todas as páginas
            header: (currentPage, pageCount) => {
                return {
                    stack: [
                        { text: 'REPÚBLICA FEDERATIVA DO BRASIL', alignment: 'center', fontSize: 10, bold: true, margin: [0, 15, 0, 0] },
                        { text: 'SECRETARIA DE ESTADO DE JUSTIÇA E SEGURANÇA PÚBLICA', alignment: 'center', fontSize: 10, bold: true },
                        { text: 'POLÍCIA CIVIL - DIP', alignment: 'center', fontSize: 10, bold: true },
                        { canvas: [{ type: 'line', x1: 85, y1: 5, x2: 538, y2: 5, lineWidth: 1 }] } // Linha ajustada às margens
                    ]
                };
            },

            // Rodapé com paginação
            footer: (currentPage, pageCount) => {
                return {
                    columns: [
                        { text: `Inquérito Nº ${investigation.id} - Confidencial`, alignment: 'left', fontSize: 10, margin: [85, 0, 0, 0] },
                        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 10, margin: [0, 0, 57, 0] }
                    ]
                };
            },

            content: [
                // --- CAPA ---
                // Uso seguro da imagem do brasão
                (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                    image: coatOfArmsBase64,
                    width: 60,
                    alignment: 'center',
                    margin: [0, 20, 0, 10]
                } : { text: '[BRASÃO]', alignment: 'center', margin: [0, 20, 0, 10] },

                { text: 'INQUÉRITO POLICIAL', style: 'title' },
                { text: `PROCEDIMENTO Nº: PC - ${investigation.id.toString().padStart(3, '0')}/${new Date().getFullYear()}`, style: 'subHeader' },
                { text: `DATA DE INSTAURAÇÃO: ${formatDate(investigation.createdAt)}`, style: 'subHeader', fontSize: 12 },
                
                { text: '\n\n\n\n', fontSize: 1 }, // Espaço

                // --- SUMÁRIO ---
                {
                    toc: {
                        title: { text: 'SUMÁRIO', style: 'header' },
                        numberStyle: { bold: true }
                    },
                    pageBreak: 'after'
                },

                // --- IDENTIFICAÇÃO (TABELA) ---
                { text: '1. IDENTIFICAÇÃO', style: 'sectionTitle', tocItem: true },
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            [{ text: 'UNIDADE POLICIAL', style: 'tableHeader' }, { text: 'DEPARTAMENTO DE INVESTIGAÇÕES - DIP', style: 'tableCell' }],
                            [{ text: 'NATUREZA', style: 'tableHeader' }, { text: 'Inquérito Policial (Investigação Criminal)', style: 'tableCell' }],
                            [{ text: 'STATUS', style: 'tableHeader' }, { text: investigation.status.toUpperCase(), style: 'tableCell', bold: true }],
                            [{ text: 'PRIORIDADE', style: 'tableHeader' }, { text: investigation.priority.toUpperCase(), style: 'tableCell' }],
                            [{ text: 'RESPONSÁVEL', style: 'tableHeader' }, { text: investigation.investigator ? investigation.investigator.nome.toUpperCase() : (user?.nome || 'NÃO ATRIBUÍDO').toUpperCase(), style: 'tableCell' }]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                // --- ENVOLVIDOS ---
                { text: '2. PARTES ENVOLVIDAS', style: 'sectionTitle', tocItem: true },
                {
                    text: Array.isArray(investigation.involved) ? investigation.involved.join(', ') : (investigation.involved || 'Não informado.'),
                    style: 'normalText',
                    margin: [0, 0, 0, 15]
                },

                // --- RELATO DOS FATOS ---
                { text: '3. RELATO DOS FATOS', style: 'sectionTitle', tocItem: true },
                {
                    text: investigation.description || 'Nenhuma descrição fornecida.',
                    style: 'normalText'
                },

                // --- LINHA DO TEMPO ---
                { text: '4. DILIGÊNCIAS REALIZADAS', style: 'sectionTitle', tocItem: true },
                {
                    ul: [
                        `Abertura do inquérito em ${formatDate(investigation.createdAt)}.`,
                        `Análise inicial das evidências.`,
                        investigation.status === 'Finalizada' ? `Encerramento e conclusão em ${formatDate(investigation.closedAt)}.` : 'Investigação em andamento.'
                    ],
                    style: 'normalText'
                },

                // --- PROVAS E EVIDÊNCIAS ---
                { text: '5. PROVAS COLETADAS', style: 'sectionTitle', pageBreak: 'before', tocItem: true },
                processedProofs.length > 0 ? {
                    layout: 'headerLineOnly', // or 'noBorders'
                    table: {
                        widths: ['5%', '15%', '60%', '20%'],
                        headerRows: 1,
                        body: [
                            [
                                { text: '#', style: 'tableHeader' },
                                { text: 'TIPO', style: 'tableHeader' },
                                { text: 'DESCRIÇÃO E CONTEÚDO', style: 'tableHeader' },
                                { text: 'DATA', style: 'tableHeader' }
                            ],
                            ...processedProofs.map((proof, index) => [
                                { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
                                { text: (proof.type || 'DOC').toUpperCase(), style: 'tableCell' },
                                { 
                                    stack: [
                                        { text: proof.title || 'Sem título', bold: true, fontSize: 10 },
                                        { text: proof.description || '', fontSize: 10, margin: [0, 2, 0, 2] },
                                        // Renderização condicional do conteúdo
                                        (proof.type === 'image') ? 
                                            { text: '(Visualizar na seção de Anexos)', fontSize: 9, italics: true, color: '#666666' } : null,
                                        
                                        (proof.type === 'link' || proof.type === 'video') ? 
                                            { text: proof.content || '', link: proof.content, color: '#2563eb', decoration: 'underline', fontSize: 9, margin: [0, 2, 0, 0] } : null,
                                        
                                        (proof.type === 'file') ? 
                                            { text: `Arquivo/Ref: ${proof.content || 'Não informado'}`, fontSize: 9, italics: true, color: '#4b5563', margin: [0, 2, 0, 0] } : null,
                                        
                                        (proof.type === 'text') ? 
                                            { text: `"${proof.content || ''}"`, fontSize: 9, italics: true, background: '#f3f4f6', margin: [0, 2, 0, 0] } : null
                                    ].filter(Boolean),
                                    style: 'tableCell' 
                                },
                                { text: formatDate(proof.createdAt), style: 'tableCell', alignment: 'center' }
                            ])
                        ]
                    }
                } : { text: 'Nenhuma prova anexada.', style: 'normalText', italics: true },

                // --- ANEXOS (IMAGENS) ---
                validImages.length > 0 ? { text: '6. ANEXOS FOTOGRÁFICOS', style: 'sectionTitle', pageBreak: 'before', tocItem: true } : null,
                ...validImages.map((proof, index) => {
                    // Garantia final de que temos uma imagem válida antes de renderizar
                    if (!proof.imgData) return null;
                    
                    return [
                        {
                            text: `ANEXO ${index + 1} - ${proof.title || 'EVIDÊNCIA VISUAL'}`,
                            style: 'subHeader',
                            margin: [0, 20, 0, 10]
                        },
                        {
                            image: proof.imgData, // Aqui garantimos que é válido
                            fit: [450, 350], // Tamanho máximo
                            alignment: 'center',
                            margin: [0, 0, 0, 10]
                        },
                        {
                            text: `Legenda: ${proof.description || 'Sem descrição.'}`,
                            fontSize: 9,
                            alignment: 'center',
                            italics: true,
                            margin: [0, 0, 0, 20]
                        }
                    ];
                }).flat().filter(Boolean),

                // --- CONCLUSÃO ---
                { text: '7. CONCLUSÃO', style: 'sectionTitle', pageBreak: 'before', tocItem: true },
                {
                    text: "Diante do exposto, encaminha-se o presente Inquérito Policial para apreciação da autoridade competente. Todas as diligências cabíveis nesta fase foram realizadas, e as evidências encontram-se devidamente catalogadas e anexadas a este relatório.",
                    style: 'normalText'
                },
                {
                    text: "Sendo o que cumpria relatar, submeto à consideração superior.",
                    style: 'normalText',
                    margin: [0, 10, 0, 0]
                },

                // --- ASSINATURAS ---
                {
                    text: '___________________________________________________',
                    style: 'signatureLine'
                },
                {
                    text: investigation.investigator ? investigation.investigator.nome.toUpperCase() : (user?.username || user?.nome || 'AGENTE RESPONSÁVEL').toUpperCase(),
                    alignment: 'center',
                    bold: true,
                    fontSize: 12
                },
                {
                    text: 'AGENTE DE POLÍCIA CIVIL',
                    alignment: 'center',
                    fontSize: 10
                },
                {
                    text: `MATRÍCULA: ${user?.badge || 'PC-000'}`,
                    alignment: 'center',
                    fontSize: 10
                }
            ],

            styles: styles,
            defaultStyle: {
                font: 'Roboto' // pdfmake default font
            }
        };

        // Gerar e Baixar
        pdfMake.createPdf(docDefinition).download(`Inquerito_Policial_${investigation.id}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF Profissional:", error);
        alert("Erro ao gerar o documento PDF. Verifique o console.");
    }
};
