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
          *,
          laudo_arquivos (*)
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

  const addLaudo = useCallback(async (data, arquivos) => {
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

      // 2. Upload Arquivos and Create File Records
      if (arquivos && arquivos.length > 0) {
        const arquivoPromises = arquivos.map(async (arquivo) => {
          if (!arquivo.file) return null;

          const fileExt = arquivo.file.name.split('.').pop();
          const fileName = `laudos/${newLaudo.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('provas') // Using the same bucket as proofs/evidence
            .upload(fileName, arquivo.file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('provas')
            .getPublicUrl(fileName);

          return {
            laudo_id: newLaudo.id,
            url: publicUrlData.publicUrl,
            descricao: arquivo.descricao
          };
        });

        const arquivoRecords = (await Promise.all(arquivoPromises)).filter(Boolean);

        if (arquivoRecords.length > 0) {
          const { error: arquivosError } = await supabase
            .from('laudo_arquivos')
            .insert(arquivoRecords);

          if (arquivosError) throw arquivosError;
        }
      }

      await fetchLaudos(); // Refresh list
      return newLaudo.id;
    } catch (error) {
      console.error('Erro ao criar laudo:', error);
      throw error;
    }
  }, [fetchLaudos]);

  const getLaudo = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from('laudos_medicos')
        .select(`
          *,
          laudo_arquivos (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch profile manually
      let officerProfile = null;
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, badge, role')
          .eq('id', data.created_by)
          .single();
        
        if (profile) officerProfile = profile;
      }

      const dataWithProfile = {
        ...data,
        officer: officerProfile
      };

      return dataWithProfile;
    } catch (error) {
      console.error('Erro ao buscar detalhe do laudo:', error);
      return null;
    }
  }, []);

  const deleteLaudo = useCallback(async (id) => {
    try {
      // Primeiro, buscar o laudo para obter os arquivos
      const { data: laudo, error: fetchError } = await supabase
        .from('laudos_medicos')
        .select('id, laudo_arquivos (*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Deletar arquivos do storage
      if (laudo.laudo_arquivos && laudo.laudo_arquivos.length > 0) {
        for (const arquivo of laudo.laudo_arquivos) {
          if (arquivo.url && arquivo.url.includes('supabase.co/storage')) {
            try {
              // Extrair o caminho do arquivo da URL pública
              const urlParts = arquivo.url.split('/provas/');
              if (urlParts.length > 1) {
                const filePath = decodeURIComponent(urlParts[1]);
                await supabase.storage.from('provas').remove([filePath]);
              }
            } catch (storageError) {
              console.warn('Não foi possível deletar o arquivo do storage:', storageError);
              // Não lançamos erro aqui para não impedir a exclusão do laudo
            }
          }
        }
      }

      // Deletar o laudo do banco de dados
      const { error: deleteError } = await supabase
        .from('laudos_medicos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh da lista
      fetchLaudos();
    } catch (error) {
      console.error('Erro ao deletar laudo:', error);
      throw error;
    }
  }, [fetchLaudos]);

  return {
    laudos,
    loading,
    fetchLaudos,
    addLaudo,
    getLaudo,
    deleteLaudo
  };
};
