import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useForensics = () => {
  const [forensics, setForensics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchForensics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pericias')
        .select(`
          *,
          pericia_fotos (*)
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

      const forensicsWithProfiles = data.map(item => ({
        ...item,
        officer: profilesMap[item.created_by] || null
      }));

      setForensics(forensicsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar perícias:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addForensics = useCallback(async (data, photos) => {
    try {
      // 1. Create the Forensics Record
      const { data: user } = await supabase.auth.getUser();
      
      const payload = {
        type: data.type,
        title: data.title, // Assuming we want a title for the list view
        description: data.description, // General description
        youtube_link: data.youtube_link,
        created_by: user.user?.id
      };

      const { data: newForensic, error } = await supabase
        .from('pericias')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // 2. Upload Photos and Create Photo Records
      if (photos && photos.length > 0) {
        const photoPromises = photos.map(async (photo) => {
          if (!photo.file) return null;

          const fileExt = photo.file.name.split('.').pop();
          const fileName = `forensics/${newForensic.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('evidence') // Assuming 'evidence' bucket exists, or 'proofs'
            .upload(fileName, photo.file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('evidence')
            .getPublicUrl(fileName);

          return {
            pericia_id: newForensic.id,
            url: publicUrlData.publicUrl,
            description: photo.description
          };
        });

        const photoRecords = (await Promise.all(photoPromises)).filter(Boolean);

        if (photoRecords.length > 0) {
          const { error: photosError } = await supabase
            .from('pericia_fotos')
            .insert(photoRecords);

          if (photosError) throw photosError;
        }
      }

      await fetchForensics(); // Refresh list
      return newForensic.id;
    } catch (error) {
      console.error('Erro ao criar perícia:', error);
      throw error;
    }
  }, [fetchForensics]);

  const deleteForensics = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('pericias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setForensics(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Erro ao deletar perícia:', error);
      throw error;
    }
  }, []);

  return {
    forensics,
    loading,
    fetchForensics,
    addForensics,
    deleteForensics
  };
};
