// Game constants
const CAMERA_SPEED = 10;
const SPEAKER_MIN_SPEED = 1;
const SPEAKER_MAX_SPEED = 5;
const DIRECTION_CHANGE_MIN_TIME = 1000; // 1 second
const DIRECTION_CHANGE_MAX_TIME = 5000; // 5 seconds
const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 200;
const TOTAL_LIVES = 3;

// Game variables
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
let invinciblePeriod = 2000; // 2 seconds of invincibility after losing a life

// Keyboard state tracking
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

// Assets
let backgroundImage = new Image();
let speakerImage = new Image();

// DOM elements
let livesElement, scoreElement, gameOverElement, finalScoreElement, highScoreElement;

// Initialize the game
window.onload = function() {
    // Get DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    livesElement = document.getElementById('lives');
    scoreElement = document.getElementById('score');
    gameOverElement = document.getElementById('game-over');
    finalScoreElement = document.getElementById('final-score');
    highScoreElement = document.getElementById('high-score');
    
    // Set canvas size
    gameWidth = 800;
    gameHeight = 600;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    
    // Load assets
    backgroundImage.src = 'fon.png';
    speakerImage.src = 'Speaker.png';
    
    // Initialize game state
    resetGame();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restart-button').addEventListener('click', resetGame);
    
    // Initialize mobile controls
    initMobileControls();
};

// Reset game state
function resetGame() {
    // Initialize camera position (center of the screen)
    cameraX = (gameWidth - FRAME_WIDTH) / 2;
    cameraY = (gameHeight - FRAME_HEIGHT) / 2;
    
    // Initialize speaker position and size
    speakerWidth = 100;
    speakerHeight = 200;
    speakerX = (gameWidth - speakerWidth) / 2;
    speakerY = (gameHeight - speakerHeight) / 2;
    
    // Initialize speaker movement
    changeDirection();
    
    // Reset game state
    score = 0;
    lives = TOTAL_LIVES;
    gameRunning = true;
    updateLivesDisplay();
    updateScoreDisplay();
    
    // Hide game over screen
    gameOverElement.style.display = 'none';
}

