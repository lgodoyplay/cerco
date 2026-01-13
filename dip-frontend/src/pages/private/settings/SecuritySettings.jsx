import React, { useState, useEffect } from 'react';
import { Shield, Lock, Clock, Key, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const SecuritySettings = () => {
  const { security, updateSecurity } = useSettings();

  const handleChange = (key, value) => {
    updateSecurity({ ...security, [key]: value });
  };

  if (!security) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-federal-500" size={28} />
          Segurança do Sistema
        </h2>
        <p className="text-slate-400 mt-1">Defina as políticas de acesso e segurança da informação.</p>
      </div>

      <div className="grid gap-6">
        {/* Password Policy */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Key className="text-federal-400" size={20} />
            Políticas de Senha
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
              <div>
                <div className="font-medium text-white">Forçar Troca de Senha</div>
                <div className="text-sm text-slate-400">Usuários devem alterar a senha no primeiro acesso</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={security.forcePasswordChange}
                  onChange={(e) => handleChange('forcePasswordChange', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-federal-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <label className="block text-sm font-medium text-slate-400 mb-2">Nível Mínimo de Senha</label>
                <select 
                  value={security.minPasswordStrength}
                  onChange={(e) => handleChange('minPasswordStrength', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
                >
                  <option value="medium">Médio (8 chars, letras + números)</option>
                  <option value="strong">Forte (10 chars, letras + núm + especiais)</option>
                  <option value="very_strong">Muito Forte (12+ chars, complexa)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl">
                <label className="block text-sm font-medium text-slate-400 mb-2">Tentativas de Login</label>
                <select 
                  value={security.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
                >
                  <option value="3">3 tentativas</option>
                  <option value="5">5 tentativas</option>
                  <option value="10">10 tentativas</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Session Security */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="text-federal-400" size={20} />
            Sessão e Acesso
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <label className="block text-sm font-medium text-slate-400 mb-2">Tempo Limite de Sessão (Inatividade)</label>
              <select 
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="120">2 horas</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
              <div>
                <div className="font-medium text-white">Autenticação de Dois Fatores (2FA)</div>
                <div className="text-sm text-slate-400">Exigir token 2FA para todos os administradores</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={security.mfaEnabled}
                  onChange={(e) => handleChange('mfaEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-federal-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Audit Log Warning */}
        <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-500">Atenção</h4>
            <p className="text-sm text-amber-200/80 mt-1">
              Todas as alterações nas políticas de segurança são registradas nos logs do sistema e notificadas aos super-administradores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
