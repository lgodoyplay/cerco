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

// Gerar Brasão (Placeholder Base64 - Imagem Transparente de 1x1 pixel para evitar erro)
// O anterior estava corrompido
const coatOfArmsBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Gerar Documento
export const generateProfessionalPDF = async (data, user, templateStr = null, type = 'investigation') => {
    console.log(`Iniciando geração de PDF Profissional (${type})...`, data);
    try {
        // Garantir configuração de VFS
        ensureFontsConfigured();

        // Preparar dados de imagens (assíncrono) - Apenas se houver provas (investigation) ou imagens (arrest/bo)
        let processedProofs = [];
        let validImages = [];

        // Lógica de imagens baseada no tipo
        if (type === 'investigation' && data.proofs && data.proofs.length > 0) {
            processedProofs = await Promise.all(data.proofs.map(async (proof) => {
                let imgData = null;
                if (proof.type === 'image' && proof.content) {
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
        let docTitle = 'DOCUMENTO OFICIAL';
        let docRef = `${new Date().getFullYear()}.${data.id || '000'}`;

        if (type === 'investigation') {
            docTitle = 'INQUÉRITO POLICIAL';
            docRef = `DPF - ${data.id.toString().padStart(3, '0')}/${new Date().getFullYear()}`;
            
            variables = {
                '{numero_inquerito}': data.id,
                '{data_abertura}': formatDate(data.createdAt),
                '{status}': data.status,
                '{nome_investigado}': Array.isArray(data.involved) ? data.involved.join(', ') : (data.involved || 'Não informado'),
                '{cpf_investigado}': 'Não informado',
                '{nome_detido}': Array.isArray(data.involved) ? data.involved.join(', ') : 'Não informado',
                '{data_atual}': new Date().toLocaleDateString('pt-BR'),
                '{local_prisao}': 'Local da Ocorrência',
                '{doc_detido}': 'RG/CPF não informado',
                '{protocolo}': `${new Date().getFullYear()}.${data.id}`,
                '{natureza_ocorrencia}': 'Investigação Criminal',
                '{nome_comunicante}': user?.nome || 'Agente Responsável',
                '{relato_fatos}': data.description || 'Ver seção de provas.',
                '{conclusao}': 'Conforme relatório de provas em anexo.',
                '{assinatura_agente}': user?.nome || 'Agente',
                '{cargo_agente}': 'Agente de Polícia Federal'
            };

            standardContent = [
                // --- CAPA ---
                (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                    image: coatOfArmsBase64, width: 60, alignment: 'center', margin: [0, 20, 0, 10]
                } : { text: '[BRASÃO]', alignment: 'center', margin: [0, 20, 0, 10] },

                { text: docTitle, style: 'title' },
                { text: `PROCEDIMENTO Nº: ${docRef}`, style: 'subHeader' },
                { text: `DATA DE INSTAURAÇÃO: ${formatDate(data.createdAt)}`, style: 'subHeader', fontSize: 12 },
                
                { text: '\n\n\n\n', fontSize: 1 }, 

                // --- SUMÁRIO ---
                { toc: { title: { text: 'SUMÁRIO', style: 'header' }, numberStyle: { bold: true } }, pageBreak: 'after' },

                // --- IDENTIFICAÇÃO ---
                { text: '1. IDENTIFICAÇÃO', style: 'sectionTitle', tocItem: true },
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            [{ text: 'UNIDADE POLICIAL', style: 'tableHeader' }, { text: 'DEPARTAMENTO DE INVESTIGAÇÕES', style: 'tableCell' }],
                            [{ text: 'NATUREZA', style: 'tableHeader' }, { text: 'Inquérito Policial', style: 'tableCell' }],
                            [{ text: 'STATUS', style: 'tableHeader' }, { text: data.status.toUpperCase(), style: 'tableCell', bold: true }],
                            [{ text: 'PRIORIDADE', style: 'tableHeader' }, { text: data.priority.toUpperCase(), style: 'tableCell' }],
                            [{ text: 'RESPONSÁVEL', style: 'tableHeader' }, { text: data.investigator ? data.investigator.nome.toUpperCase() : (user?.nome || 'NÃO ATRIBUÍDO').toUpperCase(), style: 'tableCell' }]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                // --- ENVOLVIDOS ---
                { text: '2. PARTES ENVOLVIDAS', style: 'sectionTitle', tocItem: true },
                { text: Array.isArray(data.involved) ? data.involved.join(', ') : (data.involved || 'Não informado.'), style: 'normalText', margin: [0, 0, 0, 15] },

                // --- RELATO ---
                { text: '3. RELATO DOS FATOS', style: 'sectionTitle', tocItem: true },
                { text: data.description || 'Nenhuma descrição fornecida.', style: 'normalText' },

                // --- DILIGÊNCIAS ---
                { text: '4. DILIGÊNCIAS REALIZADAS', style: 'sectionTitle', tocItem: true },
                { ul: [`Abertura do inquérito em ${formatDate(data.createdAt)}.`, `Análise inicial das evidências.`, data.status === 'Finalizada' ? `Encerramento e conclusão em ${formatDate(data.closedAt)}.` : 'Investigação em andamento.'], style: 'normalText' }
            ];

        } else if (type === 'bo') {
            docTitle = 'BOLETIM DE OCORRÊNCIA';
            docRef = `BO - ${data.id}/${new Date().getFullYear()}`;
            
            variables = {
                '{numero_inquerito}': data.id,
                '{data_abertura}': formatDate(data.created_at),
                '{status}': data.status || 'Registrado',
                '{nome_investigado}': 'N/A',
                '{cpf_investigado}': 'N/A',
                '{nome_detido}': 'N/A',
                '{data_atual}': new Date().toLocaleDateString('pt-BR'),
                '{local_prisao}': data.localizacao || 'Não informado',
                '{doc_detido}': 'N/A',
                '{protocolo}': docRef,
                '{natureza_ocorrencia}': 'Ocorrência Policial',
                '{nome_comunicante}': data.comunicante || 'Anônimo',
                '{relato_fatos}': data.descricao || 'Sem descrição.',
                '{conclusao}': 'Registro realizado para fins legais.',
                '{assinatura_agente}': user?.nome || 'Agente de Plantão',
                '{cargo_agente}': 'Agente de Policia Civil'
            };

            standardContent = [
                (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                    image: coatOfArmsBase64, width: 60, alignment: 'center', margin: [0, 20, 0, 10]
                } : { text: '[BRASÃO]', alignment: 'center', margin: [0, 20, 0, 10] },

                { text: docTitle, style: 'title' },
                { text: `PROTOCOLO: ${docRef}`, style: 'subHeader' },
                { text: `DATA DO REGISTRO: ${formatDate(data.created_at)}`, style: 'subHeader', fontSize: 12 },
                
                { text: '\n\n', fontSize: 1 }, 

                { text: '1. DADOS DA OCORRÊNCIA', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            [{ text: 'LOCAL', style: 'tableHeader' }, { text: data.localizacao || 'Não informado', style: 'tableCell' }],
                            [{ text: 'COMUNICANTE', style: 'tableHeader' }, { text: data.comunicante || 'Anônimo', style: 'tableCell' }],
                            [{ text: 'DATA/HORA', style: 'tableHeader' }, { text: formatDate(data.created_at), style: 'tableCell' }],
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                { text: '2. DESCRIÇÃO DOS FATOS', style: 'sectionTitle' },
                { text: data.descricao || 'Nenhuma descrição fornecida.', style: 'normalText', alignment: 'justify' }
            ];

        } else if (type === 'arrest') {
            docTitle = 'AUTO DE PRISÃO';
            docRef = `AP - ${data.id}/${new Date().getFullYear()}`;
            
            variables = {
                '{numero_inquerito}': data.id,
                '{data_abertura}': formatDate(data.date || data.created_at),
                '{status}': 'Detido',
                '{nome_investigado}': data.name,
                '{cpf_investigado}': data.passport || 'Não informado',
                '{nome_detido}': data.name,
                '{data_atual}': new Date().toLocaleDateString('pt-BR'),
                '{local_prisao}': 'Delegacia Central',
                '{doc_detido}': data.passport || 'Não informado',
                '{protocolo}': docRef,
                '{natureza_ocorrencia}': data.articles || data.reason || 'Detenção',
                '{nome_comunicante}': data.officer || 'Agente',
                '{relato_fatos}': data.reason || data.description || 'Sem observações adicionais.',
                '{conclusao}': 'Indivíduo detido e à disposição da justiça.',
                '{assinatura_agente}': data.officer || user?.nome || 'Agente Responsável',
                '{cargo_agente}': 'Agente de Policia Civil'
            };

            standardContent = [
                (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                    image: coatOfArmsBase64, width: 60, alignment: 'center', margin: [0, 20, 0, 10]
                } : { text: '[BRASÃO]', alignment: 'center', margin: [0, 20, 0, 10] },

                { text: docTitle, style: 'title' },
                { text: `REGISTRO: ${docRef}`, style: 'subHeader' },
                { text: `DATA: ${formatDate(data.date || data.created_at)}`, style: 'subHeader', fontSize: 12 },
                
                { text: '\n\n', fontSize: 1 }, 

                { text: '1. DADOS DO DETIDO', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            [{ text: 'NOME COMPLETO', style: 'tableHeader' }, { text: data.name.toUpperCase(), style: 'tableCell', bold: true }],
                            [{ text: 'DOCUMENTO', style: 'tableHeader' }, { text: data.passport || 'Não informado', style: 'tableCell' }],
                            [{ text: 'ARTIGOS/CRIME', style: 'tableHeader' }, { text: data.articles || 'Não especificado', style: 'tableCell' }],
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                { text: '2. MOTIVO DA PRISÃO / OBSERVAÇÕES', style: 'sectionTitle' },
                { text: data.reason || data.description || 'Sem observações.', style: 'normalText', alignment: 'justify' }
            ];
        } else if (type === 'wanted') {
            docTitle = 'MANDADO DE PROCURA';
            docRef = `WANTED - ${data.id}/${new Date().getFullYear()}`;
            
            variables = {
                '{nome_procurado}': data.name,
                '{crime}': data.crime || data.reason || 'Não especificado',
                '{recompensa}': data.reward || 'Não informada',
                '{periculosidade}': data.dangerLevel || data.status || 'Desconhecida',
                '{data_registro}': formatDate(data.date || data.created_at),
                '{assinatura_agente}': user?.nome || 'Departamento de Polícia Federal',
                '{cargo_agente}': 'Polícia Federal'
            };

            standardContent = [
                 (coatOfArmsBase64 && coatOfArmsBase64.startsWith('data:image')) ? {
                    image: coatOfArmsBase64, width: 60, alignment: 'center', margin: [0, 20, 0, 10]
                } : { text: '[BRASÃO]', alignment: 'center', margin: [0, 20, 0, 10] },

                { text: 'PROCURADO', style: 'title', color: '#dc2626' },
                { text: `REF: ${docRef}`, style: 'subHeader' },
                
                { text: '\n\n', fontSize: 1 }, 

                validImages.length > 0 && validImages[0].imgData ? {
                    image: validImages[0].imgData,
                    width: 200,
                    alignment: 'center',
                    margin: [0, 10, 0, 20]
                } : null,

                { text: data.name.toUpperCase(), style: 'header', fontSize: 22 },
                
                { text: '\n', fontSize: 5 },

                {
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [{ text: 'CRIME / MOTIVO', style: 'tableHeader', fillColor: '#dc2626' }, { text: 'PERICULOSIDADE', style: 'tableHeader', fillColor: '#dc2626' }],
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
                            [{ text: 'RECOMPENSA', style: 'tableHeader', fillColor: '#059669' }],
                            [{ text: data.reward ? `R$ ${data.reward}` : 'A DEFINIR', style: 'tableCell', alignment: 'center', fontSize: 18, bold: true, color: '#059669', margin: [0, 10, 0, 10] }]
                        ]
                    },
                    layout: 'noBorders'
                },

                { text: '\n\n\n', fontSize: 1 },
                { text: 'Qualquer informação sobre o paradeiro deste indivíduo deve ser comunicada imediatamente às autoridades.', style: 'normalText', alignment: 'center', italics: true }
            ].filter(Boolean);
            
            validImages = []; // Evitar duplicação
        }

        // Processar Template Personalizado (se houver)
        let customContent = null;
        if (templateStr) {
            // Substituição
            let text = templateStr;
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(key, 'g');
                text = text.replace(regex, variables[key] || '');
            });

            // Converter para formato pdfmake (parágrafos)
            customContent = text.split('\n').map(line => {
                const trimmed = line.trim();
                // Detecção simples de "títulos" (linhas curtas em maiúsculas) para aplicar estilo
                if (trimmed.length > 0 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && !trimmed.includes(':') && !trimmed.includes('.')) {
                    return { text: trimmed, style: 'subHeader', margin: [0, 10, 0, 5] };
                }
                return { text: trimmed, style: 'normalText', margin: [0, 2, 0, 2] };
            });
        }

        // Definir Conteúdo Final
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [85, 85, 57, 57], 
            
            // Cabeçalho em todas as páginas
            header: () => {
                return {
                    stack: [
                        { text: 'REPÚBLICA FEDERATIVA DO BRASIL', alignment: 'center', fontSize: 10, bold: true, margin: [0, 15, 0, 0] },
            { text: 'MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA', alignment: 'center', fontSize: 10, bold: true },
            { text: 'POLÍCIA FEDERAL', alignment: 'center', fontSize: 10, bold: true },
                        { canvas: [{ type: 'line', x1: 85, y1: 5, x2: 538, y2: 5, lineWidth: 1 }] }
                    ]
                };
            },

            // Rodapé com paginação
            footer: (currentPage, pageCount) => {
                return {
                    columns: [
                        { text: `${docTitle} Nº ${data.id} - Confidencial`, alignment: 'left', fontSize: 10, margin: [85, 0, 0, 0] },
                        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 10, margin: [0, 0, 57, 0] }
                    ]
                };
            },

            content: [
                // Se tiver template customizado, usa ele. Se não, usa o padrão.
                ...(customContent ? customContent : standardContent),

                // --- ANEXOS (Para Investigations ou se houver imagens em outros tipos) ---
                (type === 'investigation' || validImages.length > 0) ? [
                    { text: customContent ? '\n\n--- ANEXOS DO SISTEMA ---\n\n' : '', style: 'subHeader', pageBreak: customContent ? 'before' : undefined },
                ] : [],

                // --- PROVAS E EVIDÊNCIAS (Apenas Investigation) ---
                (type === 'investigation') ? [
                    { text: customContent ? 'REGISTRO DE PROVAS' : '5. PROVAS COLETADAS', style: 'sectionTitle', tocItem: !customContent },
                    processedProofs.length > 0 ? {
                        layout: 'headerLineOnly',
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
                                            (proof.type === 'image') ? { text: '(Visualizar na seção de Anexos)', fontSize: 9, italics: true, color: '#666666' } : null,
                                            (proof.type === 'link' || proof.type === 'video') ? { text: proof.content || '', link: proof.content, color: '#2563eb', decoration: 'underline', fontSize: 9, margin: [0, 2, 0, 0] } : null,
                                            (proof.type === 'file') ? { text: `Arquivo/Ref: ${proof.content || 'Não informado'}`, fontSize: 9, italics: true, color: '#4b5563', margin: [0, 2, 0, 0] } : null,
                                            (proof.type === 'text') ? { text: `"${proof.content || ''}"`, fontSize: 9, italics: true, background: '#f3f4f6', margin: [0, 2, 0, 0] } : null
                                        ].filter(Boolean),
                                        style: 'tableCell' 
                                    },
                                    { text: formatDate(proof.createdAt), style: 'tableCell', alignment: 'center' }
                                ])
                            ]
                        }
                    } : { text: 'Nenhuma prova anexada.', style: 'normalText', italics: true }
                ] : [],

                // --- ANEXOS (IMAGENS) ---
                validImages.length > 0 ? [
                     { text: customContent ? 'REGISTRO FOTOGRÁFICO' : (type === 'investigation' ? '6. ANEXOS FOTOGRÁFICOS' : 'ANEXOS FOTOGRÁFICOS'), style: 'sectionTitle', pageBreak: 'before', tocItem: !customContent },
                     ...validImages.map((proof, index) => {
                        if (!proof.imgData) return null;
                        return [
                            { text: `ANEXO ${index + 1} - ${proof.title || 'EVIDÊNCIA VISUAL'}`, style: 'subHeader', margin: [0, 20, 0, 10] },
                            { image: proof.imgData, fit: [450, 350], alignment: 'center', margin: [0, 0, 0, 10] },
                            { text: `Legenda: ${proof.description || 'Sem descrição.'}`, fontSize: 9, alignment: 'center', italics: true, margin: [0, 0, 0, 20] }
                        ];
                    }).flat().filter(Boolean)
                ] : [],

                // --- CONCLUSÃO E ASSINATURAS (Se não customizado) ---
                ...(customContent ? [] : [
                    { text: type === 'investigation' ? '7. CONCLUSÃO' : 'CONCLUSÃO', style: 'sectionTitle', pageBreak: 'before', tocItem: true },
                    { text: variables['{conclusao}'], style: 'normalText' },
                    { text: "Sendo o que cumpria relatar, submeto à consideração superior.", style: 'normalText', margin: [0, 10, 0, 0] },

                    { text: '___________________________________________________', style: 'signatureLine' },
                    { text: variables['{assinatura_agente}'].toUpperCase(), alignment: 'center', bold: true, fontSize: 12 },
                    { text: 'AGENTE DE POLÍCIA CIVIL', alignment: 'center', fontSize: 10 },
                    { text: `MATRÍCULA: ${user?.badge || 'PC-000'}`, alignment: 'center', fontSize: 10 }
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
