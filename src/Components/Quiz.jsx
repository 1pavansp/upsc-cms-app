import React from 'react';

const Quiz = ({ quiz, currentQuestion, setCurrentQuestion, selectedOption, setSelectedOption, answerStatus, setAnswerStatus }) => {
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return <p>No questions available in this quiz. Please add some questions to get started.</p>;
  }

  const handleOptionClick = (index) => {
    setSelectedOption(index);
    const correctAnswer = quiz.questions[currentQuestion].answer;
    const selectedOptionText = quiz.questions[currentQuestion].options[index];
    setAnswerStatus(selectedOptionText === correctAnswer ? 'correct' : 'wrong');
  };

  return (
    <div className="quiz-content">
      <h4>Question {currentQuestion + 1} of {quiz.questions.length}</h4>
      <p className="question-text">{quiz.questions[currentQuestion].question}</p>
      
      <ul className="quiz-options">
        {quiz.questions[currentQuestion].options.map((option, idx) => {
          const isCorrect = option === quiz.questions[currentQuestion].answer;
          const isSelected = selectedOption === idx;
          
          let optionClass = 'quiz-option';
          if (selectedOption !== null) {
            if (isCorrect) {
              optionClass += ' correct';
            } 
            if (isSelected && !isCorrect) {
              optionClass += ' wrong';
            }
            if (isSelected && isCorrect) {
              optionClass += ' correct';
            }
          } else if (isSelected) {
            optionClass += ' selected';
          }

          return (
            <li
              key={idx}
              onClick={() => selectedOption === null && handleOptionClick(idx)}
              className={optionClass}
              role="button"
              tabIndex={0}
            >
              {option}
            </li>
          );
        })}
      </ul>

      {selectedOption !== null && (
        <div className={`quiz-feedback ${answerStatus}`}>
          {answerStatus === 'correct' ? (
            <>✓ Correct! Well done!</>
          ) : (
            <>× Wrong! The correct answer is: {quiz.questions[currentQuestion].options[quiz.questions[currentQuestion].answer]}</>
          )}
        </div>
      )}

      <div className="quiz-navigation">
        <button
          className={`quiz-nav-button ${currentQuestion === 0 ? 'disabled' : ''}`}
          onClick={() => {
            setCurrentQuestion(q => Math.max(0, q - 1));
            setSelectedOption(null);
            setAnswerStatus(null);
          }}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </button>
        <button
          className={`quiz-nav-button ${currentQuestion === quiz.questions.length - 1 ? 'disabled' : ''}`}
          onClick={() => {
            setCurrentQuestion(q => Math.min(quiz.questions.length - 1, q + 1));
            setSelectedOption(null);
            setAnswerStatus(null);
          }}
          disabled={currentQuestion === quiz.questions.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Quiz;