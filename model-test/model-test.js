const modelTestState = {
    section: '',
    index: 0,
    answers: {},
    submittedSections: {},
    timerSeconds: 2700,
    timerHandle: null,
    currentBank: null
};
function applyModelTestPortalAccess() {
    const pinStage = document.getElementById('pinStage');
    const pinInput = document.getElementById('pinInput');
    const pinSubmit = document.getElementById('pinSubmit');
    const pinError = document.getElementById('pinError');

    if (!pinStage || !pinInput || !pinSubmit || !pinError) return;

    const submitPin = () => {
        if (pinInput.value.trim() === '2059') {
            pinError.textContent = '';
            sessionStorage.setItem('modelTestAccessGranted', 'true');
            window.location.href = 'technical-model-test.html';
        } else {
            pinError.textContent = 'The access code is not valid. Please try again.';
        }
    };

    pinSubmit.addEventListener('click', submitPin);
    pinInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submitPin();
    });
}

function requireModelTestAccess() {
    if (sessionStorage.getItem('modelTestAccessGranted') !== 'true') {
        window.location.replace('modeltest-portal.html');
    }
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    const buttons = document.querySelectorAll('.theme-option');
    buttons.forEach((button) => {
        button.classList.toggle('active', button.dataset.theme === theme);
    });
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timerDisplay');
    if (!timerEl) return;
    const minutes = String(Math.floor(modelTestState.timerSeconds / 60)).padStart(2, '0');
    const seconds = String(modelTestState.timerSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
    timerEl.classList.toggle('warning', modelTestState.timerSeconds <= 300);
}

function syncHeaderControls() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    let controls = topbar.querySelector('.exam-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.className = 'exam-controls';
        topbar.appendChild(controls);
    }

    const theme = document.body.dataset.theme || 'light';
    controls.innerHTML = `
        <div class="timer-pill" aria-live="polite">
            <i class="fa-solid fa-stopwatch"></i>
            <span id="timerDisplay">${String(Math.floor(modelTestState.timerSeconds / 60)).padStart(2, '0')}:${String(modelTestState.timerSeconds % 60).padStart(2, '0')}</span>
        </div>
        <div class="theme-switch" role="group" aria-label="Choose color theme">
            <button type="button" class="theme-option ${theme === 'light' ? 'active' : ''}" data-theme="light">Light</button>
            <button type="button" class="theme-option ${theme === 'dark' ? 'active' : ''}" data-theme="dark">Dark</button>
        </div>
    `;

    controls.querySelectorAll('.theme-option').forEach((button) => {
        button.addEventListener('click', () => applyTheme(button.dataset.theme));
    });

    updateTimerDisplay();
}

function startTimer() {
    if (modelTestState.timerHandle) clearInterval(modelTestState.timerHandle);

    modelTestState.timerHandle = setInterval(() => {
        const sectionKey = modelTestState.section || Object.keys(modelTestState.currentBank || {})[0];
        if (!modelTestState.currentBank || modelTestState.submittedSections[sectionKey]) return;

        modelTestState.timerSeconds = Math.max(0, modelTestState.timerSeconds - 1);
        updateTimerDisplay();

        if (modelTestState.timerSeconds === 0) {
            modelTestState.submittedSections[sectionKey] = true;
            renderModelTestQuestion(modelTestState.currentBank);
        }
    }, 1000);
}

function getSectionAnswers(sectionKey) {
    if (!modelTestState.answers[sectionKey]) {
        modelTestState.answers[sectionKey] = {};
    }
    return modelTestState.answers[sectionKey];
}

function getCurrentSection(bank) {
    if (!modelTestState.section || !bank[modelTestState.section]) {
        modelTestState.section = Object.keys(bank)[0];
    }
    return bank[modelTestState.section];
}

function getAttemptedCount(sectionKey, questions) {
    const answers = getSectionAnswers(sectionKey);
    return questions.reduce((sum, _, index) => sum + (answers[index] !== undefined ? 1 : 0), 0);
}

function getPaletteClass(sectionKey, questionIndex, question) {
    const selected = getSectionAnswers(sectionKey)[questionIndex];
    if (selected === undefined) return 'palette-button unanswered';
    return selected === question.answer ? 'palette-button correct' : 'palette-button incorrect';
}

function buildSummary(bank) {
    const section = getCurrentSection(bank);
    const sectionKey = modelTestState.section;
    const answers = getSectionAnswers(sectionKey);
    const total = section.questions.length;
    const attempted = Object.keys(answers).length;
    let correct = 0;
    section.questions.forEach((question, index) => {
        if (answers[index] === question.answer) {
            correct += 1;
        }
    });
    const incorrect = Math.max(0, attempted - correct);
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    return { total, attempted, correct, incorrect, percentage };
}

