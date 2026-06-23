export const resolveWebhookActorName = (actor) => (
  actor?.full_name
  || actor?.username
  || actor?.name
  || actor?.email
  || 'Sistema'
);

const truncate = (value = '', max = 1024) => {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
};

export const formatWebhookAttachments = (items = [], emptyText = 'Nenhum documento informado.') => {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { title: item, url: item };
      }

      return {
        title: item.title || item.file_name || item.name || item.url || 'Documento',
        url: item.url || item.preview || ''
      };
    })
    .filter((item) => item?.url);

  if (!normalized.length) return emptyText;

  const lines = normalized.slice(0, 8).map((item, index) => `${index + 1}. ${truncate(item.title, 70)}\n${truncate(item.url, 220)}`);
  if (normalized.length > 8) {
    lines.push(`...e mais ${normalized.length - 8} item(s).`);
  }

  return truncate(lines.join('\n\n'), 1024);
};

export const postWebhookEmbed = async (url, embed) => {
  if (!url) return false;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });

  return response.ok;
};

export const createBaseWebhookEmbed = ({
  title,
  description,
  color = 0x3b82f6,
  actorName = 'Sistema',
  fields = [],
  footerText = 'Sistema CIVIL EUFORIA'
}) => ({
  title: truncate(title, 256),
  description: truncate(description, 4096),
  color,
  fields: [
    { name: 'Registrado por', value: truncate(actorName, 1024), inline: true },
    ...fields
      .filter((field) => field && field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
      .map((field) => ({
        name: truncate(field.name, 256),
        value: truncate(field.value, 1024),
        inline: Boolean(field.inline)
      }))
  ],
  footer: { text: truncate(footerText, 2048) },
  timestamp: new Date().toISOString()
});
