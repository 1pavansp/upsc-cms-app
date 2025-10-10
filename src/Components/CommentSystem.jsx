import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageCircle, User, Clock } from 'lucide-react';
import './CommentSystem.css';

const CommentSystem = () => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fallbackComments, setFallbackComments] = useState([
    {
      id: 'fallback-1',
      content: "The monthly magazines are incredibly helpful for current affairs preparation! The analysis is so detailed and exam-oriented. Thank you CivicCentre IAS!",
      author: "Priya Sharma",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12
    },
    {
      id: 'fallback-2',
      content: "I appreciate the detailed analysis in the publications. The way complex topics are broken down makes it so much easier to understand. Keep up the excellent work!",
      author: "Rajesh Kumar",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      likes: 8
    },
    {
      id: 'fallback-3',
      content: "The daily quiz section is amazing! It helps me stay consistent with my preparation. The explanations are very clear and help me understand my mistakes.",
      author: "Anita Singh",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      likes: 15
    },
    {
      id: 'fallback-4',
      content: "The study materials are comprehensive and well-structured. The previous year papers section is particularly useful for understanding the exam pattern.",
      author: "Vikram Patel",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      likes: 6
    },
    {
      id: 'fallback-5',
      content: "The UPSC syllabus tracker is a game-changer! It helps me stay organized and track my progress systematically. Highly recommended for serious aspirants.",
      author: "Sneha Gupta",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      likes: 9
    },
    {
      id: 'fallback-6',
      content: "The mock test series is excellent! The questions are well-crafted and the explanations help me understand the concepts better. Great platform!",
      author: "Arjun Mehta",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      likes: 11
    },
    {
      id: 'fallback-7',
      content: "The mentorship program has been incredibly helpful. The personalized guidance and feedback have improved my preparation significantly.",
      author: "Kavya Reddy",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      likes: 7
    },
    {
      id: 'fallback-8',
      content: "The current affairs coverage is comprehensive and up-to-date. The analysis helps me connect events with the UPSC syllabus effectively.",
      author: "Rohit Agarwal",
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      likes: 13
    }
  ]);

  // Set fallback comments immediately
  useEffect(() => {
    setComments(fallbackComments);
    setLoading(false);
  }, []);

  // Initialize sample comments if none exist
  useEffect(() => {
    const initializeSampleComments = async () => {
      if (hasInitialized) return;
      
      try {
        const commentsRef = collection(db, 'comments');
        const snapshot = await getDocs(commentsRef);
        
        if (snapshot.empty) {
          const sampleComments = [
            {
              content: "The monthly magazines are incredibly helpful for current affairs preparation! The analysis is so detailed and exam-oriented. Thank you CivicCentre IAS!",
              author: "Priya Sharma",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              likes: 12
            },
            {
              content: "I appreciate the detailed analysis in the publications. The way complex topics are broken down makes it so much easier to understand. Keep up the excellent work!",
              author: "Rajesh Kumar",
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
              likes: 8
            },
            {
              content: "The daily quiz section is amazing! It helps me stay consistent with my preparation. The explanations are very clear and help me understand my mistakes.",
              author: "Anita Singh",
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
              likes: 15
            },
            {
              content: "The study materials are comprehensive and well-structured. The previous year papers section is particularly useful for understanding the exam pattern.",
              author: "Vikram Patel",
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              likes: 6
            },
            {
              content: "The UPSC syllabus tracker is a game-changer! It helps me stay organized and track my progress systematically. Highly recommended for serious aspirants.",
              author: "Sneha Gupta",
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
              likes: 9
            },
            {
              content: "The mock test series is excellent! The questions are well-crafted and the explanations help me understand the concepts better. Great platform!",
              author: "Arjun Mehta",
              timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
              likes: 11
            },
            {
              content: "The mentorship program has been incredibly helpful. The personalized guidance and feedback have improved my preparation significantly.",
              author: "Kavya Reddy",
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              likes: 7
            },
            {
              content: "The current affairs coverage is comprehensive and up-to-date. The analysis helps me connect events with the UPSC syllabus effectively.",
              author: "Rohit Agarwal",
              timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
              likes: 13
            }
          ];

          // Add sample comments to Firebase
          for (const comment of sampleComments) {
            await addDoc(commentsRef, {
              ...comment,
              timestamp: serverTimestamp()
            });
          }
        }
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing sample comments:', error);
        // Set fallback comments if Firebase fails
        const fallbackData = [
          {
            id: 'fallback-1',
            content: "The monthly magazines are incredibly helpful for current affairs preparation! The analysis is so detailed and exam-oriented. Thank you CivicCentre IAS!",
            author: "Priya Sharma",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likes: 12
          },
          {
            id: 'fallback-2',
            content: "I appreciate the detailed analysis in the publications. The way complex topics are broken down makes it so much easier to understand. Keep up the excellent work!",
            author: "Rajesh Kumar",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            likes: 8
          },
          {
            id: 'fallback-3',
            content: "The daily quiz section is amazing! It helps me stay consistent with my preparation. The explanations are very clear and help me understand my mistakes.",
            author: "Anita Singh",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            likes: 15
          },
          {
            id: 'fallback-4',
            content: "The study materials are comprehensive and well-structured. The previous year papers section is particularly useful for understanding the exam pattern.",
            author: "Vikram Patel",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            likes: 6
          },
          {
            id: 'fallback-5',
            content: "The UPSC syllabus tracker is a game-changer! It helps me stay organized and track my progress systematically. Highly recommended for serious aspirants.",
            author: "Sneha Gupta",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            likes: 9
          },
          {
            id: 'fallback-6',
            content: "The mock test series is excellent! The questions are well-crafted and the explanations help me understand the concepts better. Great platform!",
            author: "Arjun Mehta",
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            likes: 11
          },
          {
            id: 'fallback-7',
            content: "The mentorship program has been incredibly helpful. The personalized guidance and feedback have improved my preparation significantly.",
            author: "Kavya Reddy",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            likes: 7
          },
          {
            id: 'fallback-8',
            content: "The current affairs coverage is comprehensive and up-to-date. The analysis helps me connect events with the UPSC syllabus effectively.",
            author: "Rohit Agarwal",
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            likes: 13
          }
        ];
        setFallbackComments(fallbackData);
        setHasInitialized(true);
      }
    };

    initializeSampleComments();
  }, [hasInitialized]);

  // Fetch comments from Firebase (optional)
  useEffect(() => {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Only use Firebase comments if they exist, otherwise keep fallback
      if (commentsData.length > 0) {
        setComments(commentsData);
      }
    });

    return () => unsubscribe();
  }, []);


  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        content: newComment.trim(),
        author: authorName.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
        replies: []
      });
      setNewComment('');
      setAuthorName('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like functionality
  const handleLike = async (commentId) => {
    setLikes(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div>
      <h2>Community Comments</h2>
      
      {/* Comment Form */}
      <div className="comment-form-wrapper">
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Your Name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Share your thoughts or ask a question..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="form-textarea"
              rows="3"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || !newComment.trim() || !authorName.trim()}
          >
            {isSubmitting ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <Send className="send-icon" />
                Post Comment
              </>
            )}
          </button>
        </form>
      </div>

      {/* Comments Display */}
      <div className="comments-wrapper">
        {loading ? (
          <div className="loading-comments">
            <div className="loading-spinner" />
            <span>Loading comments...</span>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="author-info">
                    <div className="author-avatar">
                      <User className="user-icon" />
                    </div>
                    <div className="author-details">
                      <span className="author-name">{comment.author}</span>
                      <span className="comment-time">
                        <Clock className="time-icon" />
                        {formatTime(comment.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="comment-content">
                  <p>{comment.content}</p>
                </div>

                <div className="comment-actions">
                  <button 
                    className={`action-btn like-btn ${likes[comment.id] ? 'liked' : ''}`}
                    onClick={() => handleLike(comment.id)}
                  >
                    <Heart className={`heart-icon ${likes[comment.id] ? 'liked' : ''}`} />
                    <span>{comment.likes + (likes[comment.id] ? 1 : 0)}</span>
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}

        {comments.length === 0 && !loading && (
          <div className="no-comments">
            <MessageCircle className="empty-icon" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;
