import React, { useState } from 'react';
import { Share2, Save, MessageSquare, AlertCircle, CheckCircle, Microscope, ShieldAlert, Target } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const WebhookSettings = () => {
  const { discordConfig, updateDiscordConfig } = useSettings();
  
  const [config, setConfig] = useState(() => ({
    formsWebhook: discordConfig?.formsWebhook || discordConfig?.webhookUrl || '',
    arrestsWebhook: discordConfig?.arrestsWebhook || '',
    wantedWebhook: discordConfig?.wantedWebhook || '',
    bulletinsWebhook: discordConfig?.bulletinsWebhook || '',
    reportsWebhook: discordConfig?.reportsWebhook || '',
    forensicsWebhook: discordConfig?.forensicsWebhook || ''
  }));

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Maintain backward compatibility for formsWebhook -> webhookUrl
    const newConfig = {
      ...discordConfig,
      ...config,
      webhookUrl: config.formsWebhook // Update legacy field
    };
    
    await updateDiscordConfig(newConfig);
    setLoading(false);
    alert('Configurações de Webhook salvas com sucesso!');
  };

  const handleTestWebhook = async (url, typeName) => {
    if (!url) {
      alert(`Por favor, configure a URL para ${typeName} primeiro.`);
      return;
    }

    try {
      const embed = {
        title: "🔔 Teste de Notificação",
        description: `Este é um teste de verificação para o canal de **${typeName}**.`,
        color: 0x3b82f6,
        fields: [
          { name: "Status", value: "Conectado", inline: true },
          { name: "Origem", value: "Painel Admin", inline: true }
        ],
        footer: { text: "Sistema CIVIL EUFORIA - Teste de Integração" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        alert(`Teste enviado com sucesso para ${typeName}!`);
      } else {
        alert(`Erro ao enviar teste: ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão. Verifique o console.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="text-federal-500" />
          Integrações & Webhooks
        </h2>
        <p className="text-slate-400 mt-1">Configure os canais do Discord para receber notificações automáticas.</p>
      </div>

      <div className="grid gap-6">
        {/* Porte de Armas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-red-500">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Porte de Armas</h3>
              <p className="text-sm text-slate-400">Notificações de status de solicitações de porte.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="weaponsWebhook"
              value={config.weaponsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.weaponsWebhook, 'Porte de Armas')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Formulários */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-federal-500">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Formulários de Candidatura</h3>
              <p className="text-sm text-slate-400">Notificações de novas inscrições recebidas pelo site.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="formsWebhook"
              value={config.formsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.formsWebhook, 'Formulários')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Denúncias */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-yellow-500">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Denúncias Anônimas</h3>
              <p className="text-sm text-slate-400">Notificações de novas denúncias recebidas.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="reportsWebhook"
              value={config.reportsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.reportsWebhook, 'Denúncias')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Perícias */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-500">
              <Microscope size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Solicitações de Perícia</h3>
              <p className="text-sm text-slate-400">Notificações de novas solicitações de perícia.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="forensicsWebhook"
              value={config.forensicsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.forensicsWebhook, 'Perícias')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Prisões */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-orange-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registro de Prisões</h3>
              <p className="text-sm text-slate-400">Notificações automáticas ao registrar uma nova prisão.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="arrestsWebhook"
              value={config.arrestsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.arrestsWebhook, 'Prisões')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Procurados */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-red-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registro de Procurados</h3>
              <p className="text-sm text-slate-400">Notificações automáticas ao adicionar um novo procurado.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="wantedWebhook"
              value={config.wantedWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.wantedWebhook, 'Procurados')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        {/* Boletins */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-purple-500">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Boletins de Ocorrência</h3>
              <p className="text-sm text-slate-400">Notificações automáticas ao registrar um novo B.O.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              name="bulletinsWebhook"
              value={config.bulletinsWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
            <button
              onClick={() => handleTestWebhook(config.bulletinsWebhook, 'Boletins')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Testar
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-800">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl shadow-lg shadow-federal-900/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
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
