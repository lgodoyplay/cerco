import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'dip_informantes_entries';

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.error('Failed to save entries to storage');
  }
};

const CATEGORIES = ['testemunho', 'evidencia', 'dica', 'documento', 'observacao', 'linha', 'outro'];
const PRIORITIES = ['Alta', 'Média', 'Baixa'];
const ENTRY_STATUSES = ['Pendente', 'Revisado', 'Verificado'];

export const useInformantes = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const data = loadFromStorage();
    if (isMounted.current) {
      setEntries(data);
      setLoading(false);
    }
  }, []);

  const persist = useCallback((updated) => {
    if (!isMounted.current) return;
    saveToStorage(updated);
  }, []);

  const addEntry = useCallback((entryData) => {
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
    const updated = [newEntry, ...entries];
    setEntries(updated);
    persist(updated);
    return newEntry;
  }, [entries, persist]);

  const updateEntry = useCallback((entryId, entryData) => {
    const updated = entries.map(entry =>
      entry.id === entryId
        ? { ...entry, ...entryData, updatedAt: new Date().toISOString() }
        : entry
    );
    setEntries(updated);
    persist(updated);
  }, [entries, persist]);

  const deleteEntry = useCallback((entryId) => {
    const updated = entries.filter(entry => entry.id !== entryId);
    setEntries(updated);
    persist(updated);
  }, [entries, persist]);

  const addEntryFile = useCallback((entryId, file) => {
    const updated = entries.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            files: [...(entry.files || []), file],
            updatedAt: new Date().toISOString(),
          }
        : entry
    );
    setEntries(updated);
    persist(updated);
  }, [entries, persist]);

  const removeEntryFile = useCallback((entryId, fileId) => {
    const updated = entries.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            files: (entry.files || []).filter(f => f.id !== fileId),
            updatedAt: new Date().toISOString(),
          }
        : entry
    );
    setEntries(updated);
    persist(updated);
  }, [entries, persist]);

  const getStats = useCallback(() => {
    return {
      total: entries.length,
      pending: entries.filter(e => e.status === 'Pendente').length,
      reviewed: entries.filter(e => e.status === 'Revisado').length,
      verified: entries.filter(e => e.status === 'Verificado').length,
      byCategory: entries.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {}),
      byPriority: entries.reduce((acc, e) => {
        acc[e.priority] = (acc[e.priority] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [entries]);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    addEntryFile,
    removeEntryFile,
    getStats,
    CATEGORIES,
    PRIORITIES,
    ENTRY_STATUSES,
  };
};