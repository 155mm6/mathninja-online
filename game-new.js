// ========== КОНФИГУРАЦИЯ ==========
const ISLANDS = [
    { id: 1, name: 'Остров Сложения', emoji: '➕', type: 'addition', requiredStars: 0 },
    { id: 2, name: 'Остров Вычитания', emoji: '➖', type: 'subtraction', requiredStars: 6 },
    { id: 3, name: 'Остров Умножения', emoji: '✖️', type: 'multiplication', requiredStars: 12 },
    { id: 4, name: 'Остров Деления', emoji: '➗', type: 'division', requiredStars: 18 },
    { id: 5, name: 'Остров Задач', emoji: '🧩', type: 'tasks', requiredStars: 24 },
    { id: 6, name: 'Финальное испытание', emoji: '👑', type: 'final', requiredStars: 30 }
];

const LEVELS_PER_ISLAND = 4;
const QUESTIONS_PER_LEVEL = 3;

// ========== СЛОЖНОСТЬ ПО КЛАССАМ ==========
const DIFFICULTY_CONFIG = {
    1: {
        addition: { min: 1, max: 10 },
        subtraction: { min: 1, max: 10 },
        multiplication: { min: 1, max: 5 },
        division: { min: 1, max: 5 }
    },
    2: {
        addition: { min: 10, max: 50 },
        subtraction: { min: 10, max: 50 },
        multiplication: { min: 1, max: 10 },
        division: { min: 1, max: 10 }
    },
    3: {
        addition: { min: 50, max: 100 },
        subtraction: { min: 50, max: 100 },
        multiplication: { min: 5, max: 15 },
        division: { min: 2, max: 12 }
    },
    4: {
        addition: { min: 100, max: 500 },
        subtraction: { min: 100, max: 500 },
        multiplication: { min: 10, max: 20 },
        division: { min: 5, max: 20 }
    }
};

// ========== ЭФФЕКТЫ И ЗВУКИ ==========
class Effects {
    static createConfetti(x, y) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 2rem;
            pointer-events: none;
            animation: confettiFall 1s ease-out forwards;
            z-index: 1000;
        `;
        confetti.textContent = ['🎉', '⭐', '🎊', '✨'][Math.floor(Math.random() * 4)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1000);
    }

    static createParticles(x, y, emoji = '✨', count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 3 + Math.random() * 3;
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
            `;
            particle.textContent = emoji;
            document.body.appendChild(particle);

            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity - 2;
            let opacity = 1;
            let px = x, py = y;

            const animate = () => {
                vx *= 0.98;
                vy += 0.1;
                px += vx;
                py += vy;
                opacity -= 0.02;

                particle.style.left = px + 'px';
                particle.style.top = py + 'px';
                particle.style.opacity = opacity;

                if (opacity > 0) requestAnimationFrame(animate);
                else particle.remove();
            };
            animate();
        }
    }

    static playSound(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;

        switch(type) {
            case 'correct':
                const osc1 = audioContext.createOscillator();
                const gain1 = audioContext.createGain();
                osc1.connect(gain1);
                gain1.connect(audioContext.destination);
                osc1.frequency.setValueAtTime(800, now);
                osc1.frequency.setValueAtTime(900, now + 0.1);
                gain1.gain.setValueAtTime(0.3, now);
                gain1.gain.setValueAtTime(0, now + 0.1);
                osc1.start(now);
                osc1.stop(now + 0.1);
                break;

            case 'wrong':
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.setValueAtTime(200, now);
                osc2.frequency.setValueAtTime(150, now + 0.2);
                gain2.gain.setValueAtTime(0.2, now);
                gain2.gain.setValueAtTime(0, now + 0.2);
                osc2.start(now);
                osc2.stop(now + 0.2);
                break;

            case 'levelUp':
                for (let i = 0; i < 3; i++) {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.setValueAtTime(400 + i * 200, now + i * 0.1);
                    gain.gain.setValueAtTime(0.2, now + i * 0.1);
                    gain.gain.setValueAtTime(0, now + i * 0.1 + 0.15);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.15);
                }
                break;
        }
    }
}

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% { opacity: 1; transform: translateY(0) rotate(0deg); }
        100% { opacity: 0; transform: translateY(100px) rotate(360deg); }
    }
