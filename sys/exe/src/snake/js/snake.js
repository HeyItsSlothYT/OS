
// The function gets called when the window is fully loaded
window.onload = function () {
    // Get the canvas and context
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");

    let dead = new Audio();
    let eat = new Audio();
    let up = new Audio();
    let right = new Audio();
    let left = new Audio();
    let down = new Audio();
    let hit = new Audio();
    let oneup = new Audio();

    dead.src = "./src/snake/audio/dead.mp3";
    eat.src = "./src/snake/audio/eat.mp3";
    up.src = "./src/snake/audio/up.mp3";
    right.src = "./src/snake/audio/right.mp3";
    left.src = "./src/snake/audio/left.mp3";
    down.src = "./src/snake/audio/down.mp3";
    hit.src = "./src/snake/audio/hit.wav";
    oneup.src = "./src/snake/audio/oneup.wav";

    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    let lives = 3;
    let livesCounter = 0;
    let scoreMilestone = 0;
    let livesMultiplyer = 0;

    var initialized = false;

    // Images
    var images = [];
    var tileimage;

    // Image loading global variables
    var loadcount = 0;
    var loadtotal = 0;
    var preloaded = false;

    // Load images
    function loadImages(imagefiles) {
        // Initialize variables
        loadcount = 0;
        loadtotal = imagefiles.length;
        preloaded = false;

        // Load the images
        var loadedimages = [];
        for (var i = 0; i < imagefiles.length; i++) {
            // Create the image object
            var image = new Image();

            // Add onload event handler
            image.onload = function () {
                loadcount++;
                if (loadcount == loadtotal) {
                    // Done loading
                    preloaded = true;
                }
            };

            // Set the source url of the image
            image.src = imagefiles[i];

            // Save to the image array
            loadedimages[i] = image;
        }

        // Return an array of images
        return loadedimages;
    }

    // Level properties
    class Level {
        constructor(columns, rows, tilewidth, tileheight) {
            this.columns = columns;
            this.rows = rows;
            this.tilewidth = tilewidth;
            this.tileheight = tileheight;

            // Initialize tiles array
            this.tiles = [];
            for (var i = 0; i < this.columns; i++) {
                this.tiles[i] = [];
                for (var j = 0; j < this.rows; j++) {
                    this.tiles[i][j] = 0;
                }
            }
        }


        // Generate a default level with walls
        generate() {

            for (var i = 0; i < this.columns; i++) {
                for (var j = 0; j < this.rows; j++) {
                    if (i == 0 || i == this.columns - 1 ||
                        j == 0 || j == this.rows - 1) {
                        // Add walls at the edges of the level
                        this.tiles[i][j] = 1;
                    } else {
                        if (randRange(0, 100) >= 99.5) {
                            // add random wall object
                            this.tiles[i][j] = 1;
                        } else {
                            // Add empty space
                            this.tiles[i][j] = 0;

                        }

                    }
                }
            }
        }
    }



    // Snake
    class Snake {
        constructor() {
            this.init(0, 0, 1, 10, 1);
        }
        // Initialize the snake at a location
        init(x, y, direction, speed, numsegments) {
            this.x = x;
            this.y = y;
            this.direction = direction; // Up, Right, Down, Left
            this.speed = speed; // Movement speed in blocks per second
            this.movedelay = 0;

            // Reset the segments and add new ones
            this.segments = [];
            this.growsegments = 0;

            for (var i = 0; i < numsegments; i++) {
                this.segments.push({
                    x: this.x - i * this.directions[direction][0],
                    y: this.y - i * this.directions[direction][1]
                });
            }
        }
        // Increase the segment count
        grow(num) {
            if (!num) num = 1;

            if (num < 0) {
                for (var k = 0; k < Math.abs(num) - 1; k++) {
                    if ((this.segments.length - 1) <= 1) break;
                    this.segments.pop();
                }
            } else {
                this.growsegments += num;
            }
        }
        // Check we are allowed to move
        tryMove(dt) {
            this.movedelay += dt;
            var maxmovedelay = 1 / this.speed;
            if (this.movedelay > maxmovedelay) {
                return true;
            }
            return false;
        }
        // Get the position of the next move
        nextMove() {
            var nextx = this.x + this.directions[this.direction][0];
            var nexty = this.y + this.directions[this.direction][1];
            return { x: nextx, y: nexty };
        }
        // Move the snake in the direction
        move() {
            // Get the next move and modify the position
            var nextmove = this.nextMove();
            this.x = nextmove.x;
            this.y = nextmove.y;

            // Get the position of the last segment
            var lastseg = this.segments[this.segments.length - 1];
            var growx = lastseg.x;
            var growy = lastseg.y;

            // Move segments to the position of the previous segment
            for (var i = this.segments.length - 1; i >= 1; i--) {
                this.segments[i].x = this.segments[i - 1].x;
                this.segments[i].y = this.segments[i - 1].y;
            }

            // Grow a segment if needed
            if (this.growsegments > 0) {
                this.segments.push({ x: growx, y: growy });
                this.growsegments--;
            }

            // Move the first segment
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;

            // Reset movedelay
            this.movedelay = 0;
        }
    }

        // Direction table: Up, Right, Down, Left
        Snake.prototype.directions =[[0, -1], [1, 0], [0, 1], [-1, 0]];

    // Create objects
    var snake = new Snake();
    let gridSize = 27;
    let maxColumns = (window.innerWidth / gridSize).toFixed(0);
    let maxRows = (window.innerHeight / gridSize).toFixed(0);
    var level = new Level(maxColumns, maxRows, gridSize, gridSize);

    // Variables
    var score = 0;              // Score
    var gameover = true;        // Game is over
    var gameovertime = 1;       // How long we have been game over
    var gameoverdelay = 0.5;    // Waiting time after game over

    // Initialize the game
    function init() {
        // Load images
        images = loadImages(["./src/snake/snake-graphics.png"]);
        tileimage = images[0];

        // Add mouse events
        canvas.addEventListener("mousedown", onMouseDown);

        // Add keyboard events
        document.addEventListener("keydown", onKeyDown);

        // New game
        newGame();
        gameover = true;

        // Enter main loop
        main(0);
    }

    // Check if we can start a new game
    function tryNewGame() {
        if (gameovertime > gameoverdelay) {
            newGame();
            gameover = false;
        }
    }

    function newGame() {
        // Initialize the snake
        snake.init(10, 10, 1, 10, 4);

        // Generate the default level
        level.generate();

        // Add an apple
        for (i = 0; i <= 5; i++) {
            addApple(Math.floor(Math.random() * 5) + 2);
        }


        // Initialize the score
        score = 0;
        lives = 3;
        scoreMilestone = 200;
        livesMultiplyer = 1;
        livesCounter = 0;
        // Initialize variables
        gameover = false;
    }

    // Add an apple to the level at an empty position
    function addApple(foodType) {
        // Loop until we have a valid apple
        var valid = false;
        while (!valid) {
            // Get a random position
            var ax = randRange(0, level.columns - 1);
            var ay = randRange(0, level.rows - 1);

            // Make sure the snake doesn't overlap the new apple
            var overlap = false;
            for (var i = 0; i < snake.segments.length; i++) {
                // Get the position of the current snake segment
                var sx = snake.segments[i].x;
                var sy = snake.segments[i].y;

                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }

            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an apple at the tile position
                level.tiles[ax][ay] = foodType;
                valid = true;
            }
        }
    }

    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);

        if (!initialized) {
            // Preloader

            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw a progress bar
            var loadpercentage = loadcount / loadtotal;
            context.strokeStyle = "#ff8080";
            context.lineWidth = 3;
            context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
            context.fillStyle = "#ff8080";
            context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage * (canvas.width - 37), 32);

            // Draw the progress text
            var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
            context.fillStyle = "#000000";
            context.font = "16px Verdana";
            context.fillText(loadtext, 18, 0.5 + canvas.height - 63);

            if (preloaded) {
                initialized = true;
            }
        } else {
            // Update and render the game
            update(tframe);
            render();
        }
    }

    // Update the game state
    function update(tframe) {
        var dt = (tframe - lastframe) / 720;
        lastframe = tframe;

        // Update the fps counter
        updateFps(dt);

        if (!gameover) {
            updateGame(dt);

        } else {
            gameovertime += dt;
        }
    }


    function checkGameOver() {
        hit.play();
        $("#viewport").effect("shake");
        if (lives <= 0) {
            gameover = true;
            dead.play();
            return true;
        }
        snake.direction = (snake.direction + 1) % snake.directions.length;
        return false;
    }

    function updateGame(dt) {
        // Move the snake
        if (snake.tryMove(dt)) {
            // Check snake collisions

            // Get the coordinates of the next move
            var nextmove = snake.nextMove();
            var nx = nextmove.x;
            var ny = nextmove.y;

            if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                if (level.tiles[nx][ny] == 1) {
                    // Collision with a wall
                    lives--;
                    gameover = checkGameOver();
                    //gameover = true;
                    //dead.play();
                }

                // Collisions with the snake itself
                for (var i = 0; i < snake.segments.length; i++) {
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;

                    if (nx == sx && ny == sy) {
                        // Found a snake part
                        //gameover = true;
                        //dead.play();
                        lives--;
                        gameover = checkGameOver();
                        break;
                    }
                }

                if (!gameover) {
                    // The snake is allowed to move

                    if (livesCounter >= scoreMilestone) {
                        lives++;
                        oneup.play();
                        livesMultiplyer++;
                        scoreMilestone = score + (200*livesMultiplyer);
                    } 

                    livesCounter = score;

                    // Move the snake
                    snake.move();

                    var tileType = level.tiles[nx][ny];

                    // Check collision with an apple
                    if (tileType >= 2) {
                        // Remove the apple
                        level.tiles[nx][ny] = 0;

                        // Add a new apple
                        addApple(Math.floor(Math.random() * 5) + 2);

                        // Grow the snake
                        snake.grow(tileType >= 5 ? tileType : tileType == 3 ? -5 : 1);

                        // Add a point to the score
                        score += tileType*1.8;

                        eat.play();
                    } else {
                        score += .15;

                    }



                }
            } else {
                // Out of bounds
                //gameover = true;
                //dead.play();
                lives--;
                gameover = checkGameOver();
            }

            if (gameover) {
                console.log("game over!" + " " + lives + " " + gameovertime)
                gameovertime = 0;
            }
        }
    }
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);

            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }

        // Increase time and framecount
        fpstime += dt;
        framecount++;


    }

    // Render the game
    function render() {
        // Draw background
        context.fillStyle = "#577ddb";
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawLevel();
        drawSnake();
        context.fillStyle = "#000";
        context.font = "24px Verdana";
        drawCenterText("Score: " + numberWithCommas(score.toFixed(0)), 0, 24, canvas.width/5);
        drawCenterText("Lives: " + numberWithCommas(lives.toFixed(0)), (canvas.width/5)+24, 24, canvas.width/5);
        drawCenterText("To Next: " + numberWithCommas(((score/scoreMilestone)*100).toFixed(0)) + "%", (canvas.width/5)+200, 24, canvas.width/5);


        // Game over
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Press any key to start!", 0, canvas.height / 2, canvas.width);
        }
    }

    // Draw the level tiles
    function drawLevel() {
        for (var i = 0; i < level.columns; i++) {
            for (var j = 0; j < level.rows; j++) {
                // Get the current tile and location
                var tile = level.tiles[i][j];
                var tilex = i * level.tilewidth;
                var tiley = j * level.tileheight;

                // Draw tiles based on their type
                if (tile == 0) {
                    // Empty space
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 1) {
                    // Wall
                    context.fillStyle = "#bcae76";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 2) {
                    // Apple

                    // Draw apple background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    // Draw the apple image
                    var tx = 0;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx * tilew, ty * tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
                else if (tile == 3) {
                    // Mango

                    // Draw apple background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    // Draw the apple image
                    var tx = 1;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx * tilew, ty * tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 4) {
                    // Strawberry

                    // Draw apple background
                    context.fillStyle = "#f7e697 ";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    // Draw the apple image
                    var tx = 2;
                    var ty = 3;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx * tilew, ty * tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 5) {
                    // Melon

                    // Draw apple background
                    context.fillStyle = "#f7e697 ";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    // Draw the apple image
                    var tx = 0;
                    var ty = 2;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx * tilew, ty * tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 6) {
                    // Orange

                    // Draw apple background
                    context.fillStyle = "#f7e697 ";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    // Draw the apple image
                    var tx = 1;
                    var ty = 2;
                    var tilew = 64;
                    var tileh = 64;
                    context.drawImage(tileimage, tx * tilew, ty * tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
            }
        }
    }

    // Draw the snake
    function drawSnake() {
        // Loop over every snake segment
        for (var i = 0; i < snake.segments.length; i++) {
            var segment = snake.segments[i];
            var segx = segment.x;
            var segy = segment.y;
            var tilex = segx * level.tilewidth;
            var tiley = segy * level.tileheight;

            // Sprite column and row that gets calculated
            var tx = 0;
            var ty = 0;

            if (i == 0) {
                // Head; Determine the correct image
                var nseg = snake.segments[i + 1]; // Next segment
                if (segy < nseg.y) {
                    // Up
                    tx = 3; ty = 0;
                } else if (segx > nseg.x) {
                    // Right
                    tx = 4; ty = 0;
                } else if (segy > nseg.y) {
                    // Down
                    tx = 4; ty = 1;
                } else if (segx < nseg.x) {
                    // Left
                    tx = 3; ty = 1;
                }
            } else if (i == snake.segments.length - 1) {
                // Tail; Determine the correct image
                var pseg = snake.segments[i - 1]; // Prev segment
                if (pseg.y < segy) {
                    // Up
                    tx = 3; ty = 2;
                } else if (pseg.x > segx) {
                    // Right
                    tx = 4; ty = 2;
                } else if (pseg.y > segy) {
                    // Down
                    tx = 4; ty = 3;
                } else if (pseg.x < segx) {
                    // Left
                    tx = 3; ty = 3;
                }
            } else {
                // Body; Determine the correct image
                var pseg = snake.segments[i - 1]; // Previous segment
                var nseg = snake.segments[i + 1]; // Next segment
                if (pseg.x < segx && nseg.x > segx || nseg.x < segx && pseg.x > segx) {
                    // Horizontal Left-Right
                    tx = 1; ty = 0;
                } else if (pseg.x < segx && nseg.y > segy || nseg.x < segx && pseg.y > segy) {
                    // Angle Left-Down
                    tx = 2; ty = 0;
                } else if (pseg.y < segy && nseg.y > segy || nseg.y < segy && pseg.y > segy) {
                    // Vertical Up-Down
                    tx = 2; ty = 1;
                } else if (pseg.y < segy && nseg.x < segx || nseg.y < segy && pseg.x < segx) {
                    // Angle Top-Left
                    tx = 2; ty = 2;
                } else if (pseg.x > segx && nseg.y < segy || nseg.x > segx && pseg.y < segy) {
                    // Angle Right-Up
                    tx = 0; ty = 1;
                } else if (pseg.y > segy && nseg.x > segx || nseg.y > segy && pseg.x > segx) {
                    // Angle Down-Right
                    tx = 0; ty = 0;
                }
            }

            // Draw the image of the snake part
            context.drawImage(tileimage, tx * 64, ty * 64, 64, 64, tilex, tiley,
                level.tilewidth, level.tileheight);
        }
    }

    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width - textdim.width) / 2, y);
    }

    // Get a random int between low and high, inclusive
    function randRange(low, high) {
        return Math.floor(low + Math.random() * (high - low + 1));
    }

    // Mouse event handlers
    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);

        if (gameover) {
            // Start a new game
            tryNewGame();
        } else {
            // Change the direction of the snake
            snake.direction = (snake.direction + 1) % snake.directions.length;
        }
    }

    // Keyboard event handler
    function onKeyDown(e) {
        if (gameover) {
            tryNewGame();
        } else {
            if (e.keyCode == 37 || e.keyCode == 65) {
                // Left or A
                if (snake.direction != 1) {
                    snake.direction = 3;
                    left.play();
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                // Up or W
                if (snake.direction != 2) {
                    snake.direction = 0;
                    up.play();
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                // Right or D
                if (snake.direction != 3) {
                    snake.direction = 1;
                    right.play();
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                // Down or S
                if (snake.direction != 0) {
                    snake.direction = 2;
                    down.play();
                }
            }

            // Grow for demonstration purposes
            if (e.keyCode == 32) {
                snake.grow();
            }
        }
    }

    // Get the mouse position
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    class Shake {
        constructor(duration, frequency) {
            // The duration in milliseconds
            this.duration = parseInt(duration);

            // The frequency in Hz
            this.frequency = parseInt(frequency);

            // The sample count = number of peaks/valleys in the Shake
            var sampleCount = (duration / 1000) * frequency;

            // Populate the samples array with randomized values between -1.0 and 1.0
            this.samples = [];
            for (var i = 0; i < sampleCount; i++) {
                this.samples.push(Math.random() * 2 - 1);
            }

            // Init the time variables
            this.startTime = null;
            this.t = null;

            // Flag that represents if the shake is active
            this.isShaking = false;
        }
        amplitude(t) {
            // Check if optional param was passed
            if (t == undefined) {
                // return zero if we are done shaking
                if (!this.isShaking)
                    return 0;
                t = this.t;
            }

            // Get the previous and next sample
            var s = t / 1000 * this.frequency;
            var s0 = Math.floor(s);
            var s1 = s0 + 1;

            // Get the current decay
            var k = this.decay(t);

            // Return the current amplitude
            return (this.noise(s0) + (s - s0) * (this.noise(s1) - this.noise(s0))) * k;
        }
    }


    // Call init to start the game
    init();
};