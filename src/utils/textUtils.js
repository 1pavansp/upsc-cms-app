export const stripHtml = (input = '') => {
  if (typeof input !== 'string' || input.length === 0) {
    return '';
  }

  return input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const createSnippet = (input = '', maxLength = 160) => {
  const plain = stripHtml(input);

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trimEnd()}…`;
};