`;
document.head.appendChild(style);

// ========== ГЕНЕРАТОР ЗАДАНИЙ ==========
class QuestionGenerator {
    constructor(grade) {
        this.grade = grade;
        this.difficulty = DIFFICULTY_CONFIG[grade];
    }

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateAdditionQuestion() {
        const config = this.difficulty.addition;
        const a = this.random(config.min, config.max);
        const b = this.random(config.min, config.max);
        const correct = a + b;
        return {
            question: `${a} + ${b} = ?`,
            correct,
            distractors: this.generateDistractors(correct, 3, config.max * 2)
        };
    }

    generateSubtractionQuestion() {
        const config = this.difficulty.subtraction;
        const a = this.random(config.min, config.max);
        const b = this.random(1, a);
        const correct = a - b;
        return {
            question: `${a} − ${b} = ?`,
            correct,
            distractors: this.generateDistractors(correct, 3, config.max)
        };
    }

    generateMultiplicationQuestion() {
        const config = this.difficulty.multiplication;
        const a = this.random(config.min, config.max);
        const b = this.random(config.min, config.max);
        const correct = a * b;
        return {
            question: `${a} × ${b} = ?`,
            correct,
            distractors: this.generateDistractors(correct, 3, correct + 50)
        };
    }

    generateDivisionQuestion() {
        const config = this.difficulty.division;
        const divisor = this.random(config.min, config.max);
        const correct = this.random(config.min, 10);
        const dividend = correct * divisor;
        return {
            question: `${dividend} ÷ ${divisor} = ?`,
            correct,
            distractors: this.generateDistractors(correct, 3, 20)
        };
    }

    generateTaskQuestion() {
        const tasks = [
            () => {
                const apples = this.random(5, 15);
                const added = this.random(2, 10);
                return {
                    question: `У Маши было ${apples} яблок. Она нашла ещё ${added}. Сколько яблок у Маши?`,
                    correct: apples + added,
                    distractors: this.generateDistractors(apples + added, 3, apples + added + 20)
                };
            },
            () => {
                const total = this.random(10, 30);
                const spent = this.random(2, total - 1);
                return {
                    question: `В коробке было ${total} конфет. Дети съели ${spent}. Сколько конфет осталось?`,
                    correct: total - spent,
                    distractors: this.generateDistractors(total - spent, 3, total)
                };
            },
            () => {
                const groups = this.random(2, 5);
                const each = this.random(2, 8);
                return {
                    question: `${groups} групп детей по ${each} человек. Сколько всего детей?`,
                    correct: groups * each,
                    distractors: this.generateDistractors(groups * each, 3, groups * each + 30)
                };
            }
        ];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        return task();
    }

    generateDistractors(correct, count, maxValue) {
        const distractors = [];
        while (distractors.length < count) {
            const distractor = this.random(1, Math.max(maxValue, correct + 20));
            if (distractor !== correct && !distractors.includes(distractor)) {
                distractors.push(distractor);
            }
        }
        return distractors;
    }

    generateQuestion(type) {
        switch(type) {
            case 'addition': return this.generateAdditionQuestion();
            case 'subtraction': return this.generateSubtractionQuestion();
            case 'multiplication': return this.generateMultiplicationQuestion();
            case 'division': return this.generateDivisionQuestion();
            case 'tasks': return this.generateTaskQuestion();
            default: return this.generateAdditionQuestion();
        }
    }
}

// ========== ИГРОВОЙ МЕНЕДЖЕР ==========
class GameManager {
    constructor() {
        this.grade = 1;
        this.currentScreen = 'menu';
        this.currentIsland = null;
        this.currentLevel = null;
        this.currentQuestion = 0;
        this.answers = [];
        this.stats = {
            correct: 0,
            wrong: 0,
            totalScore: 0,
            totalXP: 0,
        };
        this.islandProgress = {};
        this.generator = new QuestionGenerator(1);
        this.levelQuestions = [];
        this.isBoss = false;
        this.bossHP = 5;
        this.bossMaxHP = 5;

        this.loadProgress();
        this.render();
    }

    loadProgress() {
        const saved = localStorage.getItem('mathIslandProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.stats = data.stats || this.stats;
            this.islandProgress = data.islandProgress || {};
        }
    }

    saveProgress() {
        localStorage.setItem('mathIslandProgress', JSON.stringify({
            stats: this.stats,
            islandProgress: this.islandProgress
        }));
    }

    getTotalStars() {
        return Object.values(this.islandProgress).reduce((sum, stars) => sum + stars, 0);
    }

    selectGrade(grade) {
        this.grade = grade;
        this.generator = new QuestionGenerator(grade);
        Effects.playSound('levelUp');
        this.showMap();
    }

    showMap() {
        this.currentScreen = 'map';
        this.render();
    }

    showMenu() {
        this.currentScreen = 'menu';
        this.render();
    }

    startLevel(islandId, levelNum) {
        const island = ISLANDS.find(i => i.id === islandId);
        this.currentIsland = island;
        this.currentLevel = levelNum;
        this.currentQuestion = 0;
        this.answers = [];
        this.isBoss = (levelNum === LEVELS_PER_ISLAND + 1);
        this.bossHP = this.bossMaxHP;
        this.levelQuestions = [];

        const questionsCount = this.isBoss ? 5 : QUESTIONS_PER_LEVEL;
        for (let i = 0; i < questionsCount; i++) {
            this.levelQuestions.push(this.generator.generateQuestion(island.type));
        }

        if (this.isBoss) {
            this.currentScreen = 'boss';
        } else {
            this.currentScreen = 'level';
        }
        this.render();
    }

    answerQuestion(answerValue) {
        const question = this.getQuestion();
        const isCorrect = answerValue === question.correct;

        this.answers.push({ correct: isCorrect, value: answerValue });
        if (isCorrect) {
            this.stats.correct++;
            Effects.playSound('correct');
            Effects.createParticles(window.innerWidth / 2, window.innerHeight / 2, '✨', 8);
        } else {
            this.stats.wrong++;
            Effects.playSound('wrong');
            Effects.createParticles(window.innerWidth / 2, window.innerHeight / 2, '❌', 4);
        }

        if (this.isBoss && isCorrect) {
            this.bossHP--;
            if (this.bossHP <= 0) {
                Effects.playSound('levelUp');
            }
        }

        this.render();
    }

    getQuestion() {
        return this.levelQuestions[this.currentQuestion];
    }

    nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion >= this.levelQuestions.length) {
            this.finishLevel();
        } else {
            this.render();
        }
    }

    finishLevel() {
        const correctCount = this.answers.filter(a => a.correct).length;
        const totalCount = this.answers.length;
        let stars = 0;

        if (this.isBoss) {
            stars = 3;
        } else {
            if (correctCount === totalCount) {
                stars = 3;
            } else if (correctCount >= totalCount * 0.66) {
                stars = 2;
            } else if (correctCount >= totalCount * 0.33) {
                stars = 1;
            }
        }

        const levelKey = `${this.currentIsland.id}_${this.currentLevel}`;
        const previousStars = this.islandProgress[levelKey] || 0;

        if (stars > previousStars) {
            this.islandProgress[levelKey] = stars;
            const starsDiff = stars - previousStars;
            this.stats.totalScore += stars * 10;
            this.stats.totalXP += stars * 100;
        }

        this.saveProgress();
        Effects.playSound('levelUp');

        for (let i = 0; i < 10; i++) {
            Effects.createConfetti(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight / 2
            );
        }

        this.currentScreen = 'result';
        this.render();
    }

    isIslandUnlocked(islandId) {
        const island = ISLANDS.find(i => i.id === islandId);
        return this.getTotalStars() >= island.requiredStars;
    }

    getIslandStars(islandId) {
        let total = 0;
        for (let level = 1; level <= LEVELS_PER_ISLAND + 1; level++) {
            const key = `${islandId}_${level}`;
            total += this.islandProgress[key] || 0;
        }
        return total;
    }

    render() {
        const app = document.getElementById('app');

        switch(this.currentScreen) {
            case 'menu':
                app.innerHTML = this.renderMenu();
                break;
            case 'map':
                app.innerHTML = this.renderMap();
                break;
            case 'level':
                app.innerHTML = this.renderLevel();
                break;
            case 'boss':
                app.innerHTML = this.renderBoss();
                break;
            case 'result':
                app.innerHTML = this.renderResult();
                break;
        }

        this.attachEventListeners();
    }

    renderMenu() {
        return `
            <div class="screen menu-screen active">
                <div class="menu-content">
                    <div class="title">🏝️ Математический остров</div>
                    <div class="subtitle">Выбери свой класс:</div>
                    <div class="grade-select">
                        <button class="grade-btn" data-grade="1">1️⃣ 1 класс</button>
                        <button class="grade-btn" data-grade="2">2️⃣ 2 класс</button>
                        <button class="grade-btn" data-grade="3">3️⃣ 3 класс</button>
                        <button class="grade-btn" data-grade="4">4️⃣ 4 класс</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMap() {
        const totalStars = this.getTotalStars();
        return `
            <div class="screen map-screen active">
                <div class="map-header">
                    <div class="player-stats">
                        <span class="stat">⭐ <span class="stat-value">${totalStars}</span></span>
                        <span class="stat">💰 <span class="stat-value">${this.stats.totalScore}</span></span>
                        <span class="stat">⚡ <span class="stat-value">${this.stats.totalXP}</span></span>
                    </div>
                    <button class="menu-btn" data-action="menu">← Меню</button>
                </div>
                <div class="map-container">
                    <div class="islands-row">
                        ${ISLANDS.map(island => this.renderIslandCard(island)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderIslandCard(island) {
        const unlocked = this.isIslandUnlocked(island.id);
        const stars = this.getIslandStars(island.id);

        return `
            <div class="island-card ${!unlocked ? 'locked' : ''}" data-island="${island.id}">
                <div class="island-visual">
                    ${island.emoji}
                    ${!unlocked ? '<div class="lock-icon">🔒</div>' : ''}
                </div>
                <div class="stars-display">${stars > 0 ? '⭐'.repeat(Math.min(stars, 9)) : '◯◯◯'}</div>
                <div class="island-label">${island.name}</div>
            </div>
        `;
    }

    renderLevel() {
        const progress = ((this.currentQuestion) / this.levelQuestions.length) * 100;
        const question = this.getQuestion();
        const currentAnswer = this.answers[this.currentQuestion];
        const allAnswers = [question.correct, ...question.distractors].sort(() => Math.random() - 0.5);

        const hint = this.getHint(question);
        const showHint = currentAnswer && !currentAnswer.correct;

        return `
            <div class="screen level-screen active">
                <div class="level-header">
                    <div class="level-title">${this.currentIsland.name} - Уровень ${this.currentLevel}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%">
                            ${Math.round(progress)}%
                        </div>
                    </div>
                </div>
                <div class="level-content">
                    <div class="question-box">
                        ${showHint ? `<div class="hint">💡 ${hint}</div>` : ''}
                        <div class="question">${question.question}</div>
                        <div class="answers">
                            ${allAnswers.map((answer, idx) => {
                                let className = 'answer-btn';
                                let disabled = false;

                                if (currentAnswer) {
                                    disabled = true;
                                    if (answer === currentAnswer.value) {
                                        className += currentAnswer.correct ? ' correct' : ' wrong';
                                    } else if (answer === question.correct && !currentAnswer.correct) {
                                        className += ' correct';
                                    }
                                }

                                return `<button class="${className}" data-answer="${answer}" ${disabled ? 'disabled' : ''}>
                                    ${answer}
                                </button>`;
                            }).join('')}
                        </div>
                        ${currentAnswer ? `
                            <button class="result-btn primary" data-action="next-question">
                                ${this.currentQuestion === this.levelQuestions.length - 1 ? '✅ Готово' : '➡️ Дальше'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getHint(question) {
        const hints = {
            'addition': 'Подумай: сколько станет, если добавить?',
            'subtraction': 'Подумай: сколько останется, если вычесть?',
            'multiplication': 'Это то же самое, что несколько групп одинакового количества',
            'tasks': 'Прочитай задачу внимательнее ещё раз'
        };
        return hints[this.currentIsland.type] || 'Попробуй ещё раз!';
    }

    renderBoss() {
        const question = this.getQuestion();
        const currentAnswer = this.answers[this.currentQuestion];
        const allAnswers = [question.correct, ...question.distractors].sort(() => Math.random() - 0.5);
        const hpPercent = (this.bossHP / this.bossMaxHP) * 100;

        const bossEmojis = { '➕': '🏴‍☠️', '➖': '🐙', '✖️': '🦖', '➗': '👹', '🧩': '🧙', '👑': '👿' };
        const bossEmoji = bossEmojis[this.currentIsland.emoji] || '🐉';

        return `
            <div class="screen boss-screen active">
                <div class="boss-container">
                    <div class="boss-title">⚔️ БОС: ${this.currentIsland.name}</div>
                    <div class="boss-visual">${bossEmoji}</div>
                    <div class="boss-hp-bar">
                        <div class="boss-hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                    <div style="color: white; font-weight: bold; margin-bottom: 2rem; font-size: clamp(1rem, 2.5vw, 1.3rem);">❤️ ${this.bossHP}/${this.bossMaxHP}</div>

                    <div class="question-box" style="color: var(--dark);">
                        <div class="question">${question.question}</div>
                        <div class="answers">
                            ${allAnswers.map((answer, idx) => {
                                let className = 'answer-btn';
                                let disabled = false;

                                if (currentAnswer) {
                                    disabled = true;
                                    if (answer === currentAnswer.value) {
                                        className += currentAnswer.correct ? ' correct' : ' wrong';
                                    } else if (answer === question.correct && !currentAnswer.correct) {
                                        className += ' correct';
                                    }
                                }

                                return `<button class="${className}" data-answer="${answer}" ${disabled ? 'disabled' : ''}>
                                    ${answer}
                                </button>`;
                            }).join('')}
                        </div>
                        ${currentAnswer ? `
                            <button class="result-btn primary" data-action="next-question">
                                ${this.currentQuestion === this.levelQuestions.length - 1 ? '🎯 Победа!' : '⚔️ Дальше'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderResult() {
        const correctCount = this.answers.filter(a => a.correct).length;
        const totalCount = this.answers.length;
        let stars = 0;

        if (this.isBoss) {
            stars = 3;
        } else {
            if (correctCount === totalCount) {
                stars = 3;
            } else if (correctCount >= totalCount * 0.66) {
                stars = 2;
            } else if (correctCount >= totalCount * 0.33) {
                stars = 1;
            }
        }

        const nextLevel = this.currentLevel < LEVELS_PER_ISLAND ? this.currentLevel + 1 : LEVELS_PER_ISLAND + 1;
        const hasNextLevel = this.currentLevel <= LEVELS_PER_ISLAND;
        const score = stars * 10;
        const xp = stars * 100;

        return `
            <div class="screen result-screen active">
                <div class="result-container">
                    <div class="result-title">${this.isBoss ? '🎉 Босс побеждён!' : '✨ Уровень пройден!'}</div>
                    <div class="result-info">Правильных ответов: <strong>${correctCount}/${totalCount}</strong></div>
                    <div class="stars-earned">${'⭐'.repeat(stars)}</div>
                    <div class="rewards-info">
                        💰 +${score} очков<br>
                        ⚡ +${xp} опыта
                    </div>
                    <button class="result-btn primary" data-action="${hasNextLevel ? 'next-level' : 'island-menu'}">
                        ${hasNextLevel ? '➡️ Следующий уровень' : '🏝️ На карту'}
                    </button>
                    <button class="result-btn" data-action="island-menu">← Вернуться</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.querySelectorAll('[data-grade]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectGrade(parseInt(e.target.dataset.grade));
            });
        });

        document.querySelectorAll('[data-island]').forEach(card => {
            card.addEventListener('click', (e) => {
                const islandId = parseInt(e.currentTarget.dataset.island);
                if (this.isIslandUnlocked(islandId)) {
                    this.showIslandMenu(islandId);
                }
            });
        });

        document.querySelectorAll('[data-answer]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.answers[this.currentQuestion]) {
                    this.answerQuestion(parseInt(e.target.dataset.answer));
                }
            });
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch(action) {
                    case 'menu':
                        this.showMenu();
                        break;
                    case 'next-question':
                        this.nextQuestion();
                        break;
                    case 'next-level':
                        this.startLevel(this.currentIsland.id, this.currentLevel + 1);
                        break;
                    case 'island-menu':
                        this.showIslandMenu(this.currentIsland.id);
                        break;
                }
            });
        });
    }

    showIslandMenu(islandId) {
        const island = ISLANDS.find(i => i.id === islandId);
        const menuHTML = `
            <div class="screen map-screen active">
                <div class="map-header">
                    <div class="level-title">${island.name}</div>
                    <button class="menu-btn" data-action="back-to-map">← Назад</button>
                </div>
                <div class="map-container">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: clamp(1rem, 2vw, 2rem); width: 95%; max-width: 600px;">
                        ${Array.from({length: LEVELS_PER_ISLAND + 1}, (_, i) => {
                            const levelNum = i + 1;
                            const isBoss = levelNum === LEVELS_PER_ISLAND + 1;
                            const levelKey = `${islandId}_${levelNum}`;
                            const stars = this.islandProgress[levelKey] || 0;
                            return `
                                <button style="padding: clamp(1rem, 2vw, 2rem); border: 3px solid var(--primary); border-radius: clamp(10px, 2vw, 15px); background: white; font-size: clamp(0.9rem, 2vw, 1.2rem); font-weight: bold; cursor: pointer; transition: all 0.3s;" data-level="${levelNum}" data-island-menu="${islandId}">
                                    ${isBoss ? '⚔️ БОС' : `Уровень ${levelNum}`}<br>
                                    <span style="font-size: clamp(1rem, 2.5vw, 1.4rem);">${stars > 0 ? '⭐'.repeat(stars) : '◯◯◯'}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = menuHTML;

        document.querySelectorAll('[data-level]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.currentTarget.dataset.level);
                const islandId = parseInt(e.currentTarget.dataset.islandMenu);
                this.startLevel(islandId, level);
            });
        });

        document.querySelector('[data-action="back-to-map"]').addEventListener('click', () => {
            this.showMap();
        });
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameManager();
});
