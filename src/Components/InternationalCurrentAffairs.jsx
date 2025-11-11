import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import { ensureArticleHasSlug } from '../utils/articleUtils';
import CommentSystem from './CommentSystem';
import './Home.css';
import './RecentArticlesPage.css';
import './StateArticlesPage.css';

const InternationalCurrentAffairs = () => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const articlesQuery = query(
          collection(db, 'current-affairs'),
          where('category', '==', 'International')
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
          .sort((a, b) => b.date - a.date);

        if (isMounted) {
          setArticles(fetchedArticles);
          setFilteredArticles([]);
        }
      } catch (err) {
        console.error('Error fetching international articles:', err);
        if (isMounted) {
          setError(
            'Unable to load the latest international articles right now. Please try again soon.'
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
  }, []);

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

  return (
    <main className="main-content recent-articles-page state-articles-page">
      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            <section className="content-section">
              <div className="section-card state-articles-lede">
                <h2>International Current Affairs</h2>
                <p className="section-lede">
                  Explore global events, international relations, and their impact on India's UPSC preparation.
                </p>
                {isDateFiltered && selectedDate && (
                  <p className="recent-date-filter-info">
                    Showing articles published on {formatDate(selectedDate)}
                  </p>
                )}
              </div>
            </section>

            <section className="content-section">
              <div className="section-card">
                <h3>Latest from International Affairs</h3>
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
                      : 'We haven\'t published International updates yet. Check back soon!'}
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
                Fresh stories for International Affairs will appear here soon.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default InternationalCurrentAffairs;
