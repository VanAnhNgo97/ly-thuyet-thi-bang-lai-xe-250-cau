let questions = [];
let maxIdFromCSV = 0;
let editingIndex = -1; // Track which question is being edited (-1 = not editing)

// Parse CSV data
function parseCSV(text) {
    const lines = text.split('\n');
    const parsedQuestions = [];
    
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
        
        if (fields.length >= 7) {
            parsedQuestions.push({
                id: fields[0],
                text: fields[1],
                option1: fields[2],
                option2: fields[3],
                option3: fields[4] || '',
                option4: fields[5] || '',
                correctAnswer: fields[6],
                isPriority: fields[7] && fields[7].trim() === 'True',
                chapter: fields[8] ? fields[8].trim() : '1',
                image: fields[9] ? fields[9].trim() : ''
            });
        }
    }
    return parsedQuestions;
}

// Load questions from Questions.csv
async function loadQuestions() {
    try {
        const response = await fetch('Questions.csv');
        const text = await response.text();
        questions = parseCSV(text);
        
        // Find max ID
        let maxId = 0;
        questions.forEach(q => {
            const id = parseInt(q.id);
            if (!isNaN(id) && id > maxId) {
                maxId = id;
            }
        });
        maxIdFromCSV = maxId;
        
        updatePreview();
        setNextQuestionId();
    } catch (error) {
        console.error('Error loading Questions.csv:', error);
        alert('⚠️ Không thể tải file Questions.csv. Vui lòng kiểm tra file có tồn tại.');
        questions = [];
        maxIdFromCSV = 0;
        setNextQuestionId();
    }
}

// Load max ID from CauHoi.csv
async function loadMaxIdFromCSV() {
    try {
        const response = await fetch('Questions.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        let maxId = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Get first field (ID)
            const firstComma = line.indexOf(',');
            if (firstComma > 0) {
                const id = parseInt(line.substring(0, firstComma));
                if (!isNaN(id) && id > maxId) {
                    maxId = id;
                }
            }
        }
        
        maxIdFromCSV = maxId;
        setNextQuestionId();
    } catch (error) {
        console.log('Could not load Questions.csv, starting from ID 1');
        maxIdFromCSV = 0;
        setNextQuestionId();
    }
}

// Set next question ID
function setNextQuestionId() {
    const localMaxId = questions.length > 0 
        ? Math.max(...questions.map(q => parseInt(q.id) || 0))
        : 0;
    
    const nextId = Math.max(maxIdFromCSV, localMaxId) + 1;
    document.getElementById('questionId').value = nextId;
    updateImageFilename();
}

// Update image filename based on checkbox
function updateImageFilename() {
    const hasIllustration = document.getElementById('hasIllustration');
    const id = document.getElementById('questionId');
    const imageField = document.getElementById('imageName');
    
    if (hasIllustration && id && hasIllustration.checked && id.value) {
        imageField.value = `img_${id.value}.png`;
    } else {
        imageField.value = '';
    }
}

// Save questions to localStorage (optional backup)
function saveQuestions() {
    localStorage.setItem('adminQuestions', JSON.stringify(questions));
}

// Handle form submission
document.getElementById('questionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const question = {
        id: document.getElementById('questionId').value.trim(),
        text: document.getElementById('questionText').value.trim(),
        option1: document.getElementById('option1').value.trim(),
        option2: document.getElementById('option2').value.trim(),
        option3: document.getElementById('option3').value.trim(),
        option4: document.getElementById('option4').value.trim(),
        correctAnswer: document.getElementById('correctAnswer').value,
        isPriority: document.getElementById('isPriority').checked,
        chapter: document.getElementById('chapter').value.trim(),
        image: document.getElementById('imageName').value.trim()
    };
    
    if (editingIndex >= 0) {
        // Update existing question
        questions[editingIndex] = question;
        alert('✅ Đã cập nhật câu hỏi thành công!');
        editingIndex = -1;
    } else {
        // Add new question
        questions.push(question);
        alert('✅ Đã thêm câu hỏi thành công!');
    }
    
    saveQuestions();
    updatePreview();
    resetForm();
    setNextQuestionId(); // Auto-increment ID for next question
});

// Reset form
function resetForm() {
    document.getElementById('questionForm').reset();
    editingIndex = -1;
    
    // Reset button text
    const submitBtn = document.querySelector('#questionForm button[type="submit"]');
    submitBtn.textContent = '➞ Thêm câu hỏi';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');
    
    document.getElementById('questionText').focus();
}

