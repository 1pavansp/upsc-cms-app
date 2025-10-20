import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar as CalendarIcon, Twitter, Facebook, Printer } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-quill/dist/quill.snow.css';
import { formatDate, getDateRange } from '../utils/dateUtils';
import { ensureArticleHasSlug, normalizeFirestoreDate, slugify } from '../utils/articleUtils';
import './ArticlePage.css';
import CommentSystem from './CommentSystem';

const GS_TAGS = ['GS1', 'GS2', 'GS3', 'GS4'];
const STATE_TAGS = [
  {
    id: 'telangana',
    label: 'Telangana',
    description: 'State-focused briefs'
  },
  {
    id: 'andhra-pradesh',
    label: 'Andhra Pradesh',
    description: 'Regional updates'
  }
];
const RECENT_SIDEBAR_LIMIT = 6;
const RELATED_ARTICLES_LIMIT = 6;

const ArticleActions = ({ article }) => {
  const articleUrl = window.location.href;
  const text = `Check out this article: ${article?.title}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(text)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${articleUrl}`)}`;

  return (
    <div className="article-actions">
      <div className="share-buttons">
        <span>Share:</span>
        <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="share-button twitter">
          <Twitter size={16} />
          <span>Twitter</span>
        </a>
        <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="share-button facebook">
          <Facebook size={16} />
          <span>Facebook</span>
        </a>
        <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="share-button whatsapp">
          WhatsApp
        </a>
      </div>
      <button onClick={() => window.print()} className="print-button">
        <Printer size={16} />
        <span>Print / PDF</span>
      </button>
    </div>
  );
};

const ArticlePage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [recentSidebarArticles, setRecentSidebarArticles] = useState([]);

  const fetchArticlesByDate = async (date) => {
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const affairsQuery = query(
        collection(db, 'current-affairs'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc')
      );

      const affairsSnapshot = await getDocs(affairsQuery);
      const dateFilteredArticles = await Promise.all(
        affairsSnapshot.docs.map((docSnap) => ensureArticleHasSlug(docSnap))
      );

      setFilteredArticles(dateFilteredArticles);
      setIsDateFiltered(true);
    } catch (err) {
      console.error('Error fetching articles by date:', err);
      setFilteredArticles([]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      fetchArticlesByDate(date);
    } else {
      setIsDateFiltered(false);
      setFilteredArticles([]);
    }
  };

  useEffect(() => {
    const fetchArticleData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!articleId) {
          setError('We could not find the requested article.');
          setLoading(false);
          return;
        }

        let resolvedSnapshot = null;
        let primaryArticle = null;

        const directDocRef = doc(db, 'current-affairs', articleId);
        const directSnapshot = await getDoc(directDocRef);

        if (directSnapshot.exists()) {
          resolvedSnapshot = directSnapshot;
          primaryArticle = await ensureArticleHasSlug(directSnapshot);
          if (articleId !== primaryArticle.slug) {
            navigate(`/current-affairs/${primaryArticle.slug}`, { replace: true });
          }
        } else {
          const slugQuery = query(
            collection(db, 'current-affairs'),
            where('slug', '==', articleId),
            limit(1)
          );
          const slugSnapshot = await getDocs(slugQuery);

          if (!slugSnapshot.empty) {
            resolvedSnapshot = slugSnapshot.docs[0];
            primaryArticle = await ensureArticleHasSlug(resolvedSnapshot);
            if (articleId !== primaryArticle.slug) {
              navigate(`/current-affairs/${primaryArticle.slug}`, { replace: true });
            }
          }
        }

        if (!resolvedSnapshot || !primaryArticle) {
          setError('We could not find the requested article.');
          setLoading(false);
          return;
        }

        primaryArticle.date = normalizeFirestoreDate(primaryArticle.date);

        try {
          const allArticlesSnapshot = await getDocs(
            query(collection(db, 'current-affairs'), orderBy('date', 'desc'))
          );
          const allArticles = await Promise.all(
            allArticlesSnapshot.docs.map((docSnap) => ensureArticleHasSlug(docSnap))
          );
          const currentIndex = allArticles.findIndex((item) => item.id === primaryArticle.id);

          if (currentIndex > 0) {
            const nextArticle = allArticles[currentIndex - 1];
            primaryArticle.nextArticle = {
              id: nextArticle.id,
              slug: nextArticle.slug,
              title: nextArticle.title
            };
          }

          if (currentIndex < allArticles.length - 1) {
            const previousArticle = allArticles[currentIndex + 1];
            primaryArticle.previousArticle = {
              id: previousArticle.id,
              slug: previousArticle.slug,
              title: previousArticle.title
            };
          }
        } catch (navError) {
          console.warn('Error fetching navigation articles:', navError);
        }

        setArticle(primaryArticle);
        document.title = `${primaryArticle.title} | CivicCentre IAS`;

        if (primaryArticle.domains?.gs) {
          try {
            const relatedQuery = query(
              collection(db, 'current-affairs'),
              where('domains.gs', '==', primaryArticle.domains.gs),
              orderBy('date', 'desc'),
              limit(RELATED_ARTICLES_LIMIT)
            );
            const relatedSnapshot = await getDocs(relatedQuery);
            const processedData = await Promise.all(
              relatedSnapshot.docs
                .filter((docSnap) => docSnap.id !== primaryArticle.id)
                .map((docSnap) => ensureArticleHasSlug(docSnap))
            );
            setRelatedArticles(
              processedData
                .filter(Boolean)
                .slice(0, 5)
                .map((item) => ({
                  ...item,
                  isCurrentGs: item.domains?.gs === primaryArticle.domains?.gs
                }))
            );
          } catch (relatedError) {
            console.warn('Error fetching related articles:', relatedError);
            setRelatedArticles([]);
          }
        } else {
          setRelatedArticles([]);
        }

        try {
          const recentQuery = query(
            collection(db, 'current-affairs'),
            orderBy('date', 'desc'),
            limit(RECENT_SIDEBAR_LIMIT)
          );
          const recentSnapshot = await getDocs(recentQuery);
          const recentList = await Promise.all(
            recentSnapshot.docs.map((docSnap) => ensureArticleHasSlug(docSnap))
          );
          setRecentSidebarArticles(
            recentList.map((item) => ({
              ...item,
              date: normalizeFirestoreDate(item.date)
            }))
          );
        } catch (recentErr) {
          console.warn('Error fetching recent sidebar articles:', recentErr);
          setRecentSidebarArticles([]);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Error loading article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [articleId, navigate]);

  const navigationLinkCards = useMemo(
    () => [
      ...GS_TAGS.map((tag) => ({
        key: `gs-${tag}`,
        label: `${tag} Articles`,
        helper: 'View list',
        path: `/gs/${tag.toLowerCase()}`,
        highlight: tag === article?.domains?.gs ? 'active' : ''
      })),
      ...STATE_TAGS.map((state) => ({
        key: `state-${state.id}`,
        label: `${state.label} Updates`,
        helper: state.description,
        path: `/state/${state.id}`,
        highlight:
          article?.category &&
          state.label.toLowerCase() === article.category.toLowerCase()
            ? 'active'
            : ''
      }))
    ],
    [article?.category, article?.domains?.gs]
  );

  if (loading) {
    return (
      <main className="main-content">
        <div className="page-layout">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="article-error-overlay">
          <div className="article-error-modal">
            <h2>No Article Available</h2>
            <p>{error}</p>
            <Link to="/recent-articles" className="article-error-action">
              Browse Recent Articles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="page-layout">
        <div className="main-column">
          <article>
            <header className="article-header">
              {article?.domains && (
                <div className="article-tags">
                  {article.domains.gs && (
                    <Link to={`/gs/${article.domains.gs.toLowerCase()}`} className="tag gs-tag">
                      {article.domains.gs}
                    </Link>
                  )}
                  {article.domains.subjects?.map((subject) => (
                    <span key={subject} className="tag subject-tag">
                      {subject}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="article-title">{article?.title}</h1>
              <p className="article-date">Published on {formatDate(article?.date)}</p>
            </header>

            <section className="article-quick-links">
              <div className="article-quick-links-card">
                <h2>Explore Related Sections</h2>
                <div className="article-quick-links-grid">
                  {navigationLinkCards.map((link) => (
                    <Link key={link.key} to={link.path} className={`article-quick-link-card ${link.highlight}`}>
                      <span className="article-quick-link-label">{link.label}</span>
                      <span className="article-quick-link-helper">{link.helper}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {article?.imageUrl && (
              <div className="article-main-image">
                <img src={article.imageUrl} alt={article.title} />
              </div>
            )}

            <div className="article-body" dangerouslySetInnerHTML={{ __html: article?.content }} />

            <ArticleActions article={article} />
          </article>

          {(article?.pyqs?.prelims?.length > 0 || article?.pyqs?.mains?.length > 0) && (
            <section className="content-section">
              <h2 className="content-section-title">Previous Year Questions</h2>
              {article.pyqs.prelims?.map((pyq, index) => (
                <div key={`prelims-${index}`} className="pyq-item">
                  <p><strong>Prelims {pyq.year}:</strong> {pyq.question}</p>
                </div>
              ))}
              {article.pyqs.mains?.map((pyq, index) => (
                <div key={`mains-${index}`} className="pyq-item">
                  <p><strong>Mains {pyq.year}:</strong> {pyq.question}</p>
                </div>
              ))}
            </section>
          )}

          {(article?.previousArticle || article?.nextArticle) && (
            <nav className="article-navigation content-section">
              {article.previousArticle && (
                <Link
                  to={`/current-affairs/${article.previousArticle.slug || article.previousArticle.id}`}
                  className="nav-link previous"
                >
                  <div className="nav-label">Previous Article</div>
                  <div className="nav-title">{article.previousArticle.title}</div>
                </Link>
              )}
              {article.nextArticle && (
                <Link
                  to={`/current-affairs/${article.nextArticle.slug || article.nextArticle.id}`}
                  className="nav-link next"
                >
                  <div className="nav-label">Next Article</div>
                  <div className="nav-title">{article.nextArticle.title}</div>
                </Link>
              )}
            </nav>
          )}

          {relatedArticles.length > 0 && (
            <section className="content-section related-articles-section">
              <h2 className="content-section-title">
                More Articles in {article?.domains?.gs || 'Related Topics'}
              </h2>
              <div className="related-articles-grid">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/current-affairs/${related.slug || related.id}`}
                    className={`related-article-card ${related.isCurrentGs ? 'same-gs' : ''}`}
                  >
                    {related.imageUrl && (
                      <img src={related.imageUrl} alt={related.title} className="related-article-image" />
                    )}
                    <div className="related-article-content">
                      <div className="related-article-tags">
                        {related.domains?.gs && (
                          <span
                            className="tag gs-tag small interactive-tag"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/gs/${related.domains.gs.toLowerCase()}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/gs/${related.domains.gs.toLowerCase()}`);
                              }
                            }}
                          >
                            {related.domains.gs}
                          </span>
                        )}
                        {related.domains?.subjects?.map((subject) => (
                          <span
                            key={subject}
                            className="tag subject-tag small interactive-tag"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/gs/${related.domains.gs.toLowerCase()}/${slugify(subject)}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/gs/${related.domains.gs.toLowerCase()}/${slugify(subject)}`);
                              }
                            }}
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                      <h4 className="related-article-title">{related.title}</h4>
                      <p className="related-article-meta">{formatDate(related.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="content-section gs-links-section">
            <h2 className="content-section-title">Deep Dive Sections</h2>
            <div className="gs-links-grid">
              {navigationLinkCards.map((link) => (
                <Link
                  key={link.key}
                  to={link.path}
                  className={`gs-link-card ${link.highlight}`}
                >
                  <span className="gs-link-label">{link.label}</span>
                  <span className="gs-link-action">{link.helper}</span>
                </Link>
              ))}
            </div>
            {article?.domains?.gs && (
              <div className="gs-links-footer">
                <Link to={`/gs/${article.domains.gs.toLowerCase()}`} className="view-all-link">
                  Go to {article.domains.gs} articles overview
                </Link>
              </div>
            )}
          </section>

          <section className="content-section comment-section-wrapper">
            <CommentSystem />
          </section>
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>
              <CalendarIcon size={20} /> Filter Articles by Date
            </h3>
            <div className="calendar-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                showPopperArrow={false}
                fixedHeight
                isClearable
                inline
              />
            </div>
          </div>

          {isDateFiltered && (
            <div className="sidebar-section">
              <h3>
                Articles from {formatDate(selectedDate)}
                <button
                  onClick={() => {
                    setIsDateFiltered(false);
                    setFilteredArticles([]);
                    setSelectedDate(new Date());
                  }}
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.7rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.2rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </h3>
              {filteredArticles.length > 0 ? (
                <ul className="event-list">
                  {filteredArticles.map((articleItem) => (
                    <li key={articleItem.id}>
                      <Link
                        to={`/current-affairs/${articleItem.slug || articleItem.id}`}
                        className="event-link"
                      >
                        <strong>{articleItem.title}</strong>
                        <p>{formatDate(articleItem.date)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No articles found for this date</p>
              )}
            </div>
          )}

          {recentSidebarArticles.length > 0 && (
            <div className="sidebar-section">
              <h3>Recent Articles</h3>
              <ul className="updates-list">
                {recentSidebarArticles.map((recent) => (
                  <li key={recent.id}>
                    <Link
                      to={`/current-affairs/${recent.slug || recent.id}`}
                      className="sidebar-article-link"
                    >
                      {recent.title}
                    </Link>
                    <small>Posted {formatDate(recent.date)}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};

export default ArticlePage;
