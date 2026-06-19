import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, Download } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import { generateProfessionalPDF } from '../../../utils/pdfGeneratorPro';
import ReactQuill from 'react-quill-new';
import Quill from 'quill';
import 'react-quill-new/dist/quill.snow.css';

// Register Divider Blot for Quill
const BlockEmbed = Quill.import('blots/block/embed');

class DividerBlot extends BlockEmbed {
  static create() {
    const node = super.create();
    node.innerHTML = '<hr style="margin: 16px 0; border: none; border-top: 1px solid #ccc;">';
    return node;
  }
}

DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'div';
DividerBlot.className = 'divider-blot';

Quill.register(DividerBlot);

// Custom Quill styles for dark mode
const quillStyles = `
  .ql-toolbar {
    background-color: #1e293b !important;
    border-color: #334155 !important;
  }
  .ql-container {
    background-color: #0f172a !important;
    border-color: #334155 !important;
    color: #e2e8f0 !important;
  }
  .ql-editor {
    color: #e2e8f0 !important;
    font-size: 16px !important;
    min-height: 400px !important;
  }
  .template-quill {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .template-quill .ql-toolbar {
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .template-quill .ql-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .template-quill .ql-editor {
    height: 100%;
    min-height: 100% !important;
    overflow-y: auto;
    padding-bottom: 80px !important;
  }
  .ql-editor strong {
    font-weight: bold !important;
  }
  .ql-editor em {
    font-style: italic !important;
  }
  .ql-editor.ql-blank::before {
    color: #64748b !important;
  }
  .ql-divider::before {
    content: '—';
    font-size: 20px;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .ql-divider:hover {
    background-color: #334155 !important;
  }
  .divider-blot {
    margin: 16px 0;
  }
`;