// Update preview
function updatePreview() {
    const previewContent = document.getElementById('previewContent');
    const questionCount = document.getElementById('questionCount');
    
    questionCount.textContent = questions.length;
    
    if (questions.length === 0) {
        previewContent.innerHTML = '<p class="empty-message">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên!</p>';
        return;
    }
    
    let html = '';
    questions.forEach((q, index) => {
        const options = [
            { num: 1, text: q.option1 },
            { num: 2, text: q.option2 },
            { num: 3, text: q.option3 },
            { num: 4, text: q.option4 }
        ].filter(opt => opt.text);
        
        html += `
            <div class="question-item">
                <div class="question-header">
                    <span class="question-id">Câu ${q.id}</span>
                    ${q.isPriority ? '<span class="question-priority">⚠️ ĐIỂM LIỆT</span>' : ''}
                </div>
                <div class="question-text">${q.text}</div>
                <div class="question-options">
                    ${options.map(opt => `
                        <div class="option-item ${opt.num == q.correctAnswer ? 'correct' : ''}">
                            ${opt.num}. ${opt.text} ${opt.num == q.correctAnswer ? '✓' : ''}
                        </div>
                    `).join('')}
                </div>
                ${q.image ? `<div class="question-image">🖼️ Ảnh: ${q.image}</div>` : ''}
                <div class="question-actions">
                    <button class="btn-edit" onclick="editQuestion(${index})">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deleteQuestion(${index})">🗑️ Xóa</button>
                </div>
            </div>
        `;
    });
    
    previewContent.innerHTML = html;
}

// Delete a question
function deleteQuestion(index) {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
        questions.splice(index, 1);
        saveQuestions();
        updatePreview();
    }
}

// Edit a question
function editQuestion(index) {
    const q = questions[index];
    editingIndex = index;
    
    // Populate form with question data
    document.getElementById('questionId').value = q.id;
    document.getElementById('questionText').value = q.text;
    document.getElementById('option1').value = q.option1;
    document.getElementById('option2').value = q.option2;
    document.getElementById('option3').value = q.option3 || '';
    document.getElementById('option4').value = q.option4 || '';
    document.getElementById('correctAnswer').value = q.correctAnswer;
    document.getElementById('isPriority').checked = q.isPriority;
    document.getElementById('chapter').value = q.chapter || '1';
    document.getElementById('hasIllustration').checked = !!q.image;
    document.getElementById('imageName').value = q.image || '';
    
    // Update button text
    const submitBtn = document.querySelector('#questionForm button[type="submit"]');
    submitBtn.textContent = '✅ Cập nhật câu hỏi';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-warning');
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('questionText').focus();
}

// Clear all questions
function clearQuestions() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả câu hỏi? Hành động này không thể hoàn tác!')) {
        questions = [];
        saveQuestions();
        updatePreview();
    }
}

// Generate CSV content
function generateCSV() {
    if (questions.length === 0) {
        alert('⚠️ Chưa có câu hỏi nào để xuất!');
        return null;
    }
    
    // CSV Header - updated to match new format
    let csv = 'ID,Câu hỏi,Lựa chọn 1,Lựa chọn 2,Lựa chọn 3,Lựa chọn 4,Đáp án đúng,Điểm liệt,Chương,Hình ảnh\n';
    
    // Add each question
    questions.forEach(q => {
        // Escape fields that might contain commas or quotes
        const escapeCSV = (text) => {
            if (!text) return '';
            text = text.replace(/"/g, '""'); // Escape quotes
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                return `"${text}"`;
            }
            return text;
        };
        
        const row = [
            q.id,
            escapeCSV(q.text),
            escapeCSV(q.option1),
            escapeCSV(q.option2),
            escapeCSV(q.option3 || ''),
            escapeCSV(q.option4 || ''),
            q.correctAnswer,
            q.isPriority ? 'True' : 'False',
            q.chapter || '1',
            q.image || ''
        ];
        
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

// Download CSV
function downloadCSV() {
    const csv = generateCSV();
    if (!csv) return;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'CauHoi.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Đã tải xuống file CSV thành công!');
}

// Copy CSV to clipboard
function copyCSV() {
    const csv = generateCSV();
    if (!csv) return;
    
    navigator.clipboard.writeText(csv).then(() => {
        alert('✅ Đã copy nội dung CSV vào clipboard!\nBạn có thể paste vào file CauHoi.csv');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('❌ Không thể copy. Vui lòng thử lại!');
    });
}

// Load questions on page load
loadQuestions(); // Load from Questions.csv

// Prevent manual editing of ID field
document.getElementById('questionId').addEventListener('keydown', function(e) {
    e.preventDefault();
    return false;
});
