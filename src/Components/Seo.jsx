import { Helmet } from 'react-helmet-async';
import {
  SITE_CONFIG,
  DEFAULT_STRUCTURED_DATA,
  buildCanonicalUrl
} from '../seo/seoConfig';

const flattenArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const Seo = ({
  title,
  description,
  keywords = [],
  canonicalPath = '/',
  ogType = 'website',
  image,
  noIndex = false,
  structuredData = [],
  additionalMeta = []
}) => {
  const resolvedTitle = title
    ? `${title} | ${SITE_CONFIG.siteName}`
    : `${SITE_CONFIG.siteName} | ${SITE_CONFIG.tagline}`;
  const resolvedDescription = description || SITE_CONFIG.defaultDescription;
  const resolvedKeywords = flattenArray(keywords).length
    ? flattenArray(keywords).filter(Boolean).join(', ')
    : SITE_CONFIG.defaultKeywords.join(', ');
  const resolvedImage = image || SITE_CONFIG.defaultImage;
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

  const structuredSchemas = [
    ...DEFAULT_STRUCTURED_DATA,
    ...flattenArray(structuredData)
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={resolvedKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:site_name" content={SITE_CONFIG.siteName} />
      <meta property="og:locale" content={SITE_CONFIG.locale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:url" content={canonicalUrl} />
      {flattenArray(additionalMeta).map((meta, index) => {
        if (!meta?.name && !meta?.property) {
          return null;
        }
        return <meta key={`meta-${index}`} {...meta} />;
      })}
      {structuredSchemas.map((schema, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  );
};

export default Seo;
