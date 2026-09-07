// Рогалит-подземелье: Математика
// Игра для обучения детей 4-5 класса с темой умножения на 6

// ============ Состояние игры ============
const gameState = {
  player: {
    health: 100,
    maxHealth: 100,
    level: 1,
    deck: [],
    collection: [], // все открытые карты (для апгрейдов)
  },
  currentFloor: 1,
  currentRoom: 0,
  inCombat: false,
  selectedCards: [], // карты в комбинации
  operator: null, // выбранный оператор
  hasUsedOperatorThisTurn: false,
  lastShieldBroken: false,
  currentEnemy: null,
  attackSlots: [null, null, null, null], // слоты для комбинации
};

// ============ Загрузка/сохранение ============
function loadProgress() {
  const saved = localStorage.getItem('mathRogueLike');
  if (saved) {
    const data = JSON.parse(saved);
    gameState.player.level = data.level || 1;
    gameState.player.collection = data.collection || getStartingCollection();
    gameState.player.maxHealth = data.maxHealth || 100;
    gameState.player.health = gameState.player.maxHealth;
  } else {
    gameState.player.collection = getStartingCollection();
  }
}

function saveProgress() {
  const data = {
    level: gameState.player.level,
    collection: gameState.player.collection,
    maxHealth: gameState.player.maxHealth,
  };
  localStorage.setItem('mathRogueLike', JSON.stringify(data));
}

function getStartingCollection() {
  // Стартовая колода: числа с акцентом на кратные 6 и базовые операции
  return {
    numbers: [1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 12, 18], // с упором на кратные 6
    operations: ['+', '-', '×'], // операции для комбинаций
  };
}

// ============ Генерация контента ============
function generateEnemy(floor) {
  const enemies = ['Гоблин', 'Скелет', 'Слизень', 'Призрак', 'Дракончик', 'Тролль'];
  // Щит кратен 6 (для темы умножения на 6)
  const baseShield = 6;
  const shieldValue = baseShield * (Math.floor(Math.random() * (floor + 2)) + 1);

  return {
    name: enemies[Math.floor(Math.random() * enemies.length)],
    shield: shieldValue,
    maxHealth: 30 + floor * 5,
    health: 30 + floor * 5,
    damage: 5 + floor * 2,
  };
}

function drawStartingHand() {
  // Вытягиваем 4 случайные карты из коллекции
  const hand = [];
  const allCards = [];

  // Добавляем числа
  for (let i = 0; i < 6; i++) {
    const num = gameState.player.collection.numbers[
      Math.floor(Math.random() * gameState.player.collection.numbers.length)
    ];
    allCards.push({ type: 'number', value: num });
  }

  // Добавляем операции (макс 2)
  for (let i = 0; i < 2; i++) {
    if (gameState.player.collection.operations.length > 0) {
      const op = gameState.player.collection.operations[
        Math.floor(Math.random() * gameState.player.collection.operations.length)
      ];
      allCards.push({ type: 'operation', value: op });
    }
  }

  // Перемешиваем и берём 4
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  return allCards.slice(0, 4);
}

// ============ Логика боя ============
function calculateCombination() {
  // Проверяем комбинацию: [число][оператор][число]
  const slots = gameState.attackSlots;
  const [a, op, b] = slots;

  if (!a || !b) return null;

  if (op) {
    // С операцией
    const numA = a.value;
    const numB = b.value;
    switch (op.value) {
      case '+': return numA + numB;
      case '-': return numA - numB;
      case '×': return numA * numB; // Ключевой оператор для темы умножения
      case '÷':
        if (numB === 0) return null;
        return numA / numB;
      default: return null;
    }
  } else {
    // Просто число (если совпадает с целью)
    return a.value;
  }
}

