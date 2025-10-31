import React from 'react';

const normalizeText = (value = '') => value.toString().trim().toLowerCase();

const resolveAnswerText = (question) => {
  if (!question) return '';
  const { options = [] } = question;
  const answerValue = question.answer ?? question.correctAnswer;

  if (typeof answerValue === 'number') {
    return options[answerValue] ?? '';
  }

  if (typeof answerValue === 'string') {
    const numericIndex = Number(answerValue);
    if (!Number.isNaN(numericIndex) && options[numericIndex] !== undefined) {
      return options[numericIndex];
    }
    const normalizedAnswer = normalizeText(answerValue);
    const matchedOption = options.find(option => normalizeText(option) === normalizedAnswer);
    return matchedOption ?? answerValue;
  }

  return '';
};

const isOptionCorrect = (question, optionIndex) => {
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
    return normalizeText(selected) === normalizeText(answerValue);
  }

  return false;
};

const successMessageForAnswer = (answerText) =>
  answerText
    ? `Great job! "${answerText}" is the right pick - keep the momentum going.`
    : 'Great job! Keep the momentum going.';

const growthMessage =
  'Every misstep is a clue. Revisit the concept, stay curious, and you will nail it next time.';

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
  const rawResolvedAnswer = resolveAnswerText(question);
  const derivedAnswerText = (() => {
    if (rawResolvedAnswer && rawResolvedAnswer.toString().trim().length > 0) {
      return rawResolvedAnswer;
    }
    if (question) {
      const answerValue = question.answer ?? question.correctAnswer;
      if (typeof answerValue === 'number') {
        const option = question.options?.[answerValue];
        if (option && option.toString().trim()) {
          return option;
        }
        return `Option ${answerValue + 1}`;
      }
      if (typeof answerValue === 'string' && answerValue.trim()) {
        return answerValue;
      }
      if (Array.isArray(question.options)) {
        const correctIndex = question.options.findIndex((_, idx) => isOptionCorrect(question, idx));
        if (correctIndex !== -1) {
          const optionValue = question.options[correctIndex];
          if (optionValue && optionValue.toString().trim()) {
            return optionValue;
          }
          return `Option ${correctIndex + 1}`;
        }
      }
    }
    return null;
  })();
  const hasResolvableAnswer = typeof derivedAnswerText === 'string' && derivedAnswerText.trim().length > 0;

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
      <div
        className="question-text"
        dangerouslySetInnerHTML={{ __html: question.question || '' }}
      />
      <ul className="quiz-options">
        {question.options.map((option, idx) => {
          const isSelected = selectionForCurrent === idx;
          const optionIsCorrect = isOptionCorrect(question, idx);

          let optionClass = 'quiz-option';

          if (selectionForCurrent !== null || quizSubmitted) {
            if (optionIsCorrect) {
              optionClass += ' correct';
            } else if (isSelected) {
              optionClass += ' wrong';
            }
          }

          if (isSelected) {
            optionClass += ' selected';
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

      {selectionForCurrent !== null && answerStatus && (
        <div className={`quiz-feedback ${answerStatus}`}>
          {answerStatus === 'correct' ? (
            <>
              <strong>Correct!</strong>
              <p className="quiz-feedback-note">
                {successMessageForAnswer(derivedAnswerText || '')}
              </p>
            </>
          ) : (
            <>
              <strong>Keep Going!</strong>
              <p className="quiz-feedback-note">{growthMessage}</p>
              <p className="quiz-feedback-answer">
                Correct answer:&nbsp;
                <span>{hasResolvableAnswer ? derivedAnswerText : 'Answer key not provided'}</span>
              </p>
            </>
          )}
          {question.explanation && (
            <div
              className="quiz-explanation"
              dangerouslySetInnerHTML={{ __html: question.explanation }}
            />
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
