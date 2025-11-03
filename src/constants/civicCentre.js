export const CIVIC_CENTRE_BASE_URL = 'https://www.examottcc.in';

export const civicCentrePath = (path = '') => {
  if (!path) {
    return CIVIC_CENTRE_BASE_URL;
  }

  if (path.startsWith('http')) {
    return path;
  }

  return `${CIVIC_CENTRE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
