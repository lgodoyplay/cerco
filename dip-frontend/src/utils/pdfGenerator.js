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
  // jsPDF padrão usa Helvetica (similar a Arial).
  // Tamanho padrão 12, espaçamento 1.5
  const fontNormal = 'times'; // Usando Times para ficar mais formal/ABNT
  const fontBold = 'times'; 
  const fontSizeBody = 12;
  const fontSizeTitle = 14;
  const fontSizeSmall = 10;
  
  // --- FUNÇÕES AUXILIARES ---

  const drawHeader = () => {
    // Brasão (Simulado com texto/círculo por enquanto)
    doc.setFillColor(0, 0, 0); 
    // doc.circle(pageWidth / 2, 20, 10, 'F'); // Placeholder do brasão

    // Cabeçalho Oficial
    doc.setFont(fontBold, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, 20, { align: 'center' });
    doc.text('MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA', pageWidth / 2, 25, { align: 'center' });
    doc.text('POLICIA CIVIL', pageWidth / 2, 30, { align: 'center' });
    doc.text('POLICIA CIVIL', pageWidth / 2, 35, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 40, pageWidth - marginRight, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, 'normal');
    doc.setFontSize(10); // ABNT: tamanho 10 para notas de rodapé/paginação
    doc.setTextColor(0, 0, 0);
    
    // ABNT: Paginação no canto superior direito é comum, mas rodapé centralizado também é aceito em documentos oficiais internos.
    // Vamos manter no rodapé conforme padrão anterior, mas com fonte correta.
    const footerText = `Inquérito Policial Nº ${investigation.id} - Confidencial`;
    doc.text(footerText, marginLeft, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 15, { align: 'right' });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      yPos = marginTop + 20; // Reinicia posição Y após cabeçalho com margem
      return true;
    }
    return false;
  };

  // --- INÍCIO DO DOCUMENTO ---

  drawHeader();
  yPos = marginTop + 30; // Ajuste inicial

  // Título do Documento
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeTitle);
  doc.text('RELATÓRIO FINAL DE INQUÉRITO POLICIAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  const formattedId = `PC - ${investigation.id.toString().padStart(3, '0')}`;
  doc.setFontSize(fontSizeBody);
  doc.text(`INQUÉRITO Nº: ${formattedId}/${new Date().getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // --- DADOS DA INVESTIGAÇÃO (TABELA SIMULADA) ---
  
  doc.setFontSize(fontSizeSmall);
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 35, 'F');
  doc.setDrawColor(0, 0, 0); // Preto para ficar mais sóbrio
  doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 35);

  let dataY = yPos + 8;
  const col1 = marginLeft + 5;
  const col2 = marginLeft + 100;

  // Linha 1
  doc.setFont(fontBold, 'bold');
  doc.text('DATA DE INSTAURAÇÃO:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(new Date(investigation.createdAt).toLocaleDateString('pt-BR'), col1 + 45, dataY);

  doc.setFont(fontBold, 'bold');
  doc.text('STATUS ATUAL:', col2, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(investigation.status.toUpperCase(), col2 + 30, dataY);

  dataY += 8;

  // Linha 2
  doc.setFont(fontBold, 'bold');
  doc.text('PRIORIDADE:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(investigation.priority, col1 + 45, dataY);

  doc.setFont(fontBold, 'bold');
  doc.text('DATA DE ENCERRAMENTO:', col2, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(investigation.closedAt ? new Date(investigation.closedAt).toLocaleDateString('pt-BR') : 'Em andamento', col2 + 50, dataY);

  dataY += 8;

  // Linha 3 - Responsável
  doc.setFont(fontBold, 'bold');
  doc.text('AUTORIDADE RESPONSÁVEL:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  
  // Tenta usar o nome do investigador vindo do objeto (se implementado join) ou do usuário logado
  let officerName = 'AGENTE RESPONSÁVEL';
  let officerBadge = '000.000';
  let officerRole = 'Agente de Policia Civil';

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

  // --- ENVOLVIDOS ---
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeBody);
  doc.text('1. DOS ENVOLVIDOS', marginLeft, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(fontSizeBody);
  
  let involvedText = 'Não informado.';
  if (Array.isArray(investigation.involved) && investigation.involved.length > 0) {
      involvedText = investigation.involved.join(', ');
  } else if (typeof investigation.involved === 'string' && investigation.involved.trim() !== '') {
      involvedText = investigation.involved;
  }
  
  // Parágrafo com recuo (1.25cm ~ 12.5mm aprox 13) na primeira linha seria o ideal ABNT
  // jsPDF splitTextToSize não suporta indentação de primeira linha nativamente fácil
  // Vamos manter justificado simples por enquanto
  const involvedLines = doc.splitTextToSize(involvedText, pageWidth - (marginLeft + marginRight));
  doc.text(involvedLines, marginLeft, yPos);
  yPos += (involvedLines.length * 6) + 10;

  // --- FATOS / DESCRIÇÃO ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('2. DOS FATOS APURADOS', marginLeft, yPos);
  yPos += 8;

  doc.setFont(fontNormal, 'normal');
  const descLines = doc.splitTextToSize(investigation.description || 'Sem descrição.', pageWidth - (marginLeft + marginRight));
  doc.text(descLines, marginLeft, yPos);
  yPos += (descLines.length * 6) + 15;

  // --- PROVAS E EVIDÊNCIAS ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('3. DAS PROVAS E EVIDÊNCIAS COLETADAS', marginLeft, yPos);
  yPos += 10;

  if (investigation.proofs && investigation.proofs.length > 0) {
    investigation.proofs.forEach((proof, index) => {
      checkPageBreak(50); // Verifica se cabe pelo menos o cabeçalho da prova

      // Caixa da prova
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(240, 240, 240); // Fundo cinza claro
      doc.rect(marginLeft, yPos, pageWidth - (marginLeft + marginRight), 8, 'F'); // Cabeçalho da prova
      
      doc.setFont(fontBold, 'bold');
      doc.setFontSize(fontSizeSmall);
      doc.setTextColor(0, 0, 0);
      doc.text(`EVIDÊNCIA #${index + 1} - ${proof.type ? proof.type.toUpperCase() : 'DOCUMENTO'}`, marginLeft + 2, yPos + 6);
      
      yPos += 12;

      // Descrição da prova
      doc.setFont(fontNormal, 'normal');
      doc.setFontSize(fontSizeBody);
      
      const proofTitle = proof.title ? `${proof.title} - ` : '';
      const proofDescText = `${proofTitle}${proof.description || 'Sem descrição adicional.'}`;
      const proofLines = doc.splitTextToSize(proofDescText, pageWidth - (marginLeft + marginRight));
      
      doc.text(proofLines, marginLeft, yPos);
      yPos += (proofLines.length * 6) + 5;

      // Conteúdo da prova (Imagem ou Link)
      if (proof.type === 'image' && proof.content) {
        checkPageBreak(100);
        try {
            // Tenta adicionar imagem
            const imgHeight = 80; // Altura fixa para manter padrão ou calcular proporcional
            // Mantendo proporção simples (assumindo paisagem ou quadrado para caber)
            const imgWidth = 100; 
            
            // Centralizar imagem
            const xImg = (pageWidth - imgWidth) / 2;
            
            doc.addImage(proof.content, 'JPEG', xImg, yPos, imgWidth, imgHeight);
            doc.setFontSize(8); // Legenda menor
            doc.text('Figura: Representação visual da evidência.', xImg, yPos + imgHeight + 5);
            yPos += imgHeight + 15;
        } catch (_error) {
            doc.setTextColor(200, 0, 0);
            doc.text('[Imagem não pôde ser carregada no relatório]', marginLeft, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 10;
        }
      } else if (proof.type === 'link') {
        doc.setTextColor(0, 0, 255);
        doc.setFontSize(fontSizeSmall);
        doc.textWithLink(`Acesse o conteúdo externo: ${proof.content}`, marginLeft, yPos, { url: proof.content });
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      yPos += 5; // Espaço entre provas
    });
  } else {
    doc.setFont(fontNormal, 'italic');
    doc.text('Nenhuma prova digital anexada a este relatório.', marginLeft, yPos);
    yPos += 10;
  }

  // --- CONCLUSÃO ---
  checkPageBreak(40);
  yPos += 10;
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(fontSizeBody);
  doc.text('4. CONCLUSÃO', marginLeft, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  const conclusionText = "Diante do exposto, encaminha-se o presente Inquérito Policial para apreciação da autoridade competente, contendo o relato detalhado das diligências realizadas e evidências coletadas, dando-se por encerradas as atividades investigativas desta fase.";
  const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - (marginLeft + marginRight));
  doc.text(conclusionLines, marginLeft, yPos);
  yPos += (conclusionLines.length * 6) + 30;

  // --- ASSINATURA ---
  checkPageBreak(40);
  
  // Linha de assinatura
  const signatureLineY = yPos;
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, signatureLineY, pageWidth / 2 + 40, signatureLineY);
  
  yPos += 5;
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(10);
  doc.text(officerName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(9);
  doc.text(officerRole, pageWidth / 2, yPos, { align: 'center' });
  doc.text(`Matrícula: ${officerBadge}`, pageWidth / 2, yPos + 4, { align: 'center' });

  // Numeração de páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Inquerito_Policial_${investigation.id}.pdf`);
};
