// ========== GAME CONFIGURATION ==========
const CONFIG = {
    width: 20,
    baseSpeed: 500,
    speedIncreasePerLevel: 50,
    minSpeed: 100,
    alienShootMinInterval: 1000,
    alienShootMaxInterval: 3000,
    pointsPerAlien: 10,
    pointsPerLevel: 100
};

// ========== DOM ELEMENTS ==========
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const livesContainer = document.getElementById('lives');
const messageDisplay = document.getElementById('game-message');
const messageText = document.getElementById('message-text');
const highScoreValue = document.getElementById('high-score-value');

// ========== SOUND EFFECTS ==========
const sounds = {
    shoot: document.getElementById('sound-shoot'),
    explosion: document.getElementById('sound-explosion'),
    hit: document.getElementById('sound-hit'),
    gameover: document.getElementById('sound-gameover'),
    win: document.getElementById('sound-win'),
    levelup: document.getElementById('sound-levelup')
};

function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.volume = 0.3;
            sound.play().catch(() => {}); // Ignore autoplay errors
        }
    } catch (e) {
        // Sound not available
    }
}

// ========== GAME STATE ==========
let squares = [];
let alienInvaders = [];
let aliensRemoved = [];
let currentShooterIndex = 382;
let invadersId = null;
let alienShootingTimeout = null;
let isGoingRight = true;
let direction = 1;
let score = 0;
let lives = 3;
let level = 1;
let gameSpeed = CONFIG.baseSpeed;
let isGameRunning = false;
let canShoot = true;
let highScore = localStorage.getItem('spaceInvadersHighScore') || 0;

// ========== INITIAL ALIEN FORMATION ==========
const baseAlienFormation = [
    0, 1, 2, 3, 4, 5, 6, 7,
    20, 21, 22, 23, 24, 25, 26, 27,
    40, 41, 42, 43, 44, 45, 46, 47,
    60, 61, 62, 63, 64, 65, 66, 67
];

// ========== INITIALIZATION ==========
function init() {
    // Display high score
    highScoreValue.textContent = highScore;
    
    // Create grid
    createGrid();
    
    // Event listeners
    playBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    document.addEventListener('keydown', handleKeyDown);
}

function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < CONFIG.width * CONFIG.width; i++) {
        const square = document.createElement('div');
        grid.appendChild(square);
    }
    squares = Array.from(grid.querySelectorAll('div'));
}

// ========== GAME START ==========
function startGame() {
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    resetGame();
    isGameRunning = true;
    
    // Start game loops
    invadersId = setInterval(moveInvaders, gameSpeed);
    startAlienShooting();
}

function resetGame() {
    // Clear grid
    squares.forEach(square => {
        square.className = '';
    });
    
    // Reset state
    alienInvaders = [...baseAlienFormation];
    aliensRemoved = [];
    currentShooterIndex = 382;
    isGoingRight = true;
    direction = 1;
    score = 0;
    lives = 3;
    level = 1;
    gameSpeed = CONFIG.baseSpeed;
    canShoot = true;
    
    // Update UI
    updateScore();
    updateLevel();
    updateLives();
    
    // Hide message
    messageDisplay.classList.add('hidden');
    restartBtn.classList.add('hidden');
    
    // Draw initial state
    draw();
    squares[currentShooterIndex].classList.add('shooter');
}

function restartGame() {
    clearInterval(invadersId);
    clearTimeout(alienShootingTimeout);
    resetGame();
    isGameRunning = true;
    invadersId = setInterval(moveInvaders, gameSpeed);
    startAlienShooting();
}

// ========== DRAWING ==========
function draw() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (!aliensRemoved.includes(i) && alienInvaders[i] < CONFIG.width * CONFIG.width) {
            squares[alienInvaders[i]].classList.add('invader');
        }
    }
}

function remove() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (alienInvaders[i] < CONFIG.width * CONFIG.width) {
            squares[alienInvaders[i]].classList.remove('invader');
        }
    }
}

// ========== PLAYER MOVEMENT ==========
function handleKeyDown(e) {
    if (!isGameRunning) return;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        shoot();
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        moveShooter(e.key);
    }
}

