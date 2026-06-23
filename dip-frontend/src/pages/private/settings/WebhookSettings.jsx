import React, { useEffect, useState } from 'react';
import { Share2, Save, MessageSquare, AlertCircle, CheckCircle, Microscope, ShieldAlert, Target, Stethoscope, FileSearch, BadgeX, Scale } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const WEBHOOK_GROUPS = [
  {
    title: 'Canais Principais',
    description: 'Integrações mais usadas no fluxo diário do sistema.',
    items: [
      {
        key: 'weaponsWebhook',
        title: 'Porte de Armas',
        description: 'Notificações de status de solicitações de porte.',
        icon: Target,
        accent: 'text-red-400 border-red-500/20 bg-red-500/5',
        buttonClass: 'bg-red-600 hover:bg-red-500 text-white'
      },
      {
        key: 'formsWebhook',
        title: 'Formulários de Candidatura',
        description: 'Notificações de novas inscrições recebidas pelo site.',
        icon: MessageSquare,
        accent: 'text-federal-400 border-federal-500/20 bg-federal-500/5',
        buttonClass: 'bg-federal-600 hover:bg-federal-500 text-white'
      },
      {
        key: 'reportsWebhook',
        title: 'Denúncias Anônimas',
        description: 'Notificações de novas denúncias recebidas.',
        icon: ShieldAlert,
        accent: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-500 text-slate-950'
      }
    ]
  },
  {
    title: 'Módulos Administrativos',
    description: 'Integrações com provas, documentos e processos internos.',
    items: [
      {
        key: 'corregedoriaWebhook',
        title: 'Corregedoria',
        description: 'Denúncias com links, vídeos, imagens e arquivos anexados.',
        icon: ShieldAlert,
        accent: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
        buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white'
      },
      {
        key: 'exonerationsWebhook',
        title: 'Exoneração',
        description: 'Catálogo de exonerações com provas em imagem e links.',
        icon: BadgeX,
        accent: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
        buttonClass: 'bg-pink-600 hover:bg-pink-500 text-white'
      },
      {
        key: 'laudosWebhook',
        title: 'Laudos Médicos',
        description: 'Envio de laudos com documentos e anexos médicos.',
        icon: Stethoscope,
        accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
      },
      {
        key: 'searchSeizureWebhook',
        title: 'Busca e Apreensão',
        description: 'Operações com documentos, fotos do alvo, casas e veículos.',
        icon: FileSearch,
        accent: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white'
      },
      {
        key: 'protectiveMeasuresWebhook',
        title: 'Medida Protetiva',
        description: 'Notificações com validade e documento oficial anexado.',
        icon: Scale,
        accent: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
        buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white'
      }
    ]
  },
  {
    title: 'Registros Operacionais',
    description: 'Integrações para monitoramento de registros do sistema.',
    items: [
      {
        key: 'forensicsWebhook',
        title: 'Solicitações de Perícia',
        description: 'Notificações de novas solicitações de perícia.',
        icon: Microscope,
        accent: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
        buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white'
      },
      {
        key: 'arrestsWebhook',
        title: 'Registro de Prisões',
        description: 'Notificações automáticas ao registrar uma nova prisão.',
        icon: AlertCircle,
        accent: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950'
      },
      {
        key: 'wantedWebhook',
        title: 'Registro de Procurados',
        description: 'Notificações automáticas ao adicionar um novo procurado.',
        icon: AlertCircle,
        accent: 'text-red-400 border-red-500/20 bg-red-500/5',
        buttonClass: 'bg-red-600 hover:bg-red-500 text-white'
      },
      {
        key: 'bulletinsWebhook',
        title: 'Boletins de Ocorrência',
        description: 'Notificações automáticas ao registrar um novo B.O.',
        icon: CheckCircle,
        accent: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
        buttonClass: 'bg-violet-600 hover:bg-violet-500 text-white'
      }
    ]
  }
];

