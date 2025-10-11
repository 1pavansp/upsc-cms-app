export const extractYoutubeVideoId = (url = '') => {
  try {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    if (!trimmedUrl.startsWith('http')) {
      return trimmedUrl.slice(0, 11);
    }

    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '').slice(0, 11);
    }

    if (parsedUrl.searchParams.has('v')) {
      return parsedUrl.searchParams.get('v');
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1].slice(0, 11);
    }
  } catch (error) {
    console.warn('Unable to parse YouTube URL:', url, error);
  }
  return '';
};

export const getYoutubeEmbedUrl = (url = '') => {
  const videoId = extractYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
};

