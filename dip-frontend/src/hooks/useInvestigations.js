import { useState, useCallback, useEffect } from 'react';
import api, { API_URL } from '../services/api';

export const useInvestigations = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapInvestigation = (inv) => ({
    id: inv.id,
    title: inv.titulo,
    description: inv.descricao,
    involved: inv.envolvidos,
    priority: inv.prioridade || 'Média',
    status: inv.status,
    createdAt: inv.createdAt,
    closedAt: inv.dataFim,
    investigator: inv.investigador?.nome,
    proofs: inv.evidences?.map(ev => ({
      id: ev.id,
      type: ev.tipo,
      description: ev.descricao,
      url: ev.conteudo ? `${API_URL}${ev.conteudo}` : null,
      createdAt: ev.data
    })) || []
  });

  const fetchInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/investigations');
      setInvestigations(response.data.map(mapInvestigation));
    } catch (error) {
      console.error('Erro ao buscar investigações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  const addInvestigation = useCallback(async (data) => {
    try {
      const payload = {
        titulo: data.title,
        descricao: data.description,
        envolvidos: data.involved,
        prioridade: data.priority
      };
      const response = await api.post('/investigations', payload);
      const newInv = mapInvestigation(response.data);
      setInvestigations(prev => [newInv, ...prev]);
      return newInv.id;
    } catch (error) {
      console.error('Erro ao criar investigação:', error);
      throw error;
    }
  }, []);

  const getInvestigation = useCallback(async (id) => {
    try {
      const response = await api.get(`/investigations/${id}`);
      return mapInvestigation(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhe da investigação:', error);
      return null;
    }
  }, []);

  const addProof = useCallback(async (investigationId, proofData) => {
    try {
      const formData = new FormData();
      formData.append('tipo', proofData.type);
      formData.append('descricao', proofData.description);
      if (proofData.file) {
        formData.append('arquivo', proofData.file);
      }

      await api.post(`/investigations/${investigationId}/provas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      throw error;
    }
  }, []);

  const closeInvestigation = useCallback(async (id) => {
    try {
      await api.post(`/investigations/${id}/finalizar`);
      setInvestigations(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: 'Finalizada', closedAt: new Date().toISOString() } : inv
      ));
    } catch (error) {
      console.error('Erro ao finalizar investigação:', error);
      throw error;
    }
  }, []);

  return {
    investigations,
    loading,
    addInvestigation,
    getInvestigation,
    addProof,
    closeInvestigation
  };
};
