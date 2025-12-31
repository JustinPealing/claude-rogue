// ===== GAME CONSTANTS =====
const WIDTH = 50;
const HEIGHT = 25;
const MAX_LEVELS = 5;

// Responsive font size
const isMobile = window.innerWidth <= 768;
const fontSize = isMobile ? 8 : 14;

// Enemy templates
const ENEMY_TYPES = {
    goblin: { char: 'g', color: '#8b4513', hp: 15, attack: 3, xp: 10 },
    orc: { char: 'o', color: '#ff4444', hp: 25, attack: 5, xp: 20 },
    troll: { char: 'T', color: '#ff00ff', hp: 40, attack: 8, xp: 35 }
};

// ===== GAME STATE =====
let game = {
    currentLevel: 1,
    gameOver: false,
    victory: false,
    messages: [],
    map: {},
    freeSpaces: []
};

let player = {
    x: 0,
    y: 0,
    hp: 50,
    maxHp: 50,
    attack: 8,
    gold: 0,
    potions: 0
};

let entities = {
    enemies: [],
    items: []
};

// ===== DISPLAY =====
const display = new ROT.Display({
    width: WIDTH,
    height: HEIGHT,
    fontSize: fontSize
});
document.getElementById('game').appendChild(display.getContainer());

// ===== DUNGEON GENERATION =====
function generateDungeon() {
    game.map = {};
    game.freeSpaces = [];

    // Create digger dungeon
    const digger = new ROT.Map.Digger(WIDTH, HEIGHT);
    digger.create((x, y, value) => {
        if (value === 0) { // 0 = floor, 1 = wall
            const key = x + "," + y;
            game.map[key] = "floor";
            game.freeSpaces.push({ x, y });
        }
    });
}

// ===== ENTITY SPAWNING =====
function spawnPlayer() {
    const pos = game.freeSpaces.splice(ROT.RNG.getUniformInt(0, game.freeSpaces.length - 1), 1)[0];
    player.x = pos.x;
    player.y = pos.y;
}

function spawnEnemies() {
    entities.enemies = [];

    // Determine enemy count and types based on level
    const count = 3 + game.currentLevel * 2;

    for (let i = 0; i < count; i++) {
        if (game.freeSpaces.length === 0) break;

        const pos = game.freeSpaces.splice(ROT.RNG.getUniformInt(0, game.freeSpaces.length - 1), 1)[0];

        // Choose enemy type based on level
        let type;
        const roll = ROT.RNG.getUniformInt(1, 100);

        if (game.currentLevel <= 2) {
            type = roll < 80 ? 'goblin' : 'orc';
        } else if (game.currentLevel <= 4) {
            type = roll < 40 ? 'goblin' : (roll < 85 ? 'orc' : 'troll');
        } else {
            type = roll < 20 ? 'goblin' : (roll < 60 ? 'orc' : 'troll');
        }

        const template = ENEMY_TYPES[type];
        entities.enemies.push({
            x: pos.x,
            y: pos.y,
            type: type,
            hp: template.hp,
            maxHp: template.hp,
            attack: template.attack,
            xp: template.xp
        });
    }
}

function spawnItems() {
    entities.items = [];

    // Spawn potions
    const potionCount = 2 + ROT.RNG.getUniformInt(0, 2);
    for (let i = 0; i < potionCount; i++) {
        if (game.freeSpaces.length === 0) break;
        const pos = game.freeSpaces.splice(ROT.RNG.getUniformInt(0, game.freeSpaces.length - 1), 1)[0];
        entities.items.push({ x: pos.x, y: pos.y, type: 'potion' });
    }

    // Spawn gold
    const goldCount = 3 + ROT.RNG.getUniformInt(0, 3);
    for (let i = 0; i < goldCount; i++) {
        if (game.freeSpaces.length === 0) break;
        const pos = game.freeSpaces.splice(ROT.RNG.getUniformInt(0, game.freeSpaces.length - 1), 1)[0];
        entities.items.push({ x: pos.x, y: pos.y, type: 'gold' });
    }

    // Spawn stairs (always)
    if (game.freeSpaces.length > 0) {
        const pos = game.freeSpaces.splice(ROT.RNG.getUniformInt(0, game.freeSpaces.length - 1), 1)[0];
        entities.items.push({ x: pos.x, y: pos.y, type: 'stairs' });
    }
}