function tryBreakShield() {
  if (!gameState.currentEnemy) return;

  const result = calculateCombination();

  if (result === gameState.currentEnemy.shield) {
    // Успех! Ломаем щит
    gameState.currentEnemy.health -= 25;
    gameState.lastShieldBroken = true;
    showMessage(`🎉 Правильно! ${result} = ${gameState.currentEnemy.shield}`);

    // Очищаем слоты
    gameState.attackSlots = [null, null, null, null];
    gameState.hasUsedOperatorThisTurn = false;

    if (gameState.currentEnemy.health <= 0) {
      winCombat();
    } else {
      // Враг бьёт в ответ
      setTimeout(() => enemyTurn(), 1000);
    }
  } else if (result !== null) {
    // Неверно
    showMessage(`❌ Получилось ${result}, а нужно ${gameState.currentEnemy.shield}`);
    gameState.player.health -= gameState.currentEnemy.damage;
    gameState.attackSlots = [null, null, null, null];
    gameState.hasUsedOperatorThisTurn = false;

    if (gameState.player.health <= 0) {
      gameOver();
    }
  }

  updateUI();
}

function enemyTurn() {
  if (!gameState.currentEnemy) return;
  gameState.player.health -= gameState.currentEnemy.damage;
  showMessage(`💥 ${gameState.currentEnemy.name} бьёт на ${gameState.currentEnemy.damage}!`);
  updateUI();

  if (gameState.player.health <= 0) {
    gameOver();
  }
}

function winCombat() {
  showMessage(`🏆 ${gameState.currentEnemy.name} повержен!`);
  // Восстанавливаем немного здоровья
  gameState.player.health = Math.min(
    gameState.player.maxHealth,
    gameState.player.health + 15
  );
  gameState.currentEnemy = null;
  gameState.inCombat = false;

  // Шанс получить новую карту
  if (Math.random() < 0.5) {
    gainNewCard();
  }

  // Следующая комната
  setTimeout(() => nextRoom(), 1500);
}

function gameOver() {
  showMessage('💀 Вы погибли... Но прогресс сохранён!');
  // Сохраняем прогресс (уровень, коллекцию)
  saveProgress();
  // Возвращаем в меню
  setTimeout(() => showMainMenu(), 2500);
}

function gainNewCard() {
  const newCards = [
    { type: 'number', value: 6, source: 'multiplication' },
    { type: 'number', value: 12, source: 'multiplication' },
    { type: 'number', value: 18, source: 'multiplication' },
    { type: 'operation', value: '×', source: 'multiplication' },
    { type: 'number', value: 2, source: 'basic' },
    { type: 'number', value: 3, source: 'basic' },
  ];

  const newCard = newCards[Math.floor(Math.random() * newCards.length)];

  if (newCard.type === 'number') {
    gameState.player.collection.numbers.push(newCard.value);
  } else {
    if (!gameState.player.collection.operations.includes(newCard.value)) {
      gameState.player.collection.operations.push(newCard.value);
    }
  }

  showMessage(`✨ Получена новая карта: ${newCard.value}!`);
}

// ============ Прогрессия ============
function nextRoom() {
  gameState.currentRoom++;
  generateRoom();
}

function generateRoom() {
  const roomTypes = ['combat', 'item', 'rest'];
  const weights = [0.6, 0.25, 0.15]; // шансы появления
  let r = Math.random();
  let type = 'combat';

  if (r < weights[2]) type = 'rest';
  else if (r < weights[1] + weights[2]) type = 'item';

  if (type === 'combat') {
    startCombat();
  } else if (type === 'item') {
    showItemRoom();
  } else {
    showRestRoom();
  }
}

function startCombat() {
  gameState.inCombat = true;
  gameState.currentEnemy = generateEnemy(gameState.currentFloor);
  gameState.selectedCards = drawStartingHand();
  gameState.attackSlots = [null, null, null, null];
  gameState.hasUsedOperatorThisTurn = false;
  showCombatScreen();
}

