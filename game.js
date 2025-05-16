let words = [];
let currentQuestion = null;
let correctCount = 0;
let wrongCount = 0;
let questionDirection = "en2he"; // אפשרות למעבר שאלה: 'en2he' או 'he2en'

window.addEventListener('load', () => {
  loadWordsFromStorage();
  updateGameUI();
  renderWordsTable();
});

document.getElementById('addBulkBtn').addEventListener('click', addBulkWords);
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
document.getElementById('playWordBtn').addEventListener('click', () => {
  if (currentQuestion) speakWord(getCurrentQuestionText());
});
document.getElementById('resetGameBtn').addEventListener('click', resetGame);

document.getElementById('switchDirectionBtn')?.addEventListener('click', switchDirection);

function saveWordsToStorage() {
  localStorage.setItem('words', JSON.stringify(words));
}
function loadWordsFromStorage() {
  try {
    words = JSON.parse(localStorage.getItem('words')) || [];
  } catch (e) {
    showMessage("שגיאה בקריאת המילים", true);
    words = [];
  }
}
function updateGameUI() {
  document.getElementById('bulkWords').value = '';
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('startGameBtn').style.display = 'inline-block';
  document.getElementById('feedback').textContent = '';
  renderWordsTable();
  updateStats();
}
function resetGame() {
  if (confirm("האם אתה בטוח שברצונך לאפס את המשחק ולמחוק את כל המילים?")) {
    words = [];
    correctCount = 0;
    wrongCount = 0;
    localStorage.removeItem('words');
    updateGameUI();
    showMessage("המשחק אופס וכל המילים נמחקו.", false);
  }
}
function isEnglish(text) { return /[A-Za-z]/.test(text); }
function isHebrew(text) { return /[\u0590-\u05FF]/.test(text); }

// בדיקת כפילות
function isDuplicate(english, hebrew) {
  return words.some(w => w.english.trim().toLowerCase() === english.trim().toLowerCase() &&
                         w.hebrew.trim() === hebrew.trim());
}

// הוספת מילים בכמות, עם סינון כפולים
function addBulkWords() {
  const bulkInput = document.getElementById('bulkWords').value.trim();
  if (!bulkInput) { showMessage("אנא הזן מילים להוספה.", true); return; }
  let countAdded = 0, countDuplicates = 0;
  bulkInput.split(/\n/).forEach(line => {
    let parts = line.split(/[-:]/);
    if (parts.length >= 2) {
      let part1 = parts[0].trim();
      let part2 = parts[1].trim();
      let english, hebrew;
      if (isEnglish(part1) && isHebrew(part2)) {
        english = part1; hebrew = part2;
      } else if (isHebrew(part1) && isEnglish(part2)) {
        english = part2; hebrew = part1;
      } else {
        english = part1; hebrew = part2;
      }
      if (english && hebrew) {
        if (!isDuplicate(english, hebrew)) {
          words.push({ english, hebrew });
          countAdded++;
        } else {
          countDuplicates++;
        }
      }
    }
  });
  saveWordsToStorage();
  renderWordsTable();
  if (countAdded > 0) showMessage(`נוספו ${countAdded} זוגות מילים!`, false);
  if (countDuplicates > 0) showMessage(`${countDuplicates} זוגות היו כפולים ולא נוספו.`, true, 3000);
  if (countAdded === 0 && countDuplicates === 0) showMessage("לא נמצאו מילים בפורמט תקין.", true);
}

// טבלת ניהול מילים (מחיקה בודדת)
function renderWordsTable() {
  const container = document.getElementById('wordsTable');
  if (!container) return;
  if (!words.length) { container.innerHTML = "<span>אין מילים ברשימה.</span>"; return; }
  let html = "<table style='width:100%;text-align:center'><tr><th>אנגלית</th><th>עברית</th><th>מחיקה</th></tr>";
  words.forEach((w, i) => {
    html += `<tr>
      <td>${w.english}</td>
      <td>${w.hebrew}</td>
      <td><button onclick="deleteWord(${i})" style="color:red;">❌</button></td>
    </tr>`;
  });
  html += "</table>";
  container.innerHTML = html;
}
// פונקציה גלובלית למחיקת מילה
window.deleteWord = function(idx) {
  words.splice(idx, 1);
  saveWordsToStorage();
  renderWordsTable();
};

