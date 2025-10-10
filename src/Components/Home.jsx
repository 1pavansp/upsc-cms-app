// src/components/Home.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { db } from '../firebase';
import Quiz from './Quiz';
import CommentSystem from './CommentSystem';
import { formatDate, getDateRange, isSameDay } from '../utils/dateUtils';
import './Home.css';


const Home = () => {
  const { tagId } = useParams(); // Add this line
  const [todaysQuiz, setTodaysQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct' | 'wrong' | null
  const [currentAffairs, setCurrentAffairs] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [dailyArticles, setDailyArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  // Removed featured articles state

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
    const fetchContent = async () => {
      setLoading(true); // Set loading to true at the start of fetch
      try {
        // Fetch Today's Quiz
        const quizQuery = query(
          collection(db, 'daily-quiz'),
          orderBy('date', 'desc'),
          limit(1)
        );
        const quizSnapshot = await getDocs(quizQuery);
        console.log('Quiz snapshot:', quizSnapshot.empty ? 'empty' : 'has data');
        if (!quizSnapshot.empty) {
          const quizData = quizSnapshot.docs[0].data();
          console.log('Quiz data:', JSON.stringify(quizData, null, 2));
          const formattedQuizData = {
            id: quizSnapshot.docs[0].id,
            ...quizData,
            date: quizData.date ? quizData.date : new Date(),
            questions: quizData.questions || []
          };
          console.log('Formatted quiz data:', JSON.stringify(formattedQuizData, null, 2));
          setTodaysQuiz(formattedQuizData);
          console.log('Set quiz data with questions:', formattedQuizData.questions.length);
        }

        let currentAffairsBaseQuery = collection(db, 'current-affairs');
        let dailyArticlesBaseQuery = collection(db, 'current-affairs');

        // Apply tag filtering if tagId is present
        if (tagId) {
          if (['GS1', 'GS2', 'GS3', 'GS4'].includes(tagId)) {
            currentAffairsBaseQuery = query(currentAffairsBaseQuery, where('domains.gs', '==', tagId));
            dailyArticlesBaseQuery = query(dailyArticlesBaseQuery, where('domains.gs', '==', tagId));
          } else {
            currentAffairsBaseQuery = query(currentAffairsBaseQuery, where('domains.subjects', 'array-contains', tagId));
            dailyArticlesBaseQuery = query(dailyArticlesBaseQuery, where('domains.subjects', 'array-contains', tagId));
          }
        }

        // Fetch Current Affairs
        const affairsQuery = query(currentAffairsBaseQuery, orderBy('date', 'desc'), limit(7));
        const affairsSnapshot = await getDocs(affairsQuery);
        setCurrentAffairs(affairsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date ? data.date : new Date()
          };
        }));

        // Fetch Daily Articles from Current Affairs
        const articlesQuery = query(dailyArticlesBaseQuery, orderBy('date', 'desc'), limit(7));
        const articlesSnapshot = await getDocs(articlesQuery);
        setDailyArticles(articlesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            date: data.date ? data.date : new Date()
          };
        }));

        // Fetch Latest Updates
        const updatesQuery = query(
          collection(db, 'latest-updates'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const updatesSnapshot = await getDocs(updatesQuery);
        setLatestUpdates(updatesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            date: data.date ? data.date : new Date(),
            category: data.category || 'General',
            isImportant: data.isImportant || false
          };
        }));

      } catch (err) {
        console.error("Error fetching content:", err);
        // Keep the default state values on error
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [tagId]); // Add tagId to dependencies

  return (
    <main className="main-content">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Shape Your Destiny, Serve the Nation</h1>
        <p>Join CivicCentre IAS, where aspirants transform into leaders. Your journey to becoming an IAS officer starts here.</p>
        <button className="hero-button">
          Start Learning <ArrowRight />
        </button>
      </section>

      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            {/* Latest Updates Section - Moved to top */}
            <section className="content-section">
              <div className="section-card">
                <h2>
                  {isDateFiltered ? `Articles from ${formatDate(selectedDate)}` : 'Latest Updates'}
                  {isDateFiltered && (
                    <button 
                      onClick={() => {
                        setIsDateFiltered(false);
                        setFilteredArticles([]);
                        setSelectedDate(new Date());
                      }}
                      className="clear-filter-btn"
                      style={{
                        marginLeft: '1rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Filter
                    </button>
                  )}
                </h2>
                {loading ? (
                  <p>Loading updates...</p>
                ) : (
                  <div className="section-content">
                    {isDateFiltered ? (
                      filteredArticles.length > 0 ? (
                        filteredArticles.map((article) => (
                          <div key={article.id} className="content-item">
                            <h3>
                              <Link to={`/current-affairs/${article.id}`} className="content-link">
                                {article.title}
                              </Link>
                            </h3>
                            <div className="update-meta">
                              {article.domains?.gs && <span className="category">{article.domains.gs}</span>}
                              <span className="date">{formatDate(article.date)}</span>
                            </div>
                            <p className="summary">{article.content?.substring(0, 150)}...</p>
                          </div>
                        ))
                      ) : (
                        <p>No articles found for {formatDate(selectedDate)}</p>
                      )
                    ) : (
                      latestUpdates.slice(0, 5).map((update) => (
                        <div key={update.id} className="content-item">
                          <h3>
                            {update.isImportant && <span className="important-badge">Important</span>}
                            {update.title}
                          </h3>
                          <div className="update-meta">
                            <span className="category">{update.category}</span>
                            <span className="date">{formatDate(update.date)}</span>
                          </div>
                          <p className="summary">{update.content}</p>
                        </div>
                      ))
                    )}
                    {!isDateFiltered && (
                      <Link to="/updates" className="card-button">
                        View All Updates <ArrowRight />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </section>

            <div className="main-sections-grid" style={{ marginTop: 0 }}>
              {/* Today's Quiz Section */}
              <section className="content-section">
                <div className="section-card">
                  <h2>Today's Quiz</h2>
                  {loading ? (
                    <p>Loading quiz...</p>
                  ) : todaysQuiz ? (
                    <div className="section-content">
                      <h3>{todaysQuiz.title || 'Daily Quiz'}</h3>
                      <p className="date">{formatDate(todaysQuiz.date)}</p>
                      <p>{todaysQuiz.description || 'Test your knowledge with today\'s quiz!'}</p>
                      <Quiz 
                        quiz={todaysQuiz}
                        currentQuestion={currentQuestion}
                        setCurrentQuestion={setCurrentQuestion}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        answerStatus={answerStatus}
                        setAnswerStatus={setAnswerStatus}
                      />
                    </div>
                  ) : (
                    <p>No quiz available for today</p>
                  )}
                </div>
              </section>

              {/* Daily Articles Section */}
              <section className="content-section">
                <div className="section-card">
                  <h2>Daily Articles</h2>
                  {loading ? (
                    <p>Loading articles...</p>
                  ) : (
                    <div className="section-content">
                      {dailyArticles.map((article) => (
                        <div key={article.id} className="content-item">
                          <h3>
                            <Link to={`/current-affairs/${article.id}`} className="content-link">
                              {article.title}
                            </Link>
                          </h3>
                          <p className="date">{formatDate(article.date)}</p>
                        </div>
                      ))}
                      <button className="card-button">
                        View All <ArrowRight />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Prime Time Videos Section */}
            <section className="prime-time-videos">
              <h2>Prime Time Videos</h2>
              <div className="videos-scroller">
                <div className="video-card">
                  <iframe src="https://www.youtube.com/embed/VIDEO_ID_1" title="Prime Time Video 1" allowFullScreen></iframe>
                  <div className="video-card-content">
                    <h3>Video Title 1</h3>
                  </div>
                </div>
                <div className="video-card">
                  <iframe src="https://www.youtube.com/embed/VIDEO_ID_2" title="Prime Time Video 2" allowFullScreen></iframe>
                  <div className="video-card-content">
                    <h3>Video Title 2</h3>
                  </div>
                </div>
                <div className="video-card">
                  <iframe src="https://www.youtube.com/embed/VIDEO_ID_3" title="Prime Time Video 3" allowFullScreen></iframe>
                  <div className="video-card-content">
                    <h3>Video Title 3</h3>
                  </div>
                </div>
                <div className="video-card">
                  <iframe src="https://www.youtube.com/embed/VIDEO_ID_4" title="Prime Time Video 4" allowFullScreen></iframe>
                  <div className="video-card-content">
                    <h3>Video Title 4</h3>
                  </div>
                </div>
                <div className="video-card">
                  <iframe src="https://www.youtube.com/embed/VIDEO_ID_5" title="Prime Time Video 5" allowFullScreen></iframe>
                  <div className="video-card-content">
                    <h3>Video Title 5</h3>
                  </div>
                </div>
              </div>
            </section>

            {/* Previous Year Papers Section */}
            <section className="content-management-section">
              <h2>Previous Year Papers</h2>
              <div className="papers-grid">
                <div className="paper-card">
                  <h3>2023 Prelims Paper</h3>
                  <p>Download and analyze the latest prelims paper.</p>
                  <button className="download-button">Download PDF</button>
                </div>
                <div className="paper-card">
                  <h3>2022 Mains GS Paper I</h3>
                  <p>Review the Mains General Studies Paper I from 2022.</p>
                  <button className="download-button">Download PDF</button>
                </div>
                 <div className="paper-card">
                  <h3>2021 Essay Paper</h3>
                  <p>Practice writing with the essay topics from 2021.</p>
                  <button className="download-button">Download PDF</button>
                </div>
              </div>
            </section>

            {/* CivicCentre IAS Monthly Magazines and Publications Section */}
            <section className="content-management-section">
              <h2>CivicCentre IAS Monthly Magazines & Publications</h2>
              <div className="magazines-grid">
                <div className="magazine-card">
                  <h3>CivicCentre IAS Magazine - September 2025</h3>
                  <p>Comprehensive analysis of current affairs and exam-oriented articles.</p>
                  <button className="download-button">Read Now</button>
                </div>
                <div className="magazine-card">
                  <h3>CivicCentre IAS Magazine - August 2025</h3>
                  <p>In-depth coverage of national and international events.</p>
                  <button className="download-button">Read Now</button>
                </div>
                <div className="magazine-card">
                  <h3>UPSC Success Stories - Vol. 3</h3>
                  <p>Inspiring journeys of successful IAS candidates.</p>
                  <button className="download-button">Get Your Copy</button>
                </div>
              </div>
            </section>

            {/* Comment Section */}
            <section className="comment-section">
              <CommentSystem />
            </section>

            {/* Subscription Model Section */}
            <section className="content-management-section subscription-section">
              <h2>Unlock Premium Content</h2>
              <p className="subscription-intro">Subscribe to CivicCentre IAS for exclusive access to study materials, mock tests, and personalized guidance.</p>
              <div className="subscription-grid">
                <div className="subscription-card">
                  <h3>Basic Plan</h3>
                  <p className="price">₹499/month</p>
                  <ul>
                    <li>Access to Monthly Magazines</li>
                    <li>Daily Current Affairs</li>
                    <li>Basic Study Notes</li>
                  </ul>
                  <button className="subscribe-button">Choose Basic</button>
                </div>
                <div className="subscription-card featured-plan">
                  <h3>Premium Plan</h3>
                  <p className="price">₹999/month</p>
                  <ul>
                    <li>All Basic features</li>
                    <li>Access to All Publications</li>
                    <li>Full Mock Test Series</li>
                    <li>Personalized Mentorship</li>
                  </ul>
                  <button className="subscribe-button">Choose Premium</button>
                </div>
                <div className="subscription-card">
                  <h3>Annual Plan</h3>
                  <p className="price">₹9999/year</p>
                  <ul>
                    <li>All Premium features</li>
                    <li>2 Months Free!</li>
                    <li>Exclusive Webinars</li>
                  </ul>
                  <button className="subscribe-button">Choose Annual</button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Calendar Section */}
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
              />
            </div>
          </div>

          {/* Important Links Section */}
          <div className="sidebar-section">
            <h3>Recent Articles</h3>
            <ul className="updates-list">
              {currentAffairs.map(article => (
                <li key={article.id}>
                  <Link to={`/current-affairs/${article.id}`}>{article.title}</Link>
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

export default Home;
