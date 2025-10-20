import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, Timestamp, limit } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import './Home.css';
import './SubjectArticlesPage.css';
import { ensureArticleHasSlug, slugify } from '../utils/articleUtils';

const SUBJECTS_BY_GS = {
  GS1: ['History', 'Geography', 'Society', 'Art & Culture'],
  GS2: ['Polity', 'Governance', 'International Relations', 'Social Justice'],
  GS3: ['Economy', 'Environment', 'Science & Technology', 'Security'],
  GS4: ['Ethics', 'Integrity', 'Aptitude', 'Case Studies']
};

const normalizeDate = (rawDate) => {
  if (!rawDate) return new Date();
  if (rawDate instanceof Date) return rawDate;
  if (typeof rawDate.toDate === 'function') return rawDate.toDate();
  return new Date(rawDate);
};

const normalizeDoc = async (docSnap) => {
  const article = await ensureArticleHasSlug(docSnap);
  return {
    ...article,
    date: normalizeDate(article?.date)
  };
};

const sortByDateDesc = (items = []) =>
  items
    .slice()
    .sort((a, b) => (b.date?.getTime?.() ?? 0) - (a.date?.getTime?.() ?? 0));

const SubjectArticlesPage = () => {
  const { tagId, subjectId } = useParams();
  const normalizedTagId = tagId ? tagId.toUpperCase() : '';

  const subjectName = useMemo(() => {
    if (!normalizedTagId || !subjectId) return null;
    const subjects = SUBJECTS_BY_GS[normalizedTagId];
    if (!subjects) return null;
    return subjects.find(
      (subject) => slugify(subject) === subjectId.toLowerCase()
    );
  }, [normalizedTagId, subjectId]);

  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [otherSubjects, setOtherSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateFiltered, setIsDateFiltered] = useState(false);

  useEffect(() => {
    const fetchSubjectArticles = async () => {
      if (!normalizedTagId) {
        setArticles([]);
        setRecentArticles([]);
        setOtherSubjects([]);
        setLoading(false);
        return;
      }

      if (!subjectName) {
        setArticles([]);
        setRecentArticles([]);
        setOtherSubjects(
          SUBJECTS_BY_GS[normalizedTagId] || []
        );
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const subjectSnapshot = await getDocs(
          query(
            collection(db, 'current-affairs'),
            where('domains.gs', '==', normalizedTagId),
            where('domains.subjects', 'array-contains', subjectName),
            limit(100)
          )
        );
        const subjectArticlesRaw = await Promise.all(
          subjectSnapshot.docs.map((docSnap) => normalizeDoc(docSnap))
        );
        const subjectArticles = sortByDateDesc(subjectArticlesRaw);

        setArticles(subjectArticles);
        setFilteredArticles([]);
        setIsDateFiltered(false);

        const recentSnapshot = await getDocs(
          query(
            collection(db, 'current-affairs'),
            where('domains.gs', '==', normalizedTagId),
            limit(100)
          )
        );
        const recentDocsRaw = await Promise.all(
          recentSnapshot.docs.map((docSnap) => normalizeDoc(docSnap))
        );
        const recentDocs = sortByDateDesc(recentDocsRaw).slice(0, 7);
        setRecentArticles(recentDocs);

        const subjects = SUBJECTS_BY_GS[normalizedTagId] || [];
        setOtherSubjects(subjects.filter((subject) => subject !== subjectName));
      } catch (error) {
        console.error('Error fetching subject articles:', error);
        setArticles([]);
        setRecentArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectArticles();
  }, [normalizedTagId, subjectName]);

  const fetchArticlesByDate = async (date) => {
    if (!normalizedTagId || !subjectName || !date) return;

    setLoading(true);
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const filteredSnapshot = await getDocs(
        query(
          collection(db, 'current-affairs'),
          where('domains.gs', '==', normalizedTagId),
          where('domains.subjects', 'array-contains', subjectName),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp),
          limit(100)
        )
      );
      const datedArticlesRaw = await Promise.all(
        filteredSnapshot.docs.map((docSnap) => normalizeDoc(docSnap))
      );
      const datedArticles = sortByDateDesc(datedArticlesRaw);

      setFilteredArticles(datedArticles);
      setIsDateFiltered(true);
    } catch (error) {
      console.error('Error filtering subject articles by date:', error);
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

  const articlesToDisplay = isDateFiltered ? filteredArticles : articles;
  const hasValidSubject = Boolean(subjectName);
  const tagParam = tagId || '';

  return (
    <main className="main-content subject-page subject-articles-page">
      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            <section className="content-section">
              <div className="section-card">
                <div className="subject-page-header">
                  <div>
                    <h2 className="subject-page-title">
                      {hasValidSubject
                        ? `${normalizedTagId} · ${subjectName} Articles`
                        : 'Subject not found'}
                    </h2>
                    {hasValidSubject ? (
                      <p className="subject-page-subtitle">
                        Curated coverage for the {subjectName} topic under{' '}
                        {normalizedTagId}
                      </p>
                    ) : (
                      <p className="subject-page-subtitle">
                        We could not locate this subject for {normalizedTagId}.
                      </p>
                    )}
                  </div>
                  <Link to={`/gs/${tagParam}`} className="breadcrumb-link">
                    ← Back to {normalizedTagId || 'GS'} overview
                  </Link>
                </div>

                {hasValidSubject && (
                  <>
                    {isDateFiltered && selectedDate && (
                      <p className="date-filter-info">
                        Showing articles for {formatDate(selectedDate)}
                      </p>
                    )}
                    {loading ? (
                      <p>Loading articles...</p>
                    ) : articlesToDisplay.length > 0 ? (
                      <ul className="subject-article-list">
                        {articlesToDisplay.map((article) => (
                          <li key={article.id}>
                            <Link
                              to={`/current-affairs/${article.slug || article.id}`}
                              className="subject-article-link"
                            >
                              <h3>{article.title}</h3>
                              <p>{article.summary || article.excerpt || ''}</p>
                              <span className="subject-article-date">
                                {formatDate(article.date)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No articles found for this subject yet.</p>
                    )}
                  </>
                )}

                {!loading && !hasValidSubject && (
                  <div className="missing-subject">
                    <p>
                      Try exploring the available subjects for {normalizedTagId}{' '}
                      below.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {otherSubjects.length > 0 && (
              <section className="content-section">
                <div className="section-card">
                  <h3>More {normalizedTagId} Subjects</h3>
                  <div className="subject-links-grid">
                    {otherSubjects.map((subject) => (
                      <Link
                        key={subject}
                        to={`/gs/${tagParam}/${slugify(subject)}`}
                        className="subject-link-pill"
                      >
                        {subject}
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
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
                  <button
                    type="button"
                    className="date-filter-reset"
                    onClick={clearDateFilter}
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {recentArticles.length > 0 && (
            <div className="sidebar-section">
              <h3>Recent {normalizedTagId} Articles</h3>
              <ul className="updates-list">
                {recentArticles.map((article) => (
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
              <Link to={`/gs/${tagParam}`} className="sidebar-cta-link">
                View all {normalizedTagId} articles
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};

export default SubjectArticlesPage;