// Main game loop
function gameLoop(timestamp) {
    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    if (gameRunning) {
        // Update game state
        updateCameraPosition();
        updateSpeaker(timestamp);
        checkCollision(timestamp);
        
        // Draw game elements
        drawBackground();
        drawSpeaker();
        drawCameraFrame(timestamp);
        
        // Update score if speaker is in frame
        if (isSpeakerInFrame()) {
            score += 1/60; // Approximately 1 point per second at 60 FPS
            updateScoreDisplay();
        }
    }
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update speaker position and direction
function updateSpeaker(timestamp) {
    // Check if it's time to change direction
    if (timestamp > nextDirectionChangeTime) {
        changeDirection();
        nextDirectionChangeTime = timestamp + Math.random() * 
            (DIRECTION_CHANGE_MAX_TIME - DIRECTION_CHANGE_MIN_TIME) + DIRECTION_CHANGE_MIN_TIME;
    }
    
    // Update speaker position
    speakerX += speakerSpeedX;
    speakerY += speakerSpeedY;
    
    // Bounce off walls
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

// Change speaker direction and speed randomly
function changeDirection() {
    speakerSpeedX = (Math.random() * (SPEAKER_MAX_SPEED - SPEAKER_MIN_SPEED) + SPEAKER_MIN_SPEED) * (Math.random() > 0.5 ? 1 : -1);
    speakerSpeedY = (Math.random() * (SPEAKER_MAX_SPEED - SPEAKER_MIN_SPEED) + SPEAKER_MIN_SPEED) * (Math.random() > 0.5 ? 1 : -1);
}

// Check if speaker is completely out of frame
function checkCollision(timestamp) {
    // Only check for collision if the invincibility period has passed
    if (timestamp - lastLifeLostTime > invinciblePeriod) {
        if (!isSpeakerInFrame() && isSpeakerCompletelyOutOfFrame()) {
            lives--;
            updateLivesDisplay();
            lastLifeLostTime = timestamp;
            
            // Flash the frame red to indicate a life was lost
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

// Check if speaker is in frame
function isSpeakerInFrame() {
    return (
        speakerX + speakerWidth > cameraX &&
        speakerX < cameraX + FRAME_WIDTH &&
        speakerY + speakerHeight > cameraY &&
        speakerY < cameraY + FRAME_HEIGHT
    );
}

// Check if speaker is completely out of frame
function isSpeakerCompletelyOutOfFrame() {
    return (
        speakerX + speakerWidth < cameraX ||
        speakerX > cameraX + FRAME_WIDTH ||
        speakerY + speakerHeight < cameraY ||
        speakerY > cameraY + FRAME_HEIGHT
    );
}

// Draw background
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, gameWidth, gameHeight);
}

// Draw speaker
function drawSpeaker() {
    ctx.drawImage(speakerImage, speakerX, speakerY, speakerWidth, speakerHeight);
}

// Draw camera frame
function drawCameraFrame(timestamp) {
    // If in invincibility period, make the frame flash
    if (timestamp - lastLifeLostTime < invinciblePeriod) {
        // Flash between red and blue every 200ms
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

// Handle keyboard input (key down)
function handleKeyDown(event) {
    if (!gameRunning) return;
    
    if (event.key in keys) {
        keys[event.key] = true;
        event.preventDefault();
    }
}

// Handle keyboard input (key up)
function handleKeyUp(event) {
    if (event.key in keys) {
        keys[event.key] = false;
        event.preventDefault();
    }
}

// Update camera position based on key states
function updateCameraPosition() {
    if (!gameRunning) return;
    
    // Check up movement
    if (keys.ArrowUp || keys.w || keys.W) {
        cameraY = Math.max(0, cameraY - CAMERA_SPEED);
    }
    
    // Check down movement
    if (keys.ArrowDown || keys.s || keys.S) {
        cameraY = Math.min(gameHeight - FRAME_HEIGHT, cameraY + CAMERA_SPEED);
    }
    
    // Check left movement
    if (keys.ArrowLeft || keys.a || keys.A) {
        cameraX = Math.max(0, cameraX - CAMERA_SPEED);
    }
    
    // Check right movement
    if (keys.ArrowRight || keys.d || keys.D) {
        cameraX = Math.min(gameWidth - FRAME_WIDTH, cameraX + CAMERA_SPEED);
    }
}

// Update lives display
function updateLivesDisplay() {
    livesElement.textContent = 'Lives: ' + '❤️'.repeat(lives);
}

// Update score display
function updateScoreDisplay() {
    scoreElement.textContent = 'Score: ' + Math.floor(score);
}

// End game
function endGame() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // Show game over screen
    finalScoreElement.textContent = 'Your score: ' + Math.floor(score);
    highScoreElement.textContent = 'High score: ' + Math.floor(highScore);
    gameOverElement.style.display = 'flex';
}

// Mobile controls
function initMobileControls() {
    // Get mobile control buttons
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    
    // Touch event handlers for mobile buttons
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
    
    // Add touch events for up button
    upButton.addEventListener('touchstart', handleTouchStart('ArrowUp'));
    upButton.addEventListener('touchend', handleTouchEnd('ArrowUp'));
    upButton.addEventListener('touchcancel', handleTouchEnd('ArrowUp'));
    
    // Add touch events for down button
    downButton.addEventListener('touchstart', handleTouchStart('ArrowDown'));
    downButton.addEventListener('touchend', handleTouchEnd('ArrowDown'));
    downButton.addEventListener('touchcancel', handleTouchEnd('ArrowDown'));
    
    // Add touch events for left button
    leftButton.addEventListener('touchstart', handleTouchStart('ArrowLeft'));
    leftButton.addEventListener('touchend', handleTouchEnd('ArrowLeft'));
    leftButton.addEventListener('touchcancel', handleTouchEnd('ArrowLeft'));
    
    // Add touch events for right button
    rightButton.addEventListener('touchstart', handleTouchStart('ArrowRight'));
    rightButton.addEventListener('touchend', handleTouchEnd('ArrowRight'));
    rightButton.addEventListener('touchcancel', handleTouchEnd('ArrowRight'));
    
    // Also add mouse events for testing on desktop
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
    
    // Prevent default behavior for all buttons to avoid unwanted scrolling
    document.querySelectorAll('.control-button').forEach(button => {
        button.addEventListener('touchstart', e => e.preventDefault());
        button.addEventListener('touchmove', e => e.preventDefault());
        button.addEventListener('touchend', e => e.preventDefault());
    });
}