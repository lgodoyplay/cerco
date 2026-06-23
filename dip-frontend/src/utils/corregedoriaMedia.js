const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const stripWrappingChars = (value = '') => {
  let output = String(value || '').trim();
  output = output.replace(/^[`'"]+/, '').replace(/[`'"]+$/, '').trim();
  output = output.replace(/^[{\[]+/, (match) => match);
  return output;
};

const extractUrlCandidate = (input) => {
  let value = stripWrappingChars(input);
  if (!value) return '';

  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    decoded = safeDecodeURIComponent(decoded);
  }

  const candidates = [decoded, value];

  for (const candidate of candidates) {
    const urlPropertyMatch = candidate.match(/["']url["']\s*:\s*["']([^"']+)["']/i);
    if (urlPropertyMatch?.[1]) {
      return urlPropertyMatch[1];
    }

    const directUrlMatch = candidate.match(/https?:\/\/[^\s"'`<>()]+/i);
    if (directUrlMatch?.[0]) {
      return directUrlMatch[0];
    }

    const sloppyHttpsMatch = candidate.match(/https?\/\/[^\s"'`<>()]+/i);
    if (sloppyHttpsMatch?.[0]) {
      return sloppyHttpsMatch[0];
    }

    const youtubeMatch = candidate.match(/(?:youtu\.be|youtube\.com)[^\s"'`<>()]+/i);
    if (youtubeMatch?.[0]) {
      return youtubeMatch[0];
    }
  }

  return decoded;
};

export const normalizeExternalUrl = (value = '') => {
  let normalized = extractUrlCandidate(value)
    .replace(/\\\//g, '/')
    .replace(/^https\/\//i, 'https://')
    .replace(/^http\/\//i, 'http://')
    .replace(/^https:(?!\/\/)/i, 'https://')
    .replace(/^http:(?!\/\/)/i, 'http://')
    .replace(/^www\./i, 'https://www.')
    .trim();

  normalized = normalized
    .replace(/[}"'`\]]+$/g, '')
    .replace(/^"+|"+$/g, '')
    .trim();

  if (!normalized) return '';

  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized)) {
    normalized = `https://${normalized.replace(/^\/+/, '')}`;
  }

  return normalized;
};

const getYoutubeEmbedUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace(/^\/+/, '').split('/')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    if (host === 'youtube.com' && parsedUrl.pathname.startsWith('/shorts/')) {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch {
    return '';
  }

  return '';
};

export const parseCorregedoriaAttachment = (item) => {
  const rawObject = item && typeof item === 'object' ? item : null;
  const rawUrl = rawObject?.url || item || '';
  const url = normalizeExternalUrl(rawUrl);
  const isLink = rawObject?.type === 'link' || (!rawObject?.type && !/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v|pdf)$/i.test(url));
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideoFile = /\.(mp4|webm|mov|m4v)$/i.test(url);
  const youtubeEmbedUrl = getYoutubeEmbedUrl(url);
  const isVideo = Boolean(isVideoFile || youtubeEmbedUrl);

  const displayName = rawObject?.name
    || rawObject?.title
    || (isLink ? url : safeDecodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Arquivo'));

  return {
    raw: item,
    type: rawObject?.type || (isImage ? 'image' : isVideo ? 'video' : isLink ? 'link' : 'file'),
    url,
    displayName,
    isLink,
    isImage,
    isVideo,
    isVideoFile,
    youtubeEmbedUrl
  };
};
