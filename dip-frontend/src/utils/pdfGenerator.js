import jsPDF from 'jspdf';

export const generateInvestigationPDF = (investigation, user) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = 30; // Margem Superior 3cm
  const marginLeft = 30; // Margem Esquerda 3cm
  const marginRight = 20; // Margem Direita 2cm
  const marginBottom = 20; // Margem Inferior 2cm
  let yPos = marginTop;

  // Configurações de Fonte ABNT (Times New Roman ou Arial)
  const fontNormal = 'times'; 
  const fontBold = 'times'; 
  const fontSizeBody = 12;
  const fontSizeTitle = 14;
  const fontSizeSmall = 10;
  
  // --- FUNÇÕES AUXILIARES ---

  const drawHeader = () => {
    doc.setFont(fontBold, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('ESTADO DA EUFORIA', pageWidth / 2, 20, { align: 'center' });
    doc.text('SECRETARIA DE SEGURANÇA PÚBLICA', pageWidth / 2, 25, { align: 'center' });
    doc.text('CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS', pageWidth / 2, 30, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const footerText = `RELATÓRIO Nº ${investigation.id} - Confidencial`;
    doc.text(footerText, marginLeft, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 15, { align: 'right' });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      yPos = marginTop + 20;
      return true;
    }
    return false;
  };

  // --- INÍCIO DO DOCUMENTO ---

  drawHeader();
  yPos = marginTop + 30;

  // Título do Documento
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeTitle);
  doc.text('RELATÓRIO FINAL DE INQUÉRITO POLICIAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  const formattedId = `CIVIL EUFORIA - ${investigation.id.toString().padStart(3, '0')}`;
  doc.setFontSize(fontSizeBody);
  doc.text(`PROTOCOLO Nº: ${formattedId}/${new Date().getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // --- DADOS DO INQUÉRITO ---
  
  doc.setFontSize(fontSizeSmall);
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 35, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 35);

  let dataY = yPos + 8;
  const col1 = marginLeft + 5;
  const col2 = marginLeft + 100;

  doc.setFont(fontBold, 'bold');
  doc.text('DATA DE INSTAURAÇÃO:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(new Date(investigation.createdAt).toLocaleDateString('pt-BR'), col1 + 45, dataY);

  doc.setFont(fontBold, 'bold');
  doc.text('STATUS ATUAL:', col2, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(investigation.status.toUpperCase(), col2 + 30, dataY);

  dataY += 8;

  doc.setFont(fontBold, 'bold');
  doc.text('PRIORIDADE:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(investigation.priority, col1 + 45, dataY);

  doc.setFont(fontBold, 'bold');
  doc.text('DELEGACIA RESPONSÁVEL:', col2, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text('Central', col2 + 55, dataY);

  dataY += 8;

  doc.setFont(fontBold, 'bold');
  doc.text('INVESTIGADOR RESPONSÁVEL:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  
  let officerName = 'AGENTE RESPONSÁVEL';
  let officerBadge = '000.000';
  let officerRole = 'Investigador CIVIL EUFORIA';

  if (investigation.investigator) {
      officerName = investigation.investigator.nome.toUpperCase();
      officerBadge = investigation.investigator.badge || 'Não informado';
      if (investigation.investigator.role) officerRole = investigation.investigator.role;
  } else if (user) {
      officerName = (user.username || user.nome || 'Usuário').toUpperCase();
      officerBadge = user.badge || '000.000';
      if (user.role) officerRole = user.role;
  }
  
  doc.text(`${officerName} - MATRÍCULA: ${officerBadge}`, col1 + 55, dataY);

  yPos += 45;

  // --- IDENTIFICAÇÃO DO INVESTIGADO ---
  checkPageBreak(40);
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeBody);
  doc.text('1. IDENTIFICAÇÃO DO INVESTIGADO', marginLeft, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(fontSizeBody);
  
  let involvedText = 'Não informado.';
  if (Array.isArray(investigation.involved) && investigation.involved.length > 0) {
      involvedText = investigation.involved.join(', ');
  } else if (typeof investigation.involved === 'string' && investigation.involved.trim() !== '') {
      involvedText = investigation.involved;
  }
  
  const involvedLines = doc.splitTextToSize(involvedText, pageWidth - (marginLeft + marginRight));
  doc.text(involvedLines, marginLeft, yPos);
  yPos += (involvedLines.length * 6) + 10;

  // --- OBJETO DA INVESTIGAÇÃO ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('2. OBJETO DA INVESTIGAÇÃO', marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, 'normal');
  const objText = 'O presente Inquérito Policial foi instaurado pela Polícia Civil do Estado da Euforia com a finalidade de apurar os fatos noticiados, identificar a autoria, materialidade e circunstâncias relacionadas à possível prática de infração penal atribuída ao investigado.';
  const objLines = doc.splitTextToSize(objText, pageWidth - (marginLeft + marginRight));
  doc.text(objLines, marginLeft, yPos);
  yPos += (objLines.length * 6) + 10;

  // --- RELATÓRIO DOS FATOS ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('3. RELATÓRIO DOS FATOS', marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, 'normal');
  const descLines = doc.splitTextToSize(investigation.description || 'Sem descrição.', pageWidth - (marginLeft + marginRight));
  doc.text(descLines, marginLeft, yPos);
  yPos += (descLines.length * 6) + 15;

  // --- DILIGÊNCIAS REALIZADAS ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('4. DILIGÊNCIAS REALIZADAS', marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, 'normal');
  const diligText = 'Durante a instrução do presente inquérito foram realizadas as seguintes ações investigativas:\n- Levantamento de informações e antecedentes;\n- Coleta de depoimentos e oitivas;\n- Análise documental;\n- Verificação de registros fotográficos e audiovisuais;\n- Levantamento de inteligência policial;\n- Demais diligências necessárias para o esclarecimento dos fatos.';
  const diligLines = doc.splitTextToSize(diligText, pageWidth - (marginLeft + marginRight));
  doc.text(diligLines, marginLeft, yPos);
  yPos += (diligLines.length * 6) + 15;

  // --- ELEMENTOS PROBATÓRIOS ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('5. ELEMENTOS PROBATÓRIOS', marginLeft, yPos);
  yPos += 10;

  if (investigation.proofs && investigation.proofs.length > 0) {
    investigation.proofs.forEach((proof, index) => {
      checkPageBreak(100);

      const proofNumber = String(index + 1).padStart(3, '0');
      
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(220, 220, 220);
      doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 12, 'F');
      doc.setLineWidth(0.5);
      doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 12);
      
      doc.setFont(fontBold, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`PROVA ${proofNumber} — ${proof.title ? proof.title.toUpperCase() : 'EVIDÊNCIA'}`, marginLeft + 5, yPos + 9);
      
      yPos += 18;

      doc.setFont(fontNormal, 'normal');
      doc.setFontSize(11);
      
      doc.setFont(fontBold, 'bold');
      doc.text('Tipo:', marginLeft, yPos);
      doc.setFont(fontNormal, 'normal');
      let typeLabel = 'Documento';
      if (proof.type === 'image') typeLabel = 'Fotografia/Vídeo';
      if (proof.type === 'video') typeLabel = 'Vídeo';
      if (proof.type === 'link') typeLabel = 'Link/Recurso Digital';
      if (proof.type === 'text') typeLabel = 'Depoimento/Declaração';
      doc.text(typeLabel, marginLeft + 20, yPos);
      
      yPos += 7;
      
      doc.setFont(fontBold, 'bold');
      doc.text('Data:', marginLeft, yPos);
      doc.setFont(fontNormal, 'normal');
      doc.text(proof.createdAt ? new Date(proof.createdAt).toLocaleDateString('pt-BR') : 'Não registrada', marginLeft + 20, yPos);
      
      yPos += 7;
      
      doc.setFont(fontBold, 'bold');
      doc.text('Responsável:', marginLeft, yPos);
      doc.setFont(fontNormal, 'normal');
      doc.text(proof.author || 'Agente Responsável', marginLeft + 35, yPos);
      
      yPos += 12;

      doc.setFont(fontBold, 'bold');
      doc.text('Descrição:', marginLeft, yPos);
      yPos += 7;
      doc.setFont(fontNormal, 'normal');
      doc.setFontSize(fontSizeBody);
      const descLines = doc.splitTextToSize(proof.description || 'Sem descrição detalhada.', pageWidth - (marginLeft + marginRight));
      doc.text(descLines, marginLeft, yPos);
      yPos += (descLines.length * 6) + 8;

      if (proof.type === 'image' && proof.content) {
        checkPageBreak(120);
        try {
          const imgHeight = 100;
          const imgWidth = 130; 
          const xImg = (pageWidth - imgWidth) / 2;
          
          doc.addImage(proof.content, 'JPEG', xImg, yPos, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.text(`Figura ${proofNumber}: ${proof.title || 'Evidência visual'}`, xImg, yPos + imgHeight + 5, { align: 'center' });
          yPos += imgHeight + 15;
        } catch (_error) {
          doc.setTextColor(200, 0, 0);
          doc.text('[Imagem não pôde ser carregada no relatório]', marginLeft, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 10;
        }
      } else if (proof.type === 'video' || proof.type === 'link') {
        doc.setTextColor(0, 0, 255);
        doc.setFontSize(fontSizeSmall);
        doc.textWithLink(`Acesse o conteúdo: ${proof.content}`, marginLeft, yPos, { url: proof.content });
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      if (index < investigation.proofs.length - 1) {
        doc.setLineWidth(0.2);
        doc.setDrawColor(150, 150, 150);
        doc.line(marginLeft, yPos + 3, pageWidth - marginRight, yPos + 3);
        yPos += 15;
      }
    });
  } else {
    doc.setFont(fontNormal, 'italic');
    doc.text('Nenhuma prova digital anexada a este inquérito.', marginLeft, yPos);
    yPos += 10;
  }

  // --- ANÁLISE INVESTIGATIVA ---
  checkPageBreak(40);
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeBody);
  doc.text('6. ANÁLISE INVESTIGATIVA', marginLeft, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  const analysisText = 'Após análise técnica e confrontação dos elementos obtidos, verificou-se a existência de indícios consistentes relacionados aos fatos investigados, permitindo a formação de convicção acerca da dinâmica dos acontecimentos e da eventual responsabilidade do investigado. As informações coletadas demonstram coerência entre os depoimentos, documentos e demais evidências presentes nos autos.';
  const analysisLines = doc.splitTextToSize(analysisText, pageWidth - (marginLeft + marginRight));
  doc.text(analysisLines, marginLeft, yPos);
  yPos += (analysisLines.length * 6) + 15;

  // --- CONCLUSÃO ---
  checkPageBreak(40);
  doc.setFont(fontBold, 'bold');
  doc.text('7. CONCLUSÃO', marginLeft, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  const conclusionText = 'Diante dos fatos apurados e das provas produzidas ao longo da investigação, conclui-se que o presente Inquérito Policial atingiu seus objetivos, reunindo elementos suficientes para subsidiar as medidas legais cabíveis. Assim, os autos são encaminhados à autoridade competente para análise e deliberação quanto às providências subsequentes.';
  const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - (marginLeft + marginRight));
  doc.text(conclusionLines, marginLeft, yPos);
  yPos += (conclusionLines.length * 6) + 15;

  // Local e data
  const dataConclusao = investigation.closedAt ? new Date(investigation.closedAt) : new Date();
  doc.text(`Estado da Euforia, ${dataConclusao.toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;

  // --- ASSINATURAS ---
  checkPageBreak(60);
  
  // Investigador
  let signatureY = yPos;
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
  
  yPos += 5;
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(10);
  doc.text(officerName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(9);
  doc.text('Investigador de Polícia Civil', pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;

  // Delegado
  signatureY = yPos;
  doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
  
  yPos += 5;
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(10);
  doc.text('DELEGADO DE POLÍCIA', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 20;

  // Rodapé
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(12);
  doc.text('POLÍCIA CIVIL DO ESTADO DA EUFORIA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(11);
  doc.text('"Servir e Proteger com Justiça e Integridade"', pageWidth / 2, yPos, { align: 'center' });

  // Numeração de páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Inquerito_${investigation.id}.pdf`);
};

function fillTemplate(templateStr, variables) {
  if (!templateStr) return null;
  let text = templateStr;
  const source = variables || {};
  Object.keys(source).forEach((key) => {
    const value = source[key];
    const safe = value === undefined || value === null ? "" : String(value);
    text = text.replace(new RegExp(key, "g"), safe);
  });
  const cleaned = text.trim();
  if (!cleaned) return null;
  return cleaned;
}

export const generateBOReportPDF = (bo, user, templateStr) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = 30;
  const marginLeft = 30;
  const marginRight = 20;
  const marginBottom = 20;
  let yPos = marginTop;

  const fontNormal = "times";
  const fontBold = "times";
  const fontSizeBody = 12;
  const fontSizeTitle = 14;

  const drawHeader = () => {
    doc.setFont(fontBold, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("ESTADO DA EUFORIA", pageWidth / 2, 20, { align: "center" });
    doc.text("SECRETARIA DE SEGURANÇA PÚBLICA", pageWidth / 2, 25, { align: "center" });
    doc.text("CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS", pageWidth / 2, 30, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, "normal");
    doc.setFontSize(10);
    const footerText = `BO Nº ${bo.id || ""}`;
    doc.text(footerText, marginLeft, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 15, { align: "right" });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      yPos = marginTop + 20;
      return true;
    }
    return false;
  };

  drawHeader();
  yPos = marginTop + 30;

  doc.setFont(fontBold, "bold");
  doc.setFontSize(fontSizeTitle);
  doc.text("BOLETIM DE OCORRÊNCIA", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  const docRef = `BO - ${bo.id}/${new Date().getFullYear()}`;
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(fontSizeBody);
  doc.text(docRef, pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  doc.setFont(fontBold, "bold");
  doc.text("1. DADOS DA OCORRÊNCIA", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const width = pageWidth - (marginLeft + marginRight);
  const ocorrenciaText = [
    `Local: ${bo.localizacao || "Não informado"}`,
    `Comunicante: ${bo.comunicante || "Anônimo"}`,
    `Data/Hora: ${bo.created_at ? new Date(bo.created_at).toLocaleString("pt-BR") : "Não informada"}`
  ].join("\n");
  let lines = doc.splitTextToSize(ocorrenciaText, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 12;

  const variables = {
    "{relato_fatos}": bo.descricao || "",
    "{natureza_ocorrencia}": "Ocorrência Policial",
    "{nome_comunicante}": bo.comunicante || "Anônimo",
    "{local_prisao}": bo.localizacao || "Não informado",
    "{assinatura_agente}": (user && (user.nome || user.username)) || "Agente de Plantão"
  };

  const templateText = fillTemplate(templateStr, variables);
  const relato = templateText || bo.descricao || "Sem descrição.";

  checkPageBreak(40);
  doc.setFont(fontBold, "bold");
  doc.text("2. RELATO DOS FATOS", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  lines = doc.splitTextToSize(relato, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 16;

  checkPageBreak(40);
  doc.setFont(fontBold, "bold");
  doc.text("3. CONCLUSÃO", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const conclusion = "Registro realizado para fins legais.";
  lines = doc.splitTextToSize(conclusion, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 30;

  checkPageBreak(30);
  const officerName = (user && (user.nome || user.username)) || "Agente de Plantão";
  const officerBadge = (user && user.badge) || "N/A";
  doc.setLineWidth(0.5);
  const signatureY = yPos;
  doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
  yPos += 6;
  doc.setFont(fontBold, "bold");
  doc.setFontSize(10);
  doc.text(officerName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(9);
  doc.text("AGENTE DA CIVIL EUFORIA", pageWidth / 2, yPos, { align: "center" });
  doc.text(`Matrícula: ${officerBadge}`, pageWidth / 2, yPos + 4, { align: "center" });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Boletim_Ocorrencia_${bo.id}.pdf`);
};

export const generateArrestPDF = (arrest, user, templateStr) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = 30;
  const marginLeft = 30;
  const marginRight = 20;
  const marginBottom = 20;
  let yPos = marginTop;

  const fontNormal = "times";
  const fontBold = "times";
  const fontSizeBody = 12;
  const fontSizeTitle = 14;

  const drawHeader = () => {
    doc.setFont(fontBold, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("ESTADO DA EUFORIA", pageWidth / 2, 20, { align: "center" });
    doc.text("SECRETARIA DE SEGURANÇA PÚBLICA", pageWidth / 2, 25, { align: "center" });
    doc.text("CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS", pageWidth / 2, 30, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, "normal");
    doc.setFontSize(10);
    const footerText = `AUTO DE PRISÃO Nº ${arrest.id || ""}`;
    doc.text(footerText, marginLeft, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 15, { align: "right" });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      yPos = marginTop + 20;
      return true;
    }
    return false;
  };

  drawHeader();
  yPos = marginTop + 30;

  doc.setFont(fontBold, "bold");
  doc.setFontSize(fontSizeTitle);
  doc.text("AUTO DE PRISÃO", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  const docRef = `AP - ${arrest.id}/${new Date().getFullYear()}`;
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(fontSizeBody);
  doc.text(docRef, pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  doc.setFont(fontBold, "bold");
  doc.text("1. DADOS DO DETIDO", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const width = pageWidth - (marginLeft + marginRight);
  const detidoText = [
    `Nome: ${arrest.name || "Não informado"}`,
    `Documento: ${arrest.passport || "Não informado"}`,
    `Artigos/Crime: ${arrest.articles || arrest.reason || "Não especificado"}`
  ].join("\n");
  let lines = doc.splitTextToSize(detidoText, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 12;

  const variables = {
    "{relato_fatos}": arrest.reason || arrest.description || "",
    "{local_prisao}": "Delegacia Central",
    "{assinatura_agente}": arrest.officer || (user && (user.nome || user.username)) || "Agente Responsável"
  };

  const templateText = fillTemplate(templateStr, variables);
  const relato = templateText || arrest.reason || arrest.description || "Sem observações adicionais.";

  checkPageBreak(40);
  doc.setFont(fontBold, "bold");
  doc.text("2. MOTIVO DA PRISÃO / OBSERVAÇÕES", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  lines = doc.splitTextToSize(relato, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 16;

  checkPageBreak(40);
  doc.setFont(fontBold, "bold");
  doc.text("3. CONCLUSÃO", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const conclusion = "Indivíduo detido e à disposição da justiça.";
  lines = doc.splitTextToSize(conclusion, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 30;

  checkPageBreak(30);
  const officerName = arrest.officer || (user && (user.nome || user.username)) || "Agente Responsável";
  const officerBadge = (user && user.badge) || "N/A";
  doc.setLineWidth(0.5);
  const signatureY = yPos;
  doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
  yPos += 6;
  doc.setFont(fontBold, "bold");
  doc.setFontSize(10);
  doc.text(officerName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(9);
  doc.text("AGENTE DA CIVIL EUFORIA", pageWidth / 2, yPos, { align: "center" });
  doc.text(`Matrícula: ${officerBadge}`, pageWidth / 2, yPos + 4, { align: "center" });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Auto_Prisao_${arrest.id}.pdf`);
};

export const generateWantedPDF = (person, user, templateStr) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = 30;
  const marginLeft = 30;
  const marginRight = 20;
  const marginBottom = 20;
  let yPos = marginTop;

  const fontNormal = "times";
  const fontBold = "times";
  const fontSizeBody = 12;
  const fontSizeTitle = 16;

  const drawHeader = () => {
    doc.setFont(fontBold, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("ESTADO DA EUFORIA", pageWidth / 2, 20, { align: "center" });
    doc.text("SECRETARIA DE SEGURANÇA PÚBLICA", pageWidth / 2, 25, { align: "center" });
    doc.text("CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS", pageWidth / 2, 30, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, "normal");
    doc.setFontSize(10);
    const footerText = `Mandado de procura Nº ${person.id || ""}`;
    doc.text(footerText, marginLeft, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 15, { align: "right" });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      yPos = marginTop + 20;
      return true;
    }
    return false;
  };

  drawHeader();
  yPos = marginTop + 30;

  doc.setFont(fontBold, "bold");
  doc.setFontSize(fontSizeTitle);
  doc.setTextColor(220, 38, 38);
  doc.text("PROCURADO", pageWidth / 2, yPos, { align: "center" });
  yPos += 14;

  doc.setTextColor(0, 0, 0);
  const docRef = `WANTED - ${person.id}/${new Date().getFullYear()}`;
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(fontSizeBody);
  doc.text(docRef, pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  doc.setFont(fontBold, "bold");
  doc.setFontSize(18);
  const name = person.name || "Não identificado";
  doc.text(name.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 18;

  doc.setFont(fontBold, "bold");
  doc.setFontSize(fontSizeBody);
  doc.text("1. DADOS DO PROCURADO", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const width = pageWidth - (marginLeft + marginRight);
  const dadosText = [
    `Crime/Motivo: ${person.crime || person.reason || "Não especificado"}`,
    `Periculosidade: ${(person.dangerLevel || person.status || "Desconhecida").toString()}`,
    `Registro: ${person.date || person.created_at ? new Date(person.date || person.created_at).toLocaleDateString("pt-BR") : "Não informado"}`
  ].join("\n");
  let lines = doc.splitTextToSize(dadosText, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 12;

  const variables = {
    "{nome_procurado}": name,
    "{crime}": person.crime || person.reason || "Não especificado",
    "{recompensa}": person.reward || "Não informada",
    "{periculosidade}": person.dangerLevel || person.status || "Desconhecida",
    "{data_registro}": person.date || person.created_at ? new Date(person.date || person.created_at).toLocaleDateString("pt-BR") : "Não informado"
  };

  const templateText = fillTemplate(templateStr, variables);

  checkPageBreak(40);
  doc.setFont(fontBold, "bold");
  doc.text("2. INFORMAÇÕES", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const bodyText = templateText || "Qualquer informação sobre o paradeiro deste indivíduo deve ser comunicada imediatamente às autoridades da CIVIL EUFORIA.";
  lines = doc.splitTextToSize(bodyText, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 20;

  checkPageBreak(30);
  doc.setFont(fontBold, "bold");
  doc.text("3. RECOMPENSA", marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, "normal");
  const reward = person.reward ? `R$ ${person.reward}` : "A definir";
  const rewardText = `Recompensa oferecida: ${reward}.`;
  lines = doc.splitTextToSize(rewardText, width);
  doc.text(lines, marginLeft, yPos);
  yPos += lines.length * 6 + 20;

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Mandado_Procura_${person.id}.pdf`);
};
