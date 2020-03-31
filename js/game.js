const DEFAULT_SHIP_SIZE_X = 20;
const DEFAULT_SHIP_SIZE_Y = 30;
const DEFAULT_SHIP_SIZE_FACTOR = 1.0;
const DEFAULT_SHIP_SPEED = 0.5;
const DEFAULT_SHIP_SPEED_FACTOR = 1.0;
const DEFAULT_SHIP_TEXT_COLOR = "white";
const DEFAULT_SPEEDUP_FACTOR = 1.1;
const DEFAULT_SPEEDUP_SCORE = 1000;
const DEFAULT_BEAM_LIFE = 20;

// global game singleton
let game = null;

function DrawText(context, text, x, y, config = null) {
    let cfg = Object.assign({
        align: "left",
        color: "white",
        font: "12px Arial"
    }, config ? config : {});

    context.font = cfg.font;
    context.fillStyle = cfg.color;
    context.textAlign = cfg.align;
    context.fillText(text, x, y);
}

class Position {
    /**
     * Create new position object.
     * @param {Number} x Horizontal coordinate.
     * @param {Number} y Vertical coordinate.
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Beam {
    constructor(start, end) {
        this.start = start;
        this.end = end;

        this.durability = DEFAULT_BEAM_LIFE;

        this.active = true;
    }

    draw(context) {
        context.beginPath();
        context.moveTo(this.start.x, this.start.y);
        context.lineTo(this.end.x, this.end.y);
        context.lineWidth = "3";
        context.strokeStyle = "red";
        context.stroke();
    }

    update() {
        this.durability -= 1;

        if (this.durability <= 0) {
            this.active = false;
        }
    }
}

class Base {
    constructor(position) {
        this.position = position;
        this.shields = 2;
    }

    getPosition() {
        return this.position;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.position.x, this.position.y, 40, 0, Math.PI, true);
        context.strokeStyle = "white";
        context.stroke();

        for (let shieldID = 0; shieldID < this.shields; shieldID++) {
            context.beginPath();
            context.arc(this.position.x, this.position.y, 45 + (shieldID + 1) * 8, 1.9 * Math.PI, 1.10 * Math.PI, true);
            context.strokeStyle = "blue";
            context.stroke();
        }
    }

    addShield(shields = 1) {
        this.shields += shields;
    }

    removeShield(shields = 1) {
        this.shields -= shields;
        if (this.shields < 0) this.shields = 0;
    }
}

class Ship {
    /**
     * Create ship game object with default values. Before adding to the game, some 
     * values (position, text), should be set.
     */
    constructor() {

        // Ship position
        this.position = new Position();

        // Ship properties
        this.size = DEFAULT_SHIP_SIZE_FACTOR; // Size constant which is multiplied by the default ship size.
        this.speed = DEFAULT_SHIP_SPEED; // Ship movement constant, which is multiplied by the default ship speed.

        // There is a text and answer associated with each ship
        this.data = null; // Contains object with question and answer
        this.textColor = DEFAULT_SHIP_TEXT_COLOR // Question color

        // Dead ship is not updated or rendered
        this.dead = true;
    }

    /**
     * Sets new speed factor. This is multiplied by default ship speed to get final ship speed.
     * @param {float} speed New speed factor.
     */
    setSpeed(speed) {
        this.speed = speed < 1.0 ? 1.0 : speed;
    }

    /**
     * Set new position of the ship.
     * @param {Position} position New position of the ship.
     */
    setPosition(position) {
        this.position = position;
    }

    /**
     * Returns position of the ship's nose (down most point of the ship).
     * @returns {Position}
     */
    getPosition() {
        return this.position;
    }

    /**
     * Update data associated with the ship. This contains the question and the answer.
     * @param {Object} data Object with two keys - `question` and `answer`.
     */
    setData(data) {
        this.data = data;
    }

    /**
     * Returns answer to the question associated with the ship.
     * @returns {string}
     */
    getAnswer() {
        return this.data ? this.data.answer : "";
    }

    /**
     * Set new color of the question.
     * @param {string} color Update color of the question.
     */
    setTextColor(color = "white") {
        this.textColor = color;
    }

    /**
     * Make ship alive. Ships that are alive, are rendered and updated.
     */
    revive() {
        this.dead = false;
    }

    /**
     * Make ship dead. Dead ships are not rendered or updated.
     */
    kill() {
        this.dead = true;
    }

