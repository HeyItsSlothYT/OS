let width = window.innerWidth;
let height = window.innerHeight;
let gameInterval = "";
let gameData = {};
var audio = $("#snakeEat")[0];
const rollSound = new Audio("../src/audio/snakeeat.wav");
const overSound = new Audio("../src/audio/gameOver.wav");
let points = 0;

window.onload = function () {
    $("#dialog").dialog({
        closeOnEscape: false,
    });
    $("#gMsg").text("Press start, to start the game!");
    $("#gBtn").on('click', function () {
        $("#dialog").dialog("close");
        startGame();

    });

    resetGame();


    window.onkeydown = function (e) {
        gameData.NewDirection = { 37: -1, 38: -2, 39: 1, 40: 2 }[e.keyCode] || gameData.NewDirection;
    };
};


function playEat() {
    rollSound.play();
}
function startGame() {
    resetGame();
    console.log("Starting Game, details: ")
    console.log(gameData);
    gameInterval = setInterval(tick, 1024 / gameData.Settings.Fps); // Start game loop!
}

function gameOver(message) {
    //location.reload(); // Refresh page
    clearInterval(gameInterval);
    $("#dialog").dialog();
    $("#gMsg").text("Press start, to start the game!");
    $("#gStatus").text(message).show();
    overSound.play();
}

function randomOffset(start, stop) {
    return Math.floor(Math.random() * ((stop - start) + 1) + start);

    //return Math.floor(Math.random() * gameData.Settings.CanvasSize / gameData.Settings.GridSize) * gameData.Settings.GridSize;
}

function stringifyCoord(obj) {
    return [obj.x, obj.y].join(',');
}

function tick() {
    var newHead = { x: gameData.Snake[0].x, y: gameData.Snake[0].y };

    gameData.Context.fillStyle = gameData.Settings.BoardColor; // Background Color
    gameData.Context.fillRect(0, 0, width, height); // Reset the play area

    // Only change directon if the new direction is a different axis
    if (Math.abs(gameData.Direction) !== Math.abs(gameData.NewDirection)) {
        gameData.Direction = gameData.NewDirection;
    }

    var axis = Math.abs(gameData.Direction) === 1 ? 'x' : 'y'; // 1, -1 are X; 2, -2 are Y
    if (gameData.Direction < 0) {
        newHead[axis] -= gameData.Settings.GridSize; // Move left or down
    } else {
        newHead[axis] += gameData.Settings.GridSize; // Move right or up
    }


    myScore.text = "SCORE: " + points;
    myScore.update();

    //console.log("New Head: " + newHead.x.toFixed(2) + "/" + newHead.y.toFixed(2));
    //if (gameData.Candy) console.log("Candy   :" + gameData.Candy.x + "/" + gameData.Candy.y);

    // Collided with candy
    if (gameData.Candy && (Math.abs(gameData.Candy.x - newHead.x.toFixed(2)) <= gameData.Settings.GridSize) && (Math.abs(gameData.Candy.y - newHead.y.toFixed(2)) <= gameData.Settings.GridSize)) {
        if (gameData.Candy.type == 'apple') { // Add to snakes length
            gameData.SnakeLength += 3;
            points += 3;
        } else if (gameData.Candy.type == 'blueberry') {
            gameData.SnakeLength += 5;
            points += 5;
        } else if (gameData.Candy.type == 'mango') {
            gameData.SnakeLength += 7;
            points += 7;
        }

        gameData.Candy = null; // Remove the candy
        playEat()

    }



    // Move snake forward
    gameData.Snake.unshift(newHead);
    gameData.Snake = gameData.Snake.slice(0, gameData.SnakeLength);

    // did we run into any bounds?
    if (newHead.x < 0 || newHead.x + gameData.Settings.GridSize >= (window.innerWidth - gameData.Settings.GridSize) || newHead.y < 0 || newHead.y + gameData.Settings.GridSize >= (window.innerHeight - gameData.Settings.GridSize)) { // Detect wall collisions
        return gameOver("Oh no! You ran into a wall!");
    }

    gameData.Context.fillStyle = gameData.Settings.SnakeColor;

    var snakeObj = {};
    for (var i = 0; i < gameData.Snake.length; i++) {
        var a = gameData.Snake[i];
        gameData.Context.fillRect(a.x, a.y, gameData.Settings.GridSize, gameData.Settings.GridSize); // Render the snake
        // Build a collision lookup object
        if (i > 0) snakeObj[stringifyCoord(a)] = true;
    }

    // did we run into ourselves?
    if (snakeObj[stringifyCoord(newHead)]) return gameOver("You ran into yourself!");

    while (!gameData.Candy || snakeObj[stringifyCoord(gameData.Candy)]) { // Generate a new candy
        var chance = randomOffset(1, 10).toFixed(0);
        let candyType = '';
        if (chance >= 1 && chance <= 6) {
            candyType = 'apple';
        } else if (chance >= 7 && chance <= 10) {
            candyType = 'blueberry';
        } else if (chance >= 11 && chance <= 12) {
            candyType = 'mango';
        }

        gameData.Candy = {
            x: randomOffset(0, window.innerWidth - gameData.Settings.GridSize - 5).toFixed(2),
            y: randomOffset(0, window.innerHeight - gameData.Settings.GridSize - 5).toFixed(2),
            type: candyType
        };
        //console.log(gameData.Candy);
    }

    if (gameData.Candy.type == 'apple') {
        gameData.Context.fillStyle = '#c21336';
    } else if (gameData.Candy.type == 'blueberry') {
        gameData.Context.fillStyle = '#129cb5';
    } else if (gameData.Candy.type == 'mango') {
        gameData.Context.fillStyle = '#e8a53a';
    }
    gameData.Context.beginPath();
    gameData.Context.arc(gameData.Candy.x + 6, gameData.Candy.y + 6, 6, 0, Math.PI * 2, true);
    gameData.Context.closePath();
    gameData.Context.fill();
}


function resetGame() {
    points = 0;
    gameData = {
        "Canvas": "",
        "Context": "",
        "Direction": 0,
        "SnakeLength": 0,
        "Snake": [],
        "Candy": "",
        "Settings": {
            "FPS": "",
            "CanvasSize": 0,
            "GridSize": 0,
            "SnakeColor": "",
            "BoardColor": "#000000"
        }
    };
    gameData.Canvas = document.getElementById('canvas');
    gameData.Context = canvas.getContext('2d');


    gameData.Settings.Fps = 20;
    gameData.Settings.CanvasSize = (width + height) / 2;
    gameData.Settings.GridSize = gameData.Settings.CanvasSize / 50;
    gameData.Direction = newDirection = 1;
    gameData.SnakeLength = 5;
    gameData.Snake = [{ x: gameData.Settings.CanvasSize / 2, y: gameData.Settings.CanvasSize / 2 }]; // Snake starts in the center
    gameData.Candy = null;
    gameData.Canvas.height = height;
    gameData.Canvas.width = width;
    gameData.Settings.BoardColor = getRandomRolor();
    gameData.Settings.SnakeColor = invertColor(gameData.Settings.BoardColor, false);
    myScore = new component("30px", "Consolas", invertColor(gameData.Settings.BoardColor, true), innerWidth - 200, 40, "text");

    myScore.text = "SCORE: " + points;
    myScore.update();

}

function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.update = function () {
        ctx = gameData.Context;
        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

function getRandomRolor() {
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += Math.floor(Math.random() * 10);
    }
    return color;
}
function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

function invertColor(hex, bw) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}