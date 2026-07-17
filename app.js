// State variables
let currentBlock = 0;
const QUESTIONS_PER_BLOCK = 50;
let currentUtterance = null;
let isPlaying = false;
let currentPlayingBtn = null;
let playAllActive = false;
let currentPlayAllIndex = 0;
let learnedQuestions = [];
let currentQuestionsList = []; // Para saber qué preguntas estamos viendo

// DOM Elements
const blocksMenu = document.getElementById('blocks-menu');
const flashcardsContainer = document.getElementById('flashcards-container');
const currentBlockTitle = document.getElementById('current-block-title');
const totalCountBadge = document.getElementById('total-count-badge');
const toggleThemeBtn = document.getElementById('toggle-theme');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const jumpInput = document.getElementById('jump-to-input');
const jumpBtn = document.getElementById('jump-btn');
const playAllBtn = document.getElementById('play-all-btn');
const simulacroBtn = document.getElementById('simulacro-btn');
const learnedCounter = document.getElementById('learned-counter');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadLearnedProgress();
    initApp();
});

function loadLearnedProgress() {
    const saved = localStorage.getItem('learnedQuestionsAscenso2026');
    if (saved) {
        try {
            learnedQuestions = JSON.parse(saved);
        } catch(e) {
            learnedQuestions = [];
        }
    }
    updateProgressCounter();
}

function updateProgressCounter() {
    if(learnedCounter && window_data) {
        learnedCounter.textContent = `Estudiadas: ${learnedQuestions.length} / ${window_data.length}`;
    }
}

function toggleLearned(qNum, btnElement) {
    const card = document.getElementById(`q-${qNum}`);
    const index = learnedQuestions.indexOf(qNum);
    
    if (index === -1) {
        // Mark as learned
        learnedQuestions.push(qNum);
        card.classList.add('learned');
        btnElement.classList.add('active');
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Ya me la sé';
    } else {
        // Unmark
        learnedQuestions.splice(index, 1);
        card.classList.remove('learned');
        btnElement.classList.remove('active');
        btnElement.innerHTML = '<i class="fa-solid fa-star"></i> Marcar Estudiada';
    }
    
    localStorage.setItem('learnedQuestionsAscenso2026', JSON.stringify(learnedQuestions));
    updateProgressCounter();
}

function initApp() {
    if (typeof window_data === 'undefined') {
        flashcardsContainer.innerHTML = '<div class="flashcard"><p class="question-text" style="color:var(--danger)">Error: No se pudieron cargar los datos (data.js no encontrado).</p></div>';
        return;
    }

    totalCountBadge.textContent = `${window_data.length} Preguntas`;
    
    renderSidebarMenu();
    renderBlock(0);
    setupEventListeners();
}