    /**
     * Update ship's position on canvas. Call this function in main game loop.
     */
    update() {
        if (this.dead) return;

        this.position.y += DEFAULT_SHIP_SPEED * this.speed;
    }

    /**
     * Draw ship to the canvas.
     * @param {CanvasRenderingContext2D} context Canvas 2D context.
     */
    draw(context) {
        if (this.dead) return;

        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = "white";

        // Move to the nose (down most point of the ship) of the ship

        context.moveTo(this.position.x, this.position.y);
        // Right side
        context.lineTo(
            this.position.x - (DEFAULT_SHIP_SIZE_X / 2 * this.size),
            this.position.y - (DEFAULT_SHIP_SIZE_Y * this.size)
        );
        // Upper side
        context.lineTo(
            this.position.x + (DEFAULT_SHIP_SIZE_X / 2 * this.size),
            this.position.y - DEFAULT_SHIP_SIZE_Y * this.size
        );
        // Left side
        context.lineTo(this.position.x, this.position.y);
        context.stroke();

        // Draw question over the ship
        DrawText(context, this.data.question, this.position.x, this.position.y - (DEFAULT_SHIP_SIZE_Y * this.size) - 8, {
            align: "center"
        });
    }
}

class UserInput {
    constructor(position) {
        this.position = position;
        this.input = "";
    }

    clear(all = false) {
        if (all) {
            this.input = "";
        } else {
            this.input = this.input.slice(0, -1);
        }
    }

    add(text) {
        this.input += text;
    }

    get() {
        return this.input;
    }

    setPosition(position) {
        this.position = position;
    }

    draw(context) {
        DrawText(context, this.input, this.position.x, this.position.y, {
            font: "15px Arial",
            align: "center"
        });
    }
}

class Score {
    constructor(position = new Position(), lives = 3, startingScore = 0) {

        this.position = position;

        this.score = startingScore;
        this.lives = lives;
    }

    /**
     * Set Score position on the canvas.
     * @param {Position} position New widget's position.
     */
    setPosition(position) {
        this.position = position;
    }

    /**
     * Show Score widget on the screen.
     * @param {CanvasRenderingContext2D} context Canvas 2D context.
     */
    draw(context) {
        DrawText(context, "Score: " + this.score, this.position.x, this.position.y, {
            font: "15px Arial"
        });
        DrawText(context, "Lives: " + this.lives, this.position.x, this.position.y + 30, {
            font: "15px Arial"
        });
    }

    /**
     * Removes lives from lives counter.
     * @param {number} lives Number of lives to remove from the counter.
     */
    damage(lives = 1) {
        this.lives -= lives;
    }

    /**
     * Gets number of lives.
     * @returns {number}
     */
    getLives() {
        return this.lives;
    }

    /**
     * Adds score to the score counter.
     * @param {number} score Add score to the score counter.
     */
    addScore(score = 100) {
        this.score += score;
    }
}

class Game {

    /**
     * Creates new game instance in selected canvas.
     * @param {string} canvasSelector Query selector for canvas HTML element.
     */
    constructor(canvasSelector, settings = null) {

        this.config = Object.assign({
            maxNumber: 20,
            operators: ["+", "-"],
            wholeNumbers: true
        }, settings ? settings : {});

        console.log("Game created");
        this.canvas = document.querySelector(canvasSelector);

        // Change size to remove blurry lines
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        this.context = this.canvas.getContext("2d");

        // Create score counter
        this.score = new Score(new Position(20, this.canvas.height - 40));

        // Create field with user input
        this.userInput = new UserInput(new Position(this.canvas.width / 2, this.canvas.height - 10));

        this.base = new Base(new Position(this.canvas.width / 2, this.canvas.height));

        // List of all ships in game
        this.ships = [
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship(),
            new Ship()
        ];

        this.beams = [];

        // Question generator
        this.generator = new BasicMathGenerator(this.config);

        // If game is paused, no more ships are spawned and canvas is not updated anymore
        this.paused = false;

        // Function spawning new ships
        let spawnWithThis = this._spawnShip.bind(this);
        // Interval between ships being spawned. This changes over time
        this.timeBetweenSpawns = 5000;
        this.spawnInterval = setInterval(spawnWithThis, this.timeBetweenSpawns);

        // Register input handler
        let handleWithThis = this._handleInput.bind(this);
        document.addEventListener("keydown", handleWithThis);
    }

