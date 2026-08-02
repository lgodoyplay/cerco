import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInformantes } from '../../../hooks/useInformantes';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Plus, FolderOpen, Upload, FileText, Trash2, Edit3, CheckCircle, AlertCircle, X, Clock, Tag, Filter, Search, Calendar, Flag, Shield, AlertTriangle, Info, Star, RefreshCw, Clipboard, Eye } from 'lucide-react';
import clsx from 'clsx';
import ConfirmModal from '../../../components/common/ConfirmModal';

const CATEGORY_ICONS = {
  testemunho: User,
  evidencia: Shield,
  dica: AlertTriangle,
  documento: FileText,
  observacao: Info,
  linha: Flag,
  outro: FolderOpen,
};

const CATEGORY_LABELS = {
  testemunho: 'Testemunho',
  evidencia: 'Evidência',
  dica: 'Dica',
  documento: 'Documento',
  observacao: 'Observação',
  linha: 'Linha',
  outro: 'Outro',
};

const CATEGORY_COLORS = {
  testemunho: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  evidencia: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  dica: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  documento: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  observacao: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  linha: 'text-red-400 bg-red-400/10 border-red-400/20',
  outro: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

const PRIORITY_COLORS = {
  Alta: 'text-red-400 bg-red-400/10 border-red-400/20',
  Média: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Baixa: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const STATUS_COLORS = {
  Pendente: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Revisado: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Verificado: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const InformantesWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry, addEntryFile, removeEntryFile, getStats, CATEGORIES, PRIORITIES, ENTRY_STATUSES } = useInformantes();

  const [notification, setNotification] = useState(location.state?.notification || null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    category: 'outro',
    priority: 'Média',
    status: 'Pendente',
    relatedInvestigationId: '',
    relatedInvestigationTitle: '',
    tags: '',
  });
  const [entryFiles, setEntryFiles] = useState([]);

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

  const stats = getStats();

  const filteredEntries = entries.filter(entry => {
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || entry.priority === filterPriority;
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
  });

  const handleAddEntry = () => {
    if (!newEntry.title.trim()) return;
    const tags = newEntry.tags.split(',').map(t => t.trim()).filter(Boolean);
    const entryData = {
      ...newEntry,
      tags,
      files: entryFiles.map(f => ({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedBy: user?.full_name || user?.username || 'Agente',
        createdAt: new Date().toISOString(),
      })),
      author: user?.full_name || user?.username || 'Agente',
    };
    addEntry(entryData);
    setNewEntry({
      title: '',
      description: '',
      category: 'outro',
      priority: 'Média',
      status: 'Pendente',
      relatedInvestigationId: '',
      relatedInvestigationTitle: '',
      tags: '',
    });
    setEntryFiles([]);
    setIsAddingEntry(false);
    setNotification({ type: 'success', message: 'Informação adicionada com sucesso.' });
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !newEntry.title.trim()) return;
    const tags = newEntry.tags.split(',').map(t => t.trim()).filter(Boolean);
    const entryData = {
      ...newEntry,
      tags,
      files: entryFiles.map(f => ({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedBy: user?.full_name || user?.username || 'Agente',
        createdAt: new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
    updateEntry(editingEntry.id, entryData);
    setEditingEntry(null);
    setNewEntry({
      title: '',
      description: '',
      category: 'outro',
      priority: 'Média',
      status: 'Pendente',
      relatedInvestigationId: '',
      relatedInvestigationTitle: '',
      tags: '',
    });
    setEntryFiles([]);
    setNotification({ type: 'success', message: 'Informação atualizada com sucesso.' });
  };

  const openEditEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title,
      description: entry.description,
      category: entry.category,
      priority: entry.priority,
      status: entry.status,
      relatedInvestigationId: entry.relatedInvestigationId || '',
      relatedInvestigationTitle: entry.relatedInvestigationTitle || '',
      tags: (entry.tags || []).join(', '),
    });
    setEntryFiles([]);
    setIsAddingEntry(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setEntryFiles(prev => [...prev, ...files]);
  };

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    setEntryFiles(prev => [...prev, ...files]);
  };

  const removeFile = (fileId) => {
    setEntryFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDeleteEntry = (entryId) => {
    deleteEntry(entryId);
    setConfirmDelete(null);
    setNotification({ type: 'success', message: 'Informação removida com sucesso.' });
  };

  const handleStatusChange = (entryId, newStatus) => {
    updateEntry(entryId, { status: newStatus });
    setNotification({ type: 'success', message: `Status alterado para "${newStatus}".` });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      {confirmDelete && (
        <ConfirmModal
          message="Tem certeza que deseja remover esta informação?"
          onConfirm={() => handleDeleteEntry(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {notification && (
        <div className={clsx(
          "rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
          notification.type === 'success' ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100" : "bg-red-950/70 border-red-500/30 text-red-100"
        )}>
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertCircle size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-current/80 hover:text-current transition-colors" aria-label="Fechar aviso">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clipboard className="text-federal-500" size={32} />
            Minhas Informações
          </h1>
          <p className="text-slate-400 mt-2">Adicione e gerencie as informações que você coletou durante as investigações.</p>
        </div>
        <button
          onClick={() => {
            setIsAddingEntry(!isAddingEntry);
            setEditingEntry(null);
            setNewEntry({
              title: '',
              description: '',
              category: 'outro',
              priority: 'Média',
              status: 'Pendente',
              relatedInvestigationId: '',
              relatedInvestigationTitle: '',
              tags: '',
            });
            setEntryFiles([]);
          }}
          className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5 shrink-0"
        >
          <Plus size={20} />
          {isAddingEntry ? 'Cancelar' : 'Nova Informação'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Total</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Pendentes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.reviewed}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Revisados</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.verified}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Verificados</p>
        </div>
      </div>

      {/* Add Entry Form */}
      {isAddingEntry && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {editingEntry ? <Edit3 size={20} className="text-federal-500" /> : <Plus size={20} className="text-federal-500" />}
            {editingEntry ? 'Editar Informação' : 'Nova Informação'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título *</label>
              <input
                type="text"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Testemunho sobre o suspeito"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
              <textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes da informação..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-federal-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prioridade</label>
                <select
                  value={newEntry.priority}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-federal-500"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={newEntry.status}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-federal-500"
                >
                  {ENTRY_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Investigação Relacionada</label>
              <input
                type="text"
                value={newEntry.relatedInvestigationTitle}
                onChange={(e) => setNewEntry(prev => ({ ...prev, relatedInvestigationTitle: e.target.value }))}
                placeholder="Título da investigação relacionada"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                value={newEntry.tags}
                onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Ex: suspeito, local, testemunha"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Anexar Arquivos</label>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-bold cursor-pointer transition-colors">
                  <FolderOpen size={18} />
                  Abrir Pasta
                  <input
                    type="file"
                    webkitdirectory
                    directory
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                    aria-label="Selecionar pasta de arquivos"
                  />
                </label>
                <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-bold cursor-pointer transition-colors">
                  <Upload size={18} />
                  Selecionar Arquivos
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Selecionar arquivos"
                  />
                </label>
                {entryFiles.length > 0 && (
                  <span className="text-sm text-slate-400">{entryFiles.length} arquivo(s) selecionado(s)</span>
                )}
              </div>
              {entryFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entryFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                      <FileText size={12} />
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <button onClick={() => removeFile(f.id)} className="text-red-400 hover:text-red-300 ml-1" aria-label="Remover arquivo">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-2">
                Clique em "Abrir Pasta" para selecionar uma pasta do seu computador. Os arquivos serão adicionados gradualmente.
              </p>
            </div>

            <button
              onClick={editingEntry ? handleUpdateEntry : handleAddEntry}
              className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Clipboard size={18} /> {editingEntry ? 'Atualizar Informação' : 'Salvar Informação'}
            </button>
          </div>
        </div>
      )}

      {/* Entries Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-federal-500" size={24} />
            Informações Registradas
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{filteredEntries.length} de {entries.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 flex-1">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar informações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-200 text-sm py-2 outline-none placeholder-slate-600 w-full"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-federal-500"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-federal-500"
          >
            <option value="all">Todos os status</option>
            {ENTRY_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-federal-500"
          >
            <option value="all">Todas as prioridades</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500">
            <Clipboard size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Nenhuma informação adicionada ainda.</p>
            <p className="text-sm mt-1">Clique em "Nova Informação" para começar a registrar dados.</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Search size={32} className="mx-auto mb-3 opacity-20" />
            <p>Nenhuma informação encontrada com os filtros atuais.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => {
              const CategoryIcon = CATEGORY_ICONS[entry.category] || FolderOpen;
              return (
                <div key={entry.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CategoryIcon size={16} className="text-slate-400" />
                        <h4 className="text-white font-semibold">{entry.title}</h4>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.outro)}>
                          {CATEGORY_LABELS[entry.category] || entry.category}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", PRIORITY_COLORS[entry.priority] || PRIORITY_COLORS['Média'])}>
                          {entry.priority}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", STATUS_COLORS[entry.status] || STATUS_COLORS['Pendente'])}>
                          {entry.status}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                        {entry.relatedInvestigationTitle && (
                          <span className="flex items-center gap-1">
                            <Flag size={12} /> {entry.relatedInvestigationTitle}
                          </span>
                        )}
                        {(entry.tags || []).length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag size={12} /> {(entry.tags || []).join(', ')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {entry.author}
                        </span>
                        {(entry.files || []).length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} /> {(entry.files || []).length} arquivo(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-col items-end">
                      <select
                        value={entry.status}
                        onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-federal-500"
                        aria-label="Alterar status"
                      >
                        {ENTRY_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => openEditEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-federal-400 hover:bg-slate-700 rounded-lg transition-colors"
                          aria-label="Editar informação"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                          aria-label="Remover informação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InformantesWorkspace;