function initLevel() {
    generateDungeon();
    spawnPlayer();
    spawnEnemies();
    spawnItems();

    addMessage(`=== LEVEL ${game.currentLevel} ===`);
    if (game.currentLevel === 1) {
        addMessage("Escape the dungeon! Find the stairs (>)");
    }
}

// ===== MESSAGE SYSTEM =====
function addMessage(text) {
    game.messages.unshift(text);
    if (game.messages.length > 5) {
        game.messages = game.messages.slice(0, 5);
    }
}

// ===== COMBAT =====
function attack(attacker, defender, attackerName, defenderName) {
    const damage = attacker.attack + ROT.RNG.getUniformInt(-2, 2);
    defender.hp -= damage;

    addMessage(`${attackerName} hits ${defenderName} for ${damage} damage!`);

    if (defender.hp <= 0) {
        return true; // Defender died
    }
    return false;
}

// ===== PLAYER ACTIONS =====
function movePlayer(dx, dy) {
    if (game.gameOver || game.victory) return;

    const newX = player.x + dx;
    const newY = player.y + dy;
    const key = newX + "," + newY;

    // Check if move is valid
    if (!game.map[key]) return; // Wall

    // Check for enemy collision
    const enemy = entities.enemies.find(e => e.x === newX && e.y === newY);
    if (enemy) {
        // Attack enemy
        const killed = attack(player, enemy, "You", `the ${enemy.type}`);

        if (killed) {
            addMessage(`You killed the ${enemy.type}!`);
            player.gold += enemy.xp;
            entities.enemies = entities.enemies.filter(e => e !== enemy);
        }

        enemyTurn();
        draw();
        return;
    }

    // Move player
    player.x = newX;
    player.y = newY;

    // Check for item pickup
    const item = entities.items.find(i => i.x === newX && i.y === newY);
    if (item) {
        if (item.type === 'potion') {
            player.potions++;
            addMessage("Found a health potion! Press 'h' to use.");
            entities.items = entities.items.filter(i => i !== item);
        } else if (item.type === 'gold') {
            const amount = 10 + ROT.RNG.getUniformInt(0, 20);
            player.gold += amount;
            addMessage(`Found ${amount} gold!`);
            entities.items = entities.items.filter(i => i !== item);
        } else if (item.type === 'stairs') {
            descendStairs();
            return;
        }
    }

    enemyTurn();
    draw();
}

function usePotion() {
    if (game.gameOver || game.victory) return;
    if (player.potions <= 0) {
        addMessage("No potions to use!");
        return;
    }

    if (player.hp >= player.maxHp) {
        addMessage("Already at full health!");
        return;
    }

    player.potions--;
    const healAmount = 20;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    addMessage(`Used potion! Healed ${healAmount} HP.`);

    enemyTurn();
    draw();
}

function descendStairs() {
    if (game.currentLevel >= MAX_LEVELS) {
        game.victory = true;
        addMessage("=== VICTORY! ===");
        addMessage("You escaped the dungeon!");
        draw();
    } else {
        game.currentLevel++;
        initLevel();
        draw();
    }
}

// ===== ENEMY AI =====
function enemyTurn() {
    for (let enemy of entities.enemies) {
        // Simple AI: move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        // Check if adjacent to player
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
            // Attack player
            const killed = attack(enemy, player, `The ${enemy.type}`, "you");

            if (killed) {
                game.gameOver = true;
                addMessage("=== GAME OVER ===");
                addMessage("You died! Press R to restart.");
                return;
            }
        } else {
            // Move towards player
            const moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            const moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

            // Try to move (don't move into walls or other enemies)
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            const key = newX + "," + newY;

            if (game.map[key] && !entities.enemies.some(e => e.x === newX && e.y === newY && e !== enemy)) {
                enemy.x = newX;
                enemy.y = newY;
            }
        }
    }
}

// ===== RENDERING =====
function draw() {
    display.clear();

    // Draw map
    for (let key in game.map) {
        const parts = key.split(",");
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        display.draw(x, y, ".", "#666");
    }

    // Draw items
    for (let item of entities.items) {
        let char, color;
        if (item.type === 'potion') {
            char = '!';
            color = '#ff00ff';
        } else if (item.type === 'gold') {
            char = '$';
            color = '#ffd700';
        } else if (item.type === 'stairs') {
            char = '>';
            color = '#00ffff';
        }
        display.draw(item.x, item.y, char, color);
    }

    // Draw enemies
    for (let enemy of entities.enemies) {
        const template = ENEMY_TYPES[enemy.type];
        display.draw(enemy.x, enemy.y, template.char, template.color);
    }

    // Draw player
    const playerColor = player.hp < player.maxHp * 0.3 ? '#ff0000' : '#ffff00';
    display.draw(player.x, player.y, "@", playerColor);

    // Draw UI
    drawUI();
}

