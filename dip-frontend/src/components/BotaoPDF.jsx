import React from 'react';
import { gerarPDF } from '../utils/pdf';
import { FileText } from 'lucide-react';

const BotaoPDF = () => {
  const handleGerarPDF = () => {
    const docDefinition = {
      content: [
        { text: 'Relatório de Teste', style: 'header' },
        { text: 'Este é um documento PDF gerado com React + Vite + PDFMake corrigido.', margin: [0, 20, 0, 20] },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              ['Coluna 1', 'Coluna 2', 'Coluna 3'],
              ['Dado A', 'Dado B', 'Dado C'],
              ['Dado D', 'Dado E', 'Dado F']
            ]
          }
        }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: 'center'
        }
      }
    };

    gerarPDF(docDefinition, 'relatorio_teste.pdf');
  };

  return (
    <button
      onClick={handleGerarPDF}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-md"
    >
      <FileText size={20} />
      Gerar PDF de Teste
    </button>
  );
};

export default BotaoPDF;
