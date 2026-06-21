import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Send,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const initialFormState = {
  fullName: '',
  passportId: '',
  phone: '',
  reason: '',
  files: []
};

const rules = [
  'Ter ficha limpa na cidade (sem passagens criminais recentes).',
  'Possuir residencia fixa comprovada.',
  'Passar no teste psicotecnico (realizado no hospital).',
  'Passar no teste de tiro (realizado no estande de tiros).',
  'O porte e para defesa pessoal, nao para caca ou atividades ilicitas.',
  'O uso indevido da arma resultara na revogacao imediata do porte e prisao.'
];

const steps = [
  'Preencher este formulario de solicitacao.',
  'Aguardar a analise inicial da CIVIL EUFORIA.',
  'Entrar na etapa de processo para entregar laudo medico, laudo juridico e comprovante de pagamento.',
  'Aguardar a liberacao final do porte pela equipe responsavel.',
  'Receber o porte com data de emissao e data de renovacao.'
];

const WeaponLicenseRequestFlow = ({
  initialData = {},
  onCancel,
  onSubmitted
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLicenseId, setCreatedLicenseId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const mergedInitialData = useMemo(() => ({
    fullName: initialData.fullName || user?.full_name || user?.name || '',
    passportId: initialData.passportId || user?.passport_id || '',
    phone: initialData.phone || user?.phone || '',
    reason: initialData.reason || '',
    files: []
  }), [initialData, user]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...mergedInitialData,
      files: prev.files || []
    }));
  }, [mergedInitialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...Array.from(e.target.files)]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, fileIndex) => fileIndex !== index)
    }));
  };

  const resetFlow = () => {
    setStep(1);
    setLoading(false);
    setError('');
    setCreatedLicenseId(null);
    setFormData({
      ...mergedInitialData,
      files: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.passportId || !formData.phone || !formData.reason) {
      setError('Preencha todos os campos obrigatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const licenseId = crypto.randomUUID();

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

      if (formData.files.length > 0) {
        for (const file of formData.files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${licenseId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('license-docs')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('license-docs')
            .getPublicUrl(fileName);

          const { error: attachmentError } = await supabase
            .from('license_attachments')
            .insert({
              license_id: licenseId,
              url: publicUrlData.publicUrl,
              file_name: `[request_document] ${file.name}`,
              file_type: file.type
            });

          if (attachmentError) throw attachmentError;
        }
      }

      setCreatedLicenseId(licenseId);
      setStep(3);

      if (onSubmitted) {
        onSubmitted(licenseId);
      }
    } catch (submitError) {
      console.error('Erro ao enviar solicitacao de porte:', submitError);
      setError('Erro ao enviar solicitacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-federal-500" />
            Solicitacao de Porte de Armas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Todo o processo inicial acontece dentro desta aba.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFlow();
            if (onCancel) onCancel();
          }}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          Fechar
        </button>
      </div>

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" />
                  Regras do Porte
                </h3>
                <ul className="space-y-3">
                  {rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <FileText className="text-federal-400" />
                  Etapas
                </h3>
                <div className="space-y-4">
                  {steps.map((stepText, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-federal-900 border border-federal-700 text-federal-300 flex items-center justify-center text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-300 pt-1">{stepText}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-colors"
              >
                Continuar Solicitação
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nome</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    placeholder="Nome do solicitante"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passaporte</label>
                  <input
                    type="text"
                    name="passportId"
                    value={formData.passportId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    placeholder="Ex: DEN3635"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telefone do jogo</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                  placeholder="Numero para contato"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Motivo da solicitacao</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                  placeholder="Explique por que precisa do porte de armas"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Documentos comprobatarios</label>
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center bg-slate-950/50 hover:border-federal-500/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="weapon-request-upload"
                  />
                  <label htmlFor="weapon-request-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <span className="text-sm text-slate-400">
                      Clique para anexar documentos
                    </span>
                    <span className="text-xs text-slate-600">
                      Comprovantes, laudos ou outros arquivos
                    </span>
                  </label>
                </div>

                {formData.files.length > 0 && (
                  <ul className="space-y-2 mt-3">
                    {formData.files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg text-sm">
                        <span className="text-slate-300 truncate max-w-[260px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitacao
                      <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Solicitacao enviada!</h3>
            <p className="text-slate-400 mb-3">
              Seu pedido foi registrado com sucesso dentro do modulo de porte de armas.
            </p>
            {createdLicenseId && (
              <p className="text-xs text-slate-500 mb-8">
                Protocolo interno: {createdLicenseId}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  resetFlow();
                  if (onCancel) onCancel();
                }}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeaponLicenseRequestFlow;
