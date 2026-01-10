import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useInvestigations = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapInvestigation = (inv) => ({
    id: inv.id,
    title: inv.titulo,
    description: inv.descricao,
    involved: inv.envolvidos || 'Não informado',
    priority: inv.prioridade || 'Média',
    status: inv.status,
    createdAt: inv.created_at,
    closedAt: inv.data_fim, // Assuming column name change or keep consistency
    investigator: inv.responsavel_id, // temporarily removed profile join until relation is fixed
    proofs: inv.provas?.map(ev => ({
      id: ev.id,
      type: ev.tipo,
      title: ev.descricao ? ev.descricao.split(' - ')[0] : 'Evidência',
      description: ev.descricao ? (ev.descricao.includes(' - ') ? ev.descricao.split(' - ').slice(1).join(' - ') : ev.descricao) : '',
      content: ev.url,
      author: 'Agente',
      createdAt: ev.created_at
    })) || []
  });

  const fetchInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investigacoes')
        .select(`
          *,
          provas(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestigations(data.map(mapInvestigation));
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
        prioridade: data.priority,
        status: 'Em Andamento'
      };

      const { data: newInv, error } = await supabase
        .from('investigacoes')
        .insert([payload])
        .select(`*`)
        .single();

      if (error) throw error;

      const mapped = mapInvestigation(newInv);
      setInvestigations(prev => [mapped, ...prev]);
      return mapped.id;
    } catch (error) {
      console.error('Erro ao criar investigação:', error);
      throw error;
    }
  }, []);

  const getInvestigation = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from('investigacoes')
        .select(`
          *,
          provas(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapInvestigation(data);
    } catch (error) {
      console.error('Erro ao buscar detalhe da investigação:', error);
      return null;
    }
  }, []);

  const addProof = useCallback(async (investigationId, proofData) => {
    try {
      let finalContent = proofData.content;

      if (proofData.file) {
        const fileExt = proofData.file.name.split('.').pop();
        const fileName = `proofs/${investigationId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('provas')
          .upload(fileName, proofData.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('provas').getPublicUrl(fileName);
        finalContent = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('provas')
        .insert([{
          investigacao_id: investigationId,
          tipo: proofData.type,
          descricao: proofData.title ? `${proofData.title} - ${proofData.description}` : proofData.description,
          url: finalContent,
          uploaded_by: proofData.authorId
        }]);

      if (error) throw error;

      // Refresh list
      fetchInvestigations();

    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, [fetchInvestigations]);

  const closeInvestigation = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('investigacoes')
        .update({ status: 'Finalizada' }) // removed closedAt as I didn't add it to schema explicitly, rely on status
        .eq('id', id);

      if (error) throw error;

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