function drawUI() {
    const ui = document.getElementById('ui');

    // Health bar
    const healthPercent = (player.hp / player.maxHp) * 100;
    const healthColor = healthPercent > 50 ? '#0f0' : (healthPercent > 25 ? '#ff0' : '#f00');

    let html = `
        <div class="stat-bar">
            <div class="label">HP:</div>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${healthPercent}%; background-color: ${healthColor}"></div>
            </div>
            <div class="value">${player.hp}/${player.maxHp}</div>
        </div>

        <div class="stats">
            <span>Level: ${game.currentLevel}/${MAX_LEVELS}</span>
            <span>ATK: ${player.attack}</span>
            <span>Gold: ${player.gold}</span>
            <span>Potions: ${player.potions}</span>
        </div>

        <div class="messages">
            ${game.messages.map(m => `<div>${m}</div>`).join('')}
        </div>
    `;

    if (game.gameOver) {
        html += `<div class="game-over">GAME OVER - Press R to Restart</div>`;
    } else if (game.victory) {
        html += `<div class="victory">VICTORY! Final Score: ${player.gold}</div>`;
    }

    ui.innerHTML = html;
}

// ===== INPUT HANDLING =====
function handleKey(code) {
    if (code === "KeyR" && (game.gameOver || game.victory)) {
        restartGame();
        return;
    }

    if (game.gameOver || game.victory) return;

    switch (code) {
        case "ArrowUp":
        case "KeyW":
        case "Numpad8":
        case "Digit8":
            movePlayer(0, -1);
            break;
        case "ArrowDown":
        case "KeyS":
        case "Numpad2":
        case "Digit2":
            movePlayer(0, 1);
            break;
        case "ArrowLeft":
        case "KeyA":
        case "Numpad4":
        case "Digit4":
            movePlayer(-1, 0);
            break;
        case "ArrowRight":
        case "KeyD":
        case "Numpad6":
        case "Digit6":
            movePlayer(1, 0);
            break;
        case "KeyH":
        case "Digit5":
        case "Numpad5":
            usePotion();
            break;
    }
}

// ===== ANDROID KEYBOARD SUPPORT =====
const canvas = display.getContainer();
const keyboardProxy = document.getElementById('keyboard-proxy');

// Focus the hidden input when the canvas is tapped/clicked
canvas.addEventListener('click', () => {
    keyboardProxy.focus();
});

canvas.addEventListener('touchstart', () => {
    keyboardProxy.focus();
}, { passive: true });

// Listen for keyboard events on both document and the proxy input
document.addEventListener('keydown', (e) => {
    // Prevent default browser actions (like scrolling with arrow keys)
    e.preventDefault();

    // Handle the key press
    handleKey(e.code);
});

// Handle input directly from keyboard proxy for Android
keyboardProxy.addEventListener('input', (e) => {
    const key = e.data;
    if (key) {
        switch(key) {
            case '2':
                movePlayer(0, -1);
                break;
            case '8':
                movePlayer(0, 1);
                break;
            case '4':
                movePlayer(-1, 0);
                break;
            case '6':
                movePlayer(1, 0);
                break;
            case '5':
                usePotion();
                break;
            case 'r':
            case 'R':
                if (game.gameOver || game.victory) {
                    restartGame();
                }
                break;
        }
    }
    // Clear the input to prevent autocomplete
    keyboardProxy.value = '';
    e.preventDefault();
});

// Also handle keydown on the proxy
keyboardProxy.addEventListener('keydown', (e) => {
    e.preventDefault();
    handleKey(e.code);
    keyboardProxy.value = '';
});

// ===== GAME INITIALIZATION =====
function restartGame() {
    game = {
        currentLevel: 1,
        gameOver: false,
        victory: false,
        messages: [],
        map: {},
        freeSpaces: []
    };

    player = {
        x: 0,
        y: 0,
        hp: 50,
        maxHp: 50,
        attack: 8,
        gold: 0,
        potions: 0
    };

    entities = {
        enemies: [],
        items: []
    };

    initLevel();
    draw();
}

// Start the game!
restartGame();
