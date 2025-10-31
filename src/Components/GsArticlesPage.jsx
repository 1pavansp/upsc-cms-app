// src/Components/GsArticlesPage.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Home.css'; // Reuse styles from Home
import './GsArticlesPage.css'; // Import new styles
import CommentSystem from './CommentSystem';
import { ensureArticleHasSlug, slugify, getArticlePublicUrl, getArticleRelativePath } from '../utils/articleUtils';

const GS_TAGS = ['GS1', 'GS2', 'GS3', 'GS4'];

const getGsVariants = (value = '') => {
  if (!value) return [];
  const variants = new Set();
  variants.add(value);
  variants.add(value.toUpperCase());
  variants.add(value.toLowerCase());
  return Array.from(variants).filter(Boolean);
};

const normalizeArticleDoc = async (docSnap) => {
  const article = await ensureArticleHasSlug(docSnap);
  return {
    ...article,
    date: article.date || new Date()
  };
};

const GsArticlesPage = () => {
  const { tagId } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [currentAffairs, setCurrentAffairs] = useState([]);
  const [copiedArticleId, setCopiedArticleId] = useState(null);
  const copyTimeoutRef = useRef(null);

  const fetchArticlesForGs = useCallback(async (variants, additionalConstraints = []) => {
    const articlesMap = new Map();
    for (const gsValue of variants) {
      try {
        const constraints = [
          where('domains.gs', '==', gsValue),
          ...additionalConstraints,
          limit(100)
        ];
        const snapshot = await getDocs(query(collection(db, 'current-affairs'), ...constraints));
        for (const docSnap of snapshot.docs) {
          if (!articlesMap.has(docSnap.id)) {
            const article = await normalizeArticleDoc(docSnap);
            articlesMap.set(docSnap.id, article);
          }
        }
      } catch (err) {
        console.error(`Error fetching GS articles for ${gsValue}:`, err);
      }
    }

    return Array.from(articlesMap.values()).sort(
      (a, b) => (b.date?.getTime?.() ?? 0) - (a.date?.getTime?.() ?? 0)
    );
  }, []);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!tagId) {
        setArticles([]);
        setFilteredArticles([]);
        setCurrentAffairs([]);
        setIsDateFiltered(false);
        setSelectedDate(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const gsVariants = getGsVariants(tagId);

        const fetchedArticles = await fetchArticlesForGs(gsVariants);
        setArticles(fetchedArticles);
        setFilteredArticles([]);
        setIsDateFiltered(false);
        setSelectedDate(null);

        // Fetch recent articles for the sidebar
        const recentArticlesQuery = query(
          collection(db, 'current-affairs'),
          orderBy('date', 'desc'),
          limit(7)
        );
        const recentArticlesSnapshot = await getDocs(recentArticlesQuery);
        const recentArticles = await Promise.all(
          recentArticlesSnapshot.docs.map((docSnap) => normalizeArticleDoc(docSnap))
        );
        setCurrentAffairs(recentArticles);

      } catch (error) {
        console.error('Error fetching GS page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [tagId, fetchArticlesForGs]);

  const normalizedTagId = tagId ? tagId.toUpperCase() : '';
  const otherGsTags = normalizedTagId ? GS_TAGS.filter(tag => tag !== normalizedTagId) : GS_TAGS;

  const articlesToDisplay = isDateFiltered ? filteredArticles : articles;
  const subjectGroups = useMemo(() => {
    const subjectMap = new Map();
    articles.forEach(article => {
      const subjects = Array.isArray(article.domains?.subjects) ? article.domains.subjects : [];
      subjects.forEach(subject => {
        const normalizedSubject = subject?.trim();
        if (!normalizedSubject) return;
        if (!subjectMap.has(normalizedSubject)) {
          subjectMap.set(normalizedSubject, []);
        }
        subjectMap.get(normalizedSubject).push(article);
      });
    });

    return Array.from(subjectMap.entries())
      .map(([subject, subjectArticles]) => ({
        subject,
        articles: subjectArticles
          .slice()
          .sort((a, b) => (b.date?.getTime?.() ?? 0) - (a.date?.getTime?.() ?? 0))
          .slice(0, 5)
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [articles]);

  const fetchArticlesByDate = async (date) => {
    if (!tagId || !date) return;
    setLoading(true);
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const gsVariants = getGsVariants(tagId);
      const datedArticles = await fetchArticlesForGs(gsVariants, [
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      ]);

      setFilteredArticles(datedArticles);
      setIsDateFiltered(true);
    } catch (error) {
      console.error('Error filtering GS articles by date:', error);
      setFilteredArticles([]);
      setIsDateFiltered(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      fetchArticlesByDate(date);
    } else {
      setFilteredArticles([]);
      setIsDateFiltered(false);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setFilteredArticles([]);
    setIsDateFiltered(false);
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
    } catch (err) {
      console.error('Failed to copy GS article link:', err);
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
    <main className="main-content gs-articles-page">
      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            <section className="content-section">
              <div className="section-card">
                <h2>{normalizedTagId || 'GS'} Articles</h2>
                {isDateFiltered && selectedDate && (
                  <p className="date-filter-info">
                    Showing articles for {formatDate(selectedDate)}
                  </p>
                )}
                {loading ? (
                  <p>Loading articles...</p>
                ) : articlesToDisplay.length > 0 ? (
                  <ul className="article-list">
                    {articlesToDisplay.map(article => {
                      const articlePath = getArticleRelativePath(article);
                      const publicUrl = getArticlePublicUrl(article);
                      const isCopied = copiedArticleId === article.id;

                      return (
                        <li key={article.id}>
                          <div className="gs-article-primary">
                            <Link to={articlePath}>
                              <h4>{article.title}</h4>
                            </Link>
                            {Array.isArray(article.domains?.subjects) && article.domains.subjects.length > 0 && (
                              <div className="article-subject-tags">
                                {article.domains.subjects.map(subject => (
                                  <Link
                                    key={subject}
                                    className="subject-chip"
                                    to={`/gs/${normalizedTagId.toLowerCase()}/${slugify(subject)}`}
                                  >
                                    {subject}
                                  </Link>
                                ))}
                              </div>
                            )}
                            <small>{formatDate(article.date)}</small>
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
                  <p>No articles found for {normalizedTagId || 'GS'}.</p>
                )}
              </div>
            </section>

            {subjectGroups.length > 0 && (
              <section className="content-section">
                <div className="section-card">
                  <h2>{normalizedTagId} Subjects</h2>
                  <div className="subject-groups-grid">
                    {subjectGroups.map(({ subject, articles: subjectArticles }) => (
                      <div className="subject-group-card" key={subject}>
                        <div className="subject-group-header">
                          <h3>{subject}</h3>
                          <Link
                            to={`/gs/${normalizedTagId.toLowerCase()}/${slugify(subject)}`}
                            className="subject-group-view-all"
                          >
                            View subject <ArrowRight size={16} />
                          </Link>
                        </div>
                        <ul className="subject-group-list">
                          {subjectArticles.map(article => {
                            const articlePath = getArticleRelativePath(article);
                            const publicUrl = getArticlePublicUrl(article);
                            const isCopied = copiedArticleId === article.id;

                            return (
                              <li key={article.id}>
                                <div className="subject-article-primary">
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
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="content-section">
              <div className="section-card">
                <h2>Explore Other GS Papers</h2>
                <div className="other-gs-links" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                  {otherGsTags.map(tag => (
                    <Link key={tag} to={`/gs/${tag.toLowerCase()}`} className="card-button">
                      {tag} Articles <ArrowRight />
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="content-section comment-section-wrapper">
              <CommentSystem />
            </section>
          </div>
        </div>
        <aside className="sidebar">
          <div className="sidebar-section calendar-section">
            <h3>
              <CalendarIcon className="inline-block mr-2 h-5 w-5" />
              Filter Articles by Date
            </h3>
            <div className="calendar-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                calendarClassName="sidebar-calendar"
                showPopperArrow={false}
                fixedHeight
                isClearable
              />
              {isDateFiltered && (
                <div className="date-filter-actions">
                  <button type="button" className="date-filter-reset" onClick={clearDateFilter}>
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Recent Articles</h3>
            <ul className="updates-list">
              {currentAffairs.map(article => {
                const articlePath = getArticleRelativePath(article);
                const publicUrl = getArticlePublicUrl(article);
                const isCopied = copiedArticleId === article.id;

                return (
                  <li key={article.id}>
                    <div className="sidebar-article-primary">
                      <Link
                        to={articlePath}
                        className="sidebar-article-link"
                      >
                        {article.title}
                      </Link>
                      <small>Posted {formatDate(article.date)}</small>
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
            <Link to="/recent-articles" className="sidebar-cta-link">
              View All Articles
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default GsArticlesPage;
