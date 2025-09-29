// src/components/Home.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { db } from '../firebase';
import Quiz from './Quiz';
import './Home.css';

// Function to format date
const formatDate = (date) => {
  if (!date) return '';
  try {
    // Handle different date formats
    let dateObj;
    if (date.toDate) {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date.seconds) {
      // Firestore Timestamp in object form
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      // ISO string or other date string
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      // Already a Date object
      dateObj = date;
    } else {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const Home = () => {
  const { tagId } = useParams(); // Add this line
  const [todaysQuiz, setTodaysQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct' | 'wrong' | null
  const [currentAffairs, setCurrentAffairs] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [dailyArticles, setDailyArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Removed featured articles state

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

              {/* Latest Updates Section */}
              <section className="content-section">
                <div className="section-card">
                  <h2>Latest Updates</h2>
                  {loading ? (
                    <p>Loading updates...</p>
                  ) : (
                    <div className="section-content">
                      {latestUpdates.slice(0, 3).map((update) => (
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
                      ))}
                      <Link to="/updates" className="card-button">
                        View All Updates <ArrowRight />
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* UPSC Syllabus Tracker Section */}
            <section className="content-management-section">
              <h2>UPSC Syllabus Tracker</h2>
              <div className="syllabus-grid">
                <div className="syllabus-card">
                  <h3>General Studies Paper I</h3>
                  <p>Track your progress for Indian Heritage and Culture, History and Geography of the World and Society.</p>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '60%'}}></div>
                  </div>
                  <span>60% Complete</span>
                </div>
                <div className="syllabus-card">
                  <h3>General Studies Paper II</h3>
                  <p>Governance, Constitution, Polity, Social Justice and International relations.</p>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '45%'}}></div>
                  </div>
                  <span>45% Complete</span>
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
            <section className="content-management-section comment-section">
              <h2>Leave a Comment</h2>
              <div className="comment-form-container">
                <textarea
                  className="comment-textarea"
                  placeholder="Share your thoughts or ask a question..."
                  rows="5"
                ></textarea>
                <button className="submit-comment-button">Submit Comment</button>
              </div>
              <div className="comments-list">
                <h3>Recent Comments</h3>
                <div className="comment-item">
                  <p className="comment-author"><strong>Student A:</strong></p>
                  <p className="comment-text">"The monthly magazines are incredibly helpful for current affairs!"</p>
                  <span className="comment-date">2 days ago</span>
                </div>
                <div className="comment-item">
                  <p className="comment-author"><strong>Student B:</strong></p>
                  <p className="comment-text">"I appreciate the detailed analysis in the publications. Keep up the good work!"</p>
                  <span className="comment-date">1 week ago</span>
                </div>
              </div>
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
                onChange={(date) => setSelectedDate(date)}
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
