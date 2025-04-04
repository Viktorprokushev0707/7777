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
    resizeCanvas();
    
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
    window.addEventListener('resize', handleResize);
    
    // Инициализация мобильного управления
    initMobileControls();
};

// Сброс состояния игры
function resetGame() {
    // Получаем актуальные размеры игрового поля
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    // Инициализация позиции камеры (центр экрана)
    cameraX = (gameWidth - FRAME_WIDTH) / 2;
    cameraY = (gameHeight - FRAME_HEIGHT) / 2;
    
    // Инициализация позиции и размера спикера
    // Уменьшаем размер спикера на мобильных устройствах
    if (window.innerWidth <= 480) {
        speakerWidth = 60;
        speakerHeight = 120;
    } else if (window.innerWidth <= 850) {
        speakerWidth = 80;
        speakerHeight = 160;
    } else {
        speakerWidth = 100;
        speakerHeight = 200;
    }
    
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

// Мобильное управление
function initMobileControls() {
    // Получение кнопок мобильного управления
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    
    // Обработчики событий касания для мобильных кнопок
    function handleTouchStart(direction) {
        return function(e) {
            e.preventDefault();
            keys[direction] = true;
        };
    }
    
    function handleTouchEnd(direction) {
        return function(e) {
            e.preventDefault();
            keys[direction] = false;
        };
    }
    
    // Добавление событий касания для кнопки вверх
    upButton.addEventListener('touchstart', handleTouchStart('ArrowUp'));
    upButton.addEventListener('touchend', handleTouchEnd('ArrowUp'));
    upButton.addEventListener('touchcancel', handleTouchEnd('ArrowUp'));
    
    // Добавление событий касания для кнопки вниз
    downButton.addEventListener('touchstart', handleTouchStart('ArrowDown'));
    downButton.addEventListener('touchend', handleTouchEnd('ArrowDown'));
    downButton.addEventListener('touchcancel', handleTouchEnd('ArrowDown'));
    
    // Добавление событий касания для кнопки влево
    leftButton.addEventListener('touchstart', handleTouchStart('ArrowLeft'));
    leftButton.addEventListener('touchend', handleTouchEnd('ArrowLeft'));
    leftButton.addEventListener('touchcancel', handleTouchEnd('ArrowLeft'));
    
    // Добавление событий касания для кнопки вправо
    rightButton.addEventListener('touchstart', handleTouchStart('ArrowRight'));
    rightButton.addEventListener('touchend', handleTouchEnd('ArrowRight'));
    rightButton.addEventListener('touchcancel', handleTouchEnd('ArrowRight'));
    
    // Также добавим события мыши для тестирования на десктопе
    upButton.addEventListener('mousedown', handleTouchStart('ArrowUp'));
    upButton.addEventListener('mouseup', handleTouchEnd('ArrowUp'));
    upButton.addEventListener('mouseleave', handleTouchEnd('ArrowUp'));
    
    downButton.addEventListener('mousedown', handleTouchStart('ArrowDown'));
    downButton.addEventListener('mouseup', handleTouchEnd('ArrowDown'));
    downButton.addEventListener('mouseleave', handleTouchEnd('ArrowDown'));
    
    leftButton.addEventListener('mousedown', handleTouchStart('ArrowLeft'));
    leftButton.addEventListener('mouseup', handleTouchEnd('ArrowLeft'));
    leftButton.addEventListener('mouseleave', handleTouchEnd('ArrowLeft'));
    
    rightButton.addEventListener('mousedown', handleTouchStart('ArrowRight'));
    rightButton.addEventListener('mouseup', handleTouchEnd('ArrowRight'));
    rightButton.addEventListener('mouseleave', handleTouchEnd('ArrowRight'));
    
    // Предотвращение стандартного поведения для всех кнопок, чтобы избежать нежелательной прокрутки
    document.querySelectorAll('.control-button').forEach(button => {
        button.addEventListener('touchstart', e => e.preventDefault());
        button.addEventListener('touchmove', e => e.preventDefault());
        button.addEventListener('touchend', e => e.preventDefault());
    });
}

// u041eu0431u0440u0430u0431u043eu0442u043au0430 u0438u0437u043cu0435u043du0435u043du0438u044f u0440u0430u0437u043cu0435u0440u0430 u043eu043au043du0430
function handleResize() {
    resizeCanvas();
    
    // u041fu0435u0440u0435u0441u0447u0438u0442u044bu0432u0430u0435u043c u0440u0430u0437u043cu0435u0440 u0441u043fu0438u043au0435u0440u0430 u043fu0440u0438 u0438u0437u043cu0435u043du0435u043du0438u0438 u0440u0430u0437u043cu0435u0440u0430 u044du043au0440u0430u043du0430
    if (window.innerWidth <= 480) {
        speakerWidth = 60;
        speakerHeight = 120;
    } else if (window.innerWidth <= 850) {
        speakerWidth = 80;
        speakerHeight = 160;
    } else {
        speakerWidth = 100;
        speakerHeight = 200;
    }
    
    // u041fu0440u043eu0432u0435u0440u044fu0435u043c, u0447u0442u043eu0431u044b u0441u043fu0438u043au0435u0440 u043du0435 u0432u044bu0445u043eu0434u0438u043b u0437u0430 u043fu0440u0435u0434u0435u043bu044b u044du043au0440u0430u043du0430
    if (speakerX + speakerWidth > gameWidth) {
        speakerX = gameWidth - speakerWidth;
    }
    if (speakerY + speakerHeight > gameHeight) {
        speakerY = gameHeight - speakerHeight;
    }
    if (speakerX < 0) {
        speakerX = 0;
    }
    if (speakerY < 0) {
        speakerY = 0;
    }
    
    // u041fu0440u043eu0432u0435u0440u044fu0435u043c, u0447u0442u043eu0431u044b u043au0430u043cu0435u0440u0430 u043du0435 u0432u044bu0445u043eu0434u0438u043bu0430 u0437u0430 u043fu0440u0435u0434u0435u043bu044b u044du043au0440u0430u043du0430
    if (cameraX + FRAME_WIDTH > gameWidth) {
        cameraX = gameWidth - FRAME_WIDTH;
    }
    if (cameraY + FRAME_HEIGHT > gameHeight) {
        cameraY = gameHeight - FRAME_HEIGHT;
    }
    if (cameraX < 0) {
        cameraX = 0;
    }
    if (cameraY < 0) {
        cameraY = 0;
    }
}

// u0418u0437u043cu0435u043du0435u043du0438u0435 u0440u0430u0437u043cu0435u0440u0430 u0445u043eu043bu0441u0442u0430
function resizeCanvas() {
    // u041fu043eu043bu0443u0447u0430u0435u043c u0440u0430u0437u043cu0435u0440u044b u043au043eu043du0442u0435u0439u043du0435u0440u0430
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // u0423u0447u0438u0442u044bu0432u0430u0435u043c u043cu0435u0441u0442u043e u0434u043bu044f u043au043du043eu043fu043eu043a u0443u043fu0440u0430u0432u043bu0435u043du0438u044f
    let canvasHeight = containerHeight;
    
    if (window.innerWidth <= 850) {
        // u041du0430 u043cu043eu0431u0438u043bu044cu043du044bu0445 u0443u0441u0442u0440u043eu0439u0441u0442u0432u0430u0445 u043eu0441u0442u0430u0432u043bu044fu0435u043c u043cu0435u0441u0442u043e u0434u043bu044f u043au043du043eu043fu043eu043a
        if (window.innerWidth <= 480) {
            canvasHeight = containerHeight - 140; // u0414u043bu044f u043cu0430u043bu0435u043du044cu043au0438u0445 u044du043au0440u0430u043du043eu0432
        } else if (window.innerHeight <= 500) { // u041bu0430u043du0434u0448u0430u0444u0442u043du0430u044f u043eu0440u0438u0435u043du0442u0430u0446u0438u044f
            canvasHeight = containerHeight - 100;
        } else { // u041fu043eu0440u0442u0440u0435u0442u043du0430u044f u043eu0440u0438u0435u043du0442u0430u0446u0438u044f
            canvasHeight = containerHeight - 150;
        }
    }
    
    // u0423u0441u0442u0430u043du0430u0432u043bu0438u0432u0430u0435u043c u0440u0430u0437u043cu0435u0440u044b u0445u043eu043bu0441u0442u0430
    canvas.width = containerWidth;
    canvas.height = canvasHeight;
    
    // u041eu0431u043du043eu0432u043bu044fu0435u043c u0433u043bu043eu0431u0430u043bu044cu043du044bu0435 u043fu0435u0440u0435u043cu0435u043du043du044bu0435
    gameWidth = canvas.width;
    gameHeight = canvas.height;
}