import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Registrar fontes (necessário para pdfmake no browser)
// Em um ambiente de build real, isso pode variar, mas para Vite/React padrão funciona assim
// Se der erro de vfs, usaremos o CDN ou outra abordagem
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
} else {
    // Fallback se a importação falhar de alguma forma estranha
    // Geralmente não é necessário se instalado via npm
    console.warn("VFS fonts not found automatically. Check pdfmake import.");
}

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

// Converter URL de imagem para Base64
const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/jpeg"); // Convert to JPEG to save space
            resolve(dataURL);
        };
        img.onerror = error => {
            console.warn("Erro ao carregar imagem para PDF:", url, error);
            resolve(null); // Resolve null to not break PDF generation
        };
        img.src = url;
    });
};

// Formatar data
const formatDate = (dateStr) => {
    if (!dateStr) return "Não informada";
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

// Gerar Brasão (Placeholder Base64 - Escudo Simplificado Dourado/Preto)
// Isso evita dependência externa de imagem.
const coatOfArmsBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5wQJCg0s1j2a4wAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAADxUlEQVRoM+2az0tUQRTHPzO7rq65a5q5aVqWmJZZWJCNkvoDCoKCiCLoT7CbdO9f0KVDh6IOReBFEQRFQRRk9YOkFq5pWm7+2MztYt6bmXbzXtbdfW931wcG5s28N/P9zJlz58w8sI022mijTf5RzJ5e+H1f07b19nZtX18kFAr5AoGAr60t4u/sDIfa2iK+YDDk8/l8UiwW5ePjYzk3Nyc///xTzszMyPHxcbmysrJp2/r7+0uWlpaKk5OTxUAg4J+cnCx1dHSU+vv7S93d3aXu7u5SR0dHqaurq9TU1OTL5XKyv7+/uLi4WJyfn5eHh4fl/Py8PDk52bRtW62RkZHizMyM3NvbK+fni2W/3y+NjY1SU1MjdXV1Ul9fLw0NDdLY2CgTiYTc29sr5+bm5MTEhDw6OiqXlpZKExMTe2qNjo7Kx8fHcrFYlIeHh+Xy8rJcW1srl5aW5OrqarlQKMjV1dVyeXm5PDw8LB8eHspHR0fyb9s2Hh4eysfHx/Lw8LBcKpXk6upqubq6Wi4UCnJ1dbVcWlqSq6ur5fLycllV649t22gYhmEYhmEYhmEYhmEYhmEYhmEYhmGY/9O2beP19bV8enq6aV1dXc261t/fL5eWluT+/n55eHhYnp2d3bRt27aN4+Pj8sDAgJydnS1vbGzIra2t8szMjDwzMyO3trbKGxsbcnZ2tjw4OCgfHx9v2rZt28bZ2Vl5ZGREbm9vl9vb2+XExIQ8OTkpt7e3y+3t7fLIyIicnZ3dtG3btvHq6qq8srIit7a2yqOjI3J/f7/c398vj46Oyq2trfLKyor8+vXrpm3btvH5+blcKBTkzs5OOTExIff398v9/f1yYmJC7uzslAuFgnx+fr5p27Zt48HBQXlqakpubW2V+/v75cHBQfnr1y95cHBQ7u/vl1tbW+WpqSn54OBg07Zt28bLly/Li4uLcnNzsxwKhWQsFpOxWEwOh8NyY2OjPD8/Ly9fvrxp27ZtYyqVkpubm+XW1la5t7dXDgQCciAQkHt7e+XW1la5ublZplKpTdu2bRsvXrwod3Z2yv39/XI0GpXD4bAcDoflaDQq9/f3y52dnfLFixebtm3bNp6fn5cnJibk1tZWuVgsyqVSSdbV1cmlUkkul8tya2urPDExIZ+fn2/atm3bODMzIw8PD8utrKzI9fX1cl1dnVxfXy+zs7Nyf3+/PDMz89e2/Vd+AGa+t7e3a/v6IqFQyBcIBHxtbRF/Z2c41NYW8QWDIV8ul5Nzc3Py06dPcnh4+D+97w/3/lD05wAAAABJRU5ErkJggg==";

// Gerar Documento
export const generateProfessionalPDF = async (investigation, user) => {
    console.log("Iniciando geração de PDF Profissional (ABNT)...", investigation);
    try {
        // Preparar dados de imagens (assíncrono)
        let processedProofs = [];
        if (investigation.proofs && investigation.proofs.length > 0) {
            // Processar em paralelo para ser rápido
            processedProofs = await Promise.all(investigation.proofs.map(async (proof) => {
                let imgData = null;
                if (proof.type === 'image' && proof.content) {
                    imgData = await getBase64ImageFromURL(proof.content);
                }
                return { ...proof, imgData };
            }));
        }

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
                        { text: 'MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA', alignment: 'center', fontSize: 10, bold: true },
                        { text: 'POLÍCIA FEDERAL - DIP', alignment: 'center', fontSize: 10, bold: true },
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
                {
                    image: coatOfArmsBase64,
                    width: 60,
                    alignment: 'center',
                    margin: [0, 20, 0, 10]
                },
                { text: 'INQUÉRITO POLICIAL', style: 'title' },
                { text: `PROCEDIMENTO Nº: PF - ${investigation.id.toString().padStart(3, '0')}/${new Date().getFullYear()}`, style: 'subHeader' },
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
                        widths: ['10%', '20%', '50%', '20%'],
                        headerRows: 1,
                        body: [
                            [
                                { text: '#', style: 'tableHeader' },
                                { text: 'TIPO', style: 'tableHeader' },
                                { text: 'DESCRIÇÃO', style: 'tableHeader' },
                                { text: 'DATA', style: 'tableHeader' }
                            ],
                            ...processedProofs.map((proof, index) => [
                                { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
                                { text: (proof.type || 'DOC').toUpperCase(), style: 'tableCell' },
                                { text: proof.title ? `${proof.title} - ${proof.description}` : proof.description, style: 'tableCell' },
                                { text: formatDate(proof.createdAt), style: 'tableCell', alignment: 'center' }
                            ])
                        ]
                    }
                } : { text: 'Nenhuma prova anexada.', style: 'normalText', italics: true },

                // --- ANEXOS (IMAGENS) ---
                processedProofs.some(p => p.imgData) ? { text: '6. ANEXOS FOTOGRÁFICOS', style: 'sectionTitle', pageBreak: 'before', tocItem: true } : null,
                ...processedProofs.filter(p => p.imgData).map((proof, index) => {
                    return [
                        {
                            text: `ANEXO ${index + 1} - ${proof.title || 'EVIDÊNCIA VISUAL'}`,
                            style: 'subHeader',
                            margin: [0, 20, 0, 10]
                        },
                        {
                            image: proof.imgData,
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
                    text: 'AGENTE DE POLÍCIA FEDERAL',
                    alignment: 'center',
                    fontSize: 10
                },
                {
                    text: `MATRÍCULA: ${user?.badge || 'PF-000'}`,
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
