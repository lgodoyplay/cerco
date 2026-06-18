import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useLaudos = () => {
  const [laudos, setLaudos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLaudos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('laudos_medicos')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles manually like in useInvestigations
      const userIds = [...new Set(data.map(item => item.created_by).filter(Boolean))];
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

      const laudosWithProfiles = data.map(item => ({
        ...item,
        officer: profilesMap[item.created_by] || null
      }));

      setLaudos(laudosWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar laudos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLaudo = useCallback(async (data) => {
    try {
      // 1. Create the Laudo Record
      const { data: user } = await supabase.auth.getUser();
      
      const payload = {
        paciente_nome: data.paciente_nome,
        paciente_documento: data.paciente_documento,
        tipo_laudo: data.tipo_laudo,
        conteudo: data.conteudo,
        created_by: user.user?.id
      };

      const { data: newLaudo, error } = await supabase
        .from('laudos_medicos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      await fetchLaudos(); // Refresh list
      return newLaudo.id;
    } catch (error) {
      console.error('Erro ao criar laudo:', error);
      throw error;
    }
  }, [fetchLaudos]);

  const deleteLaudo = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('laudos_medicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLaudos(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Erro ao deletar laudo:', error);
      throw error;
    }
  }, []);

  return {
    laudos,
    loading,
    fetchLaudos,
    addLaudo,
    deleteLaudo
  };
};
