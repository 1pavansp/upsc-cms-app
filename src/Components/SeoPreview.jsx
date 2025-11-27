import React, { useMemo } from 'react';

const stripHtml = (value = '') =>
  value
    .toString()
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value = '', limit = 160) => {
  if (!value) return '';
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
};

const SeoPreview = ({ seo = {}, article = {} }) => {
  const metaTitle = seo.metaTitle || article.title || '';
  const metaDesc = seo.metaDescription || truncate(stripHtml(article.content), 160);
  const image = seo.ogImage || article.imageUrl || '';

  const metaBlock = useMemo(
    () =>
      `<title>${metaTitle}</title>
<meta name="description" content="${metaDesc}" />
<meta property="og:title" content="${metaTitle}" />
<meta property="og:description" content="${metaDesc}" />
<meta property="og:image" content="${image}" />`,
    [metaTitle, metaDesc, image]
  );

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h4 style={{ margin: '0 0 8px' }}>SEO Preview</h4>
      <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{metaTitle || 'Meta title goes here'}</div>
        <div style={{ color: '#444', marginTop: 6 }}>{metaDesc || 'Meta description (160 chars max)'}</div>
        {image ? <img src={image} alt="og" style={{ width: 120, marginTop: 6, borderRadius: 6 }} /> : null}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Head tags</strong>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, marginTop: 6 }}>{metaBlock}</pre>
      </div>
    </div>
  );
};

export default SeoPreview;
