import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const TemplatesSettings = () => {
  const { templates: dbTemplates, updateTemplates, logAction } = useSettings();
  
  const defaultTemplates = {
    investigation: `RELATÓRIO DE INVESTIGAÇÃO
    
DADOS DO INQUÉRITO
Número: {numero_inquerito}
Data de Abertura: {data_abertura}
Status: {status}

INVESTIGADO
Nome: {nome_investigado}
CPF: {cpf_investigado}

RELATÓRIO
O presente relatório tem por objetivo descrever os fatos apurados durante a investigação...

CONCLUSÃO
Diante do exposto, conclui-se que...

__________________________
Assinatura do Agente`,
    arrest: `AUTO DE PRISÃO
    
DADOS DA OCORRÊNCIA
Data: {data_atual}
Local: {local_prisao}

DETIDO
Nome: {nome_detido}
Documento: {doc_detido}

MOTIVO DA PRISÃO
O indivíduo foi detido em flagrante delito sob a acusação de...

DIREITOS CONSTITUCIONAIS
Foi informado ao detido seus direitos constitucionais...

__________________________
Autoridade Policial`,
    bo: `BOLETIM DE OCORRÊNCIA
    
PROTOCOLO: {protocolo}
NATUREZA: {natureza_ocorrencia}

COMUNICANTE
Nome: {nome_comunicante}

NARRATIVA DOS FATOS
Compareceu a esta unidade policial o comunicante acima qualificado narrando que...

PROVIDÊNCIAS
Foi determinado o registro da ocorrência para devida apuração...`
  };

  const [templates, setTemplates] = useState(defaultTemplates);
  const [activeTab, setActiveTab] = useState('investigation');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load from DB when available
  useEffect(() => {
    if (dbTemplates) {
      setTemplates(dbTemplates);
    }
  }, [dbTemplates]);

  const handleTemplateChange = (value) => {
    setTemplates(prev => ({ ...prev, [activeTab]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await updateTemplates(templates);
    if (success) {
      logAction(`Modelo de documento atualizado: ${activeTab}`);
      setHasChanges(false);
    }
    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar o modelo padrão? As alterações serão perdidas.')) {
      setTemplates(prev => ({ ...prev, [activeTab]: defaultTemplates[activeTab] }));
      setHasChanges(true);
    }
  };

  const tabs = [
    { id: 'investigation', label: 'Relatório de Investigação' },
    { id: 'arrest', label: 'Auto de Prisão' },
    { id: 'bo', label: 'Boletim de Ocorrência' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-federal-500" size={28} />
          Modelos de Documentos
        </h2>
        <p className="text-slate-400 mt-1">Gerencie os templates padrão utilizados na geração de documentos oficiais.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
        <div className="flex border-b border-slate-800 bg-slate-900">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-r border-slate-800 ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-white border-b-2 border-b-federal-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-0 relative">
          <textarea
            value={templates[activeTab]}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full h-full bg-slate-950 text-slate-300 p-6 font-mono text-sm resize-none focus:outline-none focus:ring-0"
            spellCheck={false}
          />
          <div className="absolute bottom-4 right-4 text-xs text-slate-600 bg-slate-900/80 px-2 py-1 rounded pointer-events-none">
            Variáveis disponíveis: {'{nome}'}, {'{data}'}, {'{numero}'}
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center">
          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} />
            Restaurar Padrão
          </button>
          
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
              hasChanges 
                ? 'bg-federal-600 hover:bg-federal-500 text-white shadow-lg' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesSettings;
