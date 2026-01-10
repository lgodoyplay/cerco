export const getInitials = (name) => {
  if (!name) return '??';
  try {
    return String(name).trim().substring(0, 2).toUpperCase();
  } catch (e) {
    console.error('Error getting initials:', e);
    return '??';
  }
};
