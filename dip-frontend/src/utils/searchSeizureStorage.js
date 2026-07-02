import { supabase } from '../lib/supabase';

const uploadDataUrl = async (dataUrl, fileName) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  const fullName = `busca_e_apreensao/${Date.now()}_${fileName}.${ext}`;

  const { error } = await supabase.storage.from('busca_e_apreensao').upload(fullName, blob);
  if (error) throw error;

  const { data } = supabase.storage.from('busca_e_apreensao').getPublicUrl(fullName);
  return data.publicUrl;
};

const isDataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

export const uploadSearchSeizureFiles = async (formData) => {
  const fotoRosto = isDataUrl(formData.fotoRosto)
    ? await uploadDataUrl(formData.fotoRosto, 'rosto')
    : formData.fotoRosto;

  const documentoOrdem = isDataUrl(formData.documentoOrdem)
    ? await uploadDataUrl(formData.documentoOrdem, 'ordem')
    : formData.documentoOrdem;

  const casas = await Promise.all(
    (formData.casas || []).map(async (casa, i) => {
      const updated = { ...casa };
      for (const campo of ['fotoTranca', 'fotoInterior']) {
        if (isDataUrl(updated[campo])) {
          updated[campo] = await uploadDataUrl(updated[campo], `casa_${i}_${campo}`);
        }
      }
      return updated;
    })
  );

  const carros = await Promise.all(
    (formData.carros || []).map(async (carro, i) => {
      const updated = { ...carro };
      if (isDataUrl(updated.fotoPortaMala)) {
        updated.fotoPortaMala = await uploadDataUrl(updated.fotoPortaMala, `carro_${i}_portaMala`);
      }
      return updated;
    })
  );

  return { ...formData, fotoRosto, documentoOrdem, casas, carros };
};
