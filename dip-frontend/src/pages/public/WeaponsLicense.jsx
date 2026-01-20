import React, { useState } from 'react';
import { Shield, FileText, Upload, CheckCircle, AlertTriangle, ChevronRight, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const WeaponsLicense = () => {
  const [step, setStep] = useState(1); // 1: Rules, 2: Form, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    passportId: '',
    phone: '',
    reason: '',
    files: []
  });

  const rules = [
    "Ter ficha limpa na cidade (sem passagens criminais recentes).",
    "Possuir residência fixa comprovada.",
    "Passar no teste psicotécnico (realizado no hospital).",
    "Passar no teste de tiro (realizado no estande de tiros).",
    "O porte é para defesa pessoal, não para caça ou atividades ilícitas.",
    "O uso indevido da arma resultará na revogação imediata do porte e prisão."
  ];

  const steps = [
    "Preencher este formulário de solicitação.",
    "Aguardar a análise inicial da Polícia Federal (acompanhe pelo Discord/Email).",
    "Se aprovado na triagem, comparecer à delegacia para entrevista.",
    "Realizar o pagamento da taxa de emissão.",
    "Receber a carteira de porte de armas (validade de 30 dias)."
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files)]
      }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.passportId || !formData.phone || !formData.reason) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate ID client-side to avoid SELECT permission issues for public users
      const licenseId = crypto.randomUUID();

      // 1. Create License Request
      const { error: licenseError } = await supabase
        .from('weapon_licenses')
        .insert({
          id: licenseId,
          full_name: formData.fullName,
          passport_id: formData.passportId,
          phone: formData.phone,
          reason: formData.reason,
          status: 'pending'
        });

      if (licenseError) throw licenseError;

      // 2. Upload Files if any
      if (formData.files.length > 0) {
        for (const file of formData.files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${licenseId}/${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('license-docs')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('license-docs')
            .getPublicUrl(fileName);

          await supabase
            .from('license_attachments')
            .insert({
              license_id: licenseId,
              url: publicUrl,
              file_name: file.name,
              file_type: file.type
            });
        }
      }

      setStep(3); // Success
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Erro ao enviar solicitação. Tente novamente ou contate um oficial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-federal-900/50 rounded-2xl border border-federal-800 mb-4">
            <Shield className="w-10 h-10 text-federal-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Porte de Armas
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Sistema oficial de solicitação e regulamentação de porte de armas para cidadãos.
            Leia as regras atentamente antes de prosseguir.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Rules Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" />
                  Requisitos e Regras
                </h2>
                <ul className="space-y-4">
                  {rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="text-federal-400" />
                  Passo a Passo
                </h2>
                <div className="space-y-6">
                  {steps.map((stepText, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-federal-900 border border-federal-700 text-federal-400 flex items-center justify-center text-sm font-bold shrink-0">
                          {idx + 1}
                        </div>
                        {idx !== steps.length - 1 && (
                          <div className="w-px h-full bg-slate-800 my-2" />
                        )}
                      </div>
                      <p className="text-slate-300 text-sm pt-1.5 leading-relaxed">
                        {stepText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={() => setStep(2)}
                className="group relative inline-flex items-center justify-center px-8 py-3 bg-federal-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:bg-federal-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative flex items-center gap-2">
                  Li e concordo, quero solicitar
                  <ChevronRight size={18} />
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Formulário de Solicitação</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passaporte (ID)</label>
                  <input
                    type="text"
                    name="passportId"
                    value={formData.passportId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all"
                    placeholder="Ex: 12345"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Celular de Contato</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all"
                  placeholder="Ex: 555-0123"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Motivo da Solicitação</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all resize-none"
                  placeholder="Explique por que você precisa do porte de armas..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Documentos Comprobatórios</label>
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-federal-500/50 transition-colors bg-slate-950/50">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <span className="text-sm text-slate-400">
                      Clique para fazer upload de imagens/documentos
                    </span>
                    <span className="text-xs text-slate-600">
                      (Comprovante de residência, antecedentes, etc.)
                    </span>
                  </label>
                </div>
                
                {formData.files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {formData.files.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg text-sm">
                        <span className="text-slate-300 truncate max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitação
                      <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h2>
            <p className="text-slate-400 mb-8">
              Sua solicitação foi registrada com sucesso. A Polícia Federal analisará seus dados e entrará em contato em breve.
            </p>
            <button
              onClick={() => {
                setStep(1);
                setFormData({ fullName: '', passportId: '', phone: '', reason: '', files: [] });
              }}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Missing X import fix
import { X } from 'lucide-react';

export default WeaponsLicense;
