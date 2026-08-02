import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'dip_informantes';

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (informantes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(informantes));
  } catch {
    console.error('Failed to save informantes to storage');
  }
};

const mapInformante = (inv) => ({
  id: inv.id,
  nome: inv.nome || '',
  apelido: inv.apelido || '',
  documento: inv.documento || '',
  telefone: inv.telefone || '',
  email: inv.email || '',
  endereco: inv.endereco || '',
  relacao: inv.relacao || '',
  observacoes: inv.observacoes || '',
  status: inv.status || 'Ativo',
  entries: inv.entries || [],
  createdAt: inv.createdAt || new Date().toISOString(),
  updatedAt: inv.updatedAt || new Date().toISOString(),
});

const CATEGORIES = ['testemunho', 'evidencia', 'dica', 'documento', 'observacao', 'linha', 'outro'];
const PRIORITIES = ['Alta', 'Média', 'Baixa'];
const ENTRY_STATUSES = ['Pendente', 'Revisado', 'Verificado'];

export const useInformantes = () => {
  const [informantes, setInformantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const data = loadFromStorage();
    if (isMounted.current) {
      setInformantes(data.map(mapInformante));
      setLoading(false);
    }
  }, []);

  const persist = useCallback((updated) => {
    if (!isMounted.current) return;
    saveToStorage(updated);
  }, []);

  const addInformante = useCallback((data) => {
    const newInformante = {
      id: `inf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nome: data.nome || '',
      apelido: data.apelido || '',
      documento: data.documento || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco: data.endereco || '',
      relacao: data.relacao || '',
      observacoes: data.observacoes || '',
      status: data.status || 'Ativo',
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newInformante, ...informantes];
    setInformantes(updated);
    persist(updated);
    return newInformante;
  }, [informantes, persist]);

  const updateInformante = useCallback((id, data) => {
    const updated = informantes.map(inf =>
      inf.id === id
        ? { ...inf, ...data, updatedAt: new Date().toISOString() }
        : inf
    );
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const deleteInformante = useCallback((id) => {
    const updated = informantes.filter(inf => inf.id !== id);
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const addEntry = useCallback((informanteId, entryData) => {
    const newEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: entryData.title || '',
      description: entryData.description || '',
      category: entryData.category || 'outro',
      priority: entryData.priority || 'Média',
      status: entryData.status || 'Pendente',
      relatedInvestigationId: entryData.relatedInvestigationId || '',
      relatedInvestigationTitle: entryData.relatedInvestigationTitle || '',
      tags: entryData.tags || [],
      files: entryData.files || [],
      author: entryData.author || 'Agente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          entries: [newEntry, ...(inf.entries || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
    return newEntry;
  }, [informantes, persist]);

  const updateEntry = useCallback((informanteId, entryId, entryData) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          entries: (inf.entries || []).map(entry =>
            entry.id === entryId
              ? { ...entry, ...entryData, updatedAt: new Date().toISOString() }
              : entry
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const deleteEntry = useCallback((informanteId, entryId) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          entries: (inf.entries || []).filter(e => e.id !== entryId),
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const addEntryFile = useCallback((informanteId, entryId, file) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          entries: (inf.entries || []).map(entry =>
            entry.id === entryId
              ? {
                  ...entry,
                  files: [...(entry.files || []), file],
                  updatedAt: new Date().toISOString(),
                }
              : entry
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const removeEntryFile = useCallback((informanteId, entryId, fileId) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          entries: (inf.entries || []).map(entry =>
            entry.id === entryId
              ? {
                  ...entry,
                  files: (entry.files || []).filter(f => f.id !== fileId),
                  updatedAt: new Date().toISOString(),
                }
              : entry
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const getInformante = useCallback((id) => {
    return informantes.find(inf => inf.id === id) || null;
  }, [informantes]);

  const getEntry = useCallback((informanteId, entryId) => {
    const inf = informantes.find(i => i.id === informanteId);
    if (!inf) return null;
    return (inf.entries || []).find(e => e.id === entryId) || null;
  }, [informantes]);

  return {
    informantes,
    loading,
    addInformante,
    updateInformante,
    deleteInformante,
    addEntry,
    updateEntry,
    deleteEntry,
    addEntryFile,
    removeEntryFile,
    getInformante,
    getEntry,
    CATEGORIES,
    PRIORITIES,
    ENTRY_STATUSES,
  };
};