function showItemRoom() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <div class="room">
      <h3>📦 Сундук!</h3>
      <div class="item">
        <p>Вы нашли полезный предмет</p>
        <button onclick="chooseItem('health')">💚 Зелье здоровья (+20)</button>
        <button onclick="chooseItem('card')">🃏 Новая карта</button>
      </div>
    </div>
    <button onclick="nextRoom()">Идти дальше →</button>
  `;
}

function chooseItem(type) {
  if (type === 'health') {
    gameState.player.health = Math.min(
      gameState.player.maxHealth,
      gameState.player.health + 20
    );
    showMessage('💚 Здоровье восстановлено!');
  } else {
    gainNewCard();
  }
  nextRoom();
}

function showRestRoom() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <div class="room">
      <h3>🔥 Костёр</h3>
      <div class="item">
        <p>Безопасное место для отдыха</p>
        <button onclick="rest()">Отдохнуть (+30 HP)</button>
        <button onclick="nextRoom()">Пропустить →</button>
      </div>
    </div>
  `;
}

function rest() {
  gameState.player.health = Math.min(
    gameState.player.maxHealth,
    gameState.player.health + 30
  );
  showMessage('💚 Вы отдохнули у костра');
  nextRoom();
}

// ============ UI ============
function updateUI() {
  document.getElementById('health').textContent = gameState.player.health;
  document.getElementById('level').textContent = gameState.player.level;
  document.getElementById('inventory-count').textContent = gameState.player.collection.numbers.length +
    gameState.player.collection.operations.length;
}

function showMessage(msg) {
  // Временно показываем сообщение
  const existing = document.getElementById('message-box');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'message-box';
  box.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border: 3px solid #5d5d5d;
    border-radius: 8px;
    padding: 15px 25px;
    font-size: 1.1rem;
    font-weight: bold;
    z-index: 1000;
    box-shadow: 3px 3px 0 rgba(0,0,0,0.2);
  `;
  box.textContent = msg;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2000);
}

function showMainMenu() {
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('combat-screen').style.display = 'none';

  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <div class="room">
      <h2>🏰 Добро пожаловать в подземелье!</h2>
      <p>Тема: <strong>Умножение на 6</strong></p>
      <p>Соберите число с ваших карт, чтобы сломать щит врага</p>
      <div class="floor-indicator">Этаж: ${gameState.currentFloor} | Комната: ${gameState.currentRoom + 1}</div>
      <br>
      <button onclick="startNewRun()">Начать спуск ⬇️</button>
      <button onclick="showUpgrades()">🛠️ Прокачка</button>
    </div>
  `;
  updateUI();
}

function startNewRun() {
  gameState.currentFloor = 1;
  gameState.currentRoom = 0;
  gameState.player.health = gameState.player.maxHealth;
  gameState.currentRoom++;
  generateRoom();
}

function showUpgrades() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <div class="upgrade-shop">
      <h3>🛠️ Прокачка (между забегами)</h3>
      <p>Уровень прокачки: <strong>${gameState.player.level}</strong></p>
      <div class="upgrade-item" onclick="upgradeHealth()">
        <strong>💚 Увеличить максимальное здоровье (+20)</strong>
        <p>Стоимость: 1 уровень</p>
      </div>
      <div class="upgrade-item" onclick="upgradeNumber(6)">
        <strong>🃏 Добавить карту "6"</strong>
        <p>Стоимость: 1 уровень (помогает с умножением!)</p>
      </div>
      <div class="upgrade-item" onclick="upgradeOperation('×')">
        <strong>✖️ Открыть операцию умножения</strong>
        <p>Стоимость: 2 уровня</p>
      </div>
      <br>
      <button onclick="showMainMenu()">← Назад</button>
    </div>
  `;
}

function upgradeHealth() {
  if (gameState.player.level >= 1) {
    gameState.player.maxHealth += 20;
    gameState.player.level--;
    saveProgress();
    showMessage('💚 Максимальное здоровье увеличено!');
    showUpgrades();
  } else {
    showMessage('❌ Нужно больше уровней');
  }
}

function upgradeNumber(num) {
  if (gameState.player.level >= 1) {
    gameState.player.collection.numbers.push(num);
    gameState.player.level--;
    saveProgress();
    showMessage(`🃏 Карта "${num}" добавлена!`);
    showUpgrades();
  } else {
    showMessage('❌ Нужно больше уровней');
  }
}

function upgradeOperation(op) {
  if (gameState.player.level >= 2) {
    if (!gameState.player.collection.operations.includes(op)) {
      gameState.player.collection.operations.push(op);
    }
    gameState.player.level -= 2;
    saveProgress();
    showMessage(`✖️ Операция "${op}" открыта!`);
    showUpgrades();
  } else {
    showMessage('❌ Нужно больше уровней');
  }
}

function showCombatScreen() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('combat-screen').style.display = 'block';

  document.getElementById('enemy-name').textContent = gameState.currentEnemy.name;
  document.getElementById('shield-number').textContent = gameState.currentEnemy.shield;

  renderHand();
  renderCombination();
}

function renderHand() {
  const handEl = document.getElementById('player-hand');
  handEl.innerHTML = '';

  gameState.selectedCards.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.type}`;
    cardEl.textContent = card.value;
    cardEl.onclick = () => placeCardInSlot(index, card);
    handEl.appendChild(cardEl);
  });
}

