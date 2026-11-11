const TYPE_LABELS = {
  departments: 'Departamento',
  divisions: 'Divisão',
  sectors: 'Setor',
};

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export const buildDefaultCorporation = () => ({
  departments: [
    {
      id: 'department-investigacoes',
      name: 'Departamento de Investigações',
      chiefId: '',
      members: [],
      description: '',
    },
  ],
  divisions: [
    {
      id: 'division-narcoticos',
      name: 'Narcóticos',
      chiefId: '',
      members: [],
      description: '',
    },
  ],
  sectors: [
    {
      id: 'sector-operacional',
      name: 'Operacional',
      chiefId: '',
      members: [],
      description: '',
    },
  ],
});

export const createCorporationItem = (name, type = 'departments') => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: String(name || '').trim(),
  chiefId: '',
  members: [],
  description: '',
});

export const normalizeCorporationEntry = (entry, type = 'departments') => {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const name = entry.trim();
    if (!name) return null;

    return {
      id: `${type}-${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      chiefId: '',
      members: [],
      description: '',
    };
  }

  if (typeof entry !== 'object') return null;

  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  if (!name) {
    const legacyName = typeof entry.title === 'string' ? entry.title.trim() : '';
    if (!legacyName) return null;

    return {
      id: String(entry.id || `${type}-${slugify(legacyName)}-${Math.random().toString(36).slice(2, 8)}`),
      name: legacyName,
      chiefId: entry.chiefId || entry.chief || entry.responsibleId || entry.managerId || '',
      members: Array.isArray(entry.members) ? entry.members.filter(Boolean).map(String) : [],
      description: entry.description || '',
    };
  }

  return {
    id: String(entry.id || `${type}-${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`),
    name,
    chiefId: entry.chiefId || entry.chief || entry.responsibleId || entry.managerId || '',
    members: Array.isArray(entry.members) ? entry.members.filter(Boolean).map(String) : [],
    description: entry.description || '',
  };
};

export const normalizeCorporationList = (list = [], type = 'departments') => {
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeCorporationEntry(item, type))
    .filter(Boolean);
};

export const normalizeCorporationData = (payload = {}) => {
  const base = buildDefaultCorporation();
  const source = payload && typeof payload === 'object' ? payload : {};

  const keys = Object.keys(base);

  return keys.reduce((result, key) => {
    const value = Array.isArray(source[key]) ? source[key] : base[key];
    result[key] = normalizeCorporationList(value, key);
    return result;
  }, {});
};

export const getUserStructureAssignments = (corporation = {}, userId) => {
  if (!userId) return [];

  const normalized = normalizeCorporationData(corporation);
  const assignments = [];

  Object.entries(TYPE_LABELS).forEach(([type, label]) => {
    (normalized[type] || []).forEach((item) => {
      const isChief = String(item.chiefId) === String(userId);
      const isMember = Array.isArray(item.members) && item.members.some((memberId) => String(memberId) === String(userId));

      if (isChief || isMember) {
        assignments.push({
          type,
          label,
          name: item.name,
          role: isChief ? 'chefe' : 'membro',
          itemId: item.id,
        });
      }
    });
  });

  return assignments;
};

export const getCorporateTypeLabel = (type) => TYPE_LABELS[type] || 'Estrutura';
