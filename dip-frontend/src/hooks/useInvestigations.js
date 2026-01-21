import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useInvestigations = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapInvestigation = (inv) => ({
    id: inv.id,
    title: inv.titulo,
    category: inv.categoria || 'criminal',
    description: inv.descricao,
    involved: inv.envolvidos || 'Não informado',
    priority: inv.prioridade || 'Média',
    status: inv.status,
    createdAt: inv.created_at,
    closedAt: inv.data_fim, // Assuming column name change or keep consistency
    investigator: inv.investigator ? {
      nome: inv.investigator.full_name,
      badge: inv.investigator.badge,
      role: inv.investigator.role
    } : null,
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

      // Buscar perfis separadamente para evitar erro 400 se FK não existir
      const userIds = [...new Set(data.map(inv => inv.created_by).filter(Boolean))];
      let profilesMap = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, badge, role')
          .in('id', userIds);
          
        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      const investigationsWithProfiles = data.map(inv => {
        const profile = profilesMap[inv.created_by];
        return {
          ...inv,
          investigator: profile ? {
            full_name: profile.full_name,
            badge: profile.badge,
            role: profile.role
          } : null
        };
      });

      setInvestigations(investigationsWithProfiles.map(mapInvestigation));
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
        categoria: data.category || 'criminal',
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

      // Buscar perfil do criador manualmente
      let investigatorProfile = null;
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, badge, role')
          .eq('id', data.created_by)
          .single();
        
        if (profile) investigatorProfile = profile;
      }

      const dataWithProfile = {
        ...data,
        investigator: investigatorProfile
      };

      return mapInvestigation(dataWithProfile);
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
