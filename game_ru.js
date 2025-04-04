// Константы игры
const CAMERA_SPEED = 10;
const SPEAKER_MIN_SPEED = 1;
const SPEAKER_MAX_SPEED = 5;
const DIRECTION_CHANGE_MIN_TIME = 1000; // 1 секунда
const DIRECTION_CHANGE_MAX_TIME = 5000; // 5 секунд
const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 200;
const TOTAL_LIVES = 3;

// Переменные игры
let canvas, ctx;
let gameWidth, gameHeight;
let cameraX, cameraY;
let speakerX, speakerY;
let speakerWidth, speakerHeight;
let speakerSpeedX, speakerSpeedY;
let score = 0;
let lives = TOTAL_LIVES;
let lastDirectionChangeTime = 0;
let nextDirectionChangeTime = 0;
let gameRunning = true;
let highScore = localStorage.getItem('highScore') || 0;
let lastLifeLostTime = 0;
let invinciblePeriod = 2000; // 2 секунды неуязвимости после потери жизни

// Отслеживание состояния клавиш
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    W: false,
    S: false,
    A: false,
    D: false
};

// Ресурсы
let backgroundImage = new Image();
let speakerImage = new Image();

// DOM элементы
let livesElement, scoreElement, gameOverElement, finalScoreElement, highScoreElement;

// Инициализация игры
window.onload = function() {
    // Получение DOM элементов
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    livesElement = document.getElementById('lives');
    scoreElement = document.getElementById('score');
    gameOverElement = document.getElementById('game-over');
    finalScoreElement = document.getElementById('final-score');
    highScoreElement = document.getElementById('high-score');
    
    // Установка размеров холста
    gameWidth = 800;
    gameHeight = 600;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    
    // Загрузка ресурсов
    backgroundImage.src = 'fon.png';
    speakerImage.src = 'Speaker.png';
    
    // Инициализация состояния игры
    resetGame();
    
    // Запуск игрового цикла
    requestAnimationFrame(gameLoop);
    
    // Добавление обработчиков событий
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restart-button').addEventListener('click', resetGame);
};

// Сброс состояния игры
function resetGame() {
    // Инициализация позиции камеры (центр экрана)
    cameraX = (gameWidth - FRAME_WIDTH) / 2;
    cameraY = (gameHeight - FRAME_HEIGHT) / 2;
    
    // Инициализация позиции и размера спикера
    speakerWidth = 100;
    speakerHeight = 200;
    speakerX = (gameWidth - speakerWidth) / 2;
    speakerY = (gameHeight - speakerHeight) / 2;
    
    // Инициализация движения спикера
    changeDirection();
    
    // Сброс состояния игры
    score = 0;
    lives = TOTAL_LIVES;
    gameRunning = true;
    updateLivesDisplay();
    updateScoreDisplay();
    
    // Скрытие экрана окончания игры
    gameOverElement.style.display = 'none';
}

// Основной игровой цикл
function gameLoop(timestamp) {
    // Очистка холста
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    if (gameRunning) {
        // Обновление состояния игры
        updateCameraPosition();
        updateSpeaker(timestamp);
        checkCollision(timestamp);
        
        // Отрисовка элементов игры
        drawBackground();
        drawSpeaker();
        drawCameraFrame(timestamp);
        
        // Обновление счета, если спикер в кадре
        if (isSpeakerInFrame()) {
            score += 1/60; // Примерно 1 очко в секунду при 60 FPS
            updateScoreDisplay();
        }
    }
    
    // Продолжение игрового цикла
    requestAnimationFrame(gameLoop);
}

// Обновление позиции и направления спикера
function updateSpeaker(timestamp) {
    // Проверка, пора ли менять направление
    if (timestamp > nextDirectionChangeTime) {
        changeDirection();
        nextDirectionChangeTime = timestamp + Math.random() * 
            (DIRECTION_CHANGE_MAX_TIME - DIRECTION_CHANGE_MIN_TIME) + DIRECTION_CHANGE_MIN_TIME;
    }
    
    // Обновление позиции спикера
    speakerX += speakerSpeedX;
    speakerY += speakerSpeedY;
    
    // Отскок от стен
    if (speakerX < 0) {
        speakerX = 0;
        speakerSpeedX *= -1;
    } else if (speakerX + speakerWidth > gameWidth) {
        speakerX = gameWidth - speakerWidth;
        speakerSpeedX *= -1;
    }
    
    if (speakerY < 0) {
        speakerY = 0;
        speakerSpeedY *= -1;
    } else if (speakerY + speakerHeight > gameHeight) {
        speakerY = gameHeight - speakerHeight;
        speakerSpeedY *= -1;
    }
}

