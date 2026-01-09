import jsPDF from 'jspdf';

export const generateInvestigationPDF = (investigation, user) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Helper for text wrapping
  const printText = (text, x, y, size = 12, style = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
    doc.text(lines, x, y);
    return lines.length * (size * 0.5); // approx line height
  };

  // --- HEADER ---
  // Logo placeholder (Shield shape or just text)
  doc.setFillColor(30, 41, 59); // Dark slate
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('POLÍCIA CIVIL', margin, 20);
  doc.setFontSize(10);
  doc.text('CERCO POLICIAL', margin, 28);
  
  doc.setFontSize(10);
  doc.text('RELATÓRIO DE INVESTIGAÇÃO CRIMINAL', pageWidth - margin, 20, { align: 'right' });
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - margin, 28, { align: 'right' });

  yPos = 50;

  // --- CONFIDENTIAL MARKER ---
  doc.setTextColor(220, 38, 38); // Red
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO CONFIDENCIAL - USO EXCLUSIVO', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // --- INVESTIGATION INFO ---
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 70, 'FD');

  let infoY = yPos + 10;
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(investigation.title, margin + 5, infoY);
  infoY += 15;

  // Grid Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ID:', margin + 5, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(investigation.id, margin + 30, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', margin + 100, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(investigation.status === 'Encerrada' ? 220 : 0, investigation.status === 'Encerrada' ? 38 : 100, 38);
  doc.text(investigation.status.toUpperCase(), margin + 120, infoY);
  doc.setTextColor(0, 0, 0);

  infoY += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('PRIORIDADE:', margin + 5, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(investigation.priority, margin + 30, infoY);

  doc.setFont('helvetica', 'bold');
  doc.text('RESPONSÁVEL:', margin + 100, infoY);
  doc.setFont('helvetica', 'normal');
  const officerName = user?.username ? `${user.username} (${user.badge || 'N/A'})` : 'Agente Civil';
  doc.text(officerName, margin + 130, infoY);

  infoY += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('ABERTURA:', margin + 5, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(investigation.createdAt).toLocaleDateString('pt-BR'), margin + 30, infoY);

  if (investigation.closedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('ENCERRAMENTO:', margin + 100, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(investigation.closedAt).toLocaleDateString('pt-BR'), margin + 135, infoY);
  }

  infoY += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('ENVOLVIDOS:', margin + 5, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(investigation.involved, margin + 35, infoY);

  yPos += 80;

  // --- DESCRIPTION ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIÇÃO DO CASO', margin, yPos);
  yPos += 8;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  const descLines = doc.splitTextToSize(investigation.description, pageWidth - (margin * 2));
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(descLines, margin, yPos);
  
  yPos += (descLines.length * 5) + 20;

  // --- PROOFS SECTION ---
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(30, 41, 59);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
  doc.text('REGISTRO DE PROVAS E EVIDÊNCIAS', margin + 5, yPos + 7);
  yPos += 20;

  doc.setTextColor(0, 0, 0);

  investigation.proofs.forEach((proof, index) => {
    // Check page break
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Proof Container
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    // Estimate height needed
    let estimatedHeight = 40;
    if (proof.type === 'image') estimatedHeight += 100;
    if (proof.description.length > 100) estimatedHeight += 20;

    // Proof Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${index + 1} [${proof.type.toUpperCase()}] - ${proof.title}`, margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date(proof.createdAt).toLocaleString('pt-BR');
    doc.text(`Adicionado em: ${dateStr} por ${proof.author}`, pageWidth - margin, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    yPos += 8;

    // Description
    doc.setFontSize(10);
    const proofDescLines = doc.splitTextToSize(proof.description, pageWidth - (margin * 2));
    doc.text(proofDescLines, margin, yPos);
    yPos += (proofDescLines.length * 5) + 5;

    // Content Handling
    if (proof.type === 'image' && proof.content) {
      if (yPos + 100 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      try {
        const imgProps = doc.getImageProperties(proof.content);
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Limit height to not break page too badly if possible, or just scale
        const maxHeight = pageHeight - yPos - 20;
        let finalH = imgHeight;
        let finalW = imgWidth;
        
        if (imgHeight > maxHeight) {
           finalH = maxHeight;
           finalW = (imgProps.width * finalH) / imgProps.height;
        }

        doc.addImage(proof.content, 'JPEG', margin, yPos, finalW, finalH);
        yPos += finalH + 10;
      } catch (e) {
        doc.setTextColor(255, 0, 0);
        doc.text('[Erro ao renderizar imagem]', margin, yPos);
        yPos += 10;
        doc.setTextColor(0, 0, 0);
      }
    } else if (proof.type === 'link') {
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(proof.content, margin, yPos, { url: proof.content });
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    } else if (proof.type === 'text') {
       // already handled in description mainly, but if content is extra text
       if(proof.content && proof.content !== proof.description) {
         const contentLines = doc.splitTextToSize(proof.content, pageWidth - (margin * 2));
         doc.setFont('courier', 'normal');
         doc.text(contentLines, margin, yPos);
         doc.setFont('helvetica', 'normal');
         yPos += (contentLines.length * 5) + 5;
       }
    }

    // Separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount} - DIP Polícia Federal - Sistema Integrado`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`Inquerito_${investigation.id}.pdf`);
};
