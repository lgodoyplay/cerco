import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, FileText, Save, RefreshCw } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import { buildTemplatePreviewHtml, DEFAULT_INVESTIGATION_COVER_TEMPLATE, DEFAULT_INVESTIGATION_NUMBER_CONFIG, DEFAULT_PAGE_HEADER_CONFIG, DEFAULT_TEMPLATE_LAYOUTS, formatInvestigationNumber, generateProfessionalPDF, getMergedInvestigationNumberConfig, getMergedPageHeaderConfig, getMergedTemplateLayout } from '../../../utils/pdfGeneratorPro';
import ReactQuill from 'react-quill-new';
import Quill from 'quill';
import 'react-quill-new/dist/quill.snow.css';
import NotificationBanner from '../../../components/feedback/NotificationBanner';

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
  @page {
    size: A4;
    margin: 0;
  }
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
    min-height: 720px;
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
    min-height: 620px;
    overflow-y: auto;
  }
  .template-quill .ql-editor {
    height: auto;
    min-height: 620px !important;
    overflow-y: auto;
    padding-bottom: 120px !important;
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
  .pdf-preview-stack {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .pdf-preview-page {
    position: relative;
    width: 210mm;
    max-width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.35);
    overflow: hidden;
    box-sizing: border-box;
    background-image: url('/PDF/fundo.png');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
  .pdf-preview-cover-page {
    background-color: #ffffff;
  }
  .pdf-preview-cover-content {
    min-height: 297mm;
    display: flex;
    flex-direction: column;
    padding: 210px 72px 72px;
    color: #0f172a;
    box-sizing: border-box;
  }
  .pdf-preview-cover-content p,
  .pdf-preview-cover-content li {
    font-size: 16px;
    line-height: 1.6;
  }
  .pdf-preview-cover-content .ql-align-center {
    text-align: center;
  }
  .pdf-preview-cover-content .ql-align-right {
    text-align: right;
  }
  .pdf-preview-cover-content .ql-align-justify {
    text-align: justify;
  }
  .pdf-preview-cover-content .ql-align-left {
    text-align: left;
  }
  .pdf-preview-cover-eyebrow {
    margin: 0 0 12px;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: 0.08em;
  }
  .pdf-preview-cover-title-wrap {
    margin-top: 120px;
  }
  .pdf-preview-cover-title {
    margin: 0;
    font-weight: 800;
    font-size: 34px;
    letter-spacing: 0.06em;
  }
  .pdf-preview-cover-ref {
    margin: 28px 0 0;
    font-size: 14px;
    letter-spacing: 0.08em;
  }
  .pdf-preview-cover-footer {
    margin-top: auto;
    padding-bottom: 24px;
    font-size: 14px;
    font-style: italic;
    color: #475569;
  }
  .pdf-preview-body-page {
    padding: 108px 57px 64px;
    color: #111827;
  }
  .pdf-preview-page-header {
    margin-bottom: 32px;
    text-align: center;
  }
  .pdf-preview-page-line {
    width: 100%;
    border-top: 1px solid #0f172a;
    margin-bottom: 8px;
  }
  .pdf-preview-page-header-text {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: 0.02em;
  }
  .pdf-preview-page-content {
    min-height: 828px;
  }
  .pdf-preview-page-content p,
  .pdf-preview-page-content li {
    font-size: 15px;
    line-height: 1.6;
  }
  .pdf-preview-page-content .ql-align-center {
    text-align: center;
  }
  .pdf-preview-page-content .ql-align-right {
    text-align: right;
  }
  .pdf-preview-page-content .ql-align-justify {
    text-align: justify;
  }
  .pdf-preview-page-content .ql-align-left {
    text-align: left;
  }
  .pdf-preview-page-content .divider-blot,
  .pdf-preview-page-content hr {
    position: relative;
    margin: 18px 0;
    border: 0;
    border-top: 1px solid #334155;
  }
  .pdf-preview-page-footer {
    margin-top: 28px;
  }
  .pdf-preview-page-footer-text {
    margin-top: 8px;
    font-size: 11px;
    text-align: center;
    color: #475569;
  }
`;

const getPreviewSampleData = (type) => {
  const baseInvestigation = {
    id: '12345',
    createdAt: new Date().toISOString(),
    status: 'Finalizada',
    priority: 'Alta',
    title: 'Inquerito de Exemplo',
    description: 'Descricao detalhada dos fatos apurados durante a investigacao realizada.',
    involved: 'Joao da Silva',
    delegaciaResponsavel: 'Delegacia Central de Investigacoes',
    nomeInvestigado: 'Joao da Silva',
    cpfInvestigado: '123.456.789-10',
    dataNascimento: '1990-05-10',
    enderecoInvestigado: 'Rua das Flores, 123 - Centro',
    telefoneInvestigado: '(11) 99999-0000',
    nomeDelegado: 'Carlos Almeida',
    investigator: { nome: 'Maria Oliveira' },
    closedAt: new Date().toISOString(),
    proofs: [
      { title: 'Fotografia do Local', description: 'Imagem do local dos fatos', type: 'image', content: '/imagem1.jpg', author: 'Maria Oliveira', createdAt: new Date().toISOString() },
      { title: 'Depoimento da Vitima', description: 'Oitiva registrada no dia 15/06', type: 'file', content: 'Arquivo interno do sistema', author: 'Paulo Mendes', createdAt: new Date().toISOString() },
      { title: 'Relatorio de Inteligencia', description: 'Apontou o vinculo do investigado com os fatos apurados', type: 'text', content: 'Resumo analitico catalogado no sistema', author: 'Ana Souza', createdAt: new Date().toISOString() },
    ]
  };

  if (type === 'arrest') {
    return {
      id: '67890',
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      name: 'Carlos Pereira',
      passport: 'DEN3635',
      reason: 'Prisão em flagrante durante diligencia policial.',
      description: 'Detido conduzido sem resistencia, com apreensao de material probatorio.',
      officer: 'Maria Oliveira',
      articles: 'Art. 157 e Art. 288'
    };
  }

  if (type === 'bo') {
    return {
      id: 'BO-5421',
      created_at: new Date().toISOString(),
      status: 'Registrado',
      localizacao: 'Centro da Cidade - Estado da Euforia',
      comunicante: 'Paulo Henrique',
      descricao: 'Compareceu a unidade policial relatando fato delituoso para providencias cabiveis.'
    };
  }

  return baseInvestigation;
};

const getPreviewSampleUser = () => ({
  nome: 'Maria Oliveira',
  badge: 'PC-EUF-001'
});

const TemplatesSettings = () => {
  const { templates: dbTemplates, updateTemplates } = useSettings();
  const previewWindowRef = useRef(null);
  const previewChannelRef = useRef(null);
  
  const defaultTemplates = {
    investigation: `<p><strong>1. DADOS DO INQUÉRITO</strong></p>
<p>Número do Inquérito: {numero_inquerito}</p>
<p>Data de Instauração: {data_abertura}</p>
<p>Status: {status}</p>
<p>Delegacia Responsável: {delegacia}</p>
<p>Investigador Responsável: {nome_agente}</p>
<p><br></p>
<p><strong>2. IDENTIFICAÇÃO DO INVESTIGADO</strong></p>
<p>Nome Completo: {nome_investigado}</p>
<p>CPF: {cpf_investigado}</p>
<p>Data de Nascimento: {data_nascimento}</p>
<p>Endereço: {endereco}</p>
<p>Telefone: {telefone}</p>
<p><br></p>
<p><strong>3. OBJETO DA INVESTIGAÇÃO</strong></p>
<p>O presente Inquérito Policial foi instaurado pela Polícia Civil do Estado da Euforia com a finalidade de apurar os fatos noticiados, identificar autoria, materialidade e circunstâncias relacionadas à possível prática de infração penal, bem como reunir elementos suficientes para subsidiar as medidas legais cabíveis.</p>
<p><br></p>
<p><strong>4. RELATÓRIO DOS FATOS</strong></p>
<p>{relato_fatos}</p>
<p><br></p>
<p><strong>5. DILIGÊNCIAS REALIZADAS</strong></p>
<p>Foram executadas as seguintes diligências investigativas:</p>
<ul>
<li>Levantamento de informações e antecedentes;</li>
<li>Coleta de depoimentos e oitivas de testemunhas;</li>
<li>Análise documental e material;</li>
<li>Verificação de registros fotográficos e audiovisuais;</li>
<li>Monitoramento e inteligência policial;</li>
<li>Acompanhamento de alvos investigados;</li>
<li>Demais diligências necessárias ao esclarecimento dos fatos.</li>
</ul>
<p><br></p>
<p><strong>6. ELEMENTOS PROBATÓRIOS (PROVAS DO SISTEMA)</strong></p>
<p>Os elementos probatórios foram inseridos de forma dinâmica pelo sistema investigativo, sendo automaticamente catalogados, numerados e organizados para composição do presente relatório.</p>
<p><br></p>
{bloco_provas}
<p><br></p>
<p>As provas acima foram automaticamente organizadas pelo sistema, permanecendo integradas aos autos do inquérito policial para análise e instrução processual.</p>
<p><br></p>
<p><strong>7. ANÁLISE INVESTIGATIVA</strong></p>
<p>Após análise técnica dos elementos probatórios reunidos, constatou-se a existência de indícios consistentes relacionados aos fatos investigados.</p>
<p>As provas apresentadas demonstram coerência entre si, permitindo a reconstrução dos eventos e a identificação da possível participação do investigado nas condutas apuradas.</p>
<p><br></p>
<p><strong>8. CONCLUSÃO</strong></p>
<p>Diante do conjunto probatório produzido, conclui-se que o presente Inquérito Policial atingiu sua finalidade, reunindo elementos suficientes para subsidiar as medidas legais cabíveis.</p>
<p>Os autos seguem devidamente instruídos e são encaminhados à autoridade competente para análise e deliberação.</p>
<p>Estado da Euforia, {data_conclusao}.</p>
<p><br></p>
<p style="text-align: center;">{nome_agente}</p>
<p style="text-align: center;">Investigador de Polícia Civil</p>
<p><br></p>
<p style="text-align: center;">{nome_delegado}</p>
<p style="text-align: center;">Delegado de Polícia Civil</p>
<p><br></p>`,
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
  const [notification, setNotification] = useState(null);
  const tabs = [
    { id: 'investigation', label: 'Relatório de Investigação' },
    { id: 'arrest', label: 'Auto de Prisão' },
    { id: 'bo', label: 'Boletim de Ocorrência' },
  ];

  const layoutConfigs = templates.__layoutConfig || DEFAULT_TEMPLATE_LAYOUTS;
  const pageHeaderConfig = templates.__pageHeaderConfig || DEFAULT_PAGE_HEADER_CONFIG;
  const investigationCoverTemplate = templates.__investigationCoverTemplate || DEFAULT_INVESTIGATION_COVER_TEMPLATE;
  const investigationNumberConfig = templates.__investigationNumberConfig || DEFAULT_INVESTIGATION_NUMBER_CONFIG;
  const activeLayout = getMergedTemplateLayout(activeTab, layoutConfigs?.[activeTab]);
  const mergedPageHeaderConfig = getMergedPageHeaderConfig(pageHeaderConfig);
  const mergedInvestigationNumberConfig = getMergedInvestigationNumberConfig(investigationNumberConfig);
  const previewSampleData = useMemo(() => getPreviewSampleData(activeTab), [activeTab]);
  const previewSampleUser = useMemo(() => getPreviewSampleUser(), []);
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'Documento';

  useEffect(() => {
    setTemplates(prev => {
      const mergedTemplates = { ...defaultTemplates, ...(dbTemplates || {}) };
      const mergedLayouts = { ...DEFAULT_TEMPLATE_LAYOUTS, ...((dbTemplates && dbTemplates.__layoutConfig) || {}) };
      const mergedPageHeader = { ...DEFAULT_PAGE_HEADER_CONFIG, ...((dbTemplates && dbTemplates.__pageHeaderConfig) || {}) };
      const mergedInvestigationCoverTemplate = (dbTemplates && dbTemplates.__investigationCoverTemplate) || DEFAULT_INVESTIGATION_COVER_TEMPLATE;
      const mergedInvestigationNumber = { ...DEFAULT_INVESTIGATION_NUMBER_CONFIG, ...((dbTemplates && dbTemplates.__investigationNumberConfig) || {}) };
      return hasChanges
        ? {
            ...mergedTemplates,
            ...prev,
            __layoutConfig: {
              ...mergedLayouts,
              ...((prev && prev.__layoutConfig) || {})
            },
            __pageHeaderConfig: {
              ...mergedPageHeader,
              ...((prev && prev.__pageHeaderConfig) || {})
            },
            __investigationCoverTemplate: (prev && prev.__investigationCoverTemplate) || mergedInvestigationCoverTemplate,
            __investigationNumberConfig: {
              ...mergedInvestigationNumber,
              ...((prev && prev.__investigationNumberConfig) || {})
            }
          }
        : {
            ...mergedTemplates,
            __layoutConfig: mergedLayouts,
            __pageHeaderConfig: mergedPageHeader,
            __investigationCoverTemplate: mergedInvestigationCoverTemplate,
            __investigationNumberConfig: mergedInvestigationNumber
          };
    });
  }, [dbTemplates, hasChanges]);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return undefined;
    }

    const channel = new BroadcastChannel('templates-preview-channel');
    channel.onmessage = async (event) => {
      if (!event.data || event.data.type !== 'template-preview-download-pdf') return;

      try {
        await generateProfessionalPDF(
          getPreviewSampleData(event.data.tab || activeTab),
          getPreviewSampleUser(),
          templates[event.data.tab || activeTab] || defaultTemplates[event.data.tab || activeTab],
          event.data.tab || activeTab,
          layoutConfigs?.[event.data.tab || activeTab],
          pageHeaderConfig,
          {},
          investigationCoverTemplate,
          investigationNumberConfig
        );
      } catch (error) {
        console.error('Erro ao gerar PDF da previa:', error);
        setNotification({ type: 'error', message: 'Nao foi possivel baixar o PDF da previa.' });
      }
    };
    previewChannelRef.current = channel;

    return () => {
      channel.close();
      previewChannelRef.current = null;
    };
  }, [activeTab, defaultTemplates, layoutConfigs, templates]);

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

  const handleCoverTemplateChange = (value) => {
    setTemplates(prev => ({ ...prev, __investigationCoverTemplate: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...defaultTemplates,
        ...templates,
        __layoutConfig: {
          ...DEFAULT_TEMPLATE_LAYOUTS,
          ...(templates.__layoutConfig || {})
        },
        __pageHeaderConfig: {
          ...DEFAULT_PAGE_HEADER_CONFIG,
          ...(templates.__pageHeaderConfig || {})
        },
        __investigationCoverTemplate: templates.__investigationCoverTemplate || DEFAULT_INVESTIGATION_COVER_TEMPLATE,
        __investigationNumberConfig: {
          ...DEFAULT_INVESTIGATION_NUMBER_CONFIG,
          ...(templates.__investigationNumberConfig || {})
        }
      };
      const success = await updateTemplates(payload);
      if (success) {
        setTemplates(payload);
        setHasChanges(false);
        setNotification({ type: 'success', message: 'Modelo salvo com sucesso.' });
      } else {
        setNotification({ type: 'error', message: 'Nao foi possivel salvar o modelo.' });
      }
    } catch (_error) {
      setNotification({ type: 'error', message: 'Falha ao salvar o modelo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar o modelo padrão? As alterações serão perdidas.')) {
      setTemplates(prev => ({
        ...prev,
        [activeTab]: defaultTemplates[activeTab],
        __layoutConfig: {
          ...(prev.__layoutConfig || {}),
          [activeTab]: DEFAULT_TEMPLATE_LAYOUTS[activeTab] || {}
        },
        __pageHeaderConfig: {
          ...DEFAULT_PAGE_HEADER_CONFIG,
          ...(prev.__pageHeaderConfig || {})
        },
        __investigationCoverTemplate: DEFAULT_INVESTIGATION_COVER_TEMPLATE,
        __investigationNumberConfig: DEFAULT_INVESTIGATION_NUMBER_CONFIG
      }));
      setHasChanges(true);
    }
  };

  const previewHtml = useMemo(() => {
    return buildTemplatePreviewHtml(
      previewSampleData,
      previewSampleUser,
      templates[activeTab] || defaultTemplates[activeTab],
      activeTab,
      layoutConfigs?.[activeTab],
      pageHeaderConfig,
      {},
      investigationCoverTemplate,
      investigationNumberConfig
    );
  }, [activeTab, defaultTemplates, investigationCoverTemplate, investigationNumberConfig, layoutConfigs, pageHeaderConfig, previewSampleData, previewSampleUser, templates]);

  const previewWindowDocument = useMemo(() => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prévia do Documento</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        background: #020617;
        font-family: Arial, Helvetica, sans-serif;
      }
      .preview-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 20px;
        background: rgba(15, 23, 42, 0.94);
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        backdrop-filter: blur(10px);
      }
      .preview-toolbar-title {
        color: #f8fafc;
      }
      .preview-toolbar-title strong {
        display: block;
        font-size: 14px;
      }
      .preview-toolbar-title span {
        display: block;
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .preview-toolbar-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .preview-toolbar-actions button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }
      .preview-toolbar-actions button:hover {
        opacity: 0.92;
      }
      .preview-btn-download {
        background: #2563eb;
        color: #fff;
      }
      .preview-btn-print {
        background: #059669;
        color: #fff;
      }
      .preview-btn-close {
        background: #334155;
        color: #fff;
      }
      .preview-shell {
        min-height: 100vh;
        padding: 24px;
        box-sizing: border-box;
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        .preview-toolbar {
          display: none !important;
        }
        body {
          background: #fff;
        }
        .preview-shell {
          padding: 0;
        }
        .pdf-preview-stack {
          gap: 0;
        }
        .pdf-preview-page {
          width: 210mm;
          max-width: 210mm;
          min-height: 297mm;
          box-shadow: none;
          margin: 0 auto;
          break-after: page;
          page-break-after: always;
        }
        .pdf-preview-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }
      }
      ${quillStyles}
    </style>
  </head>
  <body>
    <div class="preview-toolbar">
      <div class="preview-toolbar-title">
        <strong id="preview-title">${activeTabLabel}</strong>
        <span>Prévia sincronizada em tempo real com o editor</span>
      </div>
      <div class="preview-toolbar-actions">
        <button type="button" class="preview-btn-download" id="preview-download">Baixar PDF</button>
        <button type="button" class="preview-btn-print" id="preview-print">Imprimir</button>
        <button type="button" class="preview-btn-close" id="preview-close">Fechar</button>
      </div>
    </div>
    <div class="preview-shell">
      <div id="preview-root">${previewHtml}</div>
    </div>
    <script>
      const channel = typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('templates-preview-channel')
        : null;
      const titleElement = document.getElementById('preview-title');

      if (channel) {
        channel.onmessage = (event) => {
          if (!event.data || event.data.type !== 'template-preview-update') return;
          document.title = event.data.title || 'Prévia do Documento';
          if (titleElement) {
            titleElement.textContent = event.data.title || 'Documento';
          }
          const root = document.getElementById('preview-root');
          if (root) {
            root.innerHTML = event.data.html || '';
          }
        };
      }

      const downloadButton = document.getElementById('preview-download');
      const printButton = document.getElementById('preview-print');
      const closeButton = document.getElementById('preview-close');

      if (downloadButton) {
        downloadButton.addEventListener('click', () => {
          if (channel) {
            channel.postMessage({ type: 'template-preview-download-pdf', tab: '${activeTab}' });
          }
        });
      }

      if (printButton) {
        printButton.addEventListener('click', () => window.print());
      }

      if (closeButton) {
        closeButton.addEventListener('click', () => window.close());
      }
    </script>
  </body>
</html>`, [activeTab, activeTabLabel, previewHtml]);

  useEffect(() => {
    if (!previewChannelRef.current) return;

    previewChannelRef.current.postMessage({
      type: 'template-preview-update',
      title: `Prévia - ${activeTabLabel}`,
      html: previewHtml
    });
  }, [activeTabLabel, previewHtml]);

  useEffect(() => {
    return () => {
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.close();
      }
    };
  }, []);

  const handlePreview = () => {
    try {
      const previewWindow = window.open('', 'template-preview-window', 'width=1100,height=900,scrollbars=yes,resizable=yes');

      if (!previewWindow) {
        setNotification({ type: 'error', message: 'Nao foi possivel abrir a janela de previa. Verifique se o navegador bloqueou pop-up.' });
        return;
      }

      previewWindowRef.current = previewWindow;
      previewWindow.document.open();
      previewWindow.document.write(previewWindowDocument);
      previewWindow.document.close();
      previewWindow.focus();
    } catch (e) {
      console.error('Erro ao abrir pré-visualização:', e);
      setNotification({ type: 'error', message: 'Erro ao abrir a janela de pre-visualizacao.' });
    }
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-federal-500" size={28} />
          Modelos de Documentos
        </h2>
        <p className="text-slate-400 mt-1">Gerencie os templates padrão utilizados na geração de documentos oficiais.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[720px]">
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
        <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-300">
            Essas abas apenas trocam o tipo de documento. Para alterar o conteudo do PDF, edite o texto no editor logo abaixo.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            O titulo da aba nao faz parte do documento final.
          </p>
        </div>
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-4">
          <p className="text-xs font-bold text-white mb-3">Cabecalho de todas as paginas</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-300">
              Linha 1
              <input
                type="text"
                value={mergedPageHeaderConfig.line1}
                onChange={(e) => {
                  const value = e.target.value;
                  setTemplates(prev => ({
                    ...prev,
                    __pageHeaderConfig: {
                      ...getMergedPageHeaderConfig(prev.__pageHeaderConfig),
                      line1: value
                    }
                  }));
                  setHasChanges(true);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
              />
            </label>
            <label className="text-xs text-slate-300">
              Linha 2
              <input
                type="text"
                value={mergedPageHeaderConfig.line2}
                onChange={(e) => {
                  const value = e.target.value;
                  setTemplates(prev => ({
                    ...prev,
                    __pageHeaderConfig: {
                      ...getMergedPageHeaderConfig(prev.__pageHeaderConfig),
                      line2: value
                    }
                  }));
                  setHasChanges(true);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
              />
            </label>
            <label className="text-xs text-slate-300">
              Linha 3
              <input
                type="text"
                value={mergedPageHeaderConfig.line3}
                onChange={(e) => {
                  const value = e.target.value;
                  setTemplates(prev => ({
                    ...prev,
                    __pageHeaderConfig: {
                      ...getMergedPageHeaderConfig(prev.__pageHeaderConfig),
                      line3: value
                    }
                  }));
                  setHasChanges(true);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Essas 3 linhas aparecem no topo de todas as paginas do PDF e da previa.
          </p>
        </div>

        {activeTab === 'investigation' && (
          <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-4">
            <p className="text-xs font-bold text-white mb-3">Estrutura do numero do inquerito</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <label className="text-xs text-slate-300">
                Segmento (J)
                <input
                  type="text"
                  value={mergedInvestigationNumberConfig.segment}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                    setTemplates(prev => ({
                      ...prev,
                      __investigationNumberConfig: {
                        ...getMergedInvestigationNumberConfig(prev.__investigationNumberConfig),
                        segment: value
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
                />
              </label>
              <label className="text-xs text-slate-300">
                Tribunal (TR)
                <input
                  type="text"
                  value={mergedInvestigationNumberConfig.tribunal}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setTemplates(prev => ({
                      ...prev,
                      __investigationNumberConfig: {
                        ...getMergedInvestigationNumberConfig(prev.__investigationNumberConfig),
                        tribunal: value
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
                />
              </label>
              <label className="text-xs text-slate-300">
                Unidade (OOOO)
                <input
                  type="text"
                  value={mergedInvestigationNumberConfig.unit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setTemplates(prev => ({
                      ...prev,
                      __investigationNumberConfig: {
                        ...getMergedInvestigationNumberConfig(prev.__investigationNumberConfig),
                        unit: value
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-federal-500"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Prévia do número: <span className="font-semibold text-white">{formatInvestigationNumber(previewSampleData, mergedInvestigationNumberConfig)}</span>
            </p>
            <p className="text-xs font-bold text-white mb-3">Editor da capa do inquerito</p>
            <p className="text-[11px] text-slate-400 mb-3">
              A capa agora e totalmente editavel aqui. As linhas automaticas foram removidas e so aparecem linhas que voce inserir no editor.
            </p>
            <div className="relative min-h-[360px] overflow-auto bg-slate-50 rounded-lg border border-slate-800">
              <ReactQuill
                key="investigation-cover-template"
                theme="snow"
                value={investigationCoverTemplate}
                onChange={handleCoverTemplateChange}
                modules={modules}
                formats={formats}
                className="template-quill"
              />
              <div className="sticky bottom-4 ml-auto mr-4 mb-4 w-fit text-xs text-slate-200 bg-slate-900/90 px-2 py-1 rounded pointer-events-none z-10">
                Variáveis da capa: {'{numero_inquerito}'}, {'{data_abertura}'}, {'{status}'}, {'{delegacia}'}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 flex-wrap sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-bold text-white">Editor do Documento</h3>
                <p className="text-xs text-slate-400">
                  Edite aqui o corpo do documento. A capa do relatorio tem um editor proprio acima.
                </p>
              </div>
              <button 
                onClick={handlePreview}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg transition-all"
              >
                <ExternalLink size={18} />
                Abrir Prévia
              </button>
            </div>
            <div className="relative flex-1 min-h-[720px] overflow-auto bg-slate-50">
              <ReactQuill
                key={activeTab}
                theme="snow"
                value={templates[activeTab] || ''}
                onChange={handleTemplateChange}
                modules={modules}
                formats={formats}
                className="template-quill"
              />
              <div className="sticky bottom-4 ml-auto mr-4 mb-4 w-fit text-xs text-slate-200 bg-slate-900/90 px-2 py-1 rounded pointer-events-none z-10">
                Variáveis: {'{numero_inquerito}'}, {'{nome_investigado}'}, {'{bloco_provas}'}, {'{nome_delegado}'}
              </div>
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
              <ExternalLink size={18} />
              Abrir Prévia
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
