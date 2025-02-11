let words = [];
let currentQuestion = null;

// בעת טעינת הדף טוענים את המילים ומעדכנים את ממשק המשתמש
window.addEventListener('load', () => {
  loadWordsFromStorage();
  updateGameUI();
});

// מאזיני לחיצות על הכפתורים
document.getElementById('addBulkBtn').addEventListener('click', addBulkWords);
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
document.getElementById('playWordBtn').addEventListener('click', function() {
  if (currentQuestion) {
    // השמעת המילה באנגלית
    speakWord(currentQuestion.english);
  }
});
document.getElementById('resetGameBtn').addEventListener('click', resetGame);

// פונקציות לשמירה וטעינה מ־localStorage
function saveWordsToStorage() {
  localStorage.setItem('words', JSON.stringify(words));
}

function loadWordsFromStorage() {
  const storedWords = localStorage.getItem('words');
  if (storedWords) {
    try {
      words = JSON.parse(storedWords);
    } catch (e) {
      console.error('שגיאה בקריאת המילים מ-localStorage', e);
      words = [];
    }
  }
}

// עדכון ממשק המשתמש – איפוס השדות והצגת כפתור "התחל משחק"
function updateGameUI() {
  document.getElementById('bulkWords').value = '';
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('startGameBtn').style.display = 'inline-block';
}

// איפוס המשחק – מחיקת כל המילים מהמשחק ומה-localStorage
function resetGame() {
  if (confirm("האם אתה בטוח שברצונך לאפס את המשחק ולמחוק את כל המילים?")) {
    words = [];
    localStorage.removeItem('words');
    updateGameUI();
    alert("המשחק אופס וכל המילים נמחקו.");
  }
}

// פונקציות לזיהוי שפה
function isEnglish(text) {
  return /[A-Za-z]/.test(text);
}

function isHebrew(text) {
  return /[\u0590-\u05FF]/.test(text);
}

// הוספת זוגות מילים – אם המשתמש מזין סדר הפוך, מתבצעת החלפה
function addBulkWords() {
  const bulkInput = document.getElementById('bulkWords').value.trim();
  if (!bulkInput) {
    alert("אנא הזן מילים להוספה.");
    return;
  }
  let countAdded = 0;
  bulkInput.split(/\n/).forEach(line => {
    let parts = line.split(/[-:]/);
    if (parts.length >= 2) {
      let part1 = parts[0].trim();
      let part2 = parts[1].trim();
      let english, hebrew;
      if (isEnglish(part1) && isHebrew(part2)) {
        english = part1;
        hebrew = part2;
      } else if (isHebrew(part1) && isEnglish(part2)) {
        // אם הסדר הפוך – מחליפים
        english = part2;
        hebrew = part1;
      } else {
        // במקרה שאין זיהוי ברור – מניחים שהחלק הראשון הוא באנגלית והשני בעברית
        english = part1;
        hebrew = part2;
      }
      if (english && hebrew) {
        words.push({ english, hebrew });
        countAdded++;
      }
    }
  });
  if (countAdded > 0) {
    saveWordsToStorage();
    alert(`נוספו ${countAdded} זוגות מילים בהצלחה!`);
  } else {
    alert("לא נמצאו מילים בפורמט תקין.");
  }
}

// התחלת המשחק – מציגים את אזור המשחק ומסתירים את כפתור "התחל משחק"
function startGame() {
  if (words.length < 2) {
    alert("אנא הוסף לפחות 2 מילים כדי להתחיל משחק.");
    return;
  }
  document.getElementById('gameArea').style.display = 'block';
  document.getElementById('startGameBtn').style.display = 'none';
  nextQuestion();
}

// מעבר לשאלה הבאה
function nextQuestion() {
  document.getElementById('feedback').textContent = '';
  document.getElementById('nextQuestionBtn').style.display = 'none';
  generateQuestion();
}

// יצירת שאלה – בוחרים מילה אקראית ומכינים אפשרויות (תשובה נכונה ועוד 3 תשובות שגויות) 
function generateQuestion() {
  const randomIndex = Math.floor(Math.random() * words.length);
  currentQuestion = words[randomIndex];
  
  // מציגים את השאלה עם המילה באנגלית
  document.getElementById('question').textContent = `מהו התרגום של "${currentQuestion.english}"?`;
  
  // הכנת אפשרויות – כל האפשרויות יהיו בעברית
  let options = [currentQuestion.hebrew];
  let otherWords = words.filter(word => word.hebrew !== currentQuestion.hebrew);
  shuffleArray(otherWords);
  otherWords.slice(0, 3).forEach(word => {
    options.push(word.hebrew);
  });
  shuffleArray(options);
  displayOptions(options);
  
  // השמעת המילה באנגלית
  setTimeout(() => {
    speakWord(currentQuestion.english);
  }, 500);
}

// הצגת אפשרויות התשובה ככפתורים
function displayOptions(options) {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = 'btn-option';
    btn.addEventListener('click', function() {
      checkAnswer(option);
    });
    container.appendChild(btn);
  });
}

// בדיקת התשובה והצגת המשוב
function checkAnswer(selectedOption) {
  const feedbackDiv = document.getElementById('feedback');
  if (selectedOption === currentQuestion.hebrew) {
    feedbackDiv.textContent = 'תשובה נכונה!';
    feedbackDiv.style.color = 'green';
  } else {
    feedbackDiv.textContent = 'תשובה שגויה!';
    feedbackDiv.style.color = 'red';
  }
  document.querySelectorAll('.btn-option').forEach(btn => btn.disabled = true);
  document.getElementById('nextQuestionBtn').style.display = 'inline-block';
}

// עירבוב מערך – שיטת Fisher-Yates
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// קריאת טקסט באמצעות Speech Synthesis – בודק את השפה של המילה
function speakWord(text) {
  if ('speechSynthesis' in window) {
    let utterance = new SpeechSynthesisUtterance(text);
    // אם המילה מכילה אותיות אנגליות, מגדירים את השפה לאנגלית, אחרת לעברית
    utterance.lang = isEnglish(text) ? 'en-US' : 'he-IL';
    window.speechSynthesis.speak(utterance);
  } else {
    console.log("דיבור באמצעות טקסט לא נתמך בדפדפן זה.");
  }
}
