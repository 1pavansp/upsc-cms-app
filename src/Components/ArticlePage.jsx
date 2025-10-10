import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar as CalendarIcon, Twitter, Facebook, Printer } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import 'react-quill/dist/quill.snow.css';
import { formatDate, getDateRange } from '../utils/dateUtils';
import './ArticlePage.css';


const ArticleActions = ({ article }) => {
  const articleUrl = window.location.href;
  const text = `Check out this article: ${article?.title}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(text)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + articleUrl)}`;

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
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isDateFiltered, setIsDateFiltered] = useState(false);

  // Function to fetch articles by specific date
  const fetchArticlesByDate = async (date) => {
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      
      // Create Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Fetch current affairs for the selected date
      const affairsQuery = query(
        collection(db, 'current-affairs'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc')
      );
      
      const affairsSnapshot = await getDocs(affairsQuery);
      const dateFilteredArticles = affairsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date : new Date()
        };
      });
      
      setFilteredArticles(dateFilteredArticles);
      setIsDateFiltered(true);
    } catch (error) {
      console.error('Error fetching articles by date:', error);
      setFilteredArticles([]);
    }
  };

  // Function to handle date selection
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
        // Fetch main article
        const articleDocRef = doc(db, 'current-affairs', articleId);
        const articleDoc = await getDoc(articleDocRef);

        if (!articleDoc.exists()) {
          setError('Article not found');
          setLoading(false);
          return;
        }

        let articleData = { id: articleDoc.id, ...articleDoc.data() };

        // Fetch navigation articles
        try {
          const allArticlesQuery = query(
            collection(db, 'current-affairs'),
            orderBy('date', 'desc')
          );
          const allArticlesSnapshot = await getDocs(allArticlesQuery);
          const allArticles = allArticlesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const currentIndex = allArticles.findIndex(art => art.id === articleId);

          if (currentIndex > 0) {
            articleData.nextArticle = {
              id: allArticles[currentIndex - 1].id,
              title: allArticles[currentIndex - 1].title,
            };
          }

          if (currentIndex < allArticles.length - 1) {
            articleData.previousArticle = {
              id: allArticles[currentIndex + 1].id,
              title: allArticles[currentIndex + 1].title,
            };
          }
        } catch (navError) {
          console.warn('Error fetching navigation articles:', navError);
        }

        setArticle(articleData);

        // Fetch related articles
        try {
          let relatedQuery;
          if (articleData.domains?.gs) {
            relatedQuery = query(
              collection(db, 'current-affairs'),
              where('domains.gs', '==', articleData.domains.gs),
              limit(6)
            );

            const relatedSnapshot = await getDocs(relatedQuery);
            const processedData = relatedSnapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
                isCurrentGs: doc.data().domains?.gs === articleData.domains?.gs
              }))
              .filter(doc => doc.id !== articleId)
              .slice(0, 5);
            setRelatedArticles(processedData);
          }
        } catch (relatedError) {
          console.warn('Error fetching related articles:', relatedError);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Error loading article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [articleId]);

  if (loading) {
    return <main className="main-content"><div className="page-layout"><p>Loading...</p></div></main>;
  }

  if (error) {
    return <main className="main-content"><div className="page-layout"><p className="error-message">{error}</p></div></main>;
  }

  return (
    <main className="main-content">
      <div className="page-layout">
        <div className="main-column">
          <article>
            <header className="article-header">
              {article?.domains && (
                <div className="article-tags">
                  {article.domains.gs && <span className="tag gs-tag">{article.domains.gs}</span>}
                  {article.domains.subjects?.map(subject => (
                    <span key={subject} className="tag subject-tag">{subject}</span>
                  ))}
                </div>
              )}
              <h1 className="article-title">{article?.title}</h1>
              <p className="article-date">Published on {formatDate(article?.date)}</p>
            </header>

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
                  {/* Further details can be structured here */}
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
                <Link to={`/article/${article.previousArticle.id}`} className="nav-link previous">
                  <div className="nav-label">Previous Article</div>
                  <div className="nav-title">{article.previousArticle.title}</div>
                </Link>
              )}
              {article.nextArticle && (
                <Link to={`/article/${article.nextArticle.id}`} className="nav-link next">
                  <div className="nav-label">Next Article</div>
                  <div className="nav-title">{article.nextArticle.title}</div>
                </Link>
              )}
            </nav>
          )}

          {relatedArticles.length > 0 && (
            <section className="content-section related-articles-section">
              <h2 className="content-section-title">
                More Articles in {article?.domains?.gs || "Related Topics"}
              </h2>
              <div className="related-articles-grid">
                {relatedArticles.map(related => (
                  <Link 
                    key={related.id} 
                    to={`/article/${related.id}`} 
                    className={`related-article-card ${related.isCurrentGs ? 'same-gs' : ''}`}
                  >
                    {related.imageUrl && (
                      <img src={related.imageUrl} alt={related.title} className="related-article-image" />
                    )}
                    <div className="related-article-content">
                      <div className="related-article-tags">
                        {related.domains?.gs && (
                          <span className="tag gs-tag small">{related.domains.gs}</span>
                        )}
                        {related.domains?.subjects?.map(subject => (
                          <span key={subject} className="tag subject-tag small">{subject}</span>
                        ))}
                      </div>
                      <h4 className="related-article-title">{related.title}</h4>
                      <p className="related-article-meta">{formatDate(related.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {article?.domains?.gs && (
                <Link to={`/articles/${article.domains.gs}`} className="view-all-link">
                  View all articles in {article.domains.gs} →
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <h3><CalendarIcon size={20} /> Calendar</h3>
            <div className="calendar-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
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
                  {filteredArticles.map((article) => (
                    <li key={article.id}>
                      <Link to={`/current-affairs/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong>{article.title}</strong>
                        <p>{formatDate(article.date)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No articles found for this date</p>
              )}
            </div>
          )}

          <div className="sidebar-section">
            <h3>Upcoming Events</h3>
            <ul className="event-list">
              <li>
                <strong>Free Mock Test</strong>
                <p>Sept 25, 2025 • 10:00 AM</p>
              </li>
              <li>
                <strong>UPSC Strategy Webinar</strong>
                <p>Sept 28, 2025 • 4:00 PM</p>
              </li>
              <li>
                <strong>Interview Workshop</strong>
                <p>Oct 2, 2025 • 2:00 PM</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default ArticlePage;
