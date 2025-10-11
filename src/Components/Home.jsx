// src/components/Home.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import Quiz from './Quiz';
import CommentSystem from './CommentSystem';
import PrimetimeVideos from './PrimetimeVideos';
import './Home.css';
import { extractYoutubeVideoId, getYoutubeEmbedUrl } from '../utils/videoUtils';
import { civicCentrePath } from '../constants/civicCentre';

const normalizeText = (value = '') => value?.toString().trim().toLowerCase();

const GS_TAGS = ['GS1', 'GS2', 'GS3', 'GS4'];

const Home = () => {
  const { tagId } = useParams();
  const normalizedTagId = tagId ? tagId.toUpperCase() : null;
  const [todaysQuiz, setTodaysQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct' | 'wrong' | null
  const [currentAffairs, setCurrentAffairs] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [dailyArticles, setDailyArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [quizResponses, setQuizResponses] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLeadForm, setQuizLeadForm] = useState({ name: '', mobile: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [leadStatus, setLeadStatus] = useState({ type: null, message: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [quizLoading, setQuizLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const resetQuizLeadState = (questionCount = 0) => {
    setQuizResponses(Array(questionCount).fill(null));
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizLeadForm({ name: '', mobile: '', otp: '' });
    setOtpSent(false);
    setOtpVerified(false);
    setGeneratedOtp('');
    setLeadStatus({ type: null, message: '' });
    setLeadSubmitting(false);
    setShowLeadModal(false);
  };

  const resolveQuizDate = (value) => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'number' || typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (value && typeof value === 'object' && 'seconds' in value) {
      return new Date(value.seconds * 1000);
    }
    return new Date();
  };

  const buildQuizFromDoc = (doc) => {
    if (!doc) return null;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: resolveQuizDate(data.date),
      questions: Array.isArray(data.questions) ? data.questions : []
    };
  };

  const applyQuizData = (quizData) => {
    if (quizData) {
      setTodaysQuiz(quizData);
      const questionCount = quizData.questions?.length || 0;
      resetQuizLeadState(questionCount);
    } else {
      setTodaysQuiz(null);
      resetQuizLeadState(0);
    }
    setCurrentQuestion(0);
    setSelectedOption(null);
    setAnswerStatus(null);
  };

  const fetchQuizForDate = async (dateValue = new Date()) => {
    try {
      setQuizLoading(true);
      const targetDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
      const { startOfDay, endOfDay } = getDateRange(targetDate);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const dateScopedQuery = query(
        collection(db, 'daily-quiz'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(dateScopedQuery);

      if (!snapshot.empty) {
        const quizData = buildQuizFromDoc(snapshot.docs[0]);
        applyQuizData(quizData);
      } else {
        applyQuizData(null);
      }
    } catch (error) {
      console.error('Error fetching quiz for date:', error);
      applyQuizData(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleLeadInputChange = (field) => (event) => {
    const { value } = event.target;
    const sanitizedValue =
      field === 'mobile'
        ? value.replace(/\D/g, '').slice(0, 10)
        : field === 'otp'
          ? value.replace(/\D/g, '').slice(0, 6)
          : value;
    setQuizLeadForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  };

  const isQuizAnswerCorrect = (question, optionIndex) => {
    if (!question) return false;
    const { options = [] } = question;
    const answerValue = question.answer ?? question.correctAnswer;

    if (typeof answerValue === 'number') {
      return optionIndex === answerValue;
    }

    const numericIndex = Number(answerValue);
    if (!Number.isNaN(numericIndex)) {
      return optionIndex === numericIndex;
    }

    if (typeof answerValue === 'string') {
      const selected = options[optionIndex];
      return normalizeText(selected || '') === normalizeText(answerValue);
    }

    return false;
  };

  const computeQuizScore = (quizData, responses) => {
    if (!quizData || !Array.isArray(quizData.questions) || !Array.isArray(responses)) {
      return 0;
    }

    return responses.reduce((total, response, index) => {
      if (response === null || response === undefined) {
        return total;
      }
      const question = quizData.questions[index];
      if (!question) {
        return total;
      }
      return isQuizAnswerCorrect(question, response) ? total + 1 : total;
    }, 0);
  };

  const buildMotivationMessage = (score, total) => {
    const safeTotal = total || 0;
    const mistakes = Math.max(safeTotal - score, 0);

    if (safeTotal === 0) {
      return 'Quiz submitted. Add questions in the admin panel to keep learners challenged.';
    }

    if (score === safeTotal) {
      return `Outstanding! You aced every question (${score}/${total}). Keep this energy alive!`;
    }

    if (score === safeTotal - 1) {
      return `So close to perfection! ${score}/${total} correct — revisit that one tricky question and you'll be unstoppable.`;
    }

    if (score >= Math.ceil(safeTotal * 0.7)) {
      return `Great work! You’ve nailed ${score}/${total}. A little fine-tuning on the remaining ${mistakes} and you're golden.`;
    }

    if (score >= Math.ceil(safeTotal * 0.4)) {
      return `Solid progress with ${score}/${total}. Focus on the ${mistakes} improvements and keep building momentum.`;
    }

    if (score > 0) {
      return `Every step counts — ${score}/${total} today sets up a stronger attempt tomorrow. Stay curious and keep practising.`;
    }

    return `Every champion starts somewhere. Analyze the ${total} questions, revisit the concepts, and come back stronger!`;
  };

  const handleQuizSubmit = () => {
    if (!todaysQuiz || !Array.isArray(todaysQuiz.questions) || todaysQuiz.questions.length === 0) {
      setLeadStatus({ type: 'error', message: 'Quiz data is unavailable right now.' });
      return;
    }

    if (quizResponses.some(response => response === null || response === undefined)) {
      setLeadStatus({ type: 'error', message: 'Please answer all questions before submitting the quiz.' });
      return;
    }

    const score = computeQuizScore(todaysQuiz, quizResponses);
    const totalForMessage = todaysQuiz.questions?.length ?? quizResponses.length;
    setQuizScore(score);
    setQuizSubmitted(true);
    const motivationMessage = buildMotivationMessage(score, totalForMessage);
    setLeadStatus({
      type: 'info',
      message: motivationMessage
    });
    setShowLeadModal(true);
  };

  const handleSendOtp = async () => {
    if (!quizLeadForm.mobile || quizLeadForm.mobile.length !== 10) {
      setLeadStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number before requesting an OTP.' });
      return;
    }

    try {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(generated);
      setOtpSent(true);
      setOtpVerified(false);
      setQuizLeadForm(prev => ({ ...prev, otp: '' }));

      await addDoc(collection(db, 'quiz-otp-requests'), {
        mobile: quizLeadForm.mobile,
        otp: generated,
        quizId: todaysQuiz?.id ?? null,
        createdAt: serverTimestamp()
      });

      setLeadStatus({
        type: 'info',
        message: 'A verification OTP has been sent to your mobile number. Enter it below to confirm your subscription.'
      });

      // Optional: log for QA environments
      if (import.meta?.env?.MODE !== 'production') {
        console.info('Quiz OTP (development mode):', generated);
      }
    } catch (error) {
      console.error('Error generating quiz OTP:', error);
      setLeadStatus({
        type: 'error',
        message: 'We were unable to send the OTP right now. Please try again in a moment.'
      });
      setOtpSent(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otpSent) {
      setLeadStatus({ type: 'error', message: 'Please request an OTP before attempting verification.' });
      return;
    }

    if (quizLeadForm.otp.trim() === generatedOtp) {
      setOtpVerified(true);
      setLeadStatus({ type: 'success', message: 'Mobile number verified successfully.' });
    } else {
      setOtpVerified(false);
      setLeadStatus({ type: 'error', message: 'Incorrect OTP. Please try again.' });
    }
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();

    if (!quizLeadForm.name.trim()) {
      setLeadStatus({ type: 'error', message: 'Please enter your name.' });
      return;
    }

    if (!quizLeadForm.mobile || quizLeadForm.mobile.length !== 10) {
      setLeadStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (!otpVerified) {
      setLeadStatus({ type: 'error', message: 'Please verify the OTP before submitting your details.' });
      return;
    }

    try {
      setLeadSubmitting(true);
      await addDoc(collection(db, 'quiz-leads'), {
        name: quizLeadForm.name.trim(),
        mobile: quizLeadForm.mobile,
        quizId: todaysQuiz?.id ?? null,
        quizTitle: todaysQuiz?.title ?? null,
        score: quizScore,
        totalQuestions: todaysQuiz?.questions?.length ?? quizResponses.length,
        responses: quizResponses.map((response, index) => ({
          questionNumber: index + 1,
          selectedOptionIndex: response,
          selectedOptionText:
            response !== null && todaysQuiz?.questions?.[index]?.options
              ? todaysQuiz.questions[index].options[response] ?? null
              : null
        })),
        submittedAt: serverTimestamp()
      });
      setLeadStatus({
        type: 'success',
        message: 'Thank you! Your details have been saved. We will keep you posted with important updates.'
      });
      setShowLeadModal(false);
    } catch (error) {
      console.error('Error saving quiz lead:', error);
      setLeadStatus({
        type: 'error',
        message: 'We were unable to save your details. Please try again in a little while.'
      });
    } finally {
      setLeadSubmitting(false);
    }
  };

  const [otherGsCollections, setOtherGsCollections] = useState([]);
  const isGsTag = normalizedTagId ? GS_TAGS.includes(normalizedTagId) : false;
  const activeTagId = isGsTag ? normalizedTagId : tagId;
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateRef = useRef(new Date());
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const isDateFilteredRef = useRef(false);
  // Removed featured articles state

  // Function to fetch articles by specific date
  const fetchArticlesByDate = async (date) => {
    try {
      const { startOfDay, endOfDay } = getDateRange(date);
      
      // Create Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Fetch current affairs for the selected date
      let affairsQuery = query(
        collection(db, 'current-affairs'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc')
      );

      if (isGsTag && activeTagId) {
        affairsQuery = query(
          collection(db, 'current-affairs'),
          where('domains.gs', '==', activeTagId),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp),
          orderBy('date', 'desc')
        );
      } else if (activeTagId) {
        affairsQuery = query(
          collection(db, 'current-affairs'),
          where('domains.subjects', 'array-contains', activeTagId),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp),
          orderBy('date', 'desc')
        );
      }
      
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
      isDateFilteredRef.current = true;
      setIsDateFiltered(true);
    } catch (error) {
      console.error('Error fetching articles by date:', error);
      setFilteredArticles([]);
    }
  };

  const clearDateFilter = () => {
    const today = new Date();
    setIsDateFiltered(false);
    isDateFilteredRef.current = false;
    setFilteredArticles([]);
    setSelectedDate(today);
    selectedDateRef.current = today;
    fetchQuizForDate(today);
  };

  // Function to handle date selection
  const handleDateChange = (date) => {
    if (!date) {
      clearDateFilter();
    return;
  }

  selectedDateRef.current = date;
    setSelectedDate(date);
    setIsDateFiltered(true);
    isDateFilteredRef.current = true;
    fetchArticlesByDate(date);
    fetchQuizForDate(date);
  };

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true); // Set loading to true at the start of fetch
      try {
        await fetchQuizForDate(selectedDateRef.current || new Date());

        let currentAffairsBaseQuery = collection(db, 'current-affairs');
        let dailyArticlesBaseQuery = collection(db, 'current-affairs');

        // Apply tag filtering if tagId is present
        if (activeTagId) {
          if (isGsTag) {
            currentAffairsBaseQuery = query(currentAffairsBaseQuery, where('domains.gs', '==', activeTagId));
            dailyArticlesBaseQuery = query(dailyArticlesBaseQuery, where('domains.gs', '==', activeTagId));
          } else {
            currentAffairsBaseQuery = query(currentAffairsBaseQuery, where('domains.subjects', 'array-contains', activeTagId));
            dailyArticlesBaseQuery = query(dailyArticlesBaseQuery, where('domains.subjects', 'array-contains', activeTagId));
          }
        }

        // Fetch Current Affairs
        const affairsQuery = query(currentAffairsBaseQuery, orderBy('date', 'desc'), limit(7));
        const affairsSnapshot = await getDocs(affairsQuery);
        const normalizeArticle = (doc) => {
          const data = doc.data();
          const title = typeof data.title === 'string' ? data.title.trim() : '';

          return {
            id: doc.id,
            ...data,
            title,
            date: data.date ? data.date : new Date()
          };
        };

        const isValidTitle = (title) => title && !/\.js(\?|$)/i.test(title) && !/^https?:\/\//i.test(title);

        const currentAffairsArticles = affairsSnapshot.docs
          .map(normalizeArticle)
          .filter(article => isValidTitle(article.title));

        setCurrentAffairs(currentAffairsArticles);

        // Fetch Daily Articles from Current Affairs
        const articlesQuery = query(dailyArticlesBaseQuery, orderBy('date', 'desc'), limit(5));
        const articlesSnapshot = await getDocs(articlesQuery);
        const dailyArticleList = articlesSnapshot.docs
          .map(normalizeArticle)
          .filter(article => isValidTitle(article.title)).slice(0, 5);
        setDailyArticles(dailyArticleList);

        // Fetch Latest Updates
        const updatesQuery = query(
          collection(db, 'latest-updates'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const updatesSnapshot = await getDocs(updatesQuery);
        const updates = updatesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            date: data.date ? data.date : new Date(),
            category: data.category || 'General',
            isImportant: data.isImportant || false
          };
        });
        setLatestUpdates(updates);

        if (isGsTag) {
          const otherTags = GS_TAGS.filter(tag => tag !== activeTagId);
          const otherTagResults = await Promise.all(otherTags.map(async (tag) => {
            const tagQuery = query(
              collection(db, 'current-affairs'),
              where('domains.gs', '==', tag),
              orderBy('date', 'desc'),
              limit(3)
            );
            const tagSnapshot = await getDocs(tagQuery);
            return {
              tag,
              articles: tagSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  title: data.title,
                  content: data.content,
                  date: data.date ? data.date : new Date(),
                  summary: data.summary || data.content?.substring(0, 160)
                };
              })
            };
          }));
          setOtherGsCollections(otherTagResults);
        } else {
          setOtherGsCollections([]);
        }

        if (isDateFilteredRef.current && selectedDateRef.current) {
          await fetchArticlesByDate(selectedDateRef.current);
        }

      } catch (err) {
        console.error("Error fetching content:", err);
        // Keep the default state values on error
        setOtherGsCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeTagId, isGsTag]);

  const heroHeadline = isGsTag
    ? `${activeTagId} Articles & Insights`
    : 'Shape Your Destiny, Serve the Nation';
  const heroSubtext = isGsTag
    ? `Curated analysis, quizzes, and resources mapped to ${activeTagId} so you can revise every theme with confidence.`
    : 'Join CivicCentre IAS, where aspirants transform into leaders. Your journey to becoming an IAS officer starts here.';

  const heroCtaHref = civicCentrePath('/courses');

  const defaultSectionTitle = isGsTag ? `${activeTagId} Highlights` : 'Latest Updates';
  const closeLeadModal = () => setShowLeadModal(false);

  return (
    <main className="main-content">
      {/* Hero Section */}
      <section className={`hero-section ${isGsTag ? 'gs-hero' : ''}`}>
        <h1>{heroHeadline}</h1>
        <p>{heroSubtext}</p>
        <a
          className="hero-button"
          href={heroCtaHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {isGsTag ? `Explore ${activeTagId} Resources` : 'Start Learning'} <ArrowRight />
        </a>
      </section>

      <div className="page-layout">
        <div className="main-column">
          <div className="main-content-wrapper">
            {/* Latest Updates Section - Moved to top */}
            <section className="content-section" id={isGsTag ? 'gs-article-feed' : 'latest-updates'}>
              <div className="section-card">
                <h2>
                  {isDateFiltered ? `Articles from ${formatDate(selectedDate)}` : defaultSectionTitle}
                  {isDateFiltered && (
                    <button 
                      onClick={clearDateFilter}
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
                              {article.domains?.gs && (
                                <Link to={`/gs/${article.domains.gs}`} className="tag-link">
                                  {article.domains.gs}
                                </Link>
                              )}
                              <span className="date">{formatDate(article.date)}</span>
                            </div>
                            <p className="summary">
                              {article.content ? `${article.content.substring(0, 150)}...` : 'Summary not available.'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p>No articles found for {formatDate(selectedDate)}</p>
                      )
                    ) : (
                      (latestUpdates.length > 0 ? latestUpdates : [
                        { id: 'placeholder-1', title: "UPSC CSE 2026-27 PCM Mentorship classes", content: "Mentorship classes for UPSC CSE 2026-27 PCM.", category: "UPSC", date: new Date(), source: 'CivicCentre IAS', link: '/updates' },
                        { id: 'placeholder-2', title: "UPSC CSE Mains 2025 GS FLMT", content: "Full Length Mock Tests for UPSC CSE Mains 2025 GS.", category: "UPSC", date: new Date(), source: 'CivicCentre IAS', link: '/updates' },
                        { id: 'placeholder-3', title: "Mains Sectional Tests Series 2025 Batch-2", content: "Batch-2 of Mains Sectional Tests Series for 2025.", category: "UPSC", date: new Date(), source: 'CivicCentre IAS', link: '/updates' },
                        { id: 'placeholder-4', title: "Mains 2026 Naipunyata+ A Long Term Program", content: "A long term program for Mains 2026.", category: "UPSC", date: new Date(), source: 'CivicCentre IAS', link: '/updates' },
                        { id: 'placeholder-5', title: "Mains 2025-26 NAIPUNYATA+", content: "NAIPUNYATA+ for Mains 2025-26.", category: "UPSC", date: new Date(), source: 'CivicCentre IAS', link: '/updates' },
                      ]).map((update) => {
                        const updateSource = update.source || 'CivicCentre IAS';
                        const updateLink = civicCentrePath(update.link || '/updates');
                        const updateSnippet = update.content ? `${update.content.substring(0, 150)}...` : 'Details coming soon.';
                        const updateCategory = update.category || 'General';
                        const normalizedCategory = updateCategory.toUpperCase();
                        const categoryIsGs = GS_TAGS.includes(normalizedCategory);
                        return (
                          <div key={update.id} className="content-item">
                            <h3>
                              {update.isImportant && <span className="important-badge">Important</span>}
                              <a href={updateLink} className="content-link" target="_blank" rel="noopener noreferrer">
                                {update.title}
                              </a>
                            </h3>
                            <div className="update-meta">
                              {categoryIsGs ? (
                                <Link to={`/gs/${normalizedCategory}`} className="tag-link">
                                  {normalizedCategory}
                                </Link>
                              ) : (
                                <span className="category">{updateCategory}</span>
                              )}
                              <span className="source">From {updateSource}</span>
                              <span className="date">{formatDate(update.date)}</span>
                            </div>
                            <p className="summary">{updateSnippet}</p>
                          </div>
                        );
                      })
                    )}
                    {!isDateFiltered && (
                      <a
                        href={civicCentrePath('/updates')}
                        className="card-button"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View All Updates <ArrowRight />
                      </a>
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
                  {quizLoading ? (
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
                        userResponses={quizResponses}
                        setUserResponses={setQuizResponses}
                        onQuizSubmit={handleQuizSubmit}
                        quizSubmitted={quizSubmitted}
                      />
                      {leadStatus.message && !showLeadModal && (
                        <p className={`quiz-lead-status ${leadStatus.type || ''}`}>
                          {leadStatus.message}
                        </p>
                      )}
                      {quizSubmitted && (
                        <>
                          {showLeadModal && (
                            <div className="quiz-lead-modal">
                              <div className="quiz-lead-backdrop" onClick={closeLeadModal} />
                              <div className="quiz-lead-dialog quiz-lead-wrapper">
                                <button
                                  type="button"
                                  className="quiz-lead-close"
                                  onClick={closeLeadModal}
                                  aria-label="Close lead capture form"
                                >
                                  &times;
                                </button>
                                <h4>Stay Updated with CivicCentre IAS</h4>
                                <p className="quiz-lead-score">
                                  You scored <strong>{quizScore}</strong> out of <strong>{todaysQuiz.questions?.length ?? quizResponses.length}</strong>.
                                  Share your details to receive regular updates and next steps.
                                </p>
                                {leadStatus.message && (
                                  <p className={`quiz-lead-status ${leadStatus.type || ''}`}>
                                    {leadStatus.message}
                                  </p>
                                )}
                                <form className="quiz-lead-form" onSubmit={handleLeadSubmit}>
                                  <div className="quiz-lead-field">
                                    <label htmlFor="quiz-lead-name">Full Name</label>
                                    <input
                                    id="quiz-lead-name"
                                    type="text"
                                    value={quizLeadForm.name}
                                    onChange={handleLeadInputChange('name')}
                                    placeholder="Enter your name"
                                    required
                                  />
                                </div>
                                <div className="quiz-lead-field">
                                  <label htmlFor="quiz-lead-mobile">Mobile Number</label>
                                  <input
                                    id="quiz-lead-mobile"
                                    type="tel"
                                    value={quizLeadForm.mobile}
                                    onChange={handleLeadInputChange('mobile')}
                                    placeholder="10-digit mobile number"
                                    required
                                  />
                                </div>
                                  <div className="quiz-lead-actions">
                                    <button
                                      type="button"
                                      className="quiz-lead-button secondary"
                                      onClick={handleSendOtp}
                                      disabled={leadSubmitting}
                                    >
                                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                    <button
                                      type="button"
                                      className="quiz-lead-button secondary"
                                      onClick={handleVerifyOtp}
                                      disabled={!otpSent || leadSubmitting}
                                    >
                                      Verify OTP
                                    </button>
                                  </div>
                                  <div className="quiz-lead-field otp-field">
                                    <label htmlFor="quiz-lead-otp">Enter OTP</label>
                                    <input
                                    id="quiz-lead-otp"
                                    type="text"
                                    value={quizLeadForm.otp}
                                    onChange={handleLeadInputChange('otp')}
                                    placeholder="Enter the OTP"
                                    disabled={!otpSent}
                                    required
                                  />
                                </div>
                                  <div className="quiz-lead-submit">
                                    <button
                                      type="submit"
                                      className="quiz-lead-button primary"
                                      disabled={!otpVerified || leadSubmitting}
                                    >
                                      {leadSubmitting ? 'Saving...' : 'Submit Details'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                          {!showLeadModal && (
                            <div className="quiz-lead-inline-cta">
                              <p>Thanks for completing the quiz! Share your details to receive curated updates.</p>
                              <button
                                type="button"
                                className="quiz-lead-inline-button"
                                onClick={() => setShowLeadModal(true)}
                              >
                                Open Details Form
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="quiz-empty-state">
                      {isDateFiltered
                        ? `No quiz was published for ${formatDate(selectedDate || new Date())}. Check back soon for fresh questions.`
                        : 'No quiz is available for today yet. Check back soon for a new challenge.'}
                    </p>
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
                      <Link to="/recent-articles" className="card-button">
                        View All <ArrowRight />
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              {isGsTag && otherGsCollections.length > 0 && (
                <section className="content-section">
                  <div className="section-card">
                    <h2>Explore Other GS Papers</h2>
                    <div className="other-gs-grid">
                      {otherGsCollections.map(({ tag, articles }) => (
                        <div key={tag} className="other-gs-card">
                          <div className="other-gs-card-header">
                            <span className="other-gs-pill">{tag}</span>
                            <p>Top picks from {tag} to balance your preparation.</p>
                          </div>
                          {articles.length > 0 ? (
                            <ul className="other-gs-list">
                              {articles.map((article) => (
                                <li key={article.id}>
                                  <Link to={`/current-affairs/${article.id}`}>{article.title}</Link>
                                  <span>{formatDate(article.date)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="empty-note">New articles coming soon.</p>
                          )}
                          <Link to={`/gs/${tag}`} className="other-gs-link">
                            View {tag} Articles <ArrowRight />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <PrimetimeVideos />

            {/* Previous Year Papers Section */}
            <section className="content-management-section">
              <h2>Previous Year Papers</h2>
              <div className="papers-grid">
                <div className="paper-card">
                  <h3>2023 Prelims Paper</h3>
                  <p>Download and analyze the latest prelims paper.</p>
                  <a
                    className="download-button"
                    href={civicCentrePath('/previous-year-papers')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </div>
                <div className="paper-card">
                  <h3>2022 Mains GS Paper I</h3>
                  <p>Review the Mains General Studies Paper I from 2022.</p>
                  <a
                    className="download-button"
                    href={civicCentrePath('/previous-year-papers')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </div>
                 <div className="paper-card">
                  <h3>2021 Essay Paper</h3>
                  <p>Practice writing with the essay topics from 2021.</p>
                  <a
                    className="download-button"
                    href={civicCentrePath('/previous-year-papers')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
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
                  <a
                    className="download-button"
                    href={civicCentrePath('/magazines')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read Now
                  </a>
                </div>
                <div className="magazine-card">
                  <h3>CivicCentre IAS Magazine - August 2025</h3>
                  <p>In-depth coverage of national and international events.</p>
                  <a
                    className="download-button"
                    href={civicCentrePath('/magazines')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read Now
                  </a>
                </div>
                <div className="magazine-card">
                  <h3>UPSC Success Stories - Vol. 3</h3>
                  <p>Inspiring journeys of successful IAS candidates.</p>
                  <a
                    className="download-button"
                    href={civicCentrePath('/magazines')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Your Copy
                  </a>
                </div>
              </div>
            </section>

            {/* Comment Section */}
            <section className="content-section comment-section-wrapper">
              <CommentSystem />
            </section>

            {/* Subscription Model Section */}
            <section className="content-management-section subscription-section">
              <h2>Unlock Premium Content</h2>
              <p className="subscription-intro">Subscribe to CivicCentre IAS for exclusive access to study materials, mock tests, and personalized guidance.</p>
              <div className="subscription-grid">
                <div className="subscription-card">
                  <h3>Basic Plan</h3>
                  <p className="price">Rs. 1499/month</p>
                  <ul>
                    <li>Access to Monthly Magazines</li>
                    <li>Daily Current Affairs</li>
                    <li>Basic Study Notes</li>
                  </ul>
                  <a
                    className="subscribe-button"
                    href={civicCentrePath('/subscriptions#basic')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Choose Basic
                  </a>
                </div>
                <div className="subscription-card featured-plan">
                  <h3>Premium Plan</h3>
                  <p className="price">Rs. 1999/month</p>
                  <ul>
                    <li>All Basic features</li>
                    <li>Access to All Publications</li>
                    <li>Full Mock Test Series</li>
                    <li>Personalized Mentorship</li>
                  </ul>
                  <a
                    className="subscribe-button"
                    href={civicCentrePath('/subscriptions#premium')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Choose Premium
                  </a>
                </div>
                <div className="subscription-card">
                  <h3>Annual Plan</h3>
                  <p className="price">Rs. 19999/year</p>
                  <ul>
                    <li>All Premium features</li>
                    <li>2 Months Free!</li>
                    <li>Exclusive Webinars</li>
                  </ul>
                  <a
                    className="subscribe-button"
                    href={civicCentrePath('/subscriptions#annual')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Choose Annual
                  </a>
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
                isClearable
              />
            </div>
          </div>

          {/* Important Links Section */}
          <div className="sidebar-section">
            <h3>Recent Articles</h3>
            <ul className="updates-list">
              {currentAffairs.map(article => (
                <li key={article.id}>
                  <Link to={`/current-affairs/${article.id}`} className="sidebar-article-link">
                    {article.title}
                  </Link>
                  <small>Posted {formatDate(article.date)}</small>
                </li>
              ))}
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

export default Home;