function renderModelTestTabs(bank) {
    const tabs = document.getElementById('tabBar');
    if (!tabs) return;

    tabs.innerHTML = Object.entries(bank).map(([key, section]) => `
        <button class="tab ${key === modelTestState.section ? 'active' : ''}" type="button" data-section="${key}">${section.title}</button>
    `).join('');

    tabs.querySelectorAll('.tab').forEach((button) => {
        button.addEventListener('click', () => {
            modelTestState.section = button.dataset.section;
            modelTestState.index = 0;
            renderModelTestTabs(bank);
            renderModelTestQuestion(bank);
        });
    });
}

if (document.getElementById('modeltestAccessGate')) {
    applyModelTestPortalAccess();
}

if (document.body.dataset.modelTestProtected === 'true') {
    requireModelTestAccess();
}

function renderModelTestQuestion(bank) {
    syncHeaderControls();

    const section = getCurrentSection(bank);
    const sectionKey = modelTestState.section;
    const questions = section.questions;
    const total = questions.length;
    const currentQuestion = questions[modelTestState.index] || questions[0];
    const selectedAnswer = getSectionAnswers(sectionKey)[modelTestState.index];
    const attempted = getAttemptedCount(sectionKey, questions);
    const isSubmitted = Boolean(modelTestState.submittedSections[sectionKey]);

    const paletteButtons = questions.map((question, index) => `
        <button
            type="button"
            class="${index === modelTestState.index ? `${getPaletteClass(sectionKey, index, question)} active` : getPaletteClass(sectionKey, index, question)}"
            data-index="${index}"
            aria-label="Go to question ${index + 1}"
        >${index + 1}</button>
    `).join('');

    const optionMarkup = currentQuestion.options.map((option) => {
        const classes = ['option-btn'];
        if (selectedAnswer !== undefined) {
            if (option === currentQuestion.answer) classes.push('correct');
            if (option === selectedAnswer && option !== currentQuestion.answer) classes.push('incorrect');
            if (option === selectedAnswer) classes.push('selected');
        }

        return `
            <button
                type="button"
                class="${classes.join(' ')}"
                data-option="${option}"
                ${selectedAnswer !== undefined ? 'disabled' : ''}
            >
                <span class="option-label">${String.fromCharCode(65 + currentQuestion.options.indexOf(option))}</span>
                <span>${option}</span>
            </button>
        `;
    }).join('');

    const answerPanelMarkup = `
        <div class="answer-panel ${selectedAnswer !== undefined ? 'visible' : ''}">
            <div class="answer-header">
                <span class="status-badge ${selectedAnswer === currentQuestion.answer ? 'correct' : 'review'}">
                    ${selectedAnswer === currentQuestion.answer ? 'Correct' : 'Review'}
                </span>
                <strong>Correct answer: ${currentQuestion.answer}</strong>
            </div>
            <div class="answer-body">
                ${selectedAnswer !== undefined ? `<p><strong>Your answer:</strong> ${selectedAnswer}</p>` : ''}
                <p>${currentQuestion.explanation}</p>
            </div>
        </div>
    `;

    if (isSubmitted) {
        const summary = buildSummary(bank);
        const reviewMarkup = questions.map((question, index) => {
            const selected = getSectionAnswers(sectionKey)[index];
            const status = selected === undefined ? 'unanswered' : selected === question.answer ? 'correct' : 'wrong';
            const optionMarkupReview = question.options.map((option) => {
                const classes = ['review-option'];
                if (option === question.answer) classes.push('correct');
                if (selected !== undefined && option === selected && selected !== question.answer) classes.push('incorrect');
                if (selected !== undefined && option === selected && selected === question.answer) classes.push('selected');
                return `<span class="${classes.join(' ')}">${option}</span>`;
            }).join('');

            return `
                <article class="review-card ${status}">
                    <div class="review-head">
                        <span>Q${index + 1}</span>
                        <span class="review-status ${status}">
                            ${status === 'correct' ? 'Correct' : status === 'wrong' ? 'Incorrect' : 'Unanswered'}
                        </span>
                    </div>
                    <p class="review-question">${question.q}</p>
                    <div class="review-options">${optionMarkupReview}</div>
                    <div class="review-answer-line">
                        <strong>Correct answer:</strong> ${question.answer}
                    </div>
                    <div class="review-answer-line">
                        <strong>Your answer:</strong> ${selected === undefined ? 'Not attempted' : selected}
                    </div>
                    <div class="review-explanation">
                        <strong>Explanation:</strong>
                        <p>${question.explanation}</p>
                    </div>
                </article>
            `;
        }).join('');

        document.getElementById('testArea').innerHTML = `
            <div class="exam-shell review-shell">
                <aside class="exam-sidebar">
                    <div class="nav-header">
                        <p>Question palette</p>
                        <strong>${attempted}/${total} attempted</strong>
                    </div>
                    <div class="palette-grid">${paletteButtons}</div>
                </aside>
                <div class="exam-panel summary-panel">
                    <div class="summary-topbar">
                        <div>
                            <p class="eyebrow">${section.title}</p>
                            <h2>Exam summary</h2>
                        </div>
                        <button type="button" class="primary-btn" id="resetExamBtn">Retake section</button>
                    </div>
                    <div class="summary-grid">
                        <div class="summary-box score-box score-flash">
                            <span>Score</span>
                            <strong>${summary.correct}/${summary.total}</strong>
                            <small>${summary.percentage}%</small>
                        </div>
                        <div class="summary-box">
                            <span>Correct</span>
                            <strong>${summary.correct}</strong>
                        </div>
                        <div class="summary-box">
                            <span>Incorrect</span>
                            <strong>${summary.incorrect}</strong>
                        </div>
                        <div class="summary-box">
                            <span>Attempted</span>
                            <strong>${summary.attempted}</strong>
                        </div>
                    </div>
                    <div class="review-list">${reviewMarkup}</div>
                </div>
            </div>
        `;

        document.getElementById('resetExamBtn').addEventListener('click', () => {
            modelTestState.answers[sectionKey] = {};
            delete modelTestState.submittedSections[sectionKey];
            renderModelTestQuestion(bank);
        });

        document.querySelectorAll('.palette-button').forEach((button) => {
            button.addEventListener('click', () => {
                modelTestState.index = Number(button.dataset.index);
                renderModelTestQuestion(bank);
            });
        });
        return;
    }

    document.getElementById('testArea').innerHTML = `
        <div class="exam-shell">
            <aside class="exam-sidebar">
                <div class="nav-header">
                    <p>Question palette</p>
                    <strong>${attempted}/${total} attempted</strong>
                </div>
                <div class="palette-grid">${paletteButtons}</div>
            </aside>

            <div class="exam-panel">
                <div class="question-header">
                    <div>
                        <p class="eyebrow">${section.title}</p>
                        <h2>Question ${modelTestState.index + 1} of ${total}</h2>
                    </div>
                    <button type="button" class="submit-button" id="submitExamBtn">Submit exam</button>
                </div>

                <div class="status-strip">
                    <span class="status-pill">${attempted} attempted</span>
                    <span class="status-pill muted">${total - attempted} remaining</span>
                </div>

                <article class="question-card">
                    <p class="question-text">Q${modelTestState.index + 1}. ${currentQuestion.q}</p>
                    <div class="option-list">${optionMarkup}</div>
                    ${answerPanelMarkup}
                </article>

                <div class="question-nav">
                    <button type="button" class="secondary-btn" id="previousBtn" ${modelTestState.index === 0 ? 'disabled' : ''}>Previous</button>
                    <button type="button" class="primary-btn" id="nextBtn">${modelTestState.index === total - 1 ? 'Finish & submit' : 'Next question'}</button>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.palette-button').forEach((button) => {
        button.addEventListener('click', () => {
            modelTestState.index = Number(button.dataset.index);
            renderModelTestQuestion(bank);
        });
    });

    document.querySelectorAll('.option-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const nextChoice = button.dataset.option;
            getSectionAnswers(sectionKey)[modelTestState.index] = nextChoice;
            renderModelTestQuestion(bank);
        });
    });

    document.getElementById('previousBtn').addEventListener('click', () => {
        if (modelTestState.index > 0) {
            modelTestState.index -= 1;
            renderModelTestQuestion(bank);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (modelTestState.index < total - 1) {
            modelTestState.index += 1;
            renderModelTestQuestion(bank);
        } else {
            modelTestState.submittedSections[sectionKey] = true;
            renderModelTestQuestion(bank);
        }
    });

    document.getElementById('submitExamBtn').addEventListener('click', () => {
        modelTestState.submittedSections[sectionKey] = true;
        renderModelTestQuestion(bank);
    });
}

async function loadModelTestBank() {
    if (window.modelTestType === 'technical') {
        modelTestState.timerSeconds = 3600;
        return window.technicalQuestionBank;
    }

    const response = await fetch('../index.html');
    if (!response.ok) throw new Error('Question bank could not be loaded.');

    const source = await response.text();
    const start = source.indexOf('const gkQuestionBank = ');
    const end = source.indexOf('const gkState', start);
    if (start < 0 || end < 0) {
        throw new Error('GK question bank is missing from the portfolio source.');
    }

    const declaration = `${source.slice(start, end).trimEnd()};`;
    return Function(`${declaration}; return gkQuestionBank;`)();
}

loadModelTestBank()
    .then((bank) => {
        modelTestState.currentBank = bank;
        modelTestState.section = Object.keys(bank)[0];
        document.body.dataset.theme = 'light';
        applyTheme('light');
        startTimer();
        renderModelTestTabs(bank);
        renderModelTestQuestion(bank);
    })
    .catch((error) => {
        const testArea = document.getElementById('testArea');
        if (testArea) {
            testArea.innerHTML = `<div class="error-box">${error.message} Please open this page through the published website rather than directly from a local file.</div>`;
        }
    });