import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAlvaras = () => {
  const [alvaras, setAlvaras] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapAlvara = (alv) => ({
    id: alv.id,
    estabelecimento: alv.estabelecimento,
    endereco: alv.endereco,
    fotoLocal: alv.foto_local,
    dataEmissao: alv.data_emissao,
    dataValidade: alv.data_validade,
    status: alv.status,
    createdAt: alv.created_at,
    updatedAt: alv.updated_at,
    createdBy: alv.created_by,
    renovacoes: alv.renovacoes || []
  });

  const fetchAlvaras = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alvaras')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlvaras(data.map(mapAlvara));
    } catch (error) {
      console.error('Erro ao buscar alvarás:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlvaras();
  }, [fetchAlvaras]);

  const addAlvara = useCallback(async (data) => {
    try {
      let finalFoto = data.fotoLocal;

      if (data.file) {
        const fileExt = data.file.name.split('.').pop();
        const fileName = `alvaras/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('alvaras')
          .upload(fileName, data.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('alvaras').getPublicUrl(fileName);
        finalFoto = urlData.publicUrl;
      }

      const payload = {
        estabelecimento: data.estabelecimento,
        endereco: data.endereco,
        foto_local: finalFoto,
        data_emissao: data.dataEmissao,
        data_validade: data.dataValidade,
        status: 'Ativo'
      };

      const { data: newAlv, error } = await supabase
        .from('alvaras')
        .insert([payload])
        .select(`*`)
        .single();

      if (error) throw error;
      const mapped = mapAlvara(newAlv);
      setAlvaras(prev => [mapped, ...prev]);
      return mapped.id;
    } catch (error) {
      console.error('Erro ao criar alvará:', error);
      throw error;
    }
  }, []);

  const getAlvara = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from('alvaras')
        .select(`*`)
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapAlvara(data);
    } catch (error) {
      console.error('Erro ao buscar detalhe do alvará:', error);
      return null;
    }
  }, []);

  const renovarAlvara = useCallback(async (id, novaValidade) => {
    try {
      const { error } = await supabase
        .from('alvaras')
        .update({ 
          data_validade: novaValidade, 
          status: 'Ativo' 
        })
        .eq('id', id);

      if (error) throw error;
      fetchAlvaras();
    } catch (error) {
      console.error('Erro ao renovar alvará:', error);
      throw error;
    }
  }, [fetchAlvaras]);

  const averiguarAlvara = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('alvaras')
        .update({ status: 'Averiguado' })
        .eq('id', id);

      if (error) throw error;
      fetchAlvaras();
    } catch (error) {
      console.error('Erro ao averiguar alvará:', error);
      throw error;
    }
  }, [fetchAlvaras]);

  return {
    alvaras,
    loading,
    addAlvara,
    getAlvara,
    renovarAlvara,
    averiguarAlvara,
    fetchAlvaras
  };
};
