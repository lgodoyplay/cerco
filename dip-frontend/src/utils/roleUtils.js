export const getRoleTitles = (roleList = []) => new Set(
  (Array.isArray(roleList) ? roleList : [])
    .map((role) => (typeof role?.title === 'string' ? role.title.trim() : ''))
    .filter(Boolean)
);

export const normalizeRoleName = (roleValue) => {
  if (roleValue == null) return '';
  return String(roleValue).trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export const normalizeRoleAssignment = (roleValue, roleList = []) => {
  const normalizedValue = typeof roleValue === 'string'
    ? roleValue.trim()
    : roleValue == null
      ? ''
      : String(roleValue).trim();

  if (!normalizedValue) return '';

  return getRoleTitles(roleList).has(normalizedValue) ? normalizedValue : '';
};

export const normalizeRoleDisplay = (roleValue) => {
  if (typeof roleValue === 'string') {
    return roleValue.trim();
  }

  return '';
};

export const getRoleColorByName = (roleValue, roleList = []) => {
  const normalizedRole = normalizeRoleName(roleValue);
  if (!normalizedRole) return null;

  const matchingRole = (Array.isArray(roleList) ? roleList : []).find((role) => {
    const roleTitle = role?.title ?? role?.name ?? '';
    return normalizeRoleName(roleTitle) === normalizedRole;
  });

  return matchingRole?.color || null;
};

export const mergeRoleConfigurations = (...roleSources) => {
  const merged = [];

  roleSources.forEach((source) => {
    if (!Array.isArray(source)) return;

    source.forEach((incomingRole) => {
      const title = normalizeRoleDisplay(incomingRole?.title || incomingRole?.name);
      if (!title) return;

      const normalizedTitle = normalizeRoleName(title);
      const existingIndex = merged.findIndex((role) => normalizeRoleName(role.title) === normalizedTitle);

      if (existingIndex === -1) {
        merged.push({
          ...incomingRole,
          title,
          kind: incomingRole?.kind || incomingRole?.category || 'main',
          category: incomingRole?.category || incomingRole?.kind || 'main',
          isThirdParty: incomingRole?.isThirdParty === true || incomingRole?.kind === 'third_party' || incomingRole?.category === 'third_party',
          permissions: Array.isArray(incomingRole?.permissions) ? [...new Set(incomingRole.permissions)] : [],
        });
        return;
      }

      const existing = merged[existingIndex];
      const permissions = new Set([
        ...(Array.isArray(existing.permissions) ? existing.permissions : []),
        ...(Array.isArray(incomingRole?.permissions) ? incomingRole.permissions : []),
      ]);

      merged[existingIndex] = {
        ...existing,
        ...incomingRole,
        title,
        kind: existing.kind || incomingRole?.kind || incomingRole?.category || 'main',
        category: existing.category || incomingRole?.category || incomingRole?.kind || 'main',
        isThirdParty: existing.isThirdParty === true || incomingRole?.isThirdParty === true,
        permissions: Array.from(permissions),
      };
    });
  });

  return merged;
};
