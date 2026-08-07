export const getVisibleNotifications = (items = [], currentUserId = null) => {
  if (!Array.isArray(items)) return [];

  return items.filter((item) => {
    const targetUser = item?.user_id ?? item?.recipient_id ?? null;
    if (!currentUserId) return !targetUser;
    return targetUser === null || targetUser === currentUserId;
  });
};

export const dedupeNotifications = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = [item?.source_type || 'notification', item?.title, item?.message, item?.user_id ?? null, item?.recipient_id ?? null].join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