// Изменение направления и скорости спикера случайным образом
function changeDirection() {
    speakerSpeedX = (Math.random() * (SPEAKER_MAX_SPEED - SPEAKER_MIN_SPEED) + SPEAKER_MIN_SPEED) * (Math.random() > 0.5 ? 1 : -1);
    speakerSpeedY = (Math.random() * (SPEAKER_MAX_SPEED - SPEAKER_MIN_SPEED) + SPEAKER_MIN_SPEED) * (Math.random() > 0.5 ? 1 : -1);
}

// Проверка, полностью ли спикер вышел за пределы кадра
function checkCollision(timestamp) {
    // Проверка коллизии только если период неуязвимости прошел
    if (timestamp - lastLifeLostTime > invinciblePeriod) {
        if (!isSpeakerInFrame() && isSpeakerCompletelyOutOfFrame()) {
            lives--;
            updateLivesDisplay();
            lastLifeLostTime = timestamp;
            
            // Мигание рамки красным для индикации потери жизни
            document.getElementById('game-container').style.boxShadow = '0 0 20px red';
            setTimeout(() => {
                document.getElementById('game-container').style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
            }, 500);
            
            if (lives <= 0) {
                endGame();
            }
        }
    }
}

// Проверка, находится ли спикер в кадре
function isSpeakerInFrame() {
    return (
        speakerX + speakerWidth > cameraX &&
        speakerX < cameraX + FRAME_WIDTH &&
        speakerY + speakerHeight > cameraY &&
        speakerY < cameraY + FRAME_HEIGHT
    );
}

// Проверка, полностью ли спикер вышел за пределы кадра
function isSpeakerCompletelyOutOfFrame() {
    return (
        speakerX + speakerWidth < cameraX ||
        speakerX > cameraX + FRAME_WIDTH ||
        speakerY + speakerHeight < cameraY ||
        speakerY > cameraY + FRAME_HEIGHT
    );
}

// Отрисовка фона
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, gameWidth, gameHeight);
}

// Отрисовка спикера
function drawSpeaker() {
    ctx.drawImage(speakerImage, speakerX, speakerY, speakerWidth, speakerHeight);
}

// Отрисовка рамки камеры
function drawCameraFrame(timestamp) {
    // Если в периоде неуязвимости, рамка мигает
    if (timestamp - lastLifeLostTime < invinciblePeriod) {
        // Мигание между красным и синим каждые 200мс
        if (Math.floor((timestamp - lastLifeLostTime) / 200) % 2 === 0) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'blue';
        }
    } else {
        ctx.strokeStyle = 'red';
    }
    
    ctx.lineWidth = 3;
    ctx.strokeRect(cameraX, cameraY, FRAME_WIDTH, FRAME_HEIGHT);
}

// Обработка нажатия клавиш
function handleKeyDown(event) {
    if (!gameRunning) return;
    
    if (event.key in keys) {
        keys[event.key] = true;
        event.preventDefault();
    }
}

// Обработка отпускания клавиш
function handleKeyUp(event) {
    if (event.key in keys) {
        keys[event.key] = false;
        event.preventDefault();
    }
}

// Обновление позиции камеры на основе состояния клавиш
function updateCameraPosition() {
    if (!gameRunning) return;
    
    // Проверка движения вверх
    if (keys.ArrowUp || keys.w || keys.W) {
        cameraY = Math.max(0, cameraY - CAMERA_SPEED);
    }
    
    // Проверка движения вниз
    if (keys.ArrowDown || keys.s || keys.S) {
        cameraY = Math.min(gameHeight - FRAME_HEIGHT, cameraY + CAMERA_SPEED);
    }
    
    // Проверка движения влево
    if (keys.ArrowLeft || keys.a || keys.A) {
        cameraX = Math.max(0, cameraX - CAMERA_SPEED);
    }
    
    // Проверка движения вправо
    if (keys.ArrowRight || keys.d || keys.D) {
        cameraX = Math.min(gameWidth - FRAME_WIDTH, cameraX + CAMERA_SPEED);
    }
}

// Обновление отображения жизней
function updateLivesDisplay() {
    livesElement.textContent = 'Жизни: ' + '❤️'.repeat(lives);
}

// Обновление отображения счета
function updateScoreDisplay() {
    scoreElement.textContent = 'Счет: ' + Math.floor(score);
}

// Завершение игры
function endGame() {
    gameRunning = false;
    
    // Обновление рекорда
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // Отображение экрана окончания игры
    finalScoreElement.textContent = 'Ваш счет: ' + Math.floor(score);
    highScoreElement.textContent = 'Рекорд: ' + Math.floor(highScore);
    gameOverElement.style.display = 'flex';
}