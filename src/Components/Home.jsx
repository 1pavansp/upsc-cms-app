// src/components/Home.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { db } from '../firebase';
import { formatDate, getDateRange } from '../utils/dateUtils';
import { ensureArticleHasSlug } from '../utils/articleUtils';
import { createSnippet } from '../utils/textUtils';
import Quiz from './Quiz';
import CommentSystem from './CommentSystem';
import PrimetimeVideos from './PrimetimeVideos';
import DownloadAppSection from './DownloadAppSection';
import './Home.css';
import { civicCentrePath } from '../constants/civicCentre';

const normalizeText = (value = '') => value?.toString().trim().toLowerCase();

const GS_TAGS = ['GS1', 'GS2', 'GS3', 'GS4'];

const FALLBACK_STATE_HIGHLIGHTS = [
  {
    id: 'telangana',
    label: 'Telangana',
    path: '/state/telangana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Charminar_south_east.jpg/640px-Charminar_south_east.jpg',
    imageAlt: 'Charminar monument at dusk in Hyderabad, Telangana',
    highlight: 'Charminar, Hyderabad'
  },
  {
    id: 'andhra-pradesh',
    label: 'Andhra Pradesh',
    path: '/state/andhra-pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Amaravati_Stupa%2C_Amaravati%2C_India_%2807%29.jpg/640px-Amaravati_Stupa%2C_Amaravati%2C_India_%2807%29.jpg',
    imageAlt: 'Ancient Amaravati Stupa in Andhra Pradesh',
    highlight: 'Amaravati Stupa'
  }
];

