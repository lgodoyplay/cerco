import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInformantes } from '../../../hooks/useInformantes';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Plus, FolderOpen, Upload, FileText, Trash2, Edit3, Download, CheckCircle, AlertCircle, X, Clock, User, Phone, Mail, MapPin, FileUp, FolderPlus } from 'lucide-react';
import clsx from 'clsx';
import ConfirmModal from '../../../components/common/ConfirmModal';

const InformanteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getInformante, updateInformante, deleteInformante, addDocument, removeDocument } = useInformantes();

  const [informante, setInformante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(location.state?.notification || null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDocDelete, setConfirmDocDelete] = useState(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', description: '', type: 'documento' });
  const [folderInput, setFolderInput] = useState(null);

  useEffect(() => {
    const data = getInformante(id);
    if (!data) {
      navigate('/dashboard/investigations/informantes');
      return;
    }
    setInformante(data);
    setLoading(false);
  }, [id, getInformante, navigate]);

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

  const handleAddDocument = () => {
    if (!newDoc.title.trim()) return;
    const doc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: newDoc.title,
      description: newDoc.description,
      type: newDoc.type,
      fileName: folderInput ? folderInput.name : '',
      fileSize: folderInput ? folderInput.size : 0,
      uploadedBy: user?.full_name || user?.username || 'Agente',
      createdAt: new Date().toISOString(),
    };
    addDocument(id, doc);
    setInformante(prev => prev ? { ...prev, documents: [...(prev.documents || []), doc] } : null);
    setNewDoc({ title: '', description: '', type: 'documento' });
    setFolderInput(null);
    setIsAddingDoc(false);
    setNotification({ type: 'success', message: 'Documento adicionado com sucesso.' });
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFolderInput(files[0]);
    }
  };

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFolderInput(files[0]);
    }
  };

  const handleDeleteInformante = () => {
    deleteInformante(id);
    navigate('/dashboard/investigations/informantes', {
      state: { notification: { type: 'success', message: 'Informante removido com sucesso.' } }
    });
  };

  const handleDeleteDocument = (docId) => {
    removeDocument(id, docId);
    setInformante(prev => prev ? {
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== docId)
    } : null);
    setConfirmDocDelete(null);
    setNotification({ type: 'success', message: 'Documento removido com sucesso.' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-20 flex justify-center items-center min-h-[420px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!informante) return null;

  const docTypes = ['documento', 'foto', 'video', 'audio', 'outro'];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {confirmDelete && (
        <ConfirmModal
          message="Tem certeza que deseja remover este informante? Esta ação não pode ser desfeita."
          onConfirm={handleDeleteInformante}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDocDelete && (
        <ConfirmModal
          message="Tem certeza que deseja remover este documento?"
          onConfirm={() => handleDeleteDocument(confirmDocDelete)}
          onCancel={() => setConfirmDocDelete(null)}
        />
      )}

      {notification && (
        <div className={clsx(
          "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
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

      <button
        onClick={() => navigate('/dashboard/investigations/informantes')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para Informantes
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-federal-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                informante.status === 'Ativo'
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              )}>
                {informante.status}
              </span>
              <span className="text-slate-500 text-xs font-mono">ID: {informante.id}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{informante.nome}</h1>
            {informante.apelido && (
              <p className="text-slate-400">Alias: {informante.apelido}</p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate(`/dashboard/investigations/informantes/${id}/edit`)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Edit3 size={20} /> Editar
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="bg-red-800 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Trash2 size={20} /> Remover
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-6 border-t border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-federal-500/10 flex items-center justify-center">
              <User size={18} className="text-federal-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome</label>
              <p className="text-white font-medium">{informante.nome || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText size={18} className="text-blue-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documento</label>
              <p className="text-white font-medium">{informante.documento || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Phone size={18} className="text-emerald-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
              <p className="text-white font-medium">{informante.telefone || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Mail size={18} className="text-amber-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
              <p className="text-white font-medium">{informante.email || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MapPin size={18} className="text-purple-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endereço</label>
              <p className="text-white font-medium">{informante.endereco || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <User size={18} className="text-rose-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relação</label>
              <p className="text-white font-medium">{informante.relacao || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Clock size={18} className="text-slate-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criado em</label>
              <p className="text-white font-medium">{new Date(informante.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <FileText size={18} className="text-slate-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documentos</label>
              <p className="text-white font-medium">{(informante.documents || []).length} arquivo(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="text-federal-500" size={24} />
            Documentos e Informações
          </h3>
          <button
            onClick={() => setIsAddingDoc(!isAddingDoc)}
            className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition-all hover:scale-105"
          >
            <Plus size={18} /> {isAddingDoc ? 'Cancelar' : 'Adicionar Documento'}
          </button>
        </div>

        {isAddingDoc && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título do Documento</label>
              <input
                type="text"
                value={newDoc.title}
                onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Declaração de Testemunho"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
              <input
                type="text"
                value={newDoc.description}
                onChange={(e) => setNewDoc(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do documento"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
              <select
                value={newDoc.type}
                onChange={(e) => setNewDoc(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-federal-500"
              >
                {docTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selecionar Arquivo (Pasta)</label>
              <div className="flex items-center gap-3">
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
                {folderInput && (
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <FileText size={14} />
                    {folderInput.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Clique em "Abrir Pasta" para selecionar uma pasta do seu computador. Os arquivos serão adicionados gradualmente.
              </p>
            </div>
            <button
              onClick={handleAddDocument}
              className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Upload size={18} /> Salvar Documento
            </button>
          </div>
        )}

        {(informante.documents || []).length === 0 ? (
          <div className="py-8 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500">
            <FolderOpen size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Nenhum documento adicionado ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Documento" para começar a incluir informações.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(informante.documents || []).map(doc => (
              <div key={doc.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-start gap-3 group hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-federal-500/10 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-federal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm truncate">{doc.title}</h4>
                  {doc.description && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{doc.type}</span>
                    {doc.fileName && (
                      <span className="text-[10px] text-slate-600">• {doc.fileName}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setConfirmDocDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                    aria-label="Remover documento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observations */}
      {informante.observacoes && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="text-slate-400" size={24} />
            Observações
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{informante.observacoes}</p>
        </div>
      )}
    </div>
  );
};

export default InformanteDetail;