function setupEventListeners() {
    // Theme toggle
    toggleThemeBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const icon = toggleThemeBtn.querySelector('i');
        
        if (root.getAttribute('data-theme') === 'light') {
            root.removeAttribute('data-theme');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            root.setAttribute('data-theme', 'light');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Simulacro Aleatorio
    if (simulacroBtn) {
        simulacroBtn.addEventListener('click', () => {
            generateMockExam();
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Jump to specific question
    jumpBtn.addEventListener('click', () => {
        const val = parseInt(jumpInput.value);
        if (!isNaN(val) && val >= 1 && val <= window_data.length) {
            const targetBlock = Math.floor((val - 1) / QUESTIONS_PER_BLOCK);
            renderBlock(targetBlock);
            
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
            
            // Highlight the exact question after a short delay
            setTimeout(() => {
                const card = document.getElementById(`q-${val}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.boxShadow = '0 0 20px var(--accent-primary)';
                    setTimeout(() => {
                        card.style.boxShadow = '';
                    }, 2000);
                }
            }, 100);
        }
    });

    // Play All in current block
    if (playAllBtn) {
        playAllBtn.addEventListener('click', () => {
            if (playAllActive) {
                stopAudio();
                playAllActive = false;
                playAllBtn.classList.remove('playing');
                playAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir Todo';
            } else {
                playAllActive = true;
                playAllBtn.classList.add('playing');
                playAllBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Detener';
                
                const firstBtn = flashcardsContainer.querySelector('.speech-btn');
                if (firstBtn) {
                    firstBtn.click();
                } else {
                    playAllActive = false;
                    playAllBtn.classList.remove('playing');
                    playAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir Todo';
                }
            }
        });
    }
}

function renderSidebarMenu() {
    blocksMenu.innerHTML = '';
    const totalBlocks = Math.ceil(window_data.length / QUESTIONS_PER_BLOCK);
    
    for (let i = 0; i < totalBlocks; i++) {
        const start = i * QUESTIONS_PER_BLOCK + 1;
        const end = Math.min((i + 1) * QUESTIONS_PER_BLOCK, window_data.length);
        
        const btn = document.createElement('button');
        btn.className = `menu-btn ${i === currentBlock ? 'active' : ''}`;
        btn.innerHTML = `<span>Bloque ${i + 1}</span> <span style="font-size: 0.8rem; opacity: 0.7;">(${start} - ${end})</span>`;
        
        btn.addEventListener('click', () => {
            renderBlock(i);
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('open');
            }
        });
        
        blocksMenu.appendChild(btn);
    }
}

function generateMockExam() {
    // Remove active state from sidebar blocks
    currentBlock = -1;
    const buttons = blocksMenu.querySelectorAll('.menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Select 100 random questions
    let allIndices = Array.from({length: window_data.length}, (_, i) => i);
    // Shuffle using Fisher-Yates
    for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    
    // Take first 100
    const examIndices = allIndices.slice(0, 100);
    // Sort them so they appear in numerical order, easier to read
    examIndices.sort((a, b) => a - b);
    
    const questions = examIndices.map(idx => ({
        item: window_data[idx],
        qNum: idx + 1
    }));

    currentBlockTitle.textContent = `Simulacro de Examen`;
    totalCountBadge.textContent = `100 Aleatorias`;
    
    renderQuestions(questions);
}

function renderBlock(blockIndex) {
    const buttons = blocksMenu.querySelectorAll('.menu-btn');
    buttons.forEach((btn, idx) => {
        if (idx === blockIndex) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    currentBlock = blockIndex;
    const start = blockIndex * QUESTIONS_PER_BLOCK;
    const end = Math.min(start + QUESTIONS_PER_BLOCK, window_data.length);
    
    const questions = [];
    for(let i = start; i < end; i++) {
        questions.push({
            item: window_data[i],
            qNum: i + 1
        });
    }

    currentBlockTitle.textContent = `Preguntas ${start + 1} - ${end}`;
    totalCountBadge.textContent = `${window_data.length} Preguntas`;
    
    renderQuestions(questions);
}

function renderQuestions(questionsToRender) {
    flashcardsContainer.innerHTML = '';
    currentQuestionsList = questionsToRender;

    // Stop any playing audio
    stopAudio();
    playAllActive = false;
    if (playAllBtn) {
        playAllBtn.classList.remove('playing');
        playAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir Todo';
    }

    questionsToRender.forEach((qObj) => {
        const qNum = qObj.qNum;
        const item = qObj.item;
        
        const isLearned = learnedQuestions.includes(qNum);
        const cardClass = isLearned ? 'flashcard learned' : 'flashcard';
        
        const card = document.createElement('div');
        card.className = cardClass;
        card.id = `q-${qNum}`;
        
        let cleanQ = item.q;
        if (!cleanQ.startsWith('¿')) cleanQ = '¿' + cleanQ;
        if (!cleanQ.endsWith('?')) cleanQ += '?';

        // Escapar comillas dobles y simples para evitar errores JS inline
        const safeQ = cleanQ.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const safeA = item.a.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        const btnClass = isLearned ? 'mark-learned-btn active' : 'mark-learned-btn';
        const btnText = isLearned ? '<i class="fa-solid fa-check"></i> Ya me la sé' : '<i class="fa-solid fa-star"></i> Marcar Estudiada';

        card.innerHTML = `
            <div class="learned-badge"><i class="fa-solid fa-check"></i></div>
            <div class="flashcard-header">
                <span class="question-number">Pregunta ${qNum}</span>
                <button class="speech-btn" title="Escuchar en voz alta" onclick="toggleAudio(this, ${qNum})">
                    <i class="fa-solid fa-volume-high"></i>
                </button>
            </div>
            <div class="question-text">${cleanQ}</div>
            
            <div class="card-actions">
                <button class="reveal-btn" onclick="revealAnswer(this)">
                    <i class="fa-solid fa-eye"></i> Revelar Respuesta
                </button>
                <button class="${btnClass}" onclick="toggleLearned(${qNum}, this)">
                    ${btnText}
                </button>
            </div>
            
            <div class="answer-container">
                <div class="answer-label">Respuesta</div>
                <div class="answer-text">${item.a}</div>
            </div>
        `;
        
        flashcardsContainer.appendChild(card);
    });
    
    document.querySelector('.main-content').scrollTo(0,0);
}

// Reveal Answer Function
window.revealAnswer = function(btn) {
    const answerContainer = btn.parentElement.nextElementSibling;
    btn.style.display = 'none';
    answerContainer.classList.add('visible');
};

window.toggleLearned = toggleLearned;

// Text-to-Speech Functionality

function cleanForTTS(text) {
    if (!text) return "";
    let clean = text.replace(/Art\./gi, "Artículo");
    clean = clean.replace(/R\.M\./gi, "Resolución Ministerial");
    clean = clean.replace(/D\.S\./gi, "Decreto Supremo");
    clean = clean.replace(/N°/gi, "Número");
    clean = clean.replace(/inc\./gi, "inciso");
    clean = clean.replace(/etc\./gi, "etcétera.");
        // Borrar emojis y caracteres raros que rompen el motor de voz en Android
    clean = clean.replace(/[^\w\s.,;:!?¿¡áéíóúÁÉÍÓÚñÑüÜ-]/g, " ");
    return clean;
}

window.toggleAudio = function(btn, qNum) {
    // Buscar la pregunta en window_data (qNum es 1-based, así que el índice es qNum - 1)
    const qObj = window_data[qNum - 1];
    let qText = qObj.q;
    if (!qText.startsWith('¿')) qText = '¿' + qText;
    if (!qText.endsWith('?')) qText += '?';
    const aText = qObj.a;

    if (isPlaying && currentPlayingBtn === btn) {
        stopAudio();
        playAllActive = false;
        if (playAllBtn) {
            playAllBtn.classList.remove('playing');
            playAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir Todo';
        }
        return;
    }

    stopAudio();
    
    const synth = window.speechSynthesis;
    if (!synth) {
        alert("Tu navegador no soporta lectura en voz alta.");
        return;
    }

    isPlaying = true;
    currentPlayingBtn = btn;
    btn.classList.add('playing');
    btn.innerHTML = '<i class="fa-solid fa-stop"></i>';

    const cardActions = btn.closest('.flashcard').querySelector('.card-actions');
    const revealBtn = cardActions ? cardActions.querySelector('.reveal-btn') : null;
    if (revealBtn && revealBtn.style.display !== 'none') {
        revealAnswer(revealBtn);
    }

    const textToRead = `Pregunta ${qNum}... ${cleanForTTS(qText)}... ... Respuesta... ${cleanForTTS(aText)}`;
    
    currentUtterance = new SpeechSynthesisUtterance(textToRead);
    currentUtterance.lang = 'es-ES';
    currentUtterance.rate = 1.0;
    
    currentUtterance.onend = function() {
        resetAudioBtn(btn);
        
        if (playAllActive) {
            const currentCard = btn.closest('.flashcard');
            const nextCard = currentCard.nextElementSibling;
            
            if (nextCard) {
                const nextBtn = nextCard.querySelector('.speech-btn');
                if (nextBtn) {
                    nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        nextBtn.click();
                    }, 500);
                }
            } else {
                playAllActive = false;
                if (playAllBtn) {
                    playAllBtn.classList.remove('playing');
                    playAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir Todo';
                }
            }
        }
    };

    currentUtterance.onerror = function() {
        resetAudioBtn(btn);
    };

    synth.speak(currentUtterance);
};

function stopAudio() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (currentPlayingBtn) {
        resetAudioBtn(currentPlayingBtn);
    }
    isPlaying = false;
}

function resetAudioBtn(btn) {
    btn.classList.remove('playing');
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    if (currentPlayingBtn === btn) {
        currentPlayingBtn = null;
        isPlaying = false;
    }
}
