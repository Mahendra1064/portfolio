const modelTestState = { section: '', index: 0 };

async function loadModelTestBank() {
    if (window.modelTestType === 'technical') {
        return window.technicalQuestionBank;
    }

    const response = await fetch('index.html');
    if (!response.ok) throw new Error('Question bank could not be loaded.');
    const source = await response.text();
    const start = source.indexOf('const gkQuestionBank = ');
    const end = source.indexOf('const gkState', start);
    if (start < 0 || end < 0) throw new Error('GK question bank is missing from the portfolio source.');
    const declaration = `${source.slice(start, end).trimEnd()};`;
    return Function(`${declaration}; return gkQuestionBank;`)();
}

function renderModelTestTabs(bank) {
    const tabs = document.getElementById('tabBar');
    tabs.innerHTML = Object.entries(bank).map(([key, section]) => `
        <button class="tab ${key === modelTestState.section ? 'active' : ''}" type="button" data-section="${key}">${section.title}</button>
    `).join('');
    tabs.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
        modelTestState.section = button.dataset.section;
        modelTestState.index = 0;
        renderModelTestTabs(bank);
        renderModelTestQuestion(bank);
    }));
}

function renderModelTestQuestion(bank) {
    const section = bank[modelTestState.section];
    const question = section.questions[modelTestState.index];
    const total = section.questions.length;
    document.getElementById('testArea').innerHTML = `
        <article class="question-card">
            <div class="meta"><span>${section.title}</span><span>${question.level || 'PSC competitive'} | Question ${modelTestState.index + 1} / ${total}</span></div>
            <h2>Q${modelTestState.index + 1}. ${question.q}</h2>
            <div class="options">${question.options.map((option) => `<button class="option" type="button" data-option="${option}">${option}</button>`).join('')}</div>
            <div class="answer" id="answer"><strong>Correct answer: ${question.answer}</strong><span>${question.explanation}</span></div>
            <div class="test-nav"><button type="button" id="previous" ${modelTestState.index === 0 ? 'disabled' : ''}>Previous</button><button class="next" type="button" id="next">${modelTestState.index === total - 1 ? 'Finish' : 'Next'}</button></div>
            <div class="score" id="score">Choose an option to check your answer.</div>
        </article>
    `;
    const options = document.querySelectorAll('.option');
    options.forEach((button) => button.addEventListener('click', () => {
        const chosen = button.dataset.option;
        options.forEach((option) => {
            option.disabled = true;
            if (option.dataset.option === question.answer) option.classList.add('correct');
            if (option.dataset.option === chosen && chosen !== question.answer) option.classList.add('incorrect');
        });
        document.getElementById('answer').classList.add('visible');
        document.getElementById('score').textContent = chosen === question.answer ? 'Correct answer.' : 'Review the explanation above.';
    }));
    document.getElementById('previous').addEventListener('click', () => { modelTestState.index--; renderModelTestQuestion(bank); });
    document.getElementById('next').addEventListener('click', () => {
        if (modelTestState.index < total - 1) {
            modelTestState.index++;
            renderModelTestQuestion(bank);
        }
    });
}

loadModelTestBank().then((bank) => {
    modelTestState.section = Object.keys(bank)[0];
    renderModelTestTabs(bank);
    renderModelTestQuestion(bank);
}).catch((error) => {
    document.getElementById('testArea').innerHTML = `<div class="error">${error.message} Please open this page through the published website rather than directly from a local file.</div>`;
});
