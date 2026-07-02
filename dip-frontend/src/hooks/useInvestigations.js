import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'];

const createEmptyInvestigated = () => ({ nome: '', cpf: '' });

const normalizeInvestigatedList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      nome: String(item?.nome || item?.name || '').trim(),
      cpf: String(item?.cpf || item?.documento || '').trim()
    }))
    .filter((item) => item.nome || item.cpf);
};

const buildLegacyInvestigatedList = (inv) => {
  const nome = String(inv.nome_investigado || '').trim();
  const cpf = String(inv.cpf_investigado || '').trim();
  return nome || cpf ? [{ nome, cpf }] : [];
};

const getInvestigationPayload = (data) => {
  const investigados = normalizeInvestigatedList(data.investigados);
  const principalInvestigado = investigados[0] || {};
  return {
    titulo: data.title,
    categoria: data.category || 'criminal',
    descricao: data.description,
    envolvidos: data.involved,
    prioridade: data.priority,
    delegacia_responsavel: data.delegaciaResponsavel,
    nome_investigado: data.nomeInvestigado || principalInvestigado.nome || '',
    cpf_investigado: data.cpfInvestigado || principalInvestigado.cpf || '',
    data_nascimento: data.dataNascimento || null,
    endereco_investigado: data.enderecoInvestigado,
    telefone_investigado: data.telefoneInvestigado,
    nome_delegado: data.nomeDelegado,
    tipo_alvo_investigacao: data.tipoAlvoInvestigacao || 'pessoa',
    nome_organizacao_investigada: data.nomeOrganizacaoInvestigada || '',
    investigados_json: investigados,
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
};

const normalizeProofType = (type, content = '') => {
  const t = String(type || '').trim().toLowerCase();
  const c = String(content || '').toLowerCase();
  if (t === 'image' || t === 'imagem' || t === 'foto' || t === 'fotografia' || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(c)) return 'image';
  if (t === 'vídeo' || t === 'video') return 'video';
  if (t === 'arquivo' || t === 'documento') return 'file';
  if (t === 'texto') return 'text';
  if (t === 'link') return 'link';
  return t || 'file';
};

const mapInvestigation = (inv) => {
  const investigados = normalizeInvestigatedList(inv.investigados_json);
  const investigadosFallback = investigados.length ? investigados : buildLegacyInvestigatedList(inv);
  const principalInvestigado = investigadosFallback[0] || createEmptyInvestigated();
  const proofs = [...(inv.provas || [])]
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    .map(ev => ({
      id: ev.id,
      type: normalizeProofType(ev.tipo, ev.url),
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
    nomeInvestigado: inv.nome_investigado || principalInvestigado.nome || '',
    cpfInvestigado: inv.cpf_investigado || principalInvestigado.cpf || '',
    dataNascimento: inv.data_nascimento || '',
    enderecoInvestigado: inv.endereco_investigado || '',
    telefoneInvestigado: inv.telefone_investigado || '',
    nomeDelegado: inv.nome_delegado || '',
    tipoAlvoInvestigacao: inv.tipo_alvo_investigacao || 'pessoa',
    nomeOrganizacaoInvestigada: inv.nome_organizacao_investigada || '',
    investigados: investigadosFallback,
    proofs,
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

const INVESTIGATION_SELECT = `
  *,
  investigator:profiles!created_by(full_name, badge, role),
  provas(*, uploader:profiles!uploaded_by(full_name, badge, role))
`;

export const useInvestigations = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investigacoes')
        .select(INVESTIGATION_SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (isMounted.current) setInvestigations(data.map(mapInvestigation));
    } catch (error) {
      console.error('Erro ao buscar investigações:', error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  const addInvestigation = useCallback(async (data) => {
    try {
      const { data: newInv, error } = await supabase
        .from('investigacoes')
        .insert([{ ...getInvestigationPayload(data), status: 'Em Andamento' }])
        .select(INVESTIGATION_SELECT)
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
        .select(INVESTIGATION_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapInvestigation(data);
    } catch (error) {
      console.error('Erro ao buscar detalhe da investigação:', error);
      return null;
    }
  }, []);

  const editInvestigation = useCallback(async (id, data) => {
    try {
      const { error } = await supabase
        .from('investigacoes')
        .update(getInvestigationPayload(data))
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
        .select('id, provas(url)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const storageFiles = (investigation.provas || [])
        .filter(p => p.url?.includes('supabase.co/storage'))
        .map(p => {
          const parts = p.url.split('/provas/');
          return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
        })
        .filter(Boolean);

      if (storageFiles.length > 0) {
        await supabase.storage.from('provas').remove(storageFiles);
      }

      const { data: deletedRows, error: deleteError } = await supabase
        .from('investigacoes')
        .delete()
        .eq('id', id)
        .select('id');

      if (deleteError) throw deleteError;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('A investigacao nao foi excluida. Verifique as politicas de DELETE no Supabase.');
      }

      setInvestigations(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Erro ao deletar investigação:', error);
      throw error;
    }
  }, []);

  const addProof = useCallback(async (investigationId, proofData) => {
    try {
      if (proofData.file) {
        if (!ALLOWED_FILE_TYPES.includes(proofData.file.type)) {
          throw new Error('Tipo de arquivo não permitido.');
        }
        const fileExt = proofData.file.name.split('.').pop();
        const fileName = `proofs/${investigationId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas').upload(fileName, proofData.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('provas').getPublicUrl(fileName);
        proofData = { ...proofData, content: urlData.publicUrl };
      }

      const { error } = await supabase.from('provas').insert([{
        investigacao_id: investigationId,
        tipo: proofData.type,
        descricao: proofData.title ? `${proofData.title} - ${proofData.description}` : proofData.description,
        url: proofData.content,
        uploaded_by: proofData.authorId
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      throw error;
    }
  }, []);

  const editProof = useCallback(async (proofId, proofData) => {
    try {
      let finalContent = proofData.content;

      if (proofData.file) {
        if (!ALLOWED_FILE_TYPES.includes(proofData.file.type)) {
          throw new Error('Tipo de arquivo não permitido.');
        }
        const fileExt = proofData.file.name.split('.').pop();
        const fileName = `proofs/${proofData.investigationId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas').upload(fileName, proofData.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('provas').getPublicUrl(fileName);
        finalContent = urlData.publicUrl;
      }

      const { error } = await supabase.from('provas').update({
        tipo: proofData.type,
        descricao: proofData.title ? `${proofData.title} - ${proofData.description}` : proofData.description,
        url: finalContent
      }).eq('id', proofId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao editar prova:', error);
      throw error;
    }
  }, []);

  const deleteProof = useCallback(async (proofId) => {
    try {
      const { data: proof, error: fetchError } = await supabase
        .from('provas').select('url').eq('id', proofId).single();

      if (fetchError) throw fetchError;

      if (proof.url?.includes('supabase.co/storage')) {
        const parts = proof.url.split('/provas/');
        if (parts.length > 1) {
          await supabase.storage.from('provas').remove([decodeURIComponent(parts[1])]);
        }
      }

      const { error: deleteError } = await supabase.from('provas').delete().eq('id', proofId);
      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      throw error;
    }
  }, []);

  const closeInvestigation = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('investigacoes')
        .update({ status: 'Finalizada', data_fim: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return await getInvestigation(id);
    } catch (error) {
      console.error('Erro ao finalizar investigação:', error);
      throw error;
    }
  }, [getInvestigation]);

  const updateSearchSeizureData = useCallback(async (id, data) => {
    try {
      const payload = {};
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

      const { error } = await supabase.from('investigacoes').update(payload).eq('id', id);
      if (error) throw error;
      fetchInvestigations();
    } catch (error) {
      console.error('Erro ao atualizar dados de busca e apreensão:', error);
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
