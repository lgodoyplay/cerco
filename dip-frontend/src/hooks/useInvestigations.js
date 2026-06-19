import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useInvestigations = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapInvestigation = (inv) => {
    const proofs = [...(inv.provas || [])]
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      .map(ev => ({
        id: ev.id,
        type: ev.tipo,
        title: ev.descricao ? ev.descricao.split(' - ')[0] : 'Evidência',
        description: ev.descricao ? (ev.descricao.includes(' - ') ? ev.descricao.split(' - ').slice(1).join(' - ') : ev.descricao) : '',
        content: ev.url,
        author: ev.uploader?.full_name || 'Agente',
        authorBadge: ev.uploader?.badge || '',
        createdAt: ev.created_at
      }));

    return {
    id: inv.id,
    title: inv.titulo,
    category: inv.categoria || 'criminal',
    description: inv.descricao,
    involved: inv.envolvidos || 'Não informado',
    priority: inv.prioridade || 'Média',
    status: inv.status,
    createdAt: inv.created_at,
    closedAt: inv.data_fim,
    investigator: inv.investigator ? {
      nome: inv.investigator.full_name,
      badge: inv.investigator.badge,
      role: inv.investigator.role
    } : null,
    delegaciaResponsavel: inv.delegacia_responsavel || 'Delegacia Central de Investigações',
    nomeInvestigado: inv.nome_investigado || '',
    cpfInvestigado: inv.cpf_investigado || '',
    dataNascimento: inv.data_nascimento || '',
    enderecoInvestigado: inv.endereco_investigado || '',
    telefoneInvestigado: inv.telefone_investigado || '',
    nomeDelegado: inv.nome_delegado || '',
    proofs,
    // Dados específicos para busca e apreensão
    tipoEntidade: inv.tipo_entidade,
    nomeEntidade: inv.nome_entidade,
    documentoPessoa: inv.documento_pessoa,
    fotoRosto: inv.foto_rosto,
    documentoOrdem: inv.documento_ordem,
    quantidadeCasas: inv.quantidade_casas,
    quantidadeCarros: inv.quantidade_carros,
    nomesCarros: inv.nomes_carros,
    casas: inv.casas || [],
    carros: inv.carros || []
    };
  };

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
      const userIds = [...new Set([
        ...data.map(inv => inv.created_by).filter(Boolean),
        ...data.flatMap(inv => (inv.provas || []).map(prova => prova.uploaded_by).filter(Boolean))
      ])];
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
          } : null,
          provas: (inv.provas || []).map(prova => ({
            ...prova,
            uploader: profilesMap[prova.uploaded_by] || null
          }))
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
        status: 'Em Andamento',
        delegacia_responsavel: data.delegaciaResponsavel,
        nome_investigado: data.nomeInvestigado,
        cpf_investigado: data.cpfInvestigado,
        data_nascimento: data.dataNascimento || null,
        endereco_investigado: data.enderecoInvestigado,
        telefone_investigado: data.telefoneInvestigado,
        nome_delegado: data.nomeDelegado,
        // Dados específicos para busca e apreensão
        tipo_entidade: data.tipoEntidade,
        nome_entidade: data.nomeEntidade,
        documento_pessoa: data.documentoPessoa,
        foto_rosto: data.fotoRosto,
        documento_ordem: data.documentoOrdem,
        quantidade_casas: data.quantidadeCasas,
        quantidade_carros: data.quantidadeCarros,
        nomes_carros: data.nomesCarros,
        casas: data.casas || [],
        carros: data.carros || []
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

      const uploaderIds = [...new Set((data.provas || []).map(prova => prova.uploaded_by).filter(Boolean))];
      let uploadersMap = {};

      if (uploaderIds.length > 0) {
        const { data: uploaders } = await supabase
          .from('profiles')
          .select('id, full_name, badge, role')
          .in('id', uploaderIds);

        if (uploaders) {
          uploadersMap = uploaders.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      const dataWithProfile = {
        ...data,
        investigator: investigatorProfile,
        provas: (data.provas || []).map(prova => ({
          ...prova,
          uploader: uploadersMap[prova.uploaded_by] || null
        }))
      };

      return mapInvestigation(dataWithProfile);
    } catch (error) {
      console.error('Erro ao buscar detalhe da investigação:', error);
      return null;
    }
  }, []);

  const updateSearchSeizureData = useCallback(async (id, data) => {
    try {
      const payload = {};
      
      // Mapear os dados para as colunas do banco
      if (data.tipoEntidade !== undefined) payload.tipo_entidade = data.tipoEntidade;
      if (data.nomeEntidade !== undefined) payload.nome_entidade = data.nomeEntidade;
      if (data.documentoPessoa !== undefined) payload.documento_pessoa = data.documentoPessoa;
      if (data.fotoRosto !== undefined) payload.foto_rosto = data.fotoRosto;
      if (data.documentoOrdem !== undefined) payload.documento_ordem = data.documentoOrdem;
      if (data.quantidadeCasas !== undefined) payload.quantidade_casas = data.quantidadeCasas;
      if (data.quantidadeCarros !== undefined) payload.quantidade_carros = data.quantidadeCarros;
      if (data.nomesCarros !== undefined) payload.nomes_carros = data.nomesCarros;
      if (data.casas !== undefined) payload.casas = data.casas;
      if (data.carros !== undefined) payload.carros = data.carros;

      const { error } = await supabase
        .from('investigacoes')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      // Refresh da lista
      fetchInvestigations();
    } catch (error) {
      console.error('Erro ao atualizar dados de busca e apreensão:', error);
      throw error;
    }
  }, [fetchInvestigations]);

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
      await fetchInvestigations();

    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, [fetchInvestigations]);

  const closeInvestigation = useCallback(async (id) => {
    try {
      const closedAt = new Date().toISOString();

      const { error } = await supabase
        .from('investigacoes')
        .update({ status: 'Finalizada', data_fim: closedAt })
        .eq('id', id);

      if (error) throw error;

      const refreshedInvestigation = await getInvestigation(id);

      if (refreshedInvestigation) {
        setInvestigations(prev => prev.map(inv =>
          inv.id === id ? refreshedInvestigation : inv
        ));
      } else {
        await fetchInvestigations();
      }
    } catch (error) {
      console.error('Erro ao finalizar investigação:', error);
      throw error;
    }
  }, [fetchInvestigations, getInvestigation]);

  const deleteProof = useCallback(async (proofId, investigationId) => {
    try {
      const { data: proof, error: fetchError } = await supabase
        .from('provas')
        .select('url')
        .eq('id', proofId)
        .single();

      if (fetchError) throw fetchError;

      if (proof.url && proof.url.includes('supabase.co/storage')) {
        try {
          const urlParts = proof.url.split('/provas/');
          if (urlParts.length > 1) {
            const filePath = decodeURIComponent(urlParts[1]);
            await supabase.storage.from('provas').remove([filePath]);
          }
        } catch (storageError) {
          console.warn('Não foi possível deletar o arquivo do storage:', storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from('provas')
        .delete()
        .eq('id', proofId);

      if (deleteError) throw deleteError;

      await fetchInvestigations();
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      throw error;
    }
  }, [fetchInvestigations]);

  const editProof = useCallback(async (proofId, proofData) => {
    try {
      let finalContent = proofData.content;

      if (proofData.file) {
        const fileExt = proofData.file.name.split('.').pop();
        const fileName = `proofs/${proofData.investigationId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('provas')
          .upload(fileName, proofData.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('provas').getPublicUrl(fileName);
        finalContent = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('provas')
        .update({
          tipo: proofData.type,
          descricao: proofData.title ? `${proofData.title} - ${proofData.description}` : proofData.description,
          url: finalContent
        })
        .eq('id', proofId);

      if (error) throw error;

      await fetchInvestigations();
    } catch (error) {
      console.error('Erro ao editar prova:', error);
      throw error;
    }
  }, [fetchInvestigations]);

  const editInvestigation = useCallback(async (id, data) => {
    try {
      const payload = {
        titulo: data.title,
        categoria: data.category || 'criminal',
        descricao: data.description,
        envolvidos: data.involved,
        prioridade: data.priority,
        delegacia_responsavel: data.delegaciaResponsavel,
        nome_investigado: data.nomeInvestigado,
        cpf_investigado: data.cpfInvestigado,
        data_nascimento: data.dataNascimento || null,
        endereco_investigado: data.enderecoInvestigado,
        telefone_investigado: data.telefoneInvestigado,
        nome_delegado: data.nomeDelegado
      };

      const { error } = await supabase
        .from('investigacoes')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      fetchInvestigations();
    } catch (error) {
      console.error('Erro ao editar investigação:', error);
      throw error;
    }
  }, [fetchInvestigations]);

  const deleteInvestigation = useCallback(async (id) => {
    try {
      const { data: investigation, error: fetchError } = await supabase
        .from('investigacoes')
        .select('id, provas(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (investigation.provas && investigation.provas.length > 0) {
        for (const proof of investigation.provas) {
          if (proof.url && proof.url.includes('supabase.co/storage')) {
            try {
              const urlParts = proof.url.split('/provas/');
              if (urlParts.length > 1) {
                const filePath = decodeURIComponent(urlParts[1]);
                await supabase.storage.from('provas').remove([filePath]);
              }
            } catch (storageError) {
              console.warn('Não foi possível deletar o arquivo do storage:', storageError);
            }
          }
        }
      }

      const { data: deletedRows, error: deleteError } = await supabase
        .from('investigacoes')
        .delete()
        .eq('id', id)
        .select('id');

      if (deleteError) throw deleteError;

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('A investigacao nao foi excluida. Verifique suas permissoes ou regras do banco.');
      }

      setInvestigations(prev => prev.filter(inv => inv.id !== id));
      await fetchInvestigations();
    } catch (error) {
      console.error('Erro ao deletar investigação:', error);
      throw error;
    }
  }, [fetchInvestigations]);

  return {
    investigations,
    loading,
    addInvestigation,
    getInvestigation,
    addProof,
    closeInvestigation,
    deleteProof,
    editProof,
    editInvestigation,
    deleteInvestigation,
    updateSearchSeizureData
  };
};