// שדרוג: תמיכה בכיוון שאלה (אנגלית→עברית / עברית→אנגלית)
function switchDirection() {
  questionDirection = (questionDirection === "en2he") ? "he2en" : "en2he";
  showMessage("כיוון השאלה שונה!", false, 1000);
  if (document.getElementById('gameArea').style.display !== 'none') nextQuestion();
}

function startGame() {
  if (words.length < 2) { showMessage("אנא הוסף לפחות 2 מילים.", true); return; }
  document.getElementById('gameArea').style.display = 'block';
  document.getElementById('startGameBtn').style.display = 'none';
  correctCount = 0; wrongCount = 0; updateStats();
  nextQuestion();
}
function nextQuestion() {
  document.getElementById('feedback').textContent = '';
  document.getElementById('nextQuestionBtn').style.display = 'none';
  generateQuestion();
}

function getCurrentQuestionText() {
  return questionDirection === "en2he" ? currentQuestion.english : currentQuestion.hebrew;
}
function getCurrentAnswerText() {
  return questionDirection === "en2he" ? currentQuestion.hebrew : currentQuestion.english;
}

// שאלה – אפשר לבחור כיוון, ותמיד 4 תשובות!
function generateQuestion() {
  if (words.length < 2) return;
  const randomIndex = Math.floor(Math.random() * words.length);
  currentQuestion = words[randomIndex];
  const qText = getCurrentQuestionText();
  document.getElementById('question').textContent =
    questionDirection === "en2he"
    ? `מהו התרגום של "${qText}"?`
    : `מהי המילה באנגלית עבור "${qText}"?`;

  // מציאת אפשרויות תשובה
  let correctAns = getCurrentAnswerText();
  let allAnswers = words.map(w => (questionDirection === "en2he" ? w.hebrew : w.english));
  // סינון כפילויות ואפשרות לשאלון קצר
  let options = [correctAns];
  let others = allAnswers.filter(ans => ans !== correctAns);
  shuffleArray(others);
  while (options.length < 4 && others.length) options.push(others.shift());
  shuffleArray(options);
  displayOptions(options);

  // השמעה
  setTimeout(() => speakWord(qText), 500);
}

function displayOptions(options) {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = 'btn-option';
    btn.disabled = false;
    btn.onclick = function() {
      checkAnswer(option);
    };
    container.appendChild(btn);
  });
}

function checkAnswer(selectedOption) {
  const feedbackDiv = document.getElementById('feedback');
  const correctAns = getCurrentAnswerText();
  if (selectedOption === correctAns) {
    feedbackDiv.textContent = 'תשובה נכונה!';
    feedbackDiv.style.color = 'green';
    correctCount++;
    updateStats();
    setTimeout(nextQuestion, 1200);
  } else {
    feedbackDiv.textContent = 'תשובה שגויה! התשובה הנכונה: ' + correctAns;
    feedbackDiv.style.color = 'red';
    wrongCount++;
    updateStats();
    document.getElementById('nextQuestionBtn').style.display = 'inline-block';
  }
  // Disable buttons
  document.querySelectorAll('.btn-option').forEach(btn => btn.disabled = true);
}

// טבלת סטטיסטיקה בסיסית
function updateStats() {
  const stats = document.getElementById('stats');
  if (!stats) return;
  stats.innerHTML = `נכונות: ${correctCount} | שגויות: ${wrongCount}`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function speakWord(text) {
  if ('speechSynthesis' in window) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEnglish(text) ? 'en-US' : 'he-IL';
    window.speechSynthesis.cancel(); // אם מדבר, מבטל קודמות
    window.speechSynthesis.speak(utterance);
  }
}

// הודעה יפה שנעלמת
function showMessage(msg, isError = false, timeMs = 1700) {
  let el = document.getElementById('flashMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'flashMsg';
    document.body.appendChild(el);
    Object.assign(el.style, {
      position: 'fixed', top: '30px', right: '30px', zIndex: 10000,
      background: '#fff', border: '2px solid #333', borderRadius: '10px',
      padding: '12px 24px', fontSize: '1.1rem', minWidth: '180px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.13)', textAlign: 'center',
      color: '#111'
    });
  }
  el.style.background = isError ? '#ffd6d6' : '#e4ffd6';
  el.style.borderColor = isError ? '#dc3545' : '#28a745';
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, timeMs);
}