    pause() {
        this.paused = !this.paused;

        console.log("pause toggle: " + this.paused);

        if (this.paused) {
            clearInterval(this.spawnInterval);
        }
    }

    /**
     * This method is called periodically from setInterval function to spawn another ship in game.
     * It finds first dead ship, refills it with new question and answer, moves it to the top and
     * respawns it.
     */
    _spawnShip() {

        // Find first dead ship and prepare it for respawn
        for (let ship of this.ships) {
            if (ship.dead) {
                // Generate new question and answer
                ship.setData(this.generator.generate());
                // Move ship to the top
                ship.setPosition(new Position(50 + Math.round(Math.random() * (this.canvas.width - 100)), -30));
                ship.setSpeed(Math.round(this.score.score / DEFAULT_SPEEDUP_SCORE) * DEFAULT_SPEEDUP_FACTOR);
                // Respawn the ship
                ship.revive();

                // Exit the loop, one ship is enough for now
                return;
            }
        }

        console.log("Too many ships in game. Could not spawn another one :/");
    }

    /**
     * Handle user input from keyboard.
     * @param {KeyEvent} e Keyboard event parameter from addEventListener callback.
     */
    _handleInput(e) {
        // Press enter to submit the answer
        if (e.key == "Enter") {
            this._processAnswer();
            // Press backspace to remove last character
        } else if (e.key == "Backspace") {
            this.userInput.clear();
            // add whatever character (except Shift, Ctrl and Alt) to the answer
        } else if (e.key == "Escape") {
            this.userInput.clear(true);
            this.pause();
        } else if (e.key != "Shift" && e.key != "Control" && e.key != "Alt") {
            this.userInput.add(e.key);
        }

        // Prevent defaults
        return false;
    }

    /**
     * Checks collisions between ships and bottom part of the canvas. If collision is detected,
     * lives are removed from the score counter and ship is destroyed.
     */
    _checkCollision() {

        for (let ship of this.ships) {
            let pos = ship.getPosition();
            if (pos.y >= this.canvas.height) {
                // Killed ships are not moved, they stay at their location, but are invisible.
                // I don't want to kill the player with one invisible ship :)
                if (!ship.dead) {
                    ship.kill();
                    this.score.damage();
                    this.base.removeShield();
                }
            }
        }
    }

    draw() {
        this._clearCanvas();

        for (let ship of this.ships) {
            ship.draw(this.context);
        }

        for (let beam of this.beams) {
            beam.draw(this.context);
        }

        this.score.draw(this.context);
        this.userInput.draw(this.context);
        this.base.draw(this.context);
    }

    update() {
        for (let ship of this.ships) {
            ship.update();
        }

        for (let i = 0; i < this.beams.length; i++) {
            let beam = this.beams[i];

            beam.update();
            if (!beam.active) {
                this.beams.splice(i, 1);
            }
        }

        this._checkCollision();
    }

    run() {
        this.update();
        this.draw();

        let loop = this.run.bind(this);

        if (this.paused) {
            console.log("Game is paused");
        } else if (this.score.lives > 0) {
            window.requestAnimationFrame(loop);
        } else {
            console.log("Game over/pause!");
            clearInterval(this.spawnInterval);
        }
    }

    _clearCanvas() {
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _processAnswer() {

        for (let ship of this.ships) {
            if (ship.getAnswer() == this.userInput.get()) {
                this.beams.push(new Beam(this.base.getPosition(), ship.getPosition()));
                ship.kill();
                this.score.addScore(Math.round((this.canvas.height - ship.getPosition().y) / 4));
                this.userInput.clear(true);
                return;
            }
        }

        this.beams.push(new Beam(this.base.getPosition(), new Position(
            Math.round(Math.random() * this.canvas.width),
            Math.round(Math.random() * (this.canvas.height - 100))
        )));
        this.userInput.clear(true);
    }
};

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("start").addEventListener("click", () => {
        let max = document.getElementById("maxNumber").value;
        let whole = document.getElementById("useWholeNumbers").checked;
        let op = ["+", "-"];
        let useMultiplication = document.getElementById("useMultiplication").checked;
        let useDivision = document.getElementById("useDivision").checked;

        if (useMultiplication) op.push("*");
        if (useDivision) op.push("/");

        game = new Game("#game", {
            maxNumber: max,
            wholeNumbers: whole,
            operators: op
        });
        game.run();
    });
});