import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useInformantes } from '../../../hooks/useInformantes';
import { Save, ArrowLeft, Plus, X, UserPlus, FileText, Clock, Phone, Mail, MapPin, Tag, Flag, Shield, AlertTriangle, Star, Building2, User } from 'lucide-react';
import clsx from 'clsx';

const InformanteCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { addInformante, updateInformante, getInformante } = useInformantes();

  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    relacao: '',
    tipoInformante: '',
    ocupacao: '',
    empresa: '',
    observacoes: '',
    status: 'Ativo',
    prioridade: 'Média',
  });

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(location.state?.notification || null);

  useEffect(() => {
    if (isEditing) {
      const fetchData = async () => {
        try {
          const inf = await getInformante(id);
          if (inf) {
            setFormData({
              nome: inf.nome || '',
              apelido: inf.apelido || '',
              documento: inf.documento || '',
              telefone: inf.telefone || '',
              email: inf.email || '',
              endereco: inf.endereco || '',
              bairro: inf.bairro || '',
              cidade: inf.cidade || '',
              estado: inf.estado || '',
              cep: inf.cep || '',
              relacao: inf.relacao || '',
              tipoInformante: inf.tipoInformante || '',
              ocupacao: inf.ocupacao || '',
              empresa: inf.empresa || '',
              observacoes: inf.observacoes || '',
              status: inf.status || 'Ativo',
              prioridade: inf.prioridade || 'Média',
            });
          } else {
            navigate('/dashboard/investigations/informantes');
          }
        } catch {
          setNotification({ type: 'error', message: 'Não foi possível carregar os dados do informante.' });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, isEditing, getInformante, navigate]);

  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateInformante(id, formData);
        setNotification({ type: 'success', message: 'Informante atualizado com sucesso.' });
        setTimeout(() => navigate(`/dashboard/investigations/informantes/${id}`), 500);
      } else {
        const newInf = await addInformante(formData);
        setNotification({ type: 'success', message: 'Informante cadastrado com sucesso.' });
        setTimeout(() => navigate(`/dashboard/investigations/informantes/${newInf.id}`), 500);
      }
    } catch (error) {
      setNotification({ type: 'error', message: error?.message || 'Não foi possível salvar o informante.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-20 flex justify-center items-center min-h-[420px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {notification && (
        <div className={clsx(
          "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
          notification.type === 'success' ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100" : "bg-red-950/70 border-red-500/30 text-red-100"
        )}>
          {notification.type === 'success' ? <Clock size={20} className="mt-0.5 shrink-0" /> : <Tag size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-current/80 hover:text-current transition-colors" aria-label="Fechar aviso">
            <X size={18} />
          </button>
        </div>
      )}

      <button
        onClick={() => navigate(isEditing ? `/dashboard/investigations/informantes/${id}` : '/dashboard/investigations/informantes')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> {isEditing ? 'Voltar ao Informante' : 'Voltar para Informantes'}
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <UserPlus className="text-federal-500" size={28} />
          {isEditing ? 'Editar Informante' : 'Novo Informante'}
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          {isEditing ? 'Atualize os dados do informante.' : 'Preencha os dados do novo informante.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-federal-500" />
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                  placeholder="Nome completo do informante"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apelido</label>
                <input
                  type="text"
                  value={formData.apelido}
                  onChange={(e) => handleChange('apelido', e.target.value)}
                  placeholder="Apelido ou nome popular"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documento</label>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => handleChange('documento', e.target.value)}
                  placeholder="CPF, RG ou outro documento"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="Telefone de contato"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="E-mail do informante"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Informante</label>
                <select
                  value={formData.tipoInformante}
                  onChange={(e) => handleChange('tipoInformante', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-federal-500"
                >
                  <option value="">Selecione</option>
                  <option value="testemunha">Testemunha</option>
                  <option value="vítima">Vítima</option>
                  <option value="suspeito">Suspeito</option>
                  <option value="denunciante">Denunciante</option>
                  <option value="colaborador">Colaborador</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ocupação</label>
                <input
                  type="text"
                  value={formData.ocupacao}
                  onChange={(e) => handleChange('ocupacao', e.target.value)}
                  placeholder="Profissão ou ocupação"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Empresa/Local de Trabalho</label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => handleChange('empresa', e.target.value)}
                  placeholder="Empresa ou instituição"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-federal-500" />
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bairro</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  placeholder="Cidade"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado</label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  placeholder="UF"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CEP</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  placeholder="CEP"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Case Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Flag size={20} className="text-federal-500" />
              Informações do Caso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relação com o Caso</label>
                <input
                  type="text"
                  value={formData.relacao}
                  onChange={(e) => handleChange('relacao', e.target.value)}
                  placeholder="Ex: Testemunha, Suspeito, Vítima, Denunciante"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prioridade</label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => handleChange('prioridade', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-federal-500"
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-federal-500"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Suspenso">Suspenso</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o informante..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                isSubmitting
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-federal-600 hover:bg-federal-500 text-white shadow-lg shadow-federal-900/50 hover:-translate-y-0.5"
              )}
            >
              <Save size={20} />
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Informante' : 'Cadastrar Informante')}
            </button>
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/dashboard/investigations/informantes/${id}` : '/dashboard/investigations/informantes')}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InformanteCreate;