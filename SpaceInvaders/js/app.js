const grid = document.querySelector(".grid");
const resultDisplay = document.querySelector(".results");
const livesDisplay = document.querySelector(".lives");
const messageDisplay = document.getElementById("game-message");

let currentShooterIndex = 382; // Ajusta este índice si es necesario
const width = 20;
const aliensRemoved = [];
let invadersId;
let isGoingRight = true;
let direction = 1;
let results = 0;
let lives = 3;

for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    square.style.width = '30px';
    square.style.height = '30px';
    grid.appendChild(square);
}

const squares = Array.from(document.querySelectorAll(".grid div"));

const alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7,
    20, 21, 22, 23, 24, 25, 26, 27,
    40, 41, 42, 43, 44, 45, 46, 47,
    60, 61, 62, 63, 64, 65, 66, 67
];

function draw() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (!aliensRemoved.includes(i)) {
            squares[alienInvaders[i]].classList.add("invader");
        }
    }
}

function draw() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (!aliensRemoved.includes(i)) {
            squares[alienInvaders[i]].classList.add("invader");
        }
    }
}

draw();

squares[currentShooterIndex].classList.add("shooter");
function remove() {
    for (let i = 0; i < alienInvaders.length; i++) {
        squares[alienInvaders[i]].classList.remove("invader");
    }
}

function moveShooter(e) {
    squares[currentShooterIndex].classList.remove("shooter");

    switch (e.key) {
        case "ArrowLeft":
            if (currentShooterIndex % width !== 0) currentShooterIndex -= 1;
            break;
        case "ArrowRight":
            if (currentShooterIndex % width < width - 1) currentShooterIndex += 1;
            break;
        case "ArrowUp":
            if (currentShooterIndex >= width) currentShooterIndex -= width;
            break;
        case "ArrowDown":
            if (currentShooterIndex < width * (width - 1)) currentShooterIndex += width;
            break;
    }

    squares[currentShooterIndex].classList.add("shooter");
}

document.addEventListener("keydown", moveShooter);

function moveInvaders() {
    const leftEdge = alienInvaders[0] % width === 0;
    const rightEdge = alienInvaders[alienInvaders.length - 1] % width === width - 1;
    remove();

    if (rightEdge && isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
            alienInvaders[i] += width + 1;
            direction = -1;
            isGoingRight = false;
        }
    }

    if (leftEdge && !isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
            alienInvaders[i] += width - 1;
            direction = 1;
            isGoingRight = true;
        }
    }

    for (let i = 0; i < alienInvaders.length; i++) {
        alienInvaders[i] += direction;
    }

    draw();

    if (squares[currentShooterIndex].classList.contains("invader")) {
        gameOver();
    }

    if (aliensRemoved.length === alienInvaders.length) {
        youWin();
        clearInterval(invadersId); 
    }
}


invadersId = setInterval(moveInvaders, 100);

function shoot(e) {
    if (e.key === " ") { // Verifica si la tecla presionada es el espacio
        let laserId;
        let currentLaserIndex = currentShooterIndex;

        function moveLaser() {
            squares[currentLaserIndex].classList.remove("laser");
            currentLaserIndex -= width;
            if (currentLaserIndex >= 0) {
                squares[currentLaserIndex].classList.add("laser");
            }

            if (squares[currentLaserIndex].classList.contains("invader")) {
                squares[currentLaserIndex].classList.remove("laser");
                squares[currentLaserIndex].classList.remove("invader");
                squares[currentLaserIndex].classList.add("boom");

                setTimeout(() => {
                    squares[currentLaserIndex].classList.remove("boom");
                }, 300);

                clearInterval(laserId);

                const alienRemoved = alienInvaders.indexOf(currentLaserIndex);
                aliensRemoved.push(alienRemoved);
                results++;
                resultDisplay.innerHTML = `Score: ${results}`;
            }
        }

        laserId = setInterval(moveLaser, 100);
    }
}

document.addEventListener('keydown', shoot);

function alienShoot() {
    const randomAlien = alienInvaders[Math.floor(Math.random() * alienInvaders.length)];
    if (!aliensRemoved.includes(alienInvaders.indexOf(randomAlien))) {
        let currentLaserIndex = randomAlien;
        function moveLaser() {
            squares[currentLaserIndex].classList.remove("alien-laser");
            currentLaserIndex += width;
            if (currentLaserIndex < width * width) {
                squares[currentLaserIndex].classList.add("alien-laser");

                if (squares[currentLaserIndex].classList.contains("shooter")) {
                    squares[currentLaserIndex].classList.remove("alien-laser");
                    squares[currentLaserIndex].classList.add("boom");
                    setTimeout(() => squares[currentLaserIndex].classList.remove("boom"), 300);

                    lives--;
                    livesDisplay.innerHTML = `Lives: ${lives}`;
                    if (lives === 0) {
                        gameOver();
                        clearInterval(invadersId);
                        clearInterval(alienLaserId);
                    }
                    clearInterval(laserId);
                }
            } else {
                squares[currentLaserIndex].classList.remove("alien-laser");
                clearInterval(laserId);
            }
        }
        let laserId = setInterval(moveLaser, 100);
    }
}
    
setInterval(addNewInvader, 5000);

function startAlienShooting() {
    const randomInterval = Math.random() * 2000 + 1000;
    setTimeout(() => {
        alienShoot();
        startAlienShooting();
    }, randomInterval);
}

startAlienShooting();

function gameOver() {
    clearInterval(invadersId);
    messageDisplay.innerHTML = "GAME OVER";
    messageDisplay.classList.remove("hidden");
    messageDisplay.classList.add("visible");
}

function youWin() {
    clearInterval(invadersId);
    if (aliensRemoved.length === alienInvaders.length) {
        messageDisplay.innerHTML = `YOU WIN<br>Score: ${results}`;
    }
    messageDisplay.classList.remove("hidden");
    messageDisplay.classList.add("visible");
}
