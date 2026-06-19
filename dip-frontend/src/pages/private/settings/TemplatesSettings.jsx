import React, { useState } from 'react';
import { FileText, Save, RefreshCw, Download } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import { generateProfessionalPDF } from '../../../utils/pdfGeneratorPro';

const TemplatesSettings = () => {
  const { templates: dbTemplates, updateTemplates, logAction } = useSettings();
  
  const defaultTemplates = {
    investigation: `[CENTER]POLÍCIA CIVIL DO ESTADO DA EUFORIA[/CENTER]
[CENTER]DEPARTAMENTO DE INVESTIGAÇÕES CRIMINAIS[/CENTER]
[CENTER]RELATÓRIO FINAL DE INQUÉRITO POLICIAL[/CENTER]

DADOS DO INQUÉRITO
Número do Inquérito: {numero_inquerito}
Data de Instauração: {data_abertura}
Status: {status}
Delegacia Responsável: {delegacia}
[CENTER]Investigador Responsável: {nome_agente}[/CENTER]

IDENTIFICAÇÃO DO INVESTIGADO

Nome Completo: {nome_investigado}
CPF: {cpf_investigado}
Data de Nascimento: {data_nascimento}
Telefone: {telefone}

OBJETO DA INVESTIGAÇÃO

O presente Inquérito Policial foi instaurado pela Polícia Civil do Estado da Euforia com a finalidade de apurar os fatos noticiados, identificar a autoria, materialidade e circunstâncias relacionadas à possível prática de infração penal atribuída ao investigado.

RELATÓRIO DOS FATOS

{relato_fatos}

DILIGÊNCIAS REALIZADAS

Durante a instrução do presente inquérito foram realizadas as seguintes ações investigativas:
- Levantamento de informações e antecedentes;
- Coleta de depoimentos e oitivas;
- Análise documental;
- Verificação de registros fotográficos e audiovisuais;
- Levantamento de inteligência policial;
- Demais diligências necessárias para o esclarecimento dos fatos.

ELEMENTOS PROBATÓRIOS

Foram reunidos e anexados aos autos os seguintes elementos de prova:
{lista_provas}

Todos os materiais foram devidamente analisados e catalogados, passando a integrar o conjunto probatório deste procedimento investigativo.

ANÁLISE INVESTIGATIVA

Após análise técnica e confrontação dos elementos obtidos, verificou-se a existência de indícios consistentes relacionados aos fatos investigados, permitindo a formação de convicção acerca da dinâmica dos acontecimentos e da eventual responsabilidade do investigado.

As informações coletadas demonstram coerência entre os depoimentos, documentos e demais evidências presentes nos autos.

CONCLUSÃO

Diante dos fatos apurados e das provas produzidas ao longo da investigação, conclui-se que o presente Inquérito Policial atingiu seus objetivos, reunindo elementos suficientes para subsidiar as medidas legais cabíveis.

Assim, os autos são encaminhados à autoridade competente para análise e deliberação quanto às providências subsequentes.

[CENTER]Estado da Euforia, {data_conclusao}.[/CENTER]


[CENTER]{nome_agente}[/CENTER]
[CENTER]Investigador de Polícia Civil[/CENTER]

[CENTER]{nome_delegado}[/CENTER]
[CENTER]Delegado de Polícia Civil[/CENTER]

[CENTER]POLÍCIA CIVIL DO ESTADO DA EUFORIA[/CENTER]
[CENTER]"Servir e Proteger com Justiça e Integridade"[/CENTER]`,
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

  const [templates, setTemplates] = useState(dbTemplates || defaultTemplates);
  const [activeTab, setActiveTab] = useState('investigation');
  const [hasChanges, setHasChanges] = useState(false);

  const handleTemplateChange = (value) => {
    setTemplates(prev => ({ ...prev, [activeTab]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updateTemplates(templates);
    if (success) {
      logAction(`Modelo de documento atualizado: ${activeTab}`);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar o modelo padrão? As alterações serão perdidas.')) {
      setTemplates(prev => ({ ...prev, [activeTab]: defaultTemplates[activeTab] }));
      setHasChanges(true);
    }
  };

  const handlePreview = async () => {
    try {
      // Dados de exemplo para pré-visualização
      const dummyData = {
        id: '12345',
        createdAt: new Date().toISOString(),
        status: 'Concluído',
        priority: 'Alta',
        title: 'Inquérito de Exemplo',
        description: 'Descrição detalhada dos fatos apurados durante a investigação realizada.',
        involved: 'João da Silva',
        investigator: { nome: 'Maria Oliveira' },
        closedAt: new Date().toISOString(),
        proofs: [
          { title: 'Fotografia do Local', description: 'Imagem do local dos fatos', type: 'Imagem', createdAt: new Date().toISOString() },
          { title: 'Depoimento da Vitima', description: 'Oitiva registrada no dia 15/06', type: 'Documento', createdAt: new Date().toISOString() },
        ]
      };

      const dummyUser = {
        nome: 'Maria Oliveira',
        badge: 'PC-EUF-001'
      };

      await generateProfessionalPDF(
        dummyData,
        dummyUser,
        templates[activeTab],
        activeTab
      );
    } catch (e) {
      console.error('Erro ao gerar pré-visualização:', e);
      alert('Erro ao gerar pré-visualização.');
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

        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center gap-3">
          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} />
            Restaurar Padrão
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handlePreview}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg transition-all"
            >
              <Download size={18} />
              Pré-visualizar
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
    </div>
  );
};

export default TemplatesSettings;
