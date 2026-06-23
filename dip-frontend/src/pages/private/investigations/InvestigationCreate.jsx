import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { Save, ArrowLeft, FolderPlus, DollarSign, Edit3, AlertCircle, CheckCircle, X, Plus, Trash2, Building2, Users } from 'lucide-react';
import clsx from 'clsx';

const createEmptyInvestigated = () => ({ nome: '', cpf: '' });

const normalizeInvestigatedList = (value) => {
  if (!Array.isArray(value) || !value.length) return [createEmptyInvestigated()];

  const sanitized = value
    .map((item) => ({
      nome: String(item?.nome || '').trim(),
      cpf: String(item?.cpf || '').trim()
    }))
    .filter((item) => item.nome || item.cpf);

  return sanitized.length ? sanitized : [createEmptyInvestigated()];
};

const InvestigationCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const categoryParam = searchParams.get('category');
  
  const { addInvestigation, getInvestigation, editInvestigation } = useInvestigations();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    involved: '',
    priority: 'Média',
    category: categoryParam || 'criminal',
    delegaciaResponsavel: 'Delegacia Central de Investigações',
    tipoAlvoInvestigacao: 'pessoa',
    nomeOrganizacaoInvestigada: '',
    nomeInvestigado: '',
    cpfInvestigado: '',
    investigados: [createEmptyInvestigated()],
    dataNascimento: '',
    enderecoInvestigado: '',
    telefoneInvestigado: '',
    nomeDelegado: ''
  });
  const [loading, setLoading] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const inv = await getInvestigation(id);
          if (inv) {
            setFormData({
              title: inv.title,
              description: inv.description,
              involved: inv.involved,
              priority: inv.priority,
              category: inv.category,
              delegaciaResponsavel: inv.delegaciaResponsavel || 'Delegacia Central de Investigações',
              tipoAlvoInvestigacao: inv.tipoAlvoInvestigacao || 'pessoa',
              nomeOrganizacaoInvestigada: inv.nomeOrganizacaoInvestigada || '',
              nomeInvestigado: inv.nomeInvestigado || '',
              cpfInvestigado: inv.cpfInvestigado || '',
              investigados: normalizeInvestigatedList(inv.investigados),
              dataNascimento: inv.dataNascimento || '',
              enderecoInvestigado: inv.enderecoInvestigado || '',
              telefoneInvestigado: inv.telefoneInvestigado || '',
              nomeDelegado: inv.nomeDelegado || ''
            });
          } else {
            navigate('/dashboard/investigations');
          }
        } catch (_error) {
          setNotification({
            type: 'error',
            message: 'Nao foi possivel carregar os dados da investigacao.'
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      if (categoryParam) {
        setFormData(prev => ({ ...prev, category: categoryParam }));
      }
      setLoading(false);
    }
  }, [id, categoryParam, getInvestigation, navigate]);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notification]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInvestigadoChange = (index, field, value) => {
    setFormData((prev) => {
      const investigados = prev.investigados.map((item, itemIndex) => (
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ));
      const principal = investigados[0] || createEmptyInvestigated();

      return {
        ...prev,
        investigados,
        nomeInvestigado: principal.nome,
        cpfInvestigado: principal.cpf
      };
    });
  };

  const addInvestigado = () => {
    setFormData((prev) => ({
      ...prev,
      investigados: [...prev.investigados, createEmptyInvestigated()]
    }));
  };

  const removeInvestigado = (index) => {
    setFormData((prev) => {
      const investigados = prev.investigados.filter((_, itemIndex) => itemIndex !== index);
      const normalized = investigados.length ? investigados : [createEmptyInvestigated()];
      const principal = normalized[0] || createEmptyInvestigated();

      return {
        ...prev,
        investigados: normalized,
        nomeInvestigado: principal.nome,
        cpfInvestigado: principal.cpf
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let targetId = id;

      if (id) {
        await editInvestigation(id, formData);
      } else {
        targetId = await addInvestigation(formData);
      }
      
      const notification = {
        type: 'success',
        message: id ? 'Investigação atualizada com sucesso.' : 'Investigação criada com sucesso.'
      };

      if (formData.category === 'financial') {
        navigate(
          targetId ? `/dashboard/revenue/investigations/${targetId}` : '/dashboard/revenue',
          targetId ? { state: { notification } } : undefined
        );
      } else {
        navigate(
          targetId ? `/dashboard/investigations/${targetId}` : '/dashboard/investigations',
          targetId ? { state: { notification } } : undefined
        );
      }
    } catch (error) {
      console.error('Erro ao salvar investigação:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel salvar a investigacao.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFinancial = formData.category === 'financial';
  const backLink = isFinancial ? '/dashboard/revenue' : '/dashboard/investigations';
  const isEntityTarget = formData.tipoAlvoInvestigacao === 'organizacao' || formData.tipoAlvoInvestigacao === 'empresa';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-10 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {notification && (
        <div
          className={clsx(
            "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
            notification.type === 'success'
              ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100"
              : "bg-red-950/70 border-red-500/30 text-red-100"
          )}
        >
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertCircle size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-current/80 hover:text-current transition-colors"
            aria-label="Fechar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <button 
        onClick={() => navigate(backLink)}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para {isFinancial ? 'Receita' : 'Investigações'}
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {isFinancial ? <DollarSign className="text-emerald-500" size={28} /> : id ? <Edit3 className="text-federal-500" size={28} /> : <FolderPlus className="text-federal-500" size={28} />}
            {id ? 'Editar Investigação' : isFinancial ? 'Nova Investigação Financeira' : 'Nova Investigação'}
          </h2>
          <p className="text-slate-400 mt-2">
            {id 
              ? 'Atualize os dados da investigação.' 
              : isFinancial 
                ? 'Abra um novo inquérito para apurar crimes financeiros.' 
                : 'Preencha os dados iniciais para abrir um novo inquérito.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Investigação / Operação</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Ex: Operação Lava Jato"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição do Caso</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
              placeholder="Detalhes iniciais do caso..."
              required
            />
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dados do Inquérito</h3>
              <p className="text-sm text-slate-400 mt-1">
                Essas informações alimentam o relatório final automaticamente quando a investigação for encerrada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Delegacia Responsável</label>
                <input
                  type="text"
                  name="delegaciaResponsavel"
                  value={formData.delegaciaResponsavel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Ex: Delegacia Central de Investigações"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Delegado Responsável</label>
                <input
                  type="text"
                  name="nomeDelegado"
                  value={formData.nomeDelegado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Nome do delegado responsável"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identificação do Investigado</h3>
              <p className="text-sm text-slate-400 mt-1">
                Escolha se a investigação é contra pessoa, organização ou empresa e informe todos os investigados necessários.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo do Alvo</label>
                <select
                  name="tipoAlvoInvestigacao"
                  value={formData.tipoAlvoInvestigacao}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                >
                  <option value="pessoa">Pessoa</option>
                  <option value="organizacao">Organização</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              {isEntityTarget && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    {formData.tipoAlvoInvestigacao === 'empresa' ? 'Nome da Empresa' : 'Nome da Organização'}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 text-slate-600" size={20} />
                    <input
                      type="text"
                      name="nomeOrganizacaoInvestigada"
                      value={formData.nomeOrganizacaoInvestigada}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                      placeholder={formData.tipoAlvoInvestigacao === 'empresa' ? 'Razão social ou nome fantasia' : 'Nome da organização investigada'}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Lista de Investigados</label>
                  <button
                    type="button"
                    onClick={addInvestigado}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Adicionar Investigado
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.investigados.map((investigado, index) => (
                    <div key={`investigado-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
                      <div className="relative">
                        <Users className="absolute left-4 top-3.5 text-slate-600" size={20} />
                        <input
                          type="text"
                          value={investigado.nome}
                          onChange={(e) => handleInvestigadoChange(index, 'nome', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                          placeholder={`Nome do investigado ${index + 1}`}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={investigado.cpf}
                          onChange={(e) => handleInvestigadoChange(index, 'cpf', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                          placeholder="CPF / Documento"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInvestigado(index)}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center justify-center"
                        title="Remover investigado"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">CPF / Documento</label>
                <input
                  type="text"
                  name="cpfInvestigado"
                  value={formData.cpfInvestigado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="CPF ou documento principal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Data de Nascimento</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento || ''}
                  onChange={handleChange}
                  className={clsx(
                    "w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none",
                    !formData.dataNascimento && "text-slate-500"
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Endereço</label>
                <input
                  type="text"
                  name="enderecoInvestigado"
                  value={formData.enderecoInvestigado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Endereço completo do investigado"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Telefone</label>
                <input
                  type="text"
                  name="telefoneInvestigado"
                  value={formData.telefoneInvestigado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Telefone para contato"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Envolvidos / Suspeitos</label>
              <input
                type="text"
                name="involved"
                value={formData.involved}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Nomes separados por vírgula"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Prioridade</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all",
                isSubmitting
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-federal-600 hover:bg-federal-500 hover:-translate-y-0.5"
              )}
            >
              <Save size={20} />
              {isSubmitting ? 'Salvando...' : id ? 'Salvar Alterações' : 'Criar Investigação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestigationCreate;
