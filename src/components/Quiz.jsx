import React, { useEffect, useState, useMemo } from "react";
import DifficultyStars from "./DifficultyStars";
import ScoreBar from "./ScoreBar";

/* helper to decode URL encoded strings from your JSON */
function decodeStr(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/* normalize question object from your JSON structure */
function normalize(raw) {
  // raw might have keys: question, correct_answer, incorrect_answers, difficulty, category, type
  const q = {
    category: raw.category ? decodeStr(raw.category) : "",
    difficulty: raw.difficulty ? raw.difficulty : "easy",
    question: raw.question ? decodeStr(raw.question) : "",
    // build options array: incorrect_answers + correct_answer
    options: [],
    answer: raw.correct_answer ? decodeStr(raw.correct_answer) : raw.answer || ""
  };

  if (raw.incorrect_answers && Array.isArray(raw.incorrect_answers)) {
    q.options = raw.incorrect_answers.map(decodeStr);
  } else if (raw.options && Array.isArray(raw.options)) {
    q.options = raw.options.map(decodeStr);
  }

  // push correct answer last then we'll shuffle where needed
  if (q.answer && !q.options.includes(q.answer)) {
    q.options.push(q.answer);
  }

  // for boolean type (True/False) ensure options are present
  if (raw.type === "boolean") {
    q.options = ["True", "False"];
  }

  return q;
}

export default function Quiz() {
  const totalPerQuestionSeconds = 45;

  const [rawQuestions, setRawQuestions] = useState(null); // raw JSON array
  const [questions, setQuestions] = useState([]); // normalized
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(totalPerQuestionSeconds);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // fetch questions from public/questions.json
  useEffect(() => {
    fetch("/questions.json")
      .then((res) => res.json())
      .then((data) => {
        setRawQuestions(data);
        const normalized = data.map(normalize);
        setQuestions(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load questions.json:", err);
        setLoading(false);
      });
  }, []);

  // shuffle options for current question (memo so it doesn't reshuffle on each render)
  const options = useMemo(() => {
    if (!questions.length) return [];
    const arr = [...questions[index].options];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [questions, index]);

  // timer logic
  useEffect(() => {
    if (loading || finished) return;
    if (timeLeft <= 0) {
      // time up: treat as no selection then auto-next
      setSelected(null);
      setShowFeedback(false);
      handleNext(); // move to next question
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, finished]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h3>Loading questions...</h3>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h3>No questions found. Put your questions.json into public/ folder.</h3>
      </div>
    );
  }

  const q = questions[index];

  function handleSelect(opt) {
    if (selected !== null) return; // prevent double click
    setSelected(opt);
    const correct = opt === q.answer;
    setIsCorrect(correct);
    setShowFeedback(true);
    setAttempted((a) => a + 1);
    if (correct) setScore((s) => s + 1);
    // stop timer by setting to current (will be cleared by effect cleanup)
    setTimeLeft((t) => t);
  }

  function handleNext() {
    // if user hasn't selected and time still left, do nothing (Next disabled)
    // but if Next called by time-out or after selection, proceed
    if (selected === null && timeLeft > 0) return;

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
      setIsCorrect(false);
      setTimeLeft(totalPerQuestionSeconds);
    } else {
      setFinished(true);
    }
  }

  function resetQuiz() {
    setIndex(0);
    setAttempted(0);
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setTimeLeft(totalPerQuestionSeconds);
    setFinished(false);
  }

  // progress bar numbers
  const minPercent = (score / questions.length) * 100;
  const currentPercent = attempted > 0 ? (score / attempted) * 100 : 0;
  const maxPercent = ((score + (questions.length - attempted)) / questions.length) * 100;

  return (
    <div className="quiz-card">
      <div className="top-progress" style={{ width: `${((index) / questions.length) * 100 + 5}%` }} />

      {finished ? (
        <div className="result-box">
          <h2>Quiz Finished</h2>
          <p className="result-score">You scored {score} out of {questions.length}</p>
          <button className="primary" onClick={resetQuiz}>Play Again</button>
        </div>
      ) : (
        <>
          <div className="header-row">
            <div>
              <div className="category">{q.category}</div>
              <div className="qcount">Question {index + 1} of {questions.length}</div>
              <div className="star-row"><DifficultyStars value={ q.difficulty === "easy" ? 1 : q.difficulty === "medium" ? 2 : 3 } /></div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="timer-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#23303a" d="M12 2a1 1 0 0 1 .95.684L14.6 7.98l5.68.83a1 1 0 0 1 .56 1.7l-4.11 3.99 0.97 5.66a1 1 0 0 1-1.45 1.05L12 19.77 6.75 21.12a1 1 0 0 1-1.45-1.05l0.97-5.66L1.17 9.21a1 1 0 0 1 .56-1.7l5.68-.83L11.05 2.68A1 1 0 0 1 12 2z"/></svg>
                <div className="timer-text">{String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}</div>
              </div>
            </div>
          </div>

          <div className="question">{q.question}</div>

          <div className="options">
            {options.map((opt) => {
              let cls = "option-btn";
              if (selected !== null) {
                if (opt === q.answer) cls += " correct";
                else if (opt === selected && selected !== q.answer) cls += " wrong";
                else cls += " disabled";
              }
              return (
                <button key={opt} className={cls} onClick={() => handleSelect(opt)} disabled={selected !== null}>
                  {opt}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className="feedback">{isCorrect ? "Correct!" : "Wrong!"}</div>
          )}

          <div style={{ textAlign: "center" }}>
            <button className="next-btn" onClick={handleNext} disabled={selected === null && timeLeft>0}>
              {index+1 < questions.length ? "Next Question" : "Finish"}
            </button>
          </div>

          <div className="footer-row">
            <div className="small score-number">Score: {Math.round((score/ (attempted || 1)) * 100)}%</div>
            <div className="scorebar-wrap">
              <ScoreBar min={minPercent} current={currentPercent} max={maxPercent} />
            </div>
            <div className="small score-number">Max: {Math.round(maxPercent)}%</div>
          </div>
        </>
      )}
    </div>
  );
}
