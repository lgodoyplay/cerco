const normalizeUrl = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const getYouTubeEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/watch')) {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : '';
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/').filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : '';
      }

      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }
    }
  } catch {
    return '';
  }

  return '';
};

const getVimeoEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'player.vimeo.com') return url;
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
};

const getDailymotionEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'dailymotion.com') {
      if (parsed.pathname.startsWith('/embed/video/')) return url;
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.dailymotion.com/embed/video/${id}` : '';
    }

    if (host === 'dai.ly') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.dailymotion.com/embed/video/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
};

const getGoogleDriveEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'drive.google.com') return '';

    if (parsed.pathname.includes('/file/d/')) {
      const parts = parsed.pathname.split('/file/d/')[1]?.split('/');
      const id = parts?.[0];
      return id ? `https://drive.google.com/file/d/${id}/preview` : '';
    }

    const id = parsed.searchParams.get('id');
    return id ? `https://drive.google.com/file/d/${id}/preview` : '';
  } catch {
    return '';
  }
};

const getStreamableEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'streamable.com') return '';

    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id ? `https://streamable.com/e/${id}` : '';
  } catch {
    return '';
  }
};

const getLoomEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'loom.com') return '';

    const parts = parsed.pathname.split('/').filter(Boolean);
    const id = parts[1];
    return id ? `https://www.loom.com/embed/${id}` : '';
  } catch {
    return '';
  }
};

export const getInvestigationVideoMedia = (rawUrl = '') => {
  const url = normalizeUrl(rawUrl);
  const isDirectVideo = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|$)/i.test(url);

  if (!url) {
    return {
      url: '',
      isDirectVideo: false,
      embedUrl: '',
      fallbackIframeUrl: '',
      externalUrl: ''
    };
  }

  const embedUrl =
    getYouTubeEmbedUrl(url)
    || getVimeoEmbedUrl(url)
    || getDailymotionEmbedUrl(url)
    || getGoogleDriveEmbedUrl(url)
    || getStreamableEmbedUrl(url)
    || getLoomEmbedUrl(url)
    || '';

  return {
    url,
    isDirectVideo,
    embedUrl,
    fallbackIframeUrl: !isDirectVideo && !embedUrl ? url : '',
    externalUrl: url
  };
};

export const normalizeInvestigationProofUrl = normalizeUrl;
