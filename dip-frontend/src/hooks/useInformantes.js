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
  documents: inv.documents || [],
  createdAt: inv.createdAt || new Date().toISOString(),
  updatedAt: inv.updatedAt || new Date().toISOString(),
});

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
      documents: [],
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

  const addDocument = useCallback((informanteId, doc) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          documents: [...(inf.documents || []), doc],
          updatedAt: new Date().toISOString(),
        };
      }
      return inf;
    });
    setInformantes(updated);
    persist(updated);
  }, [informantes, persist]);

  const removeDocument = useCallback((informanteId, docId) => {
    const updated = informantes.map(inf => {
      if (inf.id === informanteId) {
        return {
          ...inf,
          documents: (inf.documents || []).filter(d => d.id !== docId),
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

  return {
    informantes,
    loading,
    addInformante,
    updateInformante,
    deleteInformante,
    addDocument,
    removeDocument,
    getInformante,
  };
};