import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { Save, ArrowLeft, FolderPlus, DollarSign, Edit3, AlertCircle, CheckCircle, X } from 'lucide-react';
import clsx from 'clsx';

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
    nomeInvestigado: '',
    cpfInvestigado: '',
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
              nomeInvestigado: inv.nomeInvestigado || '',
              cpfInvestigado: inv.cpfInvestigado || '',
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
                Preencha os dados principais para o documento final sair pronto sem edição manual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  name="nomeInvestigado"
                  value={formData.nomeInvestigado}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Nome completo do investigado"
                />
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
