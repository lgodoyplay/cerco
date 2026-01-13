import React, { useState } from 'react';
import { Palette, Upload, Moon, Sun, Check, Layout, Loader2 } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import { supabase } from '../../../lib/supabase';

const AppearanceSettings = () => {
  const { appearance, updateAppearance, logAction } = useSettings();
  const [uploading, setUploading] = useState(false);

  const colors = [
    { id: 'blue', name: 'Azul Federal', class: 'bg-blue-600' },
    { id: 'slate', name: 'Cinza Tático', class: 'bg-slate-600' },
    { id: 'emerald', name: 'Verde Floresta', class: 'bg-emerald-600' },
    { id: 'indigo', name: 'Indigo', class: 'bg-indigo-600' },
    { id: 'amber', name: 'Alerta', class: 'bg-amber-600' },
  ];

  const handleColorChange = (colorId) => {
    updateAppearance({ ...appearance, primaryColor: colorId });
    logAction(`Cor do sistema alterada para: ${colorId}`);
  };

  const handleThemeChange = (theme) => {
    updateAppearance({ ...appearance, theme });
    logAction(`Tema do sistema alterado para: ${theme}`);
  };

  const handleCompactModeChange = (checked) => {
    updateAppearance({ ...appearance, compactMode: checked });
    logAction(`Modo compacto ${checked ? 'ativado' : 'desativado'}`);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `system-logo-${Date.now()}.${fileExt}`;
      const filePath = `system/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateAppearance({ ...appearance, logoUrl: publicUrl });
      logAction('Nova logo do sistema carregada');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erro ao carregar logo. Verifique as permissões.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Palette className="text-federal-500" size={28} />
          Aparência do Sistema
        </h2>
        <p className="text-slate-400 mt-1">Personalize a identidade visual do painel administrativo.</p>
      </div>

      <div className="grid gap-6">
        {/* Theme Selection */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Tema da Interface</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                appearance.theme === 'dark'
                  ? 'border-federal-500 bg-slate-900 ring-1 ring-federal-500/50'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-full bg-slate-950 text-federal-400">
                <Moon size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-white">Modo Escuro</div>
                <div className="text-sm text-slate-400">Padrão para operações noturnas</div>
              </div>
              {appearance.theme === 'dark' && <Check className="ml-auto text-federal-500" />}
            </button>

            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                appearance.theme === 'light'
                  ? 'border-federal-500 bg-slate-100 ring-1 ring-federal-500/50'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-full bg-white text-federal-600 shadow-sm">
                <Sun size={24} />
              </div>
              <div className="text-left">
                <div className={`font-bold ${appearance.theme === 'light' ? 'text-slate-900' : 'text-slate-300'}`}>Modo Claro</div>
                <div className="text-sm text-slate-500">Alto contraste para ambientes claros</div>
              </div>
              {appearance.theme === 'light' && <Check className="ml-auto text-federal-500" />}
            </button>
          </div>
        </section>

        {/* Color Scheme */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cor de Destaque</h3>
          <div className="flex flex-wrap gap-4">
            {colors.map(color => (
              <button
                key={color.id}
                onClick={() => handleColorChange(color.id)}
                className={`group relative w-16 h-16 rounded-xl flex items-center justify-center transition-all ${color.class} ${
                  appearance.primaryColor === color.id ? 'ring-4 ring-white/20 scale-110' : 'hover:scale-105'
                }`}
              >
                {appearance.primaryColor === color.id && <Check className="text-white" size={24} />}
                <span className="absolute -bottom-8 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Interface Options */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Opções de Interface</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-3">
                <Layout className="text-slate-400" />
                <div>
                  <div className="font-medium text-white">Modo Compacto</div>
                  <div className="text-sm text-slate-400">Reduz o espaçamento entre elementos nas tabelas</div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${appearance.compactMode ? 'bg-federal-600' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${appearance.compactMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={appearance.compactMode}
                onChange={(e) => handleCompactModeChange(e.target.checked)}
              />
            </label>
          </div>
        </section>

        {/* Logo Upload */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Logo da Corporação</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative">
              {uploading ? (
                <Loader2 className="animate-spin text-federal-500" />
              ) : appearance.logoUrl ? (
                <img src={appearance.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-500 text-center px-2">Sem Logo</span>
              )}
            </div>
            <div className="flex-1">
              <label className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload size={18} />
                {uploading ? 'Enviando...' : 'Carregar Nova Imagem'}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
              <p className="text-sm text-slate-400 mt-2">Recomendado: PNG transparente, 512x512px. Máx 2MB.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AppearanceSettings;
