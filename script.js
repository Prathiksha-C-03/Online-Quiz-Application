const welcome = document.getElementById("welcome");
const quiz = document.getElementById("quiz");
const result = document.getElementById("result");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const questionCount = document.getElementById("questionCount");
const timerDisplay = document.getElementById("timer");
const progress = document.getElementById("progress");
const topic = document.getElementById("topic");
const questionText = document.getElementById("question");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const scoreLabel = document.getElementById("scoreLabel");

const categorySelect = document.getElementById("category");

let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let timeLeft = 15;
let timerId = null;
let answered = false;
let reviewData = [];

async function loadQuestions() {
  try {
    startBtn.disabled = true;
    startBtn.textContent = "Loading questions...";

    const response = await fetch("questions.json");

    if (!response.ok) {
      throw new Error("Could not load questions.json");
    }

    const data = await response.json();

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("The question bank is empty.");
    }

    allQuestions = data.questions;
    timeLeft = Number(data.timePerQuestion) || 15;

    document.getElementById("totalLabel").textContent =
      allQuestions.length;

    startBtn.disabled = false;
    startBtn.textContent = "Start Quiz →";
  } catch (error) {
    startBtn.textContent = "Unable to load questions";
    feedback.textContent = error.message;
    console.error(error);
  }
}

function startQuiz() {
  const category = categorySelect.value;

  quizQuestions = allQuestions.filter(item =>
    category === "All" || item.category === category
  );

  if (quizQuestions.length === 0) {
    alert("No questions available for this category.");
    return;
  }

  currentIndex = 0;
  score = 0;
  reviewData = [];

  welcome.classList.add("hidden");
  result.classList.add("hidden");
  quiz.classList.remove("hidden");

  showQuestion();
}

function showQuestion() {
  clearInterval(timerId);
  answered = false;
  nextBtn.disabled = true;
  feedback.textContent = "";
  answers.innerHTML = "";

  const item = quizQuestions[currentIndex];

  questionCount.textContent =
    `Question ${currentIndex + 1} of ${quizQuestions.length}`;

  topic.textContent = item.category;
  questionText.textContent = item.question;
  scoreLabel.textContent = `Score: ${score}`;

  progress.style.width =
    `${(currentIndex / quizQuestions.length) * 100}%`;

  nextBtn.textContent =
    currentIndex === quizQuestions.length - 1
      ? "View Results →"
      : "Next →";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.className = "answer";
    button.dataset.index = index;
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    button.addEventListener("click", () => selectAnswer(index));

    answers.appendChild(button);
  });

  startTimer();
}

function startTimer() {
  timeLeft = 15;
  updateTimer();

  timerId = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerId);
      timeOut();
    }
  }, 1000);
}

function updateTimer() {
  timerDisplay.textContent = `${timeLeft}s`;
  timerDisplay.classList.toggle("urgent", timeLeft <= 5);
}

function selectAnswer(selectedIndex) {
  if (answered) return;

  answered = true;
  clearInterval(timerId);

  const item = quizQuestions[currentIndex];
  const isCorrect = selectedIndex === item.answer;

  if (isCorrect) {
    score++;
    feedback.textContent = "✓ Correct! " + item.explanation;
    feedback.style.color = "var(--green)";
  } else {
    feedback.textContent =
      "✗ Incorrect. " +
      "Correct answer: " + item.options[item.answer] +
      ". " + item.explanation;

    feedback.style.color = "var(--red)";
  }

  reviewData.push({
    question: item.question,
    selected: item.options[selectedIndex],
    correct: item.options[item.answer],
    isCorrect
  });

  showAnswerColors();
  scoreLabel.textContent = `Score: ${score}`;
  nextBtn.disabled = false;
}

function timeOut() {
  if (answered) return;

  answered = true;

  const item = quizQuestions[currentIndex];

  feedback.textContent =
    "Time's up! Correct answer: " +
    item.options[item.answer] +
    ". " + item.explanation;

  feedback.style.color = "var(--red)";

  reviewData.push({
    question: item.question,
    selected: "Not answered",
    correct: item.options[item.answer],
    isCorrect: false
  });

  showAnswerColors();
  nextBtn.disabled = false;
}

function showAnswerColors() {
  const item = quizQuestions[currentIndex];
  const buttons = answers.querySelectorAll(".answer");

  buttons.forEach((button, index) => {
    button.disabled = true;

    if (index === item.answer) {
      button.classList.add("correct");
    } else if (
      button.dataset.index === String(
        reviewData[reviewData.length - 1].selected === "Not answered"
          ? -1
          : item.options.indexOf(
              reviewData[reviewData.length - 1].selected
            )
      )
    ) {
      button.classList.add("wrong");
    }
  });
}

function nextQuestion() {
  if (!answered) return;

  clearInterval(timerId);
  currentIndex++;

  if (currentIndex < quizQuestions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  clearInterval(timerId);
  quiz.classList.add("hidden");
  result.classList.remove("hidden");

  const total = quizQuestions.length;
  const percentage = Math.round((score / total) * 100);

  document.getElementById("finalScore").textContent =
    `${score}/${total}`;

  document.getElementById("percentage").textContent =
    `${percentage}%`;

  document.getElementById("correctCount").textContent = score;

  document.getElementById("resultTitle").textContent =
    percentage >= 80 ? "Excellent Work!" :
    percentage >= 50 ? "Good Effort!" : "Keep Practicing!";

  document.getElementById("resultMessage").textContent =
    `You completed the quiz with ${percentage}% accuracy.`;

  // Save the highest score on this device.
  const storageKey = "quizHighScore_" + categorySelect.value;
  const previousBest = Number(localStorage.getItem(storageKey)) || 0;
  const newBest = Math.max(previousBest, percentage);

  localStorage.setItem(storageKey, newBest);

  document.getElementById("resultMessage").textContent +=
    ` Best score: ${newBest}%.`;

  const review = document.getElementById("review");
  review.innerHTML = "<h3>Answer Review</h3>";

  reviewData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "review-item";

    const heading = document.createElement("strong");
    heading.textContent =
      `${index + 1}. ${item.question}`;

    const selected = document.createElement("div");
    selected.textContent = `Your answer: ${item.selected}`;

    const correct = document.createElement("div");
    correct.textContent = `Correct answer: ${item.correct}`;

    card.append(heading, selected, correct);
    review.appendChild(card);
  });

  progress.style.width = "100%";
}

startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);

restartBtn.addEventListener("click", () => {
  clearInterval(timerId);
  result.classList.add("hidden");
  welcome.classList.remove("hidden");
});

document.addEventListener("keydown", event => {
  if (quiz.classList.contains("hidden")) return;

  if (!answered && /^[1-4]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    const buttons = answers.querySelectorAll(".answer");

    if (buttons[index]) {
      selectAnswer(index);
    }
  } else if (answered && event.key === "Enter") {
    nextQuestion();
  }
});

loadQuestions();