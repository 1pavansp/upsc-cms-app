import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { getYoutubeEmbedUrl } from '../utils/videoUtils';
import './PrimetimeVideos.css';

const normalizeVideo = (doc) => {
  const data = doc.data();
  const embedBase = getYoutubeEmbedUrl(data.videoUrl);
  return {
    id: doc.id,
    title: data.title || 'Primetime Session',
    description: data.description || '',
    presenter: data.presenter || '',
    videoUrl: data.videoUrl || '',
    embedUrl: embedBase ? `${embedBase}?rel=0` : '',
    isActive: data.isActive ?? true,
    createdAt: data.createdAt
  };
};

const PrimetimeVideos = ({ autoplayInterval = 9000 }) => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const videosQuery = query(
          collection(db, 'primetime-videos'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(videosQuery);
        const fetchedVideos = snapshot.docs
          .map(normalizeVideo)
          .filter((video) => video.embedUrl && video.isActive !== false);
        setVideos(fetchedVideos);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Error fetching Primetime videos:', err);
        setError('Unable to load Primetime videos right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    if (videos.length <= 1) return undefined;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % videos.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [videos, autoplayInterval]);

  const hasVideos = videos.length > 0;

  return (
    <section className="content-section primetime-section">
      <div className="section-card">
        <div className="primetime-header">
          <div>
            <h2>Primetime Videos</h2>
            <p>High impact sessions to reinforce key UPSC concepts.</p>
          </div>
        </div>
        {isLoading ? (
          <div className="primetime-placeholder">Loading Primetime videos...</div>
        ) : error ? (
          <div className="primetime-error">{error}</div>
        ) : hasVideos ? (
          <div className="primetime-carousel">
            <div
              className="primetime-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {videos.map((video) => (
                <article key={video.id} className="primetime-slide">
                  <div className="primetime-player-wrapper">
                    <iframe
                      src={video.embedUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="primetime-slide-content">
                    <div>
                      <span className="primetime-presenter">{video.presenter}</span>
                      <h3>{video.title}</h3>
                      {video.description && <p>{video.description}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {videos.length > 1 && (
              <div className="primetime-indicators">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    type="button"
                    className={index === currentIndex ? 'active' : ''}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Show video ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="primetime-placeholder">
            Primetime videos will appear here once the admin adds them.
          </div>
        )}
      </div>
    </section>
  );
};

export default PrimetimeVideos;
