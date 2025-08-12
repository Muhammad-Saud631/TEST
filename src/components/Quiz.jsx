import React, { useEffect, useState, useMemo } from "react";
import DifficultyStars from "./DifficultyStars";
import ScoreBar from "./ScoreBar";
import { GiAlarmClock } from "react-icons/gi";

/* helper to decode URL encoded strings from your JSON */
function decodeStr(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function normalize(raw) {
  const q = {
    category: raw.category ? decodeStr(raw.category) : "",
    difficulty: raw.difficulty ? raw.difficulty : "easy",
    question: raw.question ? decodeStr(raw.question) : "",
    options: [],
    answer: raw.correct_answer ? decodeStr(raw.correct_answer) : raw.answer || ""
  };

  if (raw.incorrect_answers && Array.isArray(raw.incorrect_answers)) {
    q.options = raw.incorrect_answers.map(decodeStr);
  } else if (raw.options && Array.isArray(raw.options)) {
    q.options = raw.options.map(decodeStr);
  }

  if (q.answer && !q.options.includes(q.answer)) {
    q.options.push(q.answer);
  }

  if (raw.type === "boolean") {
    q.options = ["True", "False"];
  }

  return q;
}

export default function Quiz() {
  const totalPerQuestionSeconds = 45;

  const [rawQuestions, setRawQuestions] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(totalPerQuestionSeconds);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const options = useMemo(() => {
    if (!questions.length) return [];
    const arr = [...questions[index].options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [questions, index]);

  useEffect(() => {
    if (loading || finished) return;
    if (timeLeft <= 0) {
      setSelected(null);
      setShowFeedback(false);
      handleNext();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, finished]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <h3>Loading questions...</h3>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <h3>No questions found. Put your questions.json into public/ folder.</h3>
      </div>
    );
  }

  const q = questions[index];

  function handleSelect(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === q.answer;
    setIsCorrect(correct);
    setShowFeedback(true);
    setAttempted((a) => a + 1);
    if (correct) setScore((s) => s + 1);
    setTimeLeft((t) => t);
  }

  function handleNext() {
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

  const minPercent = (score / questions.length) * 100;
  const currentPercent = attempted > 0 ? (score / attempted) * 100 : 0;
  const maxPercent = ((score + (questions.length - attempted)) / questions.length) * 100;

  return (
    <div
      className="quiz-card"
      style={{
        borderRadius: 10,
        width: 700,
        height: 700,
        margin: "20px auto",
        padding: 30,
        boxShadow: "0 0 15px rgba(0,0,0,0.2)",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflowY: "auto",
        fontFamily: "sans-serif",
      }}
    >
      <div className="top-progress" style={{ width: `${(index / questions.length) * 100 + 5}%` }} />

      {finished ? (
        <div className="result-box" style={{ fontFamily: "sans-serif" }}>
          <h2>Quiz Finished</h2>
          <p className="result-score">
            You scored {score} out of {questions.length}
          </p>
          <button className="primary" onClick={resetQuiz}>
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="header-row" style={{ fontFamily: "sans-serif" }}>
            <div>
              <div className="category">{q.category}</div>
              <div className="qcount">
                Question {index + 1} of {questions.length}
              </div>
              <div className="star-row" style={{ fontSize: "2.5rem" }}>
                <DifficultyStars value={q.difficulty === "easy" ? 1 : q.difficulty === "medium" ? 2 : 3} />
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: "43px" }}>
              <div className="timer-wrap" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <GiAlarmClock
                  style={{
                    width: "20px",
                    height: "20px",
                  }}
                />
                <div className="timer-text">
                  {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>

          <div
            className="question"
            style={{ marginTop: "-40px", paddingBottom: "8px" }}
          >
            {q.question}
          </div>

          <div
            className="options"
            style={{ marginTop: "-30px" }}
          >
            {options.map((opt) => {
              let style = {};
              let disabled = selected !== null;

              if (selected !== null) {
                if (opt === q.answer) {
                  style = {
                    backgroundColor: "#4CAF50",
                    color: "white",
                    borderColor: "#388E3C",
                    cursor: "default",
                  };
                } else if (opt === selected && selected !== q.answer) {
                  style = {
                    backgroundColor: "#f44336",
                    color: "white",
                    borderColor: "#d32f2f",
                    cursor: "default",
                  };
                } else {
                  style = {
                    opacity: 0.6,
                    pointerEvents: "none",
                    cursor: "default",
                  };
                }
              }

              return (
                <button
                  key={opt}
                  style={style}
                  className="option-btn"
                  onClick={() => handleSelect(opt)}
                  disabled={disabled}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div
              className="feedback"
              style={{ color: isCorrect ? "green" : "red", fontWeight: "bold", fontSize: "1.2rem", marginTop: "10px" }}
            >
              {isCorrect ? "Correct!" : "Wrong!"}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              className="next-btn"
              onClick={handleNext}
              disabled={selected === null && timeLeft > 0}
              style={{ minWidth: "160px", padding: "10px 20px" }}
            >
              {index + 1 < questions.length ? "Next Question" : "Finish"}
            </button>
          </div>

          <div className="footer-row">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              <div className="small score-number">
                Score: {Math.round((score / (attempted || 1)) * 100)}%
              </div>
              <div className="small score-number">
                Max Score: {Math.round(maxPercent)}%
              </div>
            </div>
            <div className="scorebar-wrap">
              <ScoreBar min={minPercent} current={currentPercent} max={maxPercent} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
