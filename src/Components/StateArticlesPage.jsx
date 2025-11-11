import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import { ensureArticleHasSlug, getArticleRelativePath } from '../utils/articleUtils';
import CommentSystem from './CommentSystem';
import './Home.css';
import './RecentArticlesPage.css';
import './StateArticlesPage.css';
import Seo from './Seo';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '../seo/seoConfig';

const STATE_CONFIGS = {
  telangana: {
    label: 'Telangana',
    description:
      'Follow state-specific current affairs, governance updates, and exam-oriented analysis from Telangana.',
    category: 'Telangana',
    matchers: ['telangana']
  },
  'andhra-pradesh': {
    label: 'Andhra Pradesh',
    description:
      'Track developments, schemes, and relevant headlines from Andhra Pradesh to strengthen your regional preparation.',
    category: 'Andhra Pradesh',
    matchers: ['andhra pradesh', 'andhra-pradesh', 'andhra']
  }
};

const normalizeValue = (value = '') =>
  value?.toString().trim().toLowerCase();

const StateArticlesPage = () => {
  const { stateId } = useParams();
  const stateKey = normalizeValue(stateId);
  const stateConfig = STATE_CONFIGS[stateKey];

  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedDate(null);
    setFilteredArticles([]);
    setIsDateFiltered(false);
  }, [stateConfig]);

  useEffect(() => {
    let isMounted = true;

    const fetchArticles = async () => {
      if (!stateConfig) {
        if (isMounted) {
          setArticles([]);
          setFilteredArticles([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const articlesQuery = query(
          collection(db, 'current-affairs'),
          where('category', '==', stateConfig.category)
        );
        const snapshot = await getDocs(articlesQuery);

        const fetchedArticlesRaw = await Promise.all(
          snapshot.docs.map((docSnap) => ensureArticleHasSlug(docSnap))
        );

        const fetchedArticles = fetchedArticlesRaw
          .map((article) => ({
            ...article,
            title: article.title || 'Untitled Article',
            category: article.category || '',
            summary: article.summary || ''
          }))
          .filter((article) =>
            stateConfig.matchers.includes(normalizeValue(article.category))
          )
          .sort((a, b) => b.date - a.date);

        if (isMounted) {
          setArticles(fetchedArticles);
          setFilteredArticles([]);
        }
      } catch (err) {
        console.error('Error fetching state articles:', err);
        if (isMounted) {
          setError(
            'Unable to load the latest articles for this state right now. Please try again soon.'
          );
          setArticles([]);
          setFilteredArticles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, [stateConfig]);

  const articlesToDisplay = useMemo(
    () => (isDateFiltered ? filteredArticles : articles),
    [articles, filteredArticles, isDateFiltered]
  );

  const sidebarHighlights = useMemo(
    () => articles.slice(0, 5),
    [articles]
  );

  const _handleDateChange = (date) => {
    setSelectedDate(date);

    if (!date) {
      setFilteredArticles([]);
      setIsDateFiltered(false);
      return;
    }

    const { startOfDay, endOfDay } = getDateRange(date);
    const datedArticles = articles.filter(
      (article) => article.date >= startOfDay && article.date <= endOfDay
    );
    setFilteredArticles(datedArticles);
    setIsDateFiltered(true);
  };

  const _clearDateFilter = () => {
    setSelectedDate(null);
    setFilteredArticles([]);
    setIsDateFiltered(false);
  };

  const fallbackStateLabel = stateConfig?.label || 'State Current Affairs';
  const canonicalPath = stateId ? `/state/${stateId}` : '/state';
  const pageTitle = `${fallbackStateLabel} | UPSC State Current Affairs`;
  const pageDescription =
    stateConfig?.description ||
    'State-focused UPSC IAS current affairs, governance updates and schemes curated by Civic Centre IAS.';
  const seoKeywords = stateConfig
    ? [stateConfig.label, `${stateConfig.label} news`, 'UPSC state updates']
    : ['state current affairs', 'regional gs', 'Civic Centre IAS'];

  const structuredData = useMemo(() => {
    const breadcrumbItems = [
      { name: 'Home', path: '/' },
      { name: 'State Current Affairs', path: '/state' }
    ];
    if (stateConfig) {
      breadcrumbItems.push({ name: stateConfig.label, path: canonicalPath });
    }
    const breadcrumb = buildBreadcrumbSchema(breadcrumbItems);
    const collection = stateConfig
      ? buildCollectionPageSchema({
          title: `${stateConfig.label} Current Affairs`,
          description: stateConfig.description,
          path: canonicalPath,
          items: articles.slice(0, 10).map((article) => ({
            title: article.title,
            path: getArticleRelativePath(article),
            date: article.date,
            keywords: [stateConfig.label, article.category].filter(Boolean).join(', ')
          }))
        })
      : null;
    return [breadcrumb, collection].filter(Boolean);
  }, [articles, canonicalPath, stateConfig]);

  if (!stateConfig) {
    return (
      <>
        <Seo
          title="State section unavailable"
          description="We could not find the requested state current affairs section."
          canonicalPath={canonicalPath}
          noIndex
        />
        <main className="main-content state-articles-page missing-state">
          <div className="state-page-empty">
            <div className="section-card">
              <h2>State Not Found</h2>
              <p>
                We couldn&apos;t find a current affairs section for this state yet.
                Head back to the{' '}
                <Link to="/" className="inline-link">
                  home page
                </Link>{' '}
                to explore other resources.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        keywords={seoKeywords}
        canonicalPath={canonicalPath}
        structuredData={structuredData}
      />
      <main className="main-content recent-articles-page state-articles-page">
      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            <section className="content-section">
              <div className="section-card state-articles-lede">
                <h2>{stateConfig.label} Current Affairs</h2>
                <p className="section-lede">{stateConfig.description}</p>
                <div className="state-switcher">
                  {Object.entries(STATE_CONFIGS).map(([key, config]) => (
                    <Link
                      key={key}
                      className={`state-pill ${
                        key === stateKey ? 'active' : ''
                      }`}
                      to={`/state/${key}`}
                    >
                      {config.label}
                      {key === stateKey && <ArrowRight size={16} />}
                    </Link>
                  ))}
                </div>
                {isDateFiltered && selectedDate && (
                  <p className="recent-date-filter-info">
                    Showing articles published on {formatDate(selectedDate)}
                  </p>
                )}
              </div>
            </section>

            <section className="content-section">
              <div className="section-card">
                <h3>Latest from {stateConfig.label}</h3>
                {loading ? (
                  <p>Loading articles...</p>
                ) : error ? (
                  <p className="error-copy">{error}</p>
                ) : articlesToDisplay.length > 0 ? (
                  <ul className="recent-articles-list">
                    {articlesToDisplay.map((article) => (
                      <li key={article.id}>
                        <Link to={`/current-affairs/${article.slug || article.id}`}>
                          {article.title}
                        </Link>
                        <span>{formatDate(article.date)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    {isDateFiltered
                      ? 'No articles were published on the selected date.'
                      : `We haven't published ${stateConfig.label} updates yet. Check back soon!`}
                  </p>
                )}
              </div>
            </section>

            <section className="content-section comment-section-wrapper">
              <CommentSystem />
            </section>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Recent Highlights</h3>
            {sidebarHighlights.length > 0 ? (
              <ul className="updates-list sidebar-article-list">
                {sidebarHighlights.map((article) => (
                  <li key={article.id}>
                    <Link
                      to={`/current-affairs/${article.slug || article.id}`}
                      className="sidebar-article-link"
                    >
                      {article.title}
                    </Link>
                    <small>Posted {formatDate(article.date)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-sidebar-copy">
                Fresh stories for {stateConfig.label} will appear here soon.
              </p>
            )}
          </div>
        </aside>
      </div>
      </main>
    </>
  );
};

export default StateArticlesPage;
