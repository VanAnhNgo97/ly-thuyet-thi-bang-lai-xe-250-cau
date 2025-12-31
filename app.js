let questions = [];
let currentQuestionIndex = 0;
let showingAnswer = false;
let selectedAnswer = null;
let questionStates = {}; // Track answered questions: { questionIndex: 'correct'|'incorrect'|'unanswered' }

// Load and parse CSV file
async function loadQuestions() {
    try {
        const response = await fetch('Questions.csv');
        const text = await response.text();
        questions = parseCSV(text);
        
        generateQuestionGrid();
        displayQuestion();
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('questionContainer').innerHTML = 
            '<div class="loading" style="color: #dc3545;">Lỗi: Không thể tải câu hỏi. Vui lòng kiểm tra file Questions.csv</div>';
    }
}

// Parse CSV data
function parseCSV(text) {
    const lines = text.split('\n');
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line considering quotes
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField);
        
        if (fields.length >= 8) {
            // Helper function to remove leading number from answer text
            const cleanAnswer = (text) => {
                return text.replace(/^\d+\.\s*/, '').trim();
            };
            
            questions.push({
                stt: fields[0],
                question: fields[1],
                answerA: cleanAnswer(fields[2]),
                answerB: cleanAnswer(fields[3]),
                answerC: cleanAnswer(fields[4]),
                answerD: cleanAnswer(fields[5]),
                correctAnswer: parseInt(fields[6]),
                isPriority: fields[7] && fields[7].trim() === 'TRUE',
                image: fields[8] ? fields[8].trim() : ''
            });
        }
    }
    return questions;
}

// Generate question grid in sidebar
function generateQuestionGrid() {
    const grid = document.getElementById('questionGrid');
    grid.innerHTML = '';
    
    questions.forEach((question, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        if (question.isPriority) {
            item.classList.add('priority');
        }
        if (index === currentQuestionIndex) {
            item.classList.add('active');
        }
        // Add state classes
        if (questionStates[index]) {
            item.classList.add(questionStates[index]);
        }
        item.textContent = index + 1;
        item.onclick = () => goToQuestion(index);
        grid.appendChild(item);
    });
}

// Go to specific question
function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
    updateQuestionGrid();
}

// Update question grid active state
function updateQuestionGrid() {
    const items = document.querySelectorAll('.question-item');
    items.forEach((item, index) => {
        // Remove active class from all
        item.classList.remove('active');
        
        // Add active class to current question
        if (index === currentQuestionIndex) {
            item.classList.add('active');
            // Scroll to active item in sidebar
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Update state classes
        item.classList.remove('correct', 'incorrect', 'unanswered');
        if (questionStates[index]) {
            item.classList.add(questionStates[index]);
        }
        
        // Re-add priority class if needed
        if (questions[index] && questions[index].isPriority) {
            item.classList.add('priority');
        }
    });
}

// Display current question
function displayQuestion() {
    if (questions.length === 0) return;
    
    const question = questions[currentQuestionIndex];
    showingAnswer = false;
    selectedAnswer = null;
    
    const answers = [
        { label: '1', text: question.answerA },
        { label: '2', text: question.answerB },
        { label: '3', text: question.answerC },
        { label: '4', text: question.answerD }
    ].filter(a => a.text);
    
    const priorityBadge = question.isPriority 
        ? '<span class="priority-badge">⚠️ CÂU ĐIỂM LIỆT</span>' 
        : '';
    
    const imageHtml = question.image 
        ? `<div class="question-image"><img src="images/${question.image}" alt="Question image" /></div>`
        : '';
    
    const html = `
        <div class="question-number">Câu ${currentQuestionIndex + 1}/${questions.length} ${priorityBadge}</div>
        <div class="question-text">${question.question}</div>
        ${imageHtml}
        <div class="answers">
            ${answers.map(answer => `
                <div class="answer" data-answer="${answer.label}" onclick="selectAnswer(${answer.label})">
                    <span class="answer-label">${answer.label}.</span>
                    <span>${answer.text}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('questionContainer').innerHTML = html;
    document.getElementById('showAnswerBtn').textContent = 'Xem đáp án';
    
    // Update button states
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').disabled = currentQuestionIndex === questions.length - 1;
    
    // Update sidebar
    updateQuestionGrid();
}

// Select an answer
function selectAnswer(answerNumber) {
    if (showingAnswer) return;
    
    const answers = document.querySelectorAll('.answer');
    answers.forEach(a => a.classList.remove('selected'));
    
    const selected = document.querySelector(`[data-answer="${answerNumber}"]`);
    if (selected) {
        selected.classList.add('selected');
        selectedAnswer = answerNumber;
    }
}

// Toggle answer display
function toggleAnswer() {
    if (!showingAnswer) {
        showAnswer();
    } else {
        hideAnswer();
    }
}

// Show correct answer
function showAnswer() {
    const question = questions[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;
    
    const answers = document.querySelectorAll('.answer');
    answers.forEach(answer => {
        const answerNum = parseInt(answer.getAttribute('data-answer'));
        
        if (answerNum === correctAnswer) {
            answer.classList.add('correct');
        } else if (selectedAnswer && answerNum === selectedAnswer && answerNum !== correctAnswer) {
            answer.classList.add('incorrect');
        }
    });
    
    // Track question state
    if (selectedAnswer) {
        if (selectedAnswer === correctAnswer) {
            questionStates[currentQuestionIndex] = 'correct';
        } else {
            questionStates[currentQuestionIndex] = 'incorrect';
        }
    } else {
        questionStates[currentQuestionIndex] = 'unanswered';
    }
    
    updateQuestionGrid();
    
    showingAnswer = true;
    document.getElementById('showAnswerBtn').textContent = 'Ẩn đáp án';
}

// Hide answer
function hideAnswer() {
    const answers = document.querySelectorAll('.answer');
    answers.forEach(a => {
        a.classList.remove('correct', 'incorrect', 'selected');
    });
    
    showingAnswer = false;
    selectedAnswer = null;
    document.getElementById('showAnswerBtn').textContent = 'Xem đáp án';
}

// Navigate to previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Navigate to next question
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        previousQuestion();
    } else if (e.key === 'ArrowRight') {
        nextQuestion();
    } else if (e.key === 'ArrowUp') {
        // Navigate up in grid (5 columns)
        e.preventDefault();
        if (currentQuestionIndex >= 5) {
            goToQuestion(currentQuestionIndex - 5);
        }
    } else if (e.key === 'ArrowDown') {
        // Navigate down in grid (5 columns)
        e.preventDefault();
        if (currentQuestionIndex + 5 < questions.length) {
            goToQuestion(currentQuestionIndex + 5);
        }
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleAnswer();
    } else if (e.key >= '1' && e.key <= '4') {
        selectAnswer(parseInt(e.key));
    }
});

// Load questions on page load
loadQuestions();
