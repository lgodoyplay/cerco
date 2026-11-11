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
