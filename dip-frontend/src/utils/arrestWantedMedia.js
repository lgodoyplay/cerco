const safeParseJson = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeEntry = (entry, index, fallbackLabel = 'Midia') => {
  if (!entry) return null;

  if (typeof entry === 'string') {
    return {
      key: `media_${index}`,
      label: `${fallbackLabel} ${index + 1}`,
      url: entry
    };
  }

  const url = entry.url || entry.src || entry.path || null;
  if (!url) return null;

  return {
    key: entry.key || `media_${index}`,
    label: entry.label || `${fallbackLabel} ${index + 1}`,
    url
  };
};

export const normalizeMediaEntries = (rawMedia, fallbackEntries = [], fallbackLabel = 'Midia') => {
  const parsedEntries = safeParseJson(rawMedia)
    .map((entry, index) => normalizeEntry(entry, index, fallbackLabel))
    .filter(Boolean);

  const fallbackNormalized = fallbackEntries
    .map((entry, index) => normalizeEntry(entry, index, fallbackLabel))
    .filter(Boolean);

  const seen = new Set();
  return [...parsedEntries, ...fallbackNormalized].filter((entry) => {
    if (!entry?.url || seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
};

export const buildArrestRecord = (item, linkedBo) => {
  const mediaEntries = normalizeMediaEntries(
    item.midias_json,
    item.foto_principal
      ? [{ key: 'face', label: 'Foto do Detento', url: item.foto_principal }]
      : [],
    'Foto'
  );

  const images = {
    face: mediaEntries.find((entry) => entry.key === 'face')?.url || item.foto_principal || null,
    bag: mediaEntries.find((entry) => entry.key === 'bag')?.url || null,
    tablet: mediaEntries.find((entry) => entry.key === 'tablet')?.url || null,
    approach: mediaEntries.find((entry) => entry.key === 'approach')?.url || null
  };

  return {
    ...item,
    name: item.nome,
    passport: item.documento,
    reason: item.motivo_prisao || item.observacoes || '',
    articles: item.artigo || '',
    officer: item.conduzido_por || 'N/A',
    description: item.observacoes || '',
    broughtByOtherPolice: item.conduzido_por_outra_policia,
    boId: item.bo_id,
    linkedBo,
    images,
    mediaEntries,
    date: item.data_prisao
  };
};

export const buildWantedRecord = (item, linkedBo) => {
  const mediaEntries = normalizeMediaEntries(
    item.midias_json,
    item.foto_principal
      ? [{ key: 'proof1', label: 'Foto Principal', url: item.foto_principal }]
      : [],
    'Prova'
  );

  const image = mediaEntries.find((entry) => entry.key === 'proof1')?.url || item.foto_principal || null;

  return {
    ...item,
    name: item.nome,
    crime: item.motivo,
    reason: item.motivo,
    dangerLevel: item.periculosidade,
    reward: item.recompensa,
    date: item.created_at,
    image,
    document: item.documento,
    boId: item.bo_id,
    linkedBo,
    observations: item.observacoes || '',
    mediaEntries
  };
};
