import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { Save, ArrowLeft, FolderPlus, AlertCircle, DollarSign } from 'lucide-react';
import clsx from 'clsx';

const InvestigationCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const { addInvestigation } = useInvestigations();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    involved: '',
    priority: 'Média',
    category: categoryParam || 'criminal'
  });

  useEffect(() => {
    if (categoryParam) {
      setFormData(prev => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    try {
      const id = await addInvestigation(formData);
      
      if (formData.category === 'financial') {
        navigate(`/dashboard/revenue/investigations/${id}`);
      } else {
        navigate(`/dashboard/investigations/${id}`);
      }
    } catch (error) {
      console.error('Erro ao criar investigação:', error);
      // Optional: Add notification handling here
    }
  };

  const isFinancial = formData.category === 'financial';
  const backLink = isFinancial ? '/dashboard/revenue' : '/dashboard/investigations';

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <button 
        onClick={() => navigate(backLink)}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para {isFinancial ? 'Receita' : 'Investigações'}
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {isFinancial ? <DollarSign className="text-emerald-500" size={28} /> : <FolderPlus className="text-federal-500" size={28} />}
            {isFinancial ? 'Nova Investigação Financeira' : 'Nova Investigação'}
          </h2>
          <p className="text-slate-400 mt-2">
            {isFinancial 
              ? 'Abra um novo inquérito para apurar crimes financeiros.' 
              : 'Preencha os dados iniciais para abrir um novo inquérito.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
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

          {/* Description */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Involved */}
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

            {/* Priority */}
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
              className="bg-federal-600 hover:bg-federal-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
            >
              <Save size={20} />
              Criar Investigação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestigationCreate;
