import jsPDF from 'jspdf';

export const generateInvestigationPDF = (investigation, user) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25; // Margem padrão A4 (2.5cm)
  let yPos = 30;

  // Configurações de Fonte
  const fontNormal = 'helvetica';
  const fontBold = 'helvetica'; // jsPDF padrão suporta bold como estilo
  
  // --- FUNÇÕES AUXILIARES ---

  const drawHeader = () => {
    // Brasão (Simulado com texto/círculo por enquanto)
    doc.setFillColor(0, 0, 0); 
    // doc.circle(pageWidth / 2, 20, 10, 'F'); // Placeholder do brasão

    // Cabeçalho Oficial
    doc.setFont(fontBold, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, 20, { align: 'center' });
    doc.text('MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA', pageWidth / 2, 25, { align: 'center' });
    doc.text('POLÍCIA FEDERAL', pageWidth / 2, 30, { align: 'center' });
    doc.text('DIRETORIA DE INVESTIGAÇÃO E COMBATE AO CRIME ORGANIZADO - DICOR', pageWidth / 2, 35, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);
  };

  const drawFooter = (pageNumber, totalPages) => {
    doc.setFont(fontNormal, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    const footerText = `Inquérito Policial Nº ${investigation.id} - Confidencial`;
    doc.text(footerText, margin, pageHeight - 15);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
    doc.text('Sistema de Inteligência Policial - Gerado eletronicamente', pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      drawHeader();
      yPos = 50; // Reinicia posição Y após cabeçalho
      return true;
    }
    return false;
  };

  // --- INÍCIO DO DOCUMENTO ---

  drawHeader();
  yPos = 55;

  // Título do Documento
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO FINAL DE INQUÉRITO POLICIAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(12);
  doc.text(`INQUÉRITO Nº: ${investigation.id.toString().padStart(6, '0')}/${new Date().getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // --- DADOS DA INVESTIGAÇÃO (TABELA SIMULADA) ---
  
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 35, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 35);

  let dataY = yPos + 8;
  const col1 = margin + 5;
  const col2 = margin + 100;

  // Linha 1
  doc.setFont(fontBold, 'bold');
  doc.text('DATA DE INSTAURAÇÃO:', col1, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.text(new Date(investigation.createdAt).toLocaleDateString('pt-BR'), col1 + 45, dataY);

  doc.setFont(fontBold, 'bold');
  doc.text('STATUS ATUAL:', col2, dataY);
  doc.setFont(fontNormal, 'normal');
  doc.setTextColor(investigation.status === 'Encerrada' ? 200 : 0, 0, 0);
  doc.text(investigation.status.toUpperCase(), col2 + 30, dataY);
  doc.setTextColor(0, 0, 0);

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
  const officerName = user?.username ? `${user.username.toUpperCase()}` : 'AGENTE RESPONSÁVEL';
  doc.text(officerName, col1 + 55, dataY);

  yPos += 45;

  // --- ENVOLVIDOS ---
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(11);
  doc.text('1. DOS ENVOLVIDOS', margin, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  doc.setFontSize(11);
  const involvedLines = doc.splitTextToSize(investigation.involved || 'Não informado.', pageWidth - (margin * 2));
  doc.text(involvedLines, margin, yPos);
  yPos += (involvedLines.length * 6) + 10;

  // --- FATOS / DESCRIÇÃO ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('2. DOS FATOS APURADOS', margin, yPos);
  yPos += 8;

  doc.setFont(fontNormal, 'normal');
  const descLines = doc.splitTextToSize(investigation.description || 'Sem descrição.', pageWidth - (margin * 2));
  doc.text(descLines, margin, yPos);
  yPos += (descLines.length * 6) + 15;

  // --- PROVAS E EVIDÊNCIAS ---
  checkPageBreak(30);
  doc.setFont(fontBold, 'bold');
  doc.text('3. DAS PROVAS E EVIDÊNCIAS COLETADAS', margin, yPos);
  yPos += 10;

  if (investigation.proofs && investigation.proofs.length > 0) {
    investigation.proofs.forEach((proof, index) => {
      checkPageBreak(50); // Verifica se cabe pelo menos o cabeçalho da prova

      // Caixa da prova
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(250, 250, 250); // Fundo cinza claro
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F'); // Cabeçalho da prova
      
      doc.setFont(fontBold, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`EVIDÊNCIA #${index + 1} - ${proof.type ? proof.type.toUpperCase() : 'DOCUMENTO'}`, margin + 2, yPos + 6);
      
      yPos += 12;

      // Descrição da prova
      doc.setFont(fontNormal, 'normal');
      doc.setFontSize(10);
      
      const proofTitle = proof.title ? `${proof.title} - ` : '';
      const proofDescText = `${proofTitle}${proof.description || 'Sem descrição adicional.'}`;
      const proofLines = doc.splitTextToSize(proofDescText, pageWidth - (margin * 2));
      
      doc.text(proofLines, margin, yPos);
      yPos += (proofLines.length * 5) + 5;

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
            doc.setFontSize(8);
            doc.text('Figura: Representação visual da evidência.', xImg, yPos + imgHeight + 5);
            yPos += imgHeight + 15;
        } catch (e) {
            doc.setTextColor(200, 0, 0);
            doc.text('[Imagem não pôde ser carregada no relatório]', margin, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 10;
        }
      } else if (proof.type === 'link') {
        doc.setTextColor(0, 0, 255);
        doc.setFontSize(9);
        doc.textWithLink(`Acesse o conteúdo externo: ${proof.content}`, margin, yPos, { url: proof.content });
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      yPos += 5; // Espaço entre provas
    });
  } else {
    doc.setFont(fontNormal, 'italic');
    doc.text('Nenhuma prova digital anexada a este relatório.', margin, yPos);
    yPos += 10;
  }

  // --- CONCLUSÃO ---
  checkPageBreak(40);
  yPos += 10;
  doc.setFont(fontBold, 'bold');
  doc.setFontSize(11);
  doc.text('4. CONCLUSÃO', margin, yPos);
  yPos += 8;
  
  doc.setFont(fontNormal, 'normal');
  const conclusionText = "Diante do exposto, encaminha-se o presente Inquérito Policial para apreciação da autoridade competente, contendo o relato detalhado das diligências realizadas e evidências coletadas, dando-se por encerradas as atividades investigativas desta fase.";
  const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - (margin * 2));
  doc.text(conclusionLines, margin, yPos);
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
  doc.text('Agente de Polícia Federal', pageWidth / 2, yPos, { align: 'center' });
  doc.text(`Matrícula: ${user?.badge || '000.000'}`, pageWidth / 2, yPos + 4, { align: 'center' });

  // Numeração de páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`Inquerito_Policial_${investigation.id}.pdf`);
};
