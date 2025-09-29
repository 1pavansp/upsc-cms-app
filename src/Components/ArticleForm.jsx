import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ArticleForm.css';

const ArticleForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    examRelevance: {
      prelims: false,
      mains: false
    },
    domains: {
      gs: '',
      subjects: []
    },
    pyqs: [{
      year: '',
      examType: '',
      question: '',
      answer: ''
    }],
    image: null,
    imageUrl: ''
  });

  const gsOptions = ['GS1', 'GS2', 'GS3', 'GS4'];
  const subjectOptions = {
    GS1: ['History', 'Geography', 'Society', 'Art & Culture'],
    GS2: ['Polity', 'Governance', 'International Relations', 'Social Justice'],
    GS3: ['Economy', 'Environment', 'Science & Technology', 'Security'],
    GS4: ['Ethics', 'Integrity', 'Aptitude', 'Case Studies']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

  const handleExamRelevanceChange = (exam) => {
    setFormData(prev => ({
      ...prev,
      examRelevance: {
        ...prev.examRelevance,
        [exam]: !prev.examRelevance[exam]
      }
    }));
  };

  const handleGSChange = (e) => {
    const selectedGS = e.target.value;
    setFormData(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        gs: selectedGS,
        subjects: [] // Reset subjects when GS changes
      }
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        subjects: prev.domains.subjects.includes(subject)
          ? prev.domains.subjects.filter(s => s !== subject)
          : [...prev.domains.subjects, subject]
      }
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  const handlePYQChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pyqs: prev.pyqs.map((pyq, i) => 
        i === index ? { ...pyq, [field]: value } : pyq
      )
    }));
  };

  const addPYQ = () => {
    setFormData(prev => ({
      ...prev,
      pyqs: [...prev.pyqs, { year: '', examType: '', question: '', answer: '' }]
    }));
  };

  const removePYQ = (index) => {
    setFormData(prev => ({
      ...prev,
      pyqs: prev.pyqs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (formData.image) {
        const imageRef = ref(storage, `articles/${formData.image.name + '-' + Date.now()}`);
        const uploadResult = await uploadBytes(imageRef, formData.image);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const articleData = {
        title: formData.title,
        content: formData.content,
        examRelevance: formData.examRelevance,
        domains: formData.domains,
        pyqs: formData.pyqs.filter(pyq => pyq.question.trim() !== ''),
        imageUrl,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'current-affairs'), articleData);
      alert('Article posted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        examRelevance: { prelims: false, mains: false },
        domains: { gs: '', subjects: [] },
        pyqs: [{ year: '', examType: '', question: '', answer: '' }],
        image: null,
        imageUrl: ''
      });
    } catch (error) {
      console.error('Error posting article:', error);
      alert('Error posting article. Please try again.');
    }
  };

  return (
    <div className="article-form-container">
      <h2>Create New Article</h2>
      <form onSubmit={handleSubmit} className="article-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Article Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter article title"
          />
        </div>

        {/* Exam Relevance */}
        <div className="form-group">
          <label>Exam Relevance</label>
          <div className="exam-relevance-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.examRelevance.prelims}
                onChange={() => handleExamRelevanceChange('prelims')}
              />
              UPSC Prelims
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.examRelevance.mains}
                onChange={() => handleExamRelevanceChange('mains')}
              />
              UPSC Mains
            </label>
          </div>
        </div>

        {/* GS Paper Selection */}
        <div className="form-group">
          <label htmlFor="gs">GS Paper</label>
          <select
            id="gs"
            value={formData.domains.gs}
            onChange={handleGSChange}
            required
          >
            <option value="">Select GS Paper</option>
            {gsOptions.map(gs => (
              <option key={gs} value={gs}>{gs}</option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        {formData.domains.gs && (
          <div className="form-group">
            <label>Subjects</label>
            <div className="subject-options">
              {subjectOptions[formData.domains.gs].map(subject => (
                <label key={subject} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.domains.subjects.includes(subject)}
                    onChange={() => handleSubjectChange(subject)}
                  />
                  {subject}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image">Article Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {/* Content */}
        {/* Content */}
        <div className="form-group">
          <label htmlFor="content">Article Content</label>
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Enter article content"
          />
        </div>

        {/* Previous Year Questions */}
        <div className="form-group pyq-section">
          <label>Previous Year Questions</label>
          {formData.pyqs.map((pyq, index) => (
            <div key={index} className="pyq-form">
              <div className="pyq-header">
                <h4>Question {index + 1}</h4>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removePYQ(index)}
                    className="remove-pyq-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="pyq-inputs">
                <input
                  type="number"
                  placeholder="Year"
                  value={pyq.year}
                  onChange={(e) => handlePYQChange(index, 'year', e.target.value)}
                  min="1990"
                  max="2025"
                />
                <select
                  value={pyq.examType}
                  onChange={(e) => handlePYQChange(index, 'examType', e.target.value)}
                >
                  <option value="">Select Exam Type</option>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </div>
              <textarea
                placeholder="Question"
                value={pyq.question}
                onChange={(e) => handlePYQChange(index, 'question', e.target.value)}
                rows="3"
              />
              <textarea
                placeholder="Answer (optional)"
                value={pyq.answer}
                onChange={(e) => handlePYQChange(index, 'answer', e.target.value)}
                rows="3"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addPYQ}
            className="add-pyq-btn"
          >
            Add Another Question
          </button>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">
          Post Article
        </button>
      </form>
    </div>
  );
};

export default ArticleForm;