function renderCombination() {
  // Создаём область комбинации если её нет
  let combArea = document.getElementById('combination-area');
  if (!combArea) {
    const combat = document.getElementById('combat-screen');
    const div = document.createElement('div');
    div.id = 'combination-area';
    div.className = 'combination-area';
    div.innerHTML = `
      <h4>Соберите комбинацию: <span id="target-display">${gameState.currentEnemy.shield}</span></h4>
      <div>
        <span class="combination-slot" id="slot-0">?</span>
        <span class="combination-slot" id="slot-1">?</span>
        <span class="combination-slot" id="slot-2">?</span>
      </div>
      <div>
        <span id="current-result">Результат: ?</span>
        <button onclick="tryBreakShield()">⚔️ Атаковать!</button>
      </div>
    `;
    combat.appendChild(div);
  } else {
    document.getElementById('target-display').textContent = gameState.currentEnemy.shield;
  }

  // Обновляем слоты
  for (let i = 0; i < 3; i++) {
    const slotEl = document.getElementById(`slot-${i}`);
    if (gameState.attackSlots[i]) {
      slotEl.textContent = gameState.attackSlots[i].value;
      slotEl.classList.add('filled');
    } else {
      slotEl.textContent = '?';
      slotEl.classList.remove('filled');
    }
  }

  // Обновляем результат
  const result = calculateCombination();
  const resultEl = document.getElementById('current-result');
  if (result !== null) {
    resultEl.textContent = `Результат: ${result}`;
    if (result === gameState.currentEnemy.shield) {
      resultEl.style.color = 'green';
      resultEl.style.fontWeight = 'bold';
    } else {
      resultEl.style.color = 'red';
    }
  } else {
    resultEl.textContent = 'Результат: ?';
    resultEl.style.color = 'black';
  }
}

function placeCardInSlot(handIndex, card) {
  // Определяем первый свободный слот
  if (card.type === 'operation' && gameState.hasUsedOperatorThisTurn) {
    showMessage('Уже использована операция в этом ходу');
    return;
  }

  // Находим первый пустой слот
  for (let i = 0; i < 3; i++) {
    if (gameState.attackSlots[i] === null) {
      gameState.attackSlots[i] = card;
      if (card.type === 'operation') {
        gameState.hasUsedOperatorThisTurn = true;
      }
      // Удаляем карту из руки
      gameState.selectedCards.splice(handIndex, 1);
      renderHand();
      renderCombination();
      return;
    }
  }
  showMessage('Все слоты заполнены');
}

function endTurn() {
  // Пропуск хода — враг бьёт
  enemyTurn();
  // Очищаем слоты и добираем карты
  gameState.attackSlots = [null, null, null, null];
  gameState.hasUsedOperatorThisTurn = false;

  // Добираем карту
  const newCards = [];
  for (let i = 0; i < 2; i++) {
    const num = gameState.player.collection.numbers[
      Math.floor(Math.random() * gameState.player.collection.numbers.length)
    ];
    newCards.push({ type: 'number', value: num });
  }
  gameState.selectedCards = newCards;

  renderHand();
  renderCombination();
}

// ============ Инициализация ============
function init() {
  loadProgress();
  document.getElementById('end-turn').onclick = endTurn;
  showMainMenu();
}

// Запускаем при загрузке
window.onload = init;