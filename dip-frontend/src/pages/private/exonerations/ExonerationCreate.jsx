import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../context/AuthContext';
import NotificationBanner from '../../../components/feedback/NotificationBanner';
import { ArrowLeft, BadgeX, CheckCircle, Link as LinkIcon, Plus, RefreshCw, Upload, X } from 'lucide-react';

const createEmptyForm = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return {
    fullName: '',
    passportId: '',
    roleName: '',
    department: '',
    reason: '',
    notes: '',
    decisionDate: `${year}-${month}-${day}`
  };
};

const ExonerationCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('exonerations_manage');

  const [creating, setCreating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm());
  const [proofs, setProofs] = useState([]);
  const [linkInput, setLinkInput] = useState('');

  const handleFormInput = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const nextProofs = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      type: 'image',
      file,
      title: file.name,
      preview: URL.createObjectURL(file)
    }));

    setProofs((prev) => [...prev, ...nextProofs]);
    event.target.value = '';
  };

  const addLinkProof = () => {
    if (!linkInput.trim()) return;

    setProofs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'link',
        url: linkInput.trim(),
        title: linkInput.trim()
      }
    ]);
    setLinkInput('');
  };

  const removeProof = (proofId) => {
    setProofs((prev) => {
      const proof = prev.find((item) => item.id === proofId);
      if (proof?.preview) URL.revokeObjectURL(proof.preview);
      return prev.filter((item) => item.id !== proofId);
    });
  };

  const uploadProofs = async (exonerationId) => {
    const rows = [];

    for (const proof of proofs) {
      if (proof.type === 'link') {
        rows.push({
          exoneration_id: exonerationId,
          proof_type: 'link',
          url: proof.url.trim(),
          title: proof.title || proof.url.trim(),
          file_name: null,
          uploaded_by: user?.id || null
        });
        continue;
      }

      const fileExt = proof.file.name.split('.').pop();
      const storageFileName = `${exonerationId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('exoneration-proofs')
        .upload(storageFileName, proof.file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('exoneration-proofs')
        .getPublicUrl(storageFileName);

      rows.push({
        exoneration_id: exonerationId,
        proof_type: 'image',
        url: publicUrlData.publicUrl,
        title: proof.title || proof.file.name,
        file_name: proof.file.name,
        uploaded_by: user?.id || null
      });
    }

    if (!rows.length) return;

    const { error } = await supabase.from('exoneration_proofs').insert(rows);
    if (error) throw error;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!canManage) {
      setNotification({
        type: 'error',
        title: 'Sem permissao',
        message: 'Voce nao tem permissao para catalogar exonerações.'
      });
      return;
    }

    if (!formData.fullName.trim() || !formData.passportId.trim() || !formData.reason.trim()) {
      setNotification({
        type: 'warning',
        title: 'Campos obrigatorios',
        message: 'Preencha nome, passaporte e motivo da exoneração.'
      });
      return;
    }

    if (proofs.length === 0) {
      setNotification({
        type: 'warning',
        title: 'Provas obrigatorias',
        message: 'Adicione pelo menos uma prova com imagem ou link.'
      });
      return;
    }

    setCreating(true);
    try {
      const exonerationId = crypto.randomUUID();
      const decisionDate = new Date(`${formData.decisionDate}T12:00:00`);

      const { error: insertError } = await supabase
        .from('exonerations')
        .insert({
          id: exonerationId,
          status: 'catalogado',
          full_name: formData.fullName,
          passport_id: formData.passportId,
          role_name: formData.roleName || null,
          department: formData.department || null,
          reason: formData.reason,
          notes: formData.notes || null,
          decision_date: decisionDate.toISOString(),
          created_by: user?.id || null
        });

      if (insertError) throw insertError;

      await uploadProofs(exonerationId);
      proofs.forEach((proof) => proof.preview && URL.revokeObjectURL(proof.preview));

      navigate('/dashboard/exonerations', {
        replace: true,
        state: {
          notification: {
            type: 'success',
            message: 'Exoneração catalogada com sucesso.'
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar exoneração:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao salvar',
        message: 'Nao foi possivel salvar a exoneração.'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/exonerations')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Voltar para Exoneração
          </button>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BadgeX className="text-red-500" />
            Nova Exoneração
          </h1>
          <p className="text-slate-400 mt-2">
            Cadastre o agente e anexe quantas provas forem necessárias.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <form onSubmit={handleCreate} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nome</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => handleFormInput('fullName', event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Passaporte</label>
              <input
                type="text"
                value={formData.passportId}
                onChange={(event) => handleFormInput('passportId', event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Cargo/Patente</label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(event) => handleFormInput('roleName', event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Setor</label>
              <input
                type="text"
                value={formData.department}
                onChange={(event) => handleFormInput('department', event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Data da decisão</label>
            <input
              type="date"
              value={formData.decisionDate}
              onChange={(event) => handleFormInput('decisionDate', event.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Motivo da exoneração</label>
            <textarea
              value={formData.reason}
              onChange={(event) => handleFormInput('reason', event.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Observações adicionais</label>
            <textarea
              value={formData.notes}
              onChange={(event) => handleFormInput('notes', event.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Adicionar imagens</label>
              <label className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-red-600 transition-colors">
                <Upload size={22} className="text-slate-500" />
                <span className="text-slate-300 font-medium">Selecionar imagens</span>
                <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Adicionar link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(event) => setLinkInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addLinkProof())}
                  className="flex-1 px-4 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                  placeholder="Cole um link de prova"
                />
                <button
                  type="button"
                  onClick={addLinkProof}
                  disabled={!linkInput.trim()}
                  className="px-4 py-4 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {proofs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Provas adicionadas</p>
                <span className="text-xs text-slate-500">{proofs.length} item(s)</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {proofs.map((proof) => (
                  <div key={proof.id} className="relative bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                    {proof.type === 'image' ? (
                      <img src={proof.preview} alt={proof.title} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                        <LinkIcon size={20} className="text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proof.title}</p>
                      <p className="text-xs text-slate-500">{proof.type === 'image' ? 'Imagem' : 'Link'}</p>
                    </div>
                    <button type="button" onClick={() => removeProof(proof.id)} className="p-1 hover:bg-slate-800 rounded">
                      <X size={18} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/dashboard/exonerations')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Salvar catálogo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExonerationCreate;
