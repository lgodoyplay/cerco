import React, { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import { useSettings } from '../../hooks/useSettings';

const GeneratePdfButton = ({ investigation, user, className }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { templates } = useSettings();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Pequeno delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Garantir que user tenha dados mínimos se vier vazio
            const currentUser = user || {
                nome: 'Usuário do Sistema',
                badge: 'N/A'
            };

            await generateProfessionalPDF(investigation, currentUser, templates?.investigation);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
                flex items-center gap-2 px-4 py-2 
                bg-slate-800 hover:bg-slate-700 
                text-white font-medium rounded-lg 
                transition-all shadow-sm border border-slate-600
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className || ''}
            `}
            title="Gerar Inquérito Policial Oficial (PDF)"
        >
            {isGenerating ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Gerando Documento...</span>
                </>
            ) : (
                <>
                    <FileText size={18} />
                    <span>Gerar Inquérito PDF</span>
                </>
            )}
        </button>
    );
};

export default GeneratePdfButton;
