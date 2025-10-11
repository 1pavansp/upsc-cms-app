import React from 'react';

const normalizeText = (value = '') => value.toString().trim().toLowerCase();

const resolveAnswerText = (question) => {
  if (!question) return '';
  const { answer, options = [] } = question;
  if (typeof answer === 'number') {
    return options[answer] ?? '';
  }
  if (typeof answer === 'string') {
    const numericIndex = Number(answer);
    if (!Number.isNaN(numericIndex) && options[numericIndex] !== undefined) {
      return options[numericIndex];
    }
    const normalizedAnswer = normalizeText(answer);
    const matchedOption = options.find(option => normalizeText(option) === normalizedAnswer);
    return matchedOption ?? answer;
  }
  return '';
};

const isOptionCorrect = (question, optionIndex) => {
  if (!question) return false;
  const { answer, options = [] } = question;
  if (typeof answer === 'number') {
    return optionIndex === answer;
  }
  const numericIndex = Number(answer);
  if (!Number.isNaN(numericIndex)) {
    return optionIndex === numericIndex;
  }
  const selected = options[optionIndex];
  return normalizeText(selected) === normalizeText(answer);
};

const Quiz = ({
  quiz,
  currentQuestion,
  setCurrentQuestion,
  selectedOption,
  setSelectedOption,
  answerStatus,
  setAnswerStatus,
  userResponses,
  setUserResponses,
  onQuizSubmit,
  quizSubmitted
}) => {
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return <p>No questions available in this quiz. Please add some questions to get started.</p>;
  }

  const totalQuestions = quiz.questions.length;
  const question = quiz.questions[currentQuestion];
  const storedResponses = Array.isArray(userResponses) ? userResponses : [];
  const allAnswered = storedResponses.length === totalQuestions && storedResponses.every(resp => resp !== null && resp !== undefined);
  const correctAnswerText = resolveAnswerText(question);

  const handleOptionClick = (index) => {
    if (quizSubmitted) return;

    setSelectedOption(index);
    setUserResponses(prev => {
      const next = Array.isArray(prev) ? [...prev] : Array(totalQuestions).fill(null);
      next[currentQuestion] = index;
      return next;
    });

    setAnswerStatus(isOptionCorrect(question, index) ? 'correct' : 'wrong');
  };

  const goToQuestion = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= totalQuestions) return;

    setCurrentQuestion(targetIndex);
    const stored = storedResponses[targetIndex];
    if (stored !== null && stored !== undefined) {
      setSelectedOption(stored);
      setAnswerStatus(isOptionCorrect(quiz.questions[targetIndex], stored) ? 'correct' : 'wrong');
    } else {
      setSelectedOption(null);
      setAnswerStatus(null);
    }
  };

  const handlePrev = () => {
    if (currentQuestion === 0) return;
    goToQuestion(currentQuestion - 1);
  };

  const handleNext = () => {
    if (currentQuestion >= totalQuestions - 1) return;
    goToQuestion(currentQuestion + 1);
  };

  const handleSubmit = () => {
    if (quizSubmitted || !allAnswered) return;
    if (typeof onQuizSubmit === 'function') {
      onQuizSubmit();
    }
  };

  const selectionForCurrent = selectedOption ?? storedResponses[currentQuestion] ?? null;

  return (
    <div className="quiz-content">
      <h4>Question {currentQuestion + 1} of {totalQuestions}</h4>
      <p className="question-text">{question.question}</p>

      <ul className="quiz-options">
        {question.options.map((option, idx) => {
          const isSelected = selectionForCurrent === idx;
          const optionIsCorrect = isOptionCorrect(question, idx);

          let optionClass = 'quiz-option';
          if (isSelected) {
            optionClass += ' selected';
          }
          if (selectionForCurrent !== null || quizSubmitted) {
            if (optionIsCorrect) {
              optionClass += ' correct';
            } else if (isSelected && !optionIsCorrect) {
              optionClass += ' wrong';
            }
          }
          if (quizSubmitted) {
            optionClass += ' locked';
          }

          return (
            <li
              key={idx}
              onClick={() => !quizSubmitted && handleOptionClick(idx)}
              className={optionClass}
              role="button"
              tabIndex={quizSubmitted ? -1 : 0}
            >
              {option}
            </li>
          );
        })}
      </ul>

      {selectionForCurrent !== null && (
        <div className={`quiz-feedback ${answerStatus}`}>
          {answerStatus === 'correct' ? (
            <>Correct! Well done!</>
          ) : (
            <>Wrong! The correct answer is: {correctAnswerText}</>
          )}
        </div>
      )}

      <div className="quiz-navigation">
        <button
          className="quiz-nav-button"
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          Previous
        </button>
        {currentQuestion < totalQuestions - 1 ? (
          <button
            className="quiz-nav-button"
            onClick={handleNext}
            disabled={currentQuestion >= totalQuestions - 1}
          >
            Next
          </button>
        ) : (
          <button
            className="quiz-nav-button submit"
            onClick={handleSubmit}
            disabled={!allAnswered || quizSubmitted}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;