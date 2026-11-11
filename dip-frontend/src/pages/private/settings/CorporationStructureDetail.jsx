import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck, Users, UserCog, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import {
  getCorporateTypeLabel,
  normalizeCorporationList,
} from '../../../utils/corporationUtils';

const validTypes = ['departments', 'divisions', 'sectors'];

const CorporationStructureDetail = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { corporation, users, updateCorporation } = useSettings();
  const safeType = validTypes.includes(type) ? type : 'departments';
  const currentList = normalizeCorporationList(corporation?.[safeType] || [], safeType);
  const currentItem = currentList.find((item) => item.id === id) || null;

  const [form, setForm] = useState({ name: '', chiefId: '', members: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentItem) return;

    setForm({
      name: currentItem.name || '',
      chiefId: currentItem.chiefId || '',
      members: Array.isArray(currentItem.members) ? currentItem.members : [],
    });
  }, [currentItem]);

  const availableUsers = useMemo(() => {
    return [...(users || [])]
      .filter(Boolean)
      .sort((a, b) => (a.name || a.username || '').localeCompare(b.name || b.username || ''));
  }, [users]);

  const handleMemberToggle = (userId) => {
    setForm((prev) => {
      const members = prev.members.includes(userId)
        ? prev.members.filter((memberId) => memberId !== userId)
        : [...prev.members, userId];

      return { ...prev, members };
    });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      setError('É obrigatório informar o nome da estrutura.');
      return;
    }

    if (!form.chiefId) {
      setError('É obrigatório definir um chefe para a estrutura.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const nextList = currentList.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          name,
          chiefId: form.chiefId,
          members: Array.from(new Set(form.members.filter(Boolean))),
        };
      });

      await updateCorporation(safeType, nextList);
      navigate('/dashboard/settings/corporation');
    } catch (err) {
      console.error('Erro ao salvar estrutura da corporação:', err);
      setError('Não foi possível salvar a estrutura. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentItem) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/settings/corporation')}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          Estrutura não encontrada.
        </div>
      </div>
    );
  }

  const chiefName = availableUsers.find((user) => user.id === form.chiefId)?.name || 'Sem chefe definido';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-federal-400 font-bold">{getCorporateTypeLabel(safeType)}</p>
          <h2 className="text-2xl font-bold text-white">{currentItem.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/settings/corporation')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome da estrutura</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-federal-500 focus:outline-none"
                placeholder="Nome do departamento, divisão ou setor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chefe da estrutura</label>
              <select
                value={form.chiefId}
                onChange={(event) => setForm((prev) => ({ ...prev, chiefId: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-federal-500 focus:outline-none"
              >
                <option value="">Selecione o responsável</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.username || 'Usuário sem nome'}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-federal-600 px-5 py-3 font-bold text-white hover:bg-federal-500 disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Salvando...' : 'Salvar estrutura'}
            </button>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-4">
            <ShieldCheck size={18} className="text-federal-400" />
            Responsável atual
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-200">
            <div className="flex items-center gap-3">
              <UserCog size={18} className="text-federal-400" />
              <div>
                <p className="font-medium">{chiefName}</p>
                <p className="text-xs text-slate-400">Chefe da estrutura</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <Users size={18} className="text-federal-400" />
              Membros lotados
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {availableUsers.length === 0 ? (
                <div className="text-sm text-slate-400">Nenhum usuário cadastrado para adicionar.</div>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = form.members.includes(user.id) || form.chiefId === user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleMemberToggle(user.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-federal-500/50 bg-federal-500/10 text-white'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span>{user.name || user.username || 'Usuário sem nome'}</span>
                      <span className="text-xs text-slate-400">
                        {form.chiefId === user.id ? 'Chefe' : isSelected ? 'Lotado' : 'Adicionar'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporationStructureDetail;