function moveShooter(key) {
    squares[currentShooterIndex].classList.remove('shooter');
    
    switch (key) {
        case 'ArrowLeft':
            if (currentShooterIndex % CONFIG.width !== 0) currentShooterIndex -= 1;
            break;
        case 'ArrowRight':
            if (currentShooterIndex % CONFIG.width < CONFIG.width - 1) currentShooterIndex += 1;
            break;
        case 'ArrowUp':
            if (currentShooterIndex >= CONFIG.width) currentShooterIndex -= CONFIG.width;
            break;
        case 'ArrowDown':
            if (currentShooterIndex < CONFIG.width * (CONFIG.width - 1)) currentShooterIndex += CONFIG.width;
            break;
    }
    
    squares[currentShooterIndex].classList.add('shooter');
}

// ========== INVADER MOVEMENT ==========
function moveInvaders() {
    const leftEdge = alienInvaders[0] % CONFIG.width === 0;
    const rightEdge = alienInvaders[alienInvaders.length - 1] % CONFIG.width === CONFIG.width - 1;
    
    remove();
    
    if (rightEdge && isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
            alienInvaders[i] += CONFIG.width + 1;
            direction = -1;
            isGoingRight = false;
        }
    }
    
    if (leftEdge && !isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
            alienInvaders[i] += CONFIG.width - 1;
            direction = 1;
            isGoingRight = true;
        }
    }
    
    for (let i = 0; i < alienInvaders.length; i++) {
        alienInvaders[i] += direction;
    }
    
    draw();
    
    // Check collision with shooter
    if (squares[currentShooterIndex].classList.contains('invader')) {
        gameOver();
        return;
    }
    
    // Check if aliens reached bottom
    const aliensReachedBottom = alienInvaders.some((alien, index) => {
        return !aliensRemoved.includes(index) && alien >= CONFIG.width * (CONFIG.width - 1);
    });
    
    if (aliensReachedBottom) {
        gameOver();
        return;
    }
    
    // Check win condition
    if (aliensRemoved.length === alienInvaders.length) {
        nextLevel();
    }
}

// ========== SHOOTING ==========
function shoot() {
    if (!canShoot || !isGameRunning) return;
    
    canShoot = false;
    playSound('shoot');
    
    let currentLaserIndex = currentShooterIndex;
    
    const laserId = setInterval(() => {
        // Remove laser from current position
        if (currentLaserIndex < CONFIG.width * CONFIG.width && currentLaserIndex >= 0) {
            squares[currentLaserIndex].classList.remove('laser');
        }
        
        currentLaserIndex -= CONFIG.width;
        
        // Check if laser is still on grid
        if (currentLaserIndex < 0) {
            clearInterval(laserId);
            canShoot = true;
            return;
        }
        
        // Add laser to new position
        squares[currentLaserIndex].classList.add('laser');
        
        // Check for hit
        if (squares[currentLaserIndex].classList.contains('invader')) {
            squares[currentLaserIndex].classList.remove('laser');
            squares[currentLaserIndex].classList.remove('invader');
            squares[currentLaserIndex].classList.add('boom');
            
            playSound('explosion');
            
            setTimeout(() => {
                if (currentLaserIndex < CONFIG.width * CONFIG.width) {
                    squares[currentLaserIndex].classList.remove('boom');
                }
            }, 300);
            
            clearInterval(laserId);
            canShoot = true;
            
            const alienIndex = alienInvaders.indexOf(currentLaserIndex);
            aliensRemoved.push(alienIndex);
            
            // Update score
            score += CONFIG.pointsPerAlien + (level * 5);
            updateScore();
            
            // Speed up remaining aliens
            updateGameSpeed();
        }
    }, 50);
}

