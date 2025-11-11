const BASE_URL = 'https://myblog-e05eb.web.app';

export const SITE_CONFIG = {
  siteName: 'Civic Centre IAS Current Affairs',
  tagline: 'UPSC IAS CMS for daily current affairs, GS analysis and quizzes',
  baseUrl: BASE_URL,
  brandName: 'Civic Centre IAS',
  brandUrl: 'https://www.examottcc.in',
  defaultDescription:
    'Market-ready UPSC IAS current affairs CMS by Civic Centre IAS: curated briefs, GS-wise dashboards, quizzes and past year questions for aspirants across India.',
  defaultKeywords: [
    'UPSC current affairs',
    'IAS daily news',
    'Civic Centre IAS',
    'Exam OTT',
    'GS notes',
    'PYQ analysis',
    'civil services preparation'
  ],
  defaultImage: `${BASE_URL}/assets/logo.png`,
  locale: 'en_IN',
  sameAs: ['https://www.examottcc.in']
};

const ensureLeadingSlash = (value = '') => {
  if (!value) {
    return '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

export const buildCanonicalUrl = (path = '/') => {
  const safePath = ensureLeadingSlash(path);
  return `${SITE_CONFIG.baseUrl}${safePath === '/' ? '' : safePath}`;
};

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_CONFIG.brandName,
  url: SITE_CONFIG.brandUrl,
  logo: SITE_CONFIG.defaultImage,
  sameAs: SITE_CONFIG.sameAs
});

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: SITE_CONFIG.baseUrl,
  name: SITE_CONFIG.siteName,
  description: SITE_CONFIG.defaultDescription,
  inLanguage: SITE_CONFIG.locale
});

export const DEFAULT_STRUCTURED_DATA = [getOrganizationSchema(), getWebsiteSchema()];

export const buildBreadcrumbSchema = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path || '/')
    }))
  };
};

const toIsoDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') return value;
  if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
  return undefined;
};

const sanitizeItemsForSchema = (items = []) =>
  items
    .filter(Boolean)
    .slice(0, 12)
    .map((item) => {
      const isoDate = toIsoDate(item.date) || new Date().toISOString();
      return {
        '@type': 'Article',
        headline: item.title,
        url: buildCanonicalUrl(item.path),
        datePublished: isoDate,
        dateModified: isoDate,
        keywords: item.keywords
      };
    });

export const buildCollectionPageSchema = ({
  title,
  description,
  path = '/',
  items = []
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title,
  description,
  url: buildCanonicalUrl(path),
  isPartOf: buildCanonicalUrl('/'),
  hasPart: sanitizeItemsForSchema(items)
});

export const buildArticleSchema = ({
  title,
  description,
  path,
  image,
  datePublished,
  dateModified,
  keywords = [],
  sections = []
}) => {
  const publishedIso = toIsoDate(datePublished) || new Date().toISOString();
  const modifiedIso = toIsoDate(dateModified) || publishedIso;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: image ? [image] : [SITE_CONFIG.defaultImage],
    mainEntityOfPage: buildCanonicalUrl(path),
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.brandName,
      url: SITE_CONFIG.brandUrl
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.brandName,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.defaultImage
      }
    },
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
    articleSection: sections
  };
};
