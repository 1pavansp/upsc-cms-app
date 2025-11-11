import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
// removed CalendarIcon import (calendar UI is only on Home)
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import CommentSystem from './CommentSystem';
import { ensureArticleHasSlug, getArticlePublicUrl, getArticleRelativePath } from '../utils/articleUtils';
import './Home.css';
import './RecentArticlesPage.css';

const RecentArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedArticleId, setCopiedArticleId] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const articlesQuery = query(
          collection(db, 'current-affairs'),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(articlesQuery);
        const fetchedArticles = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const article = await ensureArticleHasSlug(docSnap);
            return {
              ...article,
              title: article.title || 'Untitled Article',
              date: article.date || new Date()
            };
          })
        );
        setArticles(fetchedArticles);
      } catch (err) {
        console.error('Error fetching recent articles:', err);
        setError('Unable to load recent articles right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const articlesToDisplay = useMemo(
    () => (isDateFiltered ? filteredArticles : articles),
    [articles, filteredArticles, isDateFiltered]
  );

  const recentHighlights = useMemo(
    () => (isDateFiltered ? filteredArticles : articles).slice(0, 7),
    [articles, filteredArticles, isDateFiltered]
  );

  const _fetchArticlesByDate = async (date) => {
    if (!date) return;

    setLoading(true);
    setError(null);
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const dateQuery = query(
        collection(db, 'current-affairs'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(dateQuery);
      const datedArticles = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const article = await ensureArticleHasSlug(docSnap);
          return {
            ...article,
            title: article.title || 'Untitled Article',
            date: article.date || new Date()
          };
        })
      );
      setFilteredArticles(datedArticles);
      setIsDateFiltered(true);
    } catch (err) {
      console.error('Error fetching articles by date:', err);
      setFilteredArticles([]);
      setIsDateFiltered(true);
      setError('Unable to filter articles for the selected date.');
    } finally {
      setLoading(false);
    }
  };

  const _handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      _fetchArticlesByDate(date);
    } else {
      setFilteredArticles([]);
      setIsDateFiltered(false);
    }
  };

  const _clearDateFilter = () => {
    setSelectedDate(null);
    setFilteredArticles([]);
    setIsDateFiltered(false);
    setError(null);
  };

  const handleCopyLink = useCallback(async (article) => {
    const shareUrl = getArticlePublicUrl(article);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedArticleId(article.id);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedArticleId(null);
          copyTimeoutRef.current = null;
        }, 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (copyError) {
      console.error('Failed to copy article link:', copyError);
      window.prompt('Press Ctrl+C to copy this article link:', shareUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="main-content recent-articles-page">
      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            <section className="content-section">
              <div className="section-card">
                <h2>Recent Articles</h2>
                <p className="section-lede">
                  Browse the latest CivicCentre IAS current affairs articles. Select a date to drill into the
                  coverage published on that day.
                </p>
                {isDateFiltered && selectedDate && (
                  <p className="recent-date-filter-info">
                    Showing articles published on {formatDate(selectedDate)}
                  </p>
                )}
                {loading ? (
                  <p>Loading articles...</p>
                ) : error ? (
                  <p className="error-copy">{error}</p>
                ) : articlesToDisplay.length > 0 ? (
                  <ul className="recent-articles-list">
                    {articlesToDisplay.map((article) => {
                      const articlePath = getArticleRelativePath(article);
                      const publicUrl = getArticlePublicUrl(article);
                      const isCopied = copiedArticleId === article.id;

                      return (
                        <li key={article.id}>
                          <div className="recent-article-primary">
                            <Link to={articlePath}>
                              {article.title}
                            </Link>
                            <span>{formatDate(article.date)}</span>
                          </div>
                          <div className="article-share-row">
                            <a
                              href={publicUrl}
                              className="article-share-url"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {publicUrl}
                            </a>
                            <button
                              type="button"
                              className="copy-article-link"
                              onClick={() => handleCopyLink(article)}
                            >
                              {isCopied ? 'Copied!' : 'Copy link'}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>No articles found for the selected date.</p>
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
            <h3>Latest Highlights</h3>
            <ul className="updates-list">
              {recentHighlights.map((article) => (
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
          </div>
        </aside>
      </div>
    </main>
  );
};

export default RecentArticlesPage;
