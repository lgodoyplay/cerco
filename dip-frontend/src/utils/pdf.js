import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// REGISTRA AS FONTES NO PDFMAKE
// Solução 100% funcional para Vite + React
// Evita erros de VFS fonts não carregadas
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

/**
 * Gera e baixa um PDF automaticamente.
 * @param {Object} docDefinition - Definição do documento pdfMake.
 * @param {string} filename - Nome do arquivo para download (padrão: documento.pdf).
 */
export const gerarPDF = (docDefinition, filename = 'documento.pdf') => {
  try {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    pdfDocGenerator.download(filename);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF. Verifique o console.");
  }
};

export default pdfMake;
