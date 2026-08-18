import { jsPDF } from 'jspdf';
import { formatDate, validateRequiredFields } from './pdfBase';

// Configurações padrão
const DEFAULT_MARGINS = {
    top: 30,
    left: 30,
    right: 20,
    bottom: 20
};

const DEFAULT_FONTS = {
    normal: 'times',
    bold: 'times'
};

const DEFAULT_SIZES = {
    title: 14,
    body: 12,
    small: 10
};

// --- FUNÇÕES AUXILIARES COMPARTILHADAS ---

const drawHeader = (doc, config = DEFAULT_PAGE_HEADER_CONFIG) => {
    const { top, left, right } = DEFAULT_MARGINS;
    doc.setFont(DEFAULT_FONTS.bold, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(config.line1 || 'ESTADO DA EUFORIA', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.text(config.line2 || 'SECRETARIA DE SEGURANÇA PÚBLICA', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    doc.text(config.line3 || 'CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(left, 40, doc.internal.pageSize.getWidth() - right, 40);
};

const drawFooter = (doc, pageNumber, totalPages, id, type = 'INQUERITO') => {
    const { left, right, bottom } = DEFAULT_MARGINS;
    doc.setFont(DEFAULT_FONTS.normal, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const footerText = `${type} Nº ${id} - Confidencial`;
    doc.text(footerText, left, doc.internal.pageSize.getHeight() - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, doc.internal.pageSize.getWidth() - right, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
};

const checkPageBreak = (doc, yPos, heightNeeded) => {
    if (yPos + heightNeeded > doc.internal.pageSize.getHeight() - DEFAULT_MARGINS.bottom) {
        doc.addPage();
        drawHeader(doc);
        return DEFAULT_MARGINS.top + 20;
    }
    return yPos;
};

const getPageCount = (doc) => doc.internal.getNumberOfPages();

const addFooterToAllPages = (doc, id, type) => {
    const totalPages = getPageCount(doc);
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages, id, type);
    }
};

// --- GERAÇÃO DE PDF INVESTIGATION ---
export const generateInvestigationPDF = (investigation, user) => {
    try {
        validateRequiredFields(investigation, ['id']);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = DEFAULT_MARGINS.top + 30;

        // Cabeçalho
        drawHeader(doc);
        
        // Título
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.title);
        doc.text('RELATÓRIO FINAL DE INQUÉRITO POLICIAL', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        const formattedId = `CIVIL EUFORIA - ${String(investigation.id).padStart(3, '0')}`;
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text(`PROTOCOLO Nº: ${formattedId}/${new Date().getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        // Dados do inquérito
        doc.setFontSize(DEFAULT_SIZES.small);
        doc.setFillColor(240, 240, 240);
        doc.rect(DEFAULT_MARGINS.left, yPos, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right), 35, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(DEFAULT_MARGINS.left, yPos, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right), 35);

        let dataY = yPos + 8;
        const col1 = DEFAULT_MARGINS.left + 5;
        const col2 = DEFAULT_MARGINS.left + 100;

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('DATA DE INSTAURAÇÃO:', col1, dataY);
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.text(formatDate(investigation.createdAt), col1 + 45, dataY);

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('STATUS ATUAL:', col2, dataY);
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.text((investigation.status || 'N/A').toUpperCase(), col2 + 30, dataY);

        dataY += 8;
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('PRIORIDADE:', col1, dataY);
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.text(investigation.priority || 'N/A', col1 + 45, dataY);

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('DELEGACIA RESPONSÁVEL:', col2, dataY);
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.text('Central', col2 + 55, dataY);

        dataY += 8;
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('INVESTIGADOR RESPONSÁVEL:', col1, dataY);
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        
        const officerName = investigation.investigator?.nome || user?.username || user?.nome || 'AGENTE RESPONSÁVEL';
        const officerBadge = investigation.investigator?.badge || user?.badge || '000.000';
        
        doc.text(`${officerName.toUpperCase()} - MATRÍCULA: ${officerBadge}`, col1 + 55, dataY);
        yPos += 45;

        // Identificação do investigado
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text('1. IDENTIFICAÇÃO DO INVESTIGADO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const involvedText = Array.isArray(investigation.involved) && investigation.involved.length > 0
            ? investigation.involved.join(', ')
            : (typeof investigation.involved === 'string' && investigation.involved.trim() !== '' ? investigation.involved : 'Não informado.');
        const involvedLines = doc.splitTextToSize(involvedText, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(involvedLines, DEFAULT_MARGINS.left, yPos);
        yPos += (involvedLines.length * 6) + 10;

        // Objeto da investigação
        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('2. OBJETO DA INVESTIGAÇÃO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const objText = 'O presente Inquérito Policial foi instaurado pela policia federal do Estado da Euforia com a finalidade de apurar os fatos noticiados, identificar a autoria, materialidade e circunstâncias relacionadas à possível prática de infração penal atribuída ao investigado.';
        const objLines = doc.splitTextToSize(objText, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(objLines, DEFAULT_MARGINS.left, yPos);
        yPos += (objLines.length * 6) + 10;

        // Relato dos fatos
        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('3. RELATÓRIO DOS FATOS', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const descLines = doc.splitTextToSize(investigation.description || 'Sem descrição.', pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(descLines, DEFAULT_MARGINS.left, yPos);
        yPos += (descLines.length * 6) + 15;

        // Diligências
        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('4. DILIGÊNCIAS REALIZADAS', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const diligText = 'Durante a instrução do presente inquérito foram realizadas as seguintes ações investigativas:\n- Levantamento de informações e antecedentes;\n- Coleta de depoimentos e oitivas;\n- Análise documental;\n- Verificação de registros fotográficos e audiovisuais;\n- Levantamento de inteligência policial;\n- Demais diligências necessárias para o esclarecimento dos fatos.';
        const diligLines = doc.splitTextToSize(diligText, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(diligLines, DEFAULT_MARGINS.left, yPos);
        yPos += (diligLines.length * 6) + 15;

        // Elementos probatórios
        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('5. ELEMENTOS PROBATÓRIOS', DEFAULT_MARGINS.left, yPos);
        yPos += 10;

        if (investigation.proofs && investigation.proofs.length > 0) {
            investigation.proofs.forEach((proof, index) => {
                yPos = checkPageBreak(doc, yPos, 100);
                const proofNumber = String(index + 1).padStart(3, '0');
                
                doc.setDrawColor(0, 0, 0);
                doc.setFillColor(220, 220, 220);
                doc.rect(DEFAULT_MARGINS.left, yPos, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right), 12, 'F');
                doc.setLineWidth(0.5);
                doc.rect(DEFAULT_MARGINS.left, yPos, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right), 12);
                
                doc.setFont(DEFAULT_FONTS.bold, 'bold');
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`PROVA ${proofNumber} — ${proof.title ? proof.title.toUpperCase() : 'EVIDÊNCIA'}`, DEFAULT_MARGINS.left + 5, yPos + 9);
                
                yPos += 18;
                doc.setFont(DEFAULT_FONTS.normal, 'normal');
                doc.setFontSize(11);
                
                doc.setFont(DEFAULT_FONTS.bold, 'bold');
                doc.text('Tipo:', DEFAULT_MARGINS.left, yPos);
                doc.setFont(DEFAULT_FONTS.normal, 'normal');
                const typeLabel = proof.type === 'image' ? 'Fotografia/Vídeo' :
                    proof.type === 'video' ? 'Vídeo' :
                    proof.type === 'link' ? 'Link/Recurso Digital' :
                    proof.type === 'text' ? 'Depoimento/Declaração' : 'Documento';
                doc.text(typeLabel, DEFAULT_MARGINS.left + 20, yPos);
                
                yPos += 7;
                doc.setFont(DEFAULT_FONTS.bold, 'bold');
                doc.text('Data:', DEFAULT_MARGINS.left, yPos);
                doc.setFont(DEFAULT_FONTS.normal, 'normal');
                doc.text(proof.createdAt ? formatDate(proof.createdAt) : 'Não registrada', DEFAULT_MARGINS.left + 20, yPos);
                
                yPos += 7;
                doc.setFont(DEFAULT_FONTS.bold, 'bold');
                doc.text('Responsável:', DEFAULT_MARGINS.left, yPos);
                doc.setFont(DEFAULT_FONTS.normal, 'normal');
                doc.text(proof.author || 'Agente Responsável', DEFAULT_MARGINS.left + 35, yPos);
                
                yPos += 12;
                doc.setFont(DEFAULT_FONTS.bold, 'bold');
                doc.text('Descrição:', DEFAULT_MARGINS.left, yPos);
                yPos += 7;
                doc.setFont(DEFAULT_FONTS.normal, 'normal');
                doc.setFontSize(DEFAULT_SIZES.body);
                const descLines2 = doc.splitTextToSize(proof.description || 'Sem descrição detalhada.', pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
                doc.text(descLines2, DEFAULT_MARGINS.left, yPos);
                yPos += (descLines2.length * 6) + 8;

                if (proof.type === 'image' && proof.content) {
                    yPos = checkPageBreak(doc, yPos, 120);
                    try {
                        const imgHeight = 100;
                        const imgWidth = 130;
                        const xImg = (pageWidth - imgWidth) / 2;
                        doc.addImage(proof.content, 'JPEG', xImg, yPos, imgWidth, imgHeight);
                        doc.setFontSize(8);
                        doc.text(`Figura ${proofNumber}: ${proof.title || 'Evidência visual'}`, xImg, yPos + imgHeight + 5, { align: 'center' });
                        yPos += imgHeight + 15;
                    } catch {
                        doc.setTextColor(200, 0, 0);
                        doc.text('[Imagem não pôde ser carregada no relatório]', DEFAULT_MARGINS.left, yPos);
                        doc.setTextColor(0, 0, 0);
                        yPos += 10;
                    }
                } else if (proof.type === 'video' || proof.type === 'link') {
                    doc.setTextColor(0, 0, 255);
                    doc.setFontSize(DEFAULT_SIZES.small);
                    doc.textWithLink(`Acesse o conteúdo: ${proof.content}`, DEFAULT_MARGINS.left, yPos, { url: proof.content });
                    doc.setTextColor(0, 0, 0);
                    yPos += 10;
                }

                if (index < investigation.proofs.length - 1) {
                    doc.setLineWidth(0.2);
                    doc.setDrawColor(150, 150, 150);
                    doc.line(DEFAULT_MARGINS.left, yPos + 3, pageWidth - DEFAULT_MARGINS.right, yPos + 3);
                    yPos += 15;
                }
            });
        } else {
            doc.setFont(DEFAULT_FONTS.normal, 'italic');
            doc.text('Nenhuma prova digital anexada a este inquérito.', DEFAULT_MARGINS.left, yPos);
            yPos += 10;
        }

        // Análise investigativa
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text('6. ANÁLISE INVESTIGATIVA', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const analysisText = 'Após análise técnica e confrontação dos elementos obtidos, verificou-se a existência de indícios consistentes relacionados aos fatos investigados, permitindo a formação de convicção acerca da dinâmica dos acontecimentos e da eventual responsabilidade do investigado. As informações coletadas demonstram coerência entre os depoimentos, documentos e demais evidências presentes nos autos.';
        const analysisLines = doc.splitTextToSize(analysisText, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(analysisLines, DEFAULT_MARGINS.left, yPos);
        yPos += (analysisLines.length * 6) + 15;

        // Conclusão
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('7. CONCLUSÃO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;
        
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const conclusionText = 'Diante dos fatos apurados e das provas produzidas ao longo da investigação, conclui-se que o presente Inquérito Policial atingiu seus objetivos, reunindo elementos suficientes para subsidiar as medidas legais cabíveis. Assim, os autos são encaminhados à autoridade competente para análise e deliberação quanto às providências subsequentes.';
        const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right));
        doc.text(conclusionLines, DEFAULT_MARGINS.left, yPos);
        yPos += (conclusionLines.length * 6) + 15;

        // Local e data
        const dataConclusao = investigation.closedAt ? new Date(investigation.closedAt) : new Date();
        doc.text(`Estado da Euforia, ${dataConclusao.toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;

        // Assinaturas
        yPos = checkPageBreak(doc, yPos, 60);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
        yPos += 5;
        
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(10);
        doc.text(officerName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 5;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(9);
        doc.text('Investigador de policia federal', pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;

        // Delegado
        doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
        yPos += 5;
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(10);
        doc.text('DELEGADO DE POLÍCIA', pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        // Rodapé
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(12);
        doc.text('policia federal DO ESTADO DA EUFORIA', pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(11);
        doc.text('"Servir e Proteger com Justiça e Integridade"', pageWidth / 2, yPos, { align: 'center' });

        // Numeração de páginas
        addFooterToAllPages(doc, investigation.id, 'RELATÓRIO');

        doc.save(`Inquerito_${investigation.id}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF de investigação:", error);
        alert(`Erro ao gerar o relatório: ${error.message || 'Verifique o console.'}`);
    }
};

// --- GERAÇÃO DE PDF BO ---
export const generateBOReportPDF = (bo, user) => {
    try {
        validateRequiredFields(bo, ['id']);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = DEFAULT_MARGINS.top + 30;

        drawHeader(doc);
        
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.title);
        doc.text('BOLETIM DE OCORRÊNCIA', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        const docRef = `BO - ${bo.id}/${new Date().getFullYear()}`;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text(docRef, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('1. DADOS DA OCORRÊNCIA', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const width = pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right);
        const ocorrenciaText = [
            `Local: ${bo.localizacao || 'Não informado'}`,
            `Comunicante: ${bo.comunicante || 'Anônimo'}`,
            `Data/Hora: ${bo.created_at ? new Date(bo.created_at).toLocaleString('pt-BR') : 'Não informada'}`
        ].join('\n');
        let lines = doc.splitTextToSize(ocorrenciaText, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 12;

        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('2. RELATO DOS FATOS', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        lines = doc.splitTextToSize(bo.descricao || 'Sem descrição.', width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 16;

        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('3. CONCLUSÃO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const conclusion = 'Registro realizado para fins legais.';
        lines = doc.splitTextToSize(conclusion, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 30;

        yPos = checkPageBreak(doc, yPos, 30);
        const officerName = (user && (user.nome || user.username)) || 'Agente de Plantão';
        const officerBadge = (user && user.badge) || 'N/A';
        doc.setLineWidth(0.5);
        const signatureY = yPos;
        doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
        yPos += 6;
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(10);
        doc.text(officerName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(9);
        doc.text('AGENTE DA CIVIL EUFORIA', pageWidth / 2, yPos, { align: 'center' });
        doc.text(`Matrícula: ${officerBadge}`, pageWidth / 2, yPos + 4, { align: 'center' });

        addFooterToAllPages(doc, bo.id, 'BO');

        doc.save(`Boletim_Ocorrencia_${bo.id}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF de BO:", error);
        alert(`Erro ao gerar o boletim: ${error.message || 'Verifique o console.'}`);
    }
};

// --- GERAÇÃO DE PDF ARREST ---
export const generateArrestPDF = (arrest, user) => {
    try {
        validateRequiredFields(arrest, ['id']);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = DEFAULT_MARGINS.top + 30;

        drawHeader(doc);
        
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.title);
        doc.text('AUTO DE PRISÃO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        const docRef = `AP - ${arrest.id}/${new Date().getFullYear()}`;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text(docRef, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('1. DADOS DO DETIDO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const width = pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right);
        const detidoText = [
            `Nome: ${arrest.name || 'Não informado'}`,
            `Documento: ${arrest.passport || 'Não informado'}`,
            `Artigos/Crime: ${arrest.articles || arrest.reason || 'Não especificado'}`
        ].join('\n');
        let lines = doc.splitTextToSize(detidoText, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 12;

        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('2. MOTIVO DA PRISÃO / OBSERVAÇÕES', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        lines = doc.splitTextToSize(arrest.reason || arrest.description || 'Sem observações adicionais.', width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 16;

        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('3. CONCLUSÃO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const conclusion = 'Indivíduo detido e à disposição da justiça.';
        lines = doc.splitTextToSize(conclusion, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 30;

        yPos = checkPageBreak(doc, yPos, 30);
        const officerName = arrest.officer || (user && (user.nome || user.username)) || 'Agente Responsável';
        const officerBadge = (user && user.badge) || 'N/A';
        doc.setLineWidth(0.5);
        const signatureY = yPos;
        doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
        yPos += 6;
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(10);
        doc.text(officerName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(9);
        doc.text('AGENTE DA CIVIL EUFORIA', pageWidth / 2, yPos, { align: 'center' });
        doc.text(`Matrícula: ${officerBadge}`, pageWidth / 2, yPos + 4, { align: 'center' });

        addFooterToAllPages(doc, arrest.id, 'AUTO');

        doc.save(`Auto_Prisao_${arrest.id}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF de prisão:", error);
        alert(`Erro ao gerar o auto de prisão: ${error.message || 'Verifique o console.'}`);
    }
};

// --- GERAÇÃO DE PDF WANTED ---
export const generateWantedPDF = (person, user) => {
    try {
        validateRequiredFields(person, ['id']);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = DEFAULT_MARGINS.top + 30;

        drawHeader(doc);
        
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38);
        doc.text('PROCURADO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 14;

        doc.setTextColor(0, 0, 0);
        const docRef = `WANTED - ${person.id}/${new Date().getFullYear()}`;
        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text(docRef, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(18);
        const name = person.name || 'Não identificado';
        doc.text(name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        yPos += 18;

        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.setFontSize(DEFAULT_SIZES.body);
        doc.text('1. DADOS DO PROCURADO', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const width = pageWidth - (DEFAULT_MARGINS.left + DEFAULT_MARGINS.right);
        const dadosText = [
            `Crime/Motivo: ${person.crime || person.reason || 'Não especificado'}`,
            `Periculosidade: ${(person.dangerLevel || person.status || 'Desconhecida')}`,
            `Registro: ${person.date || person.created_at ? formatDate(person.date || person.created_at) : 'Não informado'}`
        ].join('\n');
        let lines = doc.splitTextToSize(dadosText, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 12;

        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('2. INFORMAÇÕES', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const bodyText = 'Qualquer informação sobre o paradeiro deste indivíduo deve ser comunicada imediatamente às autoridades da CIVIL EUFORIA.';
        lines = doc.splitTextToSize(bodyText, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 20;

        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFont(DEFAULT_FONTS.bold, 'bold');
        doc.text('3. RECOMPENSA', DEFAULT_MARGINS.left, yPos);
        yPos += 8;

        doc.setFont(DEFAULT_FONTS.normal, 'normal');
        const reward = person.reward ? `R$ ${person.reward}` : 'A definir';
        const rewardText = `Recompensa oferecida: ${reward}.`;
        lines = doc.splitTextToSize(rewardText, width);
        doc.text(lines, DEFAULT_MARGINS.left, yPos);
        yPos += lines.length * 6 + 20;

        addFooterToAllPages(doc, person.id, 'MANDADO');

        doc.save(`Mandado_Procura_${person.id}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF de procurado:", error);
        alert(`Erro ao gerar o mandado: ${error.message || 'Verifique o console.'}`);
    }
};

// Configuração padrão de cabeçalho
const DEFAULT_PAGE_HEADER_CONFIG = {
    line1: 'ESTADO DA EUFORIA',
    line2: 'SECRETARIA DE SEGURANÇA PÚBLICA',
    line3: 'CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS'
};