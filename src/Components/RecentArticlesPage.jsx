import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import CommentSystem from './CommentSystem';
import './Home.css';
import './RecentArticlesPage.css';

const normalizeArticle = (doc) => {
  const data = doc.data();
  const rawDate = data.date;
  const normalizedDate = rawDate
    ? rawDate instanceof Date
      ? rawDate
      : typeof rawDate.toDate === 'function'
        ? rawDate.toDate()
        : new Date(rawDate)
    : new Date();

  return {
    id: doc.id,
    title: data.title || 'Untitled Article',
    date: normalizedDate
  };
};

const RecentArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const fetchedArticles = snapshot.docs.map(normalizeArticle);
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

  const fetchArticlesByDate = async (date) => {
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
      const datedArticles = snapshot.docs.map(normalizeArticle);
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
    setError(null);
  };

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
                    {articlesToDisplay.map((article) => (
                      <li key={article.id}>
                        <Link to={`/current-affairs/${article.id}`}>
                          {article.title}
                        </Link>
                        <span>{formatDate(article.date)}</span>
                      </li>
                    ))}
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
          <div className="sidebar-section calendar-section">
            <h3>
              <CalendarIcon className="inline-block mr-2 h-5 w-5" />
              Calendar
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

          <div className="sidebar-section">
            <h3>Latest Highlights</h3>
            <ul className="updates-list">
              {recentHighlights.map((article) => (
                <li key={article.id}>
                  <Link to={`/current-affairs/${article.id}`} className="sidebar-article-link">
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