const FALLBACK_LATEST_UPDATES = [
  {
    id: 'placeholder-1',
    title: 'UPSC CSE 2026-27 PCM Mentorship classes',
    content: 'Mentorship classes for UPSC CSE 2026-27 PCM.',
    category: 'UPSC',
    date: new Date(),
    source: 'CivicCentre IAS',
    link: '/#announce'
  },
  {
    id: 'placeholder-2',
    title: 'UPSC CSE Mains 2025 GS FLMT',
    content: 'Full Length Mock Tests for UPSC CSE Mains 2025 GS.',
    category: 'UPSC',
    date: new Date(),
    source: 'CivicCentre IAS',
    link: '/#announce'
  },
  {
    id: 'placeholder-3',
    title: 'Mains Sectional Tests Series 2025 Batch-2',
    content: 'Batch-2 of Mains Sectional Tests Series for 2025.',
    category: 'UPSC',
    date: new Date(),
    source: 'CivicCentre IAS',
    link: '/#announce'
  }
];

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
  const [stateHighlights, setStateHighlights] =
    useState(FALLBACK_STATE_HIGHLIGHTS);
  const [quizLoading, setQuizLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const renderRichText = (markup, fallbackText) => {
    if (typeof markup === 'string' && markup.trim().length > 0) {
      return (
        <div
          className="rich-text-block"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      );
    }

    if (fallbackText) {
      return <p>{fallbackText}</p>;
    }

    return null;
  };

  const previousYearPapers = [
    {
      id: 'py-2023-prelims',
      title: '2023 Prelims Paper',
      description: 'Download and analyze the latest prelims paper.',
      link: civicCentrePath('/#free-library'),
      cta: 'Download'
    },
    {
      id: 'py-2022-mains-gs1',
      title: '2022 Mains GS Paper I',
      description: 'Review the Mains General Studies Paper I from 2022.',
      link: civicCentrePath('/#free-library'),
      cta: 'Download'
    },
    {
      id: 'py-2021-essay',
      title: '2021 Essay Paper',
      description: 'Practice writing with the essay topics from 2021.',
      link: civicCentrePath('/#free-library'),
      cta: 'Download'
    }
  ];

  const civicCentrePublications = [
    {
      id: 'pub-2025-sept',
      title: 'Magazine - September 2025',
      description: 'Comprehensive analysis of current affairs and exam-oriented articles.',
      link: civicCentrePath('/#free-library'),
      cta: 'Read Now'
    },
    {
      id: 'pub-2025-aug',
      title: 'Magazine - August 2025',
      description: 'In-depth coverage of national and international events.',
      link: civicCentrePath('/#free-library'),
      cta: 'Read Now'
    },
    {
      id: 'pub-success-stories',
      title: 'UPSC Success Stories - Vol. 3',
      description: 'Inspiring journeys of successful IAS candidates.',
      link: civicCentrePath('/#free-library'),
      cta: 'View'
    }
  ];

  useEffect(() => {
    const fetchStateHighlightContent = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'state-highlights'));
        if (!snapshot.empty) {
          const docMap = snapshot.docs.reduce((acc, docSnap) => {
            acc[docSnap.id] = docSnap.data();
            return acc;
          }, {});
          const mergedHighlights = FALLBACK_STATE_HIGHLIGHTS.map((fallback) => {
            const docData = docMap[fallback.id];
            if (!docData) {
              return fallback;
            }
            return {
              ...fallback,
              label: docData.label || fallback.label,
              highlight: docData.highlight || fallback.highlight,
              path: docData.path || fallback.path,
              image: docData.imageUrl || fallback.image,
              imageAlt: docData.label
                ? `${docData.label} highlight`
                : fallback.imageAlt
            };
          });
          setStateHighlights(mergedHighlights);
        }
      } catch (err) {
        console.error('Error loading state highlights:', err);
      }
    };

    fetchStateHighlightContent();
  }, []);

  const resetQuizLeadState = useCallback(
    (questionCount = 0) => {
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
    },
    [
      setQuizResponses,
      setQuizSubmitted,
      setQuizScore,
      setQuizLeadForm,
      setOtpSent,
      setOtpVerified,
      setGeneratedOtp,
      setLeadStatus,
      setLeadSubmitting,
      setShowLeadModal
    ]
  );

  const resolveQuizDate = useCallback((value) => {
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
  }, []);

  const buildQuizFromDoc = useCallback((doc) => {
    if (!doc) return null;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: resolveQuizDate(data.date),
      questions: Array.isArray(data.questions) ? data.questions : []
    };
  }, [resolveQuizDate]);

  const applyQuizData = useCallback(
    (quizData) => {
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
    },
    [resetQuizLeadState, setTodaysQuiz, setCurrentQuestion, setSelectedOption, setAnswerStatus]
  );

  const fetchQuizForDate = useCallback(
    async (dateValue = new Date()) => {
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
    },
    [applyQuizData, buildQuizFromDoc]
  );

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
  const fetchArticlesByDate = useCallback(
    async (date) => {
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
        const dateFilteredArticles = await Promise.all(
          affairsSnapshot.docs.map((docSnap) => ensureArticleHasSlug(docSnap))
        );
        
        setFilteredArticles(dateFilteredArticles);
        isDateFilteredRef.current = true;
        setIsDateFiltered(true);
      } catch (error) {
        console.error('Error fetching articles by date:', error);
        setFilteredArticles([]);
      }
    },
    [activeTagId, isGsTag, setFilteredArticles, setIsDateFiltered]
  );

  const clearDateFilter = () => {
    const today = new Date();
    setIsDateFiltered(false);
    isDateFilteredRef.current = false;
    setFilteredArticles([]);
    setSelectedDate(today);
    selectedDateRef.current = today;
    fetchQuizForDate(today);
  };

  const handleDateChange = (date) => {
    if (!date) {
      clearDateFilter();
      return;
    }

    selectedDateRef.current = date;
    isDateFilteredRef.current = true;
    setSelectedDate(date);
    setIsDateFiltered(true);
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
        const normalizeArticle = async (docSnap) => {
          const article = await ensureArticleHasSlug(docSnap);
          const title = typeof article.title === 'string' ? article.title.trim() : '';

          return {
            ...article,
            title,
            date: article.date || new Date()
          };
        };

        const isValidTitle = (title) => title && !/\.js(\?|$)/i.test(title) && !/^https?:\/\//i.test(title);

        const currentAffairsArticlesRaw = await Promise.all(
          affairsSnapshot.docs.map((docSnap) => normalizeArticle(docSnap))
        );
        const currentAffairsArticles = currentAffairsArticlesRaw
          .filter(article => isValidTitle(article.title));

        setCurrentAffairs(currentAffairsArticles);

        // Fetch Daily Articles from Current Affairs
        const articlesQuery = query(dailyArticlesBaseQuery, orderBy('date', 'desc'), limit(5));
        const articlesSnapshot = await getDocs(articlesQuery);
        const dailyArticleListRaw = await Promise.all(
          articlesSnapshot.docs.map((docSnap) => normalizeArticle(docSnap))
        );
        const dailyArticleList = dailyArticleListRaw
          .filter(article => isValidTitle(article.title))
          .slice(0, 5);
        setDailyArticles(dailyArticleList);

        // Fetch Latest Updates
        const updatesQuery = query(
          collection(db, 'latest-updates'),
          orderBy('date', 'desc'),
          limit(3)
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
            const articlesWithSlug = await Promise.all(
              tagSnapshot.docs.map((docSnap) => normalizeArticle(docSnap))
            );
            return {
              tag,
              articles: articlesWithSlug.map((article) => ({
                ...article,
                summary: article.summary || article.content?.substring(0, 160)
              }))
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
  }, [activeTagId, isGsTag, fetchArticlesByDate, fetchQuizForDate]);

  const heroHeadline = isGsTag
    ? `${activeTagId} Articles & Insights`
    : 'Shape Your Destiny, Serve the Nation';
  const heroSubtext = isGsTag
    ? `Curated analysis, quizzes, and resources mapped to ${activeTagId} so you can revise every theme with confidence.`
    : 'Join CivicCentre IAS, where aspirants transform into leaders. Your journey to becoming an IAS officer starts here.';

  const heroCtaHref = civicCentrePath('/courses');
  const resolvedLatestUpdates =
    latestUpdates.length > 0 ? latestUpdates : FALLBACK_LATEST_UPDATES;

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
                      {renderRichText(
                        todaysQuiz?.description,
                        'Test your knowledge with today\'s quiz!'
                      )}
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
                        <div className={`quiz-lead-modal ${showLeadModal ? 'visible' : ''}`}>
                          <div className="quiz-lead-dialog quiz-lead-wrapper">
                            <div className="quiz-lead-header">
                              <h4>Stay Updated with CivicCentre IAS</h4>
                              <button
                                type="button"
                                className="quiz-lead-close"
                                onClick={closeLeadModal}
                                aria-label="Close lead capture form"
                              >
                                &times;
                              </button>
                            </div>
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
              <section className="content-section daily-articles-section">
                <div className="section-card daily-articles-card">
                  <h2>Daily Articles</h2>
                  {loading ? (
                    <p>Loading articles...</p>
                  ) : (
                    <div className="section-content daily-articles-list">
                      {dailyArticles.map((article) => (
                        <div key={article.id} className="content-item daily-article-item">
                          <h3>
                            <Link
                              to={`/current-affairs/${article.slug || article.id}`}
                              className="content-link"
                            >
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
                                  <Link to={`/current-affairs/${article.slug || article.id}`}>
                                    {article.title}
                                  </Link>
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

            {/* State Current Affairs Section */}
            <section className="content-section state-current-affairs-section">
              <div className="section-card state-current-affairs-card">
                <h2>State Current Affairs</h2>
                <p className="section-note">Choose your state to explore focused analysis and resources tailored for regional exams.</p>
                <div className="state-current-affairs-list">
                  {stateHighlights.map((state) => (
                    <Link
                      key={state.id}
                      to={state.path}
                      className="state-current-affairs-link"
                    >
                      <span className="state-current-affairs-label">{state.label}</span>
                      <span className="state-current-affairs-caption">{state.highlight}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* CivicCentre Publications Section */}
            <section className="content-management-section publications-section">
              <h2>CivicCentre Publications</h2>
              <div className="magazines-grid">
                {civicCentrePublications.map((publication) => (
                  <div key={publication.id} className="magazine-card">
                    <h3>{publication.title}</h3>
                    <p>{publication.description}</p>
                    <a
                      className="download-button"
                      href={publication.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {publication.cta || 'View'}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Previous Year Papers Section */}
            <section className="content-management-section previous-year-section">
              <h2>Previous Year Papers</h2>
              <div className="papers-grid">
                {previousYearPapers.map((paper) => (
                  <div key={paper.id} className="paper-card">
                    <h3>{paper.title}</h3>
                    <p>{paper.description}</p>
                    <a
                      className="download-button"
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {paper.cta || 'Download'}
                    </a>
                  </div>
                ))}
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
                    href={civicCentrePath('/#popular-courses')}
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
                    href={civicCentrePath('/#academy-excellence')}
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
                    href={civicCentrePath('/#cta')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Choose Annual
                  </a>
                </div>
              </div>
            </section>
            <DownloadAppSection />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Latest Updates Section */}
          <section className="content-section" id={isGsTag ? 'gs-article-feed' : 'latest-updates'}>
            <div className="section-card latest-updates-card">
              <h2 className="latest-heading">
                {!isDateFiltered && (
                  <span className="latest-heading-label">Latest</span>
                )}
                <span className="latest-heading-title">
                  {isDateFiltered ? `Articles from ${formatDate(selectedDate)}` : defaultSectionTitle}
                </span>
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
                          <Link
                            to={`/current-affairs/${article.slug || article.id}`}
                            className="content-link"
                          >
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
                            {article.content ? createSnippet(article.content, 150) : 'Summary not available.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>No articles found for {formatDate(selectedDate)}</p>
                    )
                    ) : (
                    resolvedLatestUpdates.slice(0, 2).map((update) => {
                      const updateSource = update.source || 'CivicCentre IAS';
                      const updateLink = civicCentrePath(update.link || '/#announce');
                      const updateSnippet = update.content ? createSnippet(update.content, 150) : 'Details coming soon.';
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
                </div>
              )}
            </div>
          </section>

          <div className="sidebar-sticky-group">
            {/* Calendar Section */}
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
              </div>
            </div>

            {/* Important Links Section */}
            <div className="sidebar-section">
              <h3>Recent Articles</h3>
              <ul className="updates-list sidebar-article-list">
                {currentAffairs.slice(0, 3).map(article => (
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
              <Link to="/recent-articles" className="sidebar-cta-link">
                View All Articles
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Home;

