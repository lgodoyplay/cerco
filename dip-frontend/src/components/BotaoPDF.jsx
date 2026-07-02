import React, { useState } from 'react';
import { gerarPDF, generatePDFWithLoading } from '../utils/pdfBase';
import { FileText, Eye, Download } from 'lucide-react';

const BotaoPDF = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGerarPDF = async () => {
        await generatePDFWithLoading(async () => {
            const docDefinition = {
                documentInfo: {
                    title: 'Relatório de Teste',
                    author: 'Sistema CERCO',
                    subject: 'Documento de Teste',
                    keywords: 'teste, relatório'
                },
                pageSize: 'A4',
                pageMargins: [30, 30, 30, 30],
                content: [
                    { text: 'Relatório de Teste', style: 'header' },
                    { text: 'Este é um documento PDF gerado com React + Vite + PDFMake com as melhorias implementadas.', margin: [0, 20, 0, 20] },
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
                        alignment: 'center',
                        color: '#1e40af'
                    }
                }
            };

            gerarPDF(docDefinition, 'relatorio_teste.pdf');
        }, setIsGenerating);
    };

    const handlePreviewPDF = async () => {
        await generatePDFWithLoading(async () => {
            const docDefinition = {
                documentInfo: {
                    title: 'Preview de Teste',
                    author: 'Sistema CERCO'
                },
                content: [
                    { text: 'Preview do Documento', style: 'header' },
                    { text: 'Use este recurso para visualizar o PDF antes de baixar.', margin: [0, 20] }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        alignment: 'center'
                    }
                }
            };

            gerarPDF(docDefinition, 'preview.pdf', { open: true });
        }, setIsGenerating);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleGerarPDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={20} />
                {isGenerating ? 'Gerando...' : 'Gerar PDF de Teste'}
            </button>
            
            <button
                onClick={handlePreviewPDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Eye size={20} />
                Visualizar PDF
            </button>
        </div>
    );
};

export default BotaoPDF;