export const getRoleTitles = (roleList = []) => new Set(
  (Array.isArray(roleList) ? roleList : [])
    .map((role) => (typeof role?.title === 'string' ? role.title.trim() : ''))
    .filter(Boolean)
);

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