function alienShoot() {
    if (!isGameRunning) return;
    
    // Get active aliens
    const activeAliens = alienInvaders.filter((alien, index) => 
        !aliensRemoved.includes(index) && alien < CONFIG.width * CONFIG.width
    );
    
    if (activeAliens.length === 0) return;
    
    const randomAlien = activeAliens[Math.floor(Math.random() * activeAliens.length)];
    let currentLaserIndex = randomAlien;
    
    const laserId = setInterval(() => {
        if (currentLaserIndex < CONFIG.width * CONFIG.width) {
            squares[currentLaserIndex].classList.remove('alien-laser');
        }
        
        currentLaserIndex += CONFIG.width;
        
        if (currentLaserIndex >= CONFIG.width * CONFIG.width) {
            clearInterval(laserId);
            return;
        }
        
        squares[currentLaserIndex].classList.add('alien-laser');
        
        if (squares[currentLaserIndex].classList.contains('shooter')) {
            squares[currentLaserIndex].classList.remove('alien-laser');
            squares[currentLaserIndex].classList.add('boom');
            
            playSound('hit');
            
            setTimeout(() => {
                if (currentLaserIndex < CONFIG.width * CONFIG.width) {
                    squares[currentLaserIndex].classList.remove('boom');
                }
            }, 300);
            
            clearInterval(laserId);
            
            lives--;
            updateLives();
            
            if (lives === 0) {
                gameOver();
            }
        }
    }, 100);
}

function startAlienShooting() {
    if (!isGameRunning) return;
    
    const interval = Math.random() * 
        (CONFIG.alienShootMaxInterval - CONFIG.alienShootMinInterval) + 
        CONFIG.alienShootMinInterval - (level * 100);
    
    alienShootingTimeout = setTimeout(() => {
        alienShoot();
        startAlienShooting();
    }, Math.max(interval, 500));
}

// ========== GAME SPEED ==========
function updateGameSpeed() {
    const aliensLeft = alienInvaders.length - aliensRemoved.length;
    const percentLeft = aliensLeft / alienInvaders.length;
    
    // Speed increases as fewer aliens remain
    const speedMultiplier = 1 - (percentLeft * 0.7);
    gameSpeed = Math.max(
        CONFIG.minSpeed,
        CONFIG.baseSpeed - (level * CONFIG.speedIncreasePerLevel) - (speedMultiplier * 200)
    );
    
    clearInterval(invadersId);
    invadersId = setInterval(moveInvaders, gameSpeed);
}

// ========== LEVEL PROGRESSION ==========
function nextLevel() {
    isGameRunning = false;
    clearInterval(invadersId);
    clearTimeout(alienShootingTimeout);
    
    // Bonus points for completing level
    score += CONFIG.pointsPerLevel * level;
    updateScore();
    
    level++;
    
    playSound('levelup');
    
    // Show level up message
    messageText.textContent = `LEVEL ${level}`;
    messageText.className = 'message-text levelup';
    messageDisplay.classList.remove('hidden');
    
    setTimeout(() => {
        messageDisplay.classList.add('hidden');
        
        // Reset for next level
        squares.forEach(square => square.className = '');
        
        alienInvaders = [...baseAlienFormation];
        aliensRemoved = [];
        isGoingRight = true;
        direction = 1;
        currentShooterIndex = 382;
        gameSpeed = CONFIG.baseSpeed - (level * CONFIG.speedIncreasePerLevel);
        gameSpeed = Math.max(gameSpeed, CONFIG.minSpeed);
        
        updateLevel();
        draw();
        squares[currentShooterIndex].classList.add('shooter');
        
        isGameRunning = true;
        invadersId = setInterval(moveInvaders, gameSpeed);
        startAlienShooting();
    }, 2000);
}

// ========== GAME OVER ==========
function gameOver() {
    isGameRunning = false;
    clearInterval(invadersId);
    clearTimeout(alienShootingTimeout);
    
    playSound('gameover');
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceInvadersHighScore', highScore);
        highScoreValue.textContent = highScore;
    }
    
    messageText.innerHTML = `GAME OVER<br><br>Score: ${score}<br>High Score: ${highScore}`;
    messageText.className = 'message-text lose';
    messageDisplay.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
}

function youWin() {
    isGameRunning = false;
    clearInterval(invadersId);
    clearTimeout(alienShootingTimeout);
    
    playSound('win');
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceInvadersHighScore', highScore);
        highScoreValue.textContent = highScore;
    }
    
    messageText.innerHTML = `YOU WIN!<br><br>Final Score: ${score}`;
    messageText.className = 'message-text win';
    messageDisplay.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
}

// ========== UI UPDATES ==========
function updateScore() {
    scoreDisplay.textContent = score;
}

function updateLevel() {
    levelDisplay.textContent = level;
}

function updateLives() {
    const hearts = livesContainer.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index >= lives) {
            heart.classList.add('lost');
        } else {
            heart.classList.remove('lost');
        }
    });
}

// ========== START ==========
init();