const TemplatesSettings = () => {
  const { templates: dbTemplates, updateTemplates } = useSettings();
  
  const defaultTemplates = {
    investigation: `<p style="text-align: center;"><strong>ESTADO DA EUFORIA</strong></p>
<p style="text-align: center;"><strong>SECRETARIA DE SEGURANÇA PÚBLICA</strong></p>
<p style="text-align: center;"><strong>CIVIL EUFORIA - DEPARTAMENTO ESTADUAL DE INVESTIGAÇÃO DE NARCÓTICOS</strong></p>
<p style="text-align: center;"><br></p>
<p style="text-align: center;"><strong>RELATÓRIO FINAL DE INQUÉRITO POLICIAL</strong></p>
<p><br></p>
<p><strong>DADOS DO INQUÉRITO</strong></p>
<p>Número do Inquérito: {numero_inquerito}</p>
<p>Data de Instauração: {data_abertura}</p>
<p>Status: {status}</p>
<p>Delegacia Responsável: {delegacia}</p>
<p style="text-align: center;">Investigador Responsável: {nome_agente}</p>
<p><br></p>
<p><strong>IDENTIFICAÇÃO DO INVESTIGADO</strong></p>
<p>Nome Completo: {nome_investigado}</p>
<p>CPF: {cpf_investigado}</p>
<p>Data de Nascimento: {data_nascimento}</p>
<p>Telefone: {telefone}</p>
<p><br></p>
<p><strong>OBJETO DA INVESTIGAÇÃO</strong></p>
<p>O presente Inquérito Policial foi instaurado pela Polícia Civil do Estado da Euforia com a finalidade de apurar os fatos noticiados, identificar a autoria, materialidade e circunstâncias relacionadas à possível prática de infração penal atribuída ao investigado.</p>
<p><br></p>
<p><strong>RELATÓRIO DOS FATOS</strong></p>
<p>{relato_fatos}</p>
<p><br></p>
<p><strong>DILIGÊNCIAS REALIZADAS</strong></p>
<p>Durante a instrução do presente inquérito foram realizadas as seguintes ações investigativas:</p>
<ul>
  <li>Levantamento de informações e antecedentes;</li>
  <li>Coleta de depoimentos e oitivas;</li>
  <li>Análise documental;</li>
  <li>Verificação de registros fotográficos e audiovisuais;</li>
  <li>Levantamento de inteligência policial;</li>
  <li>Demais diligências necessárias para o esclarecimento dos fatos.</li>
</ul>
<p><br></p>
<p><strong>ELEMENTOS PROBATÓRIOS</strong></p>
<p>Foram reunidos e anexados aos autos os seguintes elementos de prova:</p>
<p>{lista_provas}</p>
<p>Todos os materiais foram devidamente analisados e catalogados, passando a integrar o conjunto probatório deste procedimento investigativo.</p>
<p><br></p>
<p><strong>ANÁLISE INVESTIGATIVA</strong></p>
<p>Após análise técnica e confrontação dos elementos obtidos, verificou-se a existência de indícios consistentes relacionados aos fatos investigados, permitindo a formação de convicção acerca da dinâmica dos acontecimentos e da eventual responsabilidade do investigado.</p>
<p>As informações coletadas demonstram coerência entre os depoimentos, documentos e demais evidências presentes nos autos.</p>
<p><br></p>
<p><strong>CONCLUSÃO</strong></p>
<p>Diante dos fatos apurados e das provas produzidas ao longo da investigação, conclui-se que o presente Inquérito Policial atingiu seus objetivos, reunindo elementos suficientes para subsidiar as medidas legais cabíveis.</p>
<p>Assim, os autos são encaminhados à autoridade competente para análise e deliberação quanto às providências subsequentes.</p>
<p style="text-align: center;">Estado da Euforia, {data_conclusao}.</p>
<p><br></p>
<p style="text-align: center;">{nome_agente}</p>
<p style="text-align: center;">Investigador de Polícia Civil</p>
<p><br></p>
<p style="text-align: center;">{nome_delegado}</p>
<p style="text-align: center;">Delegado de Polícia Civil</p>
<p><br></p>
<p style="text-align: center;"><strong>POLÍCIA CIVIL DO ESTADO DA EUFORIA</strong></p>
<p style="text-align: center;">"Servir e Proteger com Justiça e Integridade"</p>`,
    arrest: `<p><strong>AUTO DE PRISÃO</strong></p>
<p><br></p>
<p><strong>DADOS DA OCORRÊNCIA</strong></p>
<p>Data: {data_atual}</p>
<p>Local: {local_prisao}</p>
<p><br></p>
<p><strong>DETIDO</strong></p>
<p>Nome: {nome_detido}</p>
<p>Documento: {doc_detido}</p>
<p><br></p>
<p><strong>MOTIVO DA PRISÃO</strong></p>
<p>O indivíduo foi detido em flagrante delito sob a acusação de...</p>
<p><br></p>
<p><strong>DIREITOS CONSTITUCIONAIS</strong></p>
<p>Foi informado ao detido seus direitos constitucionais...</p>
<p><br></p>
<p>__________________________</p>
<p>Autoridade Policial</p>`,
    bo: `<p><strong>BOLETIM DE OCORRÊNCIA</strong></p>
<p><br></p>
<p>PROTOCOLO: {protocolo}</p>
<p>NATUREZA: {natureza_ocorrencia}</p>
<p><br></p>
<p><strong>COMUNICANTE</strong></p>
<p>Nome: {nome_comunicante}</p>
<p><br></p>
<p><strong>NARRATIVA DOS FATOS</strong></p>
<p>Compareceu a esta unidade policial o comunicante acima qualificado narrando que...</p>
<p><br></p>
<p><strong>PROVIDÊNCIAS</strong></p>
<p>Foi determinado o registro da ocorrência para devida apuração...</p>`
  };

  const [templates, setTemplates] = useState(() => ({ ...defaultTemplates, ...(dbTemplates || {}) }));
  const [activeTab, setActiveTab] = useState('investigation');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTemplates(prev => {
      const mergedTemplates = { ...defaultTemplates, ...(dbTemplates || {}) };
      return hasChanges ? { ...mergedTemplates, ...prev } : mergedTemplates;
    });
  }, [dbTemplates, hasChanges]);

  // Custom module to insert divider
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        [{ 'divider': true }], // Custom divider button
        ['clean']
      ],
      handlers: {
        divider: function() {
          const quill = this.quill;
          const range = quill.getSelection(true);
          if (range) {
            quill.insertText(range.index, '\n');
            quill.insertEmbed(range.index + 1, 'divider', true);
            quill.setSelection(range.index + 2);
          }
        }
      }
    }
  };

  const formats = [
    'header', 'font', 'bold', 'italic', 'underline', 'strike', 'list', 
    'align', 'color', 'background', 'link', 'image', 'divider'
  ];

  const handleTemplateChange = (value) => {
    setTemplates(prev => ({ ...prev, [activeTab]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...defaultTemplates, ...templates };
      const success = await updateTemplates(payload);
      if (success) {
        setTemplates(payload);
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
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
        templates[activeTab] || defaultTemplates[activeTab],
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
      <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-federal-500" size={28} />
          Modelos de Documentos
        </h2>
        <p className="text-slate-400 mt-1">Gerencie os templates padrão utilizados na geração de documentos oficiais.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[720px] max-h-[calc(100vh-10rem)]">
        <div className="flex border-b border-slate-800 bg-slate-900 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-r border-slate-800 flex-1 min-w-[150px] ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-white border-b-2 border-b-federal-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_minmax(220px,320px)]">
          <div className="relative overflow-hidden border-b border-slate-800">
            <div className="h-full bg-slate-50">
              <ReactQuill
                key={activeTab}
                theme="snow"
                value={templates[activeTab] || ''}
                onChange={handleTemplateChange}
                modules={modules}
                formats={formats}
                className="template-quill"
              />
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-slate-600 bg-slate-900/80 px-2 py-1 rounded pointer-events-none z-10">
              Variáveis disponíveis: {'{nome}'}, {'{data}'}, {'{numero}'}
            </div>
          </div>
          <div className="min-h-0 bg-slate-900 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
              <h3 className="text-sm font-bold text-white">Prévia do Documento Salvo</h3>
              <p className="text-xs text-slate-400">A rolagem abaixo permite conferir o documento inteiro antes de salvar ou gerar o PDF.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 custom-scrollbar">
              <div
                className="mx-auto w-full max-w-3xl min-h-full bg-white text-slate-900 rounded-lg shadow-xl p-6"
                dangerouslySetInnerHTML={{ __html: templates[activeTab] || '' }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center gap-3 flex-wrap">
          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} />
            Restaurar Padrão
          </button>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handlePreview}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg transition-all"
            >
              <Download size={18} />
              Pré-visualizar
            </button>
            
            <button 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
                hasChanges && !saving
                  ? 'bg-federal-600 hover:bg-federal-500 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesSettings;