const WebhookSettings = () => {
  const { discordConfig, updateDiscordConfig } = useSettings();

  const [config, setConfig] = useState(() => ({
    weaponsWebhook: discordConfig?.weaponsWebhook || '',
    formsWebhook: discordConfig?.formsWebhook || discordConfig?.webhookUrl || '',
    arrestsWebhook: discordConfig?.arrestsWebhook || '',
    wantedWebhook: discordConfig?.wantedWebhook || '',
    bulletinsWebhook: discordConfig?.bulletinsWebhook || '',
    reportsWebhook: discordConfig?.reportsWebhook || '',
    forensicsWebhook: discordConfig?.forensicsWebhook || '',
    corregedoriaWebhook: discordConfig?.corregedoriaWebhook || '',
    exonerationsWebhook: discordConfig?.exonerationsWebhook || '',
    laudosWebhook: discordConfig?.laudosWebhook || '',
    searchSeizureWebhook: discordConfig?.searchSeizureWebhook || '',
    protectiveMeasuresWebhook: discordConfig?.protectiveMeasuresWebhook || ''
  }));

  const [loading, setLoading] = useState(false);
  const [testingKey, setTestingKey] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    setConfig({
      weaponsWebhook: discordConfig?.weaponsWebhook || '',
      formsWebhook: discordConfig?.formsWebhook || discordConfig?.webhookUrl || '',
      arrestsWebhook: discordConfig?.arrestsWebhook || '',
      wantedWebhook: discordConfig?.wantedWebhook || '',
      bulletinsWebhook: discordConfig?.bulletinsWebhook || '',
      reportsWebhook: discordConfig?.reportsWebhook || '',
      forensicsWebhook: discordConfig?.forensicsWebhook || '',
      corregedoriaWebhook: discordConfig?.corregedoriaWebhook || '',
      exonerationsWebhook: discordConfig?.exonerationsWebhook || '',
      laudosWebhook: discordConfig?.laudosWebhook || '',
      searchSeizureWebhook: discordConfig?.searchSeizureWebhook || '',
      protectiveMeasuresWebhook: discordConfig?.protectiveMeasuresWebhook || ''
    });
  }, [discordConfig]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    if (feedback.message) {
      setFeedback({ type: '', message: '' });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setFeedback({ type: '', message: '' });

      const newConfig = {
        ...discordConfig,
        ...config,
        webhookUrl: config.formsWebhook
      };

      await updateDiscordConfig(newConfig);
      setFeedback({ type: 'success', message: 'Configurações de webhook salvas com sucesso.' });
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Nao foi possivel salvar as configurações agora.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (key, url, typeName) => {
    if (!url) {
      setFeedback({ type: 'error', message: `Configure a URL de ${typeName} antes de testar.` });
      return;
    }

    try {
      setTestingKey(key);
      setFeedback({ type: '', message: '' });
      const embed = {
        title: 'Teste de Notificação',
        description: `Este é um teste de verificação para o canal de **${typeName}**.`,
        color: 0x3b82f6,
        fields: [
          { name: 'Status', value: 'Conectado', inline: true },
          { name: 'Origem', value: 'Painel Admin', inline: true }
        ],
        footer: { text: 'Sistema CIVIL EUFORIA - Teste de Integracao' },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: `Teste enviado com sucesso para ${typeName}.` });
      } else {
        setFeedback({ type: 'error', message: `Erro ao enviar teste para ${typeName}: ${response.status}.` });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: `Erro de conexão ao testar ${typeName}.` });
    } finally {
      setTestingKey('');
    }
  };

  const renderWebhookCard = ({ key, title, description, icon: Icon, accent, buttonClass }) => (
    <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/10">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent}`}>
          <Icon size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          URL do Webhook
        </label>
        <input
          type="text"
          name={key}
          value={config[key]}
          onChange={handleChange}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:border-federal-500"
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Use um canal exclusivo para manter cada fluxo organizado.
        </p>
        <button
          type="button"
          onClick={() => handleTestWebhook(key, config[key], title)}
          disabled={testingKey === key}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
        >
          <MessageSquare size={16} />
          {testingKey === key ? 'Testando...' : 'Testar Webhook'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 lg:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-federal-500/20 bg-federal-500/10 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em]">
              <Share2 size={14} />
              Painel de Integrações
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Share2 className="text-federal-500" />
                Integrações & Webhooks
              </h2>
              <p className="text-slate-400 mt-1 max-w-3xl">
                Configure os canais do Discord para receber notificações automáticas do sistema em uma tela mais organizada e padronizada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[420px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Canais</p>
              <p className="text-2xl font-bold text-white mt-2">12</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Principais</p>
              <p className="text-2xl font-bold text-white mt-2">3</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Admin</p>
              <p className="text-2xl font-bold text-white mt-2">5</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Operacional</p>
              <p className="text-2xl font-bold text-white mt-2">4</p>
            </div>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          feedback.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/20 bg-red-500/10 text-red-300'
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="space-y-6">
        {WEBHOOK_GROUPS.map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{group.title}</h3>
                <p className="text-sm text-slate-400">{group.description}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map(renderWebhookCard)}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Salvar Configurações</p>
            <p className="text-sm text-slate-400">
              Depois de ajustar as URLs, salve para aplicar em todos os módulos.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-federal-600 hover:bg-federal-500 px-8 py-3 text-white font-bold shadow-lg shadow-federal-900/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebhookSettings;
