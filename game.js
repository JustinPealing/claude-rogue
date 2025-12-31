// ===== GAME CONSTANTS =====
const WIDTH = 50;
const HEIGHT = 25;
const MAX_LEVELS = 5;

// Responsive font size
const isMobile = window.innerWidth <= 768;
const fontSize = isMobile ? 8 : 14;

// Enemy templates
const ENEMY_TYPES = {
    goblin: {
        char: 'g',
        color: '#8b4513',
        hp: 15,
        attack: 3,
        xp: 10,
        description: 'A small, cunning goblin. Weak but numerous.'
    },
    orc: {
        char: 'o',
        color: '#ff4444',
        hp: 25,
        attack: 5,
        xp: 20,
        description: 'A brutal orc warrior. Strong and aggressive.'
    },
    troll: {
        char: 'T',
        color: '#ff00ff',
        hp: 40,
        attack: 8,
        xp: 35,
        description: 'A massive troll. Very dangerous and tough to kill.'
    }
};

// ===== GAME STATE =====
let game = {
    currentLevel: 1,
    gameOver: false,
    victory: false,
    messages: [],
    map: {},
    freeSpaces: [],
    explored: new Set(), // Tracks explored tiles
    visible: new Set(),  // Tracks currently visible tiles
    lookMode: false,     // Whether look mode is active
    lookX: 0,            // X position of look cursor
    lookY: 0             // Y position of look cursor
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

// ===== FOV SYSTEM =====
const FOV_RADIUS = 8; // How far the player can see
let fov = null; // Will be initialized with the map

function initFOV() {
    fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
        const key = x + "," + y;
        return game.map[key] === "floor"; // Light passes through floors, not walls
    });
}

function computeFOV() {
    game.visible.clear();

    fov.compute(player.x, player.y, FOV_RADIUS, (x, y, r, visibility) => {
        const key = x + "," + y;
        game.visible.add(key);
        game.explored.add(key); // Mark as explored when seen
    });
}

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

    // Initialize FOV system for this level
    game.explored.clear();
    game.visible.clear();
    initFOV();
    computeFOV();

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

// ===== LOOK SYSTEM =====
function getTileDescription(x, y) {
    const key = x + "," + y;

    // Check if tile is visible or explored
    const isVisible = game.visible.has(key);
    const isExplored = game.explored.has(key);

    if (!isVisible && !isExplored) {
        return "You haven't explored this area yet.";
    }

    // Check if it's a wall
    if (!game.map[key]) {
        return "A solid stone wall.";
    }

    // Check for enemies (only if visible)
    if (isVisible) {
        const enemy = entities.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            const template = ENEMY_TYPES[enemy.type];
            return `${enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1)} (${enemy.hp}/${enemy.maxHp} HP) - ${template.description}`;
        }
    }

    // Check for items
    const item = entities.items.find(i => i.x === x && i.y === y);
    if (item) {
        if (item.type === 'potion') {
            return "A health potion. Restores 20 HP when used.";
        } else if (item.type === 'gold') {
            return "A pile of gold coins. Valuable treasure!";
        } else if (item.type === 'stairs') {
            return "Stairs leading deeper into the dungeon.";
        }
    }

    // Check if it's the player
    if (x === player.x && y === player.y) {
        return `You (${player.hp}/${player.maxHp} HP, ${player.attack} ATK)`;
    }

    // Just an empty floor
    return isVisible ? "An empty stone floor." : "An empty stone floor (remembered).";
}

function toggleLookMode() {
    game.lookMode = !game.lookMode;

    if (game.lookMode) {
        // Start looking at player position
        game.lookX = player.x;
        game.lookY = player.y;
        addMessage("Look mode: Use movement keys to look around. Press L or ESC to exit.");
    } else {
        addMessage("Look mode off.");
    }

    draw();
}

function moveLookCursor(dx, dy) {
    const newX = game.lookX + dx;
    const newY = game.lookY + dy;

    // Allow looking anywhere on the map
    if (newX >= 0 && newX < WIDTH && newY >= 0 && newY < HEIGHT) {
        game.lookX = newX;
        game.lookY = newY;
        draw();
    }
}

// ===== SAVE/LOAD SYSTEM =====
function saveGame() {
    const saveData = {
        game: {
            currentLevel: game.currentLevel,
            gameOver: game.gameOver,
            victory: game.victory,
            messages: game.messages,
            map: game.map,
            explored: Array.from(game.explored), // Convert Set to Array
            visible: Array.from(game.visible)
        },
        player: {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            attack: player.attack,
            gold: player.gold,
            potions: player.potions
        },
        entities: {
            enemies: entities.enemies,
            items: entities.items
        }
    };

    localStorage.setItem('roguelikeSave', JSON.stringify(saveData));
}

function loadGame() {
    const saveData = localStorage.getItem('roguelikeSave');
    if (!saveData) return false;

    try {
        const data = JSON.parse(saveData);

        // Restore game state
        game.currentLevel = data.game.currentLevel;
        game.gameOver = data.game.gameOver;
        game.victory = data.game.victory;
        game.messages = data.game.messages;
        game.map = data.game.map;

        // Restore FOV data (convert Arrays back to Sets)
        game.explored = new Set(data.game.explored || []);
        game.visible = new Set(data.game.visible || []);

        // Restore player state
        player.x = data.player.x;
        player.y = data.player.y;
        player.hp = data.player.hp;
        player.maxHp = data.player.maxHp;
        player.attack = data.player.attack;
        player.gold = data.player.gold;
        player.potions = data.player.potions;

        // Restore entities
        entities.enemies = data.entities.enemies;
        entities.items = data.entities.items;

        // Reinitialize FOV after loading
        initFOV();
        computeFOV();

        return true;
    } catch (e) {
        console.error('Failed to load save data:', e);
        return false;
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
        saveGame();
        return;
    }

    // Move player
    player.x = newX;
    player.y = newY;

    // Recompute FOV from new position
    computeFOV();

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
    saveGame();
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
    saveGame();
}

function descendStairs() {
    if (game.currentLevel >= MAX_LEVELS) {
        game.victory = true;
        addMessage("=== VICTORY! ===");
        addMessage("You escaped the dungeon!");
        draw();
        saveGame();
    } else {
        game.currentLevel++;
        initLevel();
        draw();
        saveGame();
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
                saveGame();
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

    // Draw map with FOV
    for (let key in game.map) {
        const parts = key.split(",");
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);

        const isVisible = game.visible.has(key);
        const isExplored = game.explored.has(key);

        if (isVisible) {
            // Visible tiles - full brightness
            display.draw(x, y, ".", "#666");
        } else if (isExplored) {
            // Explored but not visible - dim
            display.draw(x, y, ".", "#222");
        }
        // Unexplored tiles are not drawn (stay black)
    }

    // Draw items (shown if visible OR explored, but dimmed if not currently visible)
    for (let item of entities.items) {
        const key = item.x + "," + item.y;
        const isVisible = game.visible.has(key);
        const isExplored = game.explored.has(key);

        if (!isVisible && !isExplored) continue; // Skip if never seen

        let char, color;
        if (item.type === 'potion') {
            char = '!';
            color = isVisible ? '#ff00ff' : '#660066'; // Dim magenta when not visible
        } else if (item.type === 'gold') {
            char = '$';
            color = isVisible ? '#ffd700' : '#665500'; // Dim gold when not visible
        } else if (item.type === 'stairs') {
            char = '>';
            color = isVisible ? '#00ffff' : '#006666'; // Dim cyan when not visible
        }
        display.draw(item.x, item.y, char, color);
    }

    // Draw enemies (only if visible)
    for (let enemy of entities.enemies) {
        const key = enemy.x + "," + enemy.y;
        if (!game.visible.has(key)) continue;

        const template = ENEMY_TYPES[enemy.type];
        display.draw(enemy.x, enemy.y, template.char, template.color);
    }

    // Draw player (always visible)
    const playerColor = player.hp < player.maxHp * 0.3 ? '#ff0000' : '#ffff00';
    display.draw(player.x, player.y, "@", playerColor);

    // Draw look cursor if in look mode
    if (game.lookMode) {
        display.draw(game.lookX, game.lookY, "X", "#00ff00");
    }

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

    // Show look mode description
    if (game.lookMode) {
        const description = getTileDescription(game.lookX, game.lookY);
        html += `<div class="look-mode"><strong>[LOOK MODE]</strong><br>${description}</div>`;
    }

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

    // Toggle look mode with L key
    if (code === "KeyL") {
        toggleLookMode();
        return;
    }

    // Exit look mode with ESC
    if (code === "Escape" && game.lookMode) {
        toggleLookMode();
        return;
    }

    // In look mode, movement keys move the cursor instead of the player
    if (game.lookMode) {
        switch (code) {
            // Vertical movement
            case "ArrowUp":
            case "KeyW":
            case "Numpad2":
            case "Digit2":
                moveLookCursor(0, -1); // Up
                break;
            case "ArrowDown":
            case "KeyS":
            case "Numpad8":
            case "Digit8":
                moveLookCursor(0, 1); // Down
                break;
            // Horizontal movement
            case "ArrowLeft":
            case "KeyA":
            case "Numpad4":
            case "Digit4":
                moveLookCursor(-1, 0); // Left
                break;
            case "ArrowRight":
            case "KeyD":
            case "Numpad6":
            case "Digit6":
                moveLookCursor(1, 0); // Right
                break;
            // Diagonal movement (phone layout: 1-2-3 top, 7-8-9 bottom)
            case "KeyQ":
            case "Numpad1":
            case "Digit1":
                moveLookCursor(-1, -1); // Northwest (1 = up-left)
                break;
            case "KeyE":
            case "Numpad3":
            case "Digit3":
                moveLookCursor(1, -1); // Northeast (3 = up-right)
                break;
            case "KeyZ":
            case "Numpad7":
            case "Digit7":
                moveLookCursor(-1, 1); // Southwest (7 = down-left)
                break;
            case "KeyC":
            case "Numpad9":
            case "Digit9":
                moveLookCursor(1, 1); // Southeast (9 = down-right)
                break;
        }
        return;
    }

    // Normal game mode - move player
    switch (code) {
        // Vertical movement
        case "ArrowUp":
        case "KeyW":
        case "Numpad2":
        case "Digit2":
            movePlayer(0, -1); // Up
            break;
        case "ArrowDown":
        case "KeyS":
        case "Numpad8":
        case "Digit8":
            movePlayer(0, 1); // Down
            break;
        // Horizontal movement
        case "ArrowLeft":
        case "KeyA":
        case "Numpad4":
        case "Digit4":
            movePlayer(-1, 0); // Left
            break;
        case "ArrowRight":
        case "KeyD":
        case "Numpad6":
        case "Digit6":
            movePlayer(1, 0); // Right
            break;
        // Diagonal movement (phone layout: 1-2-3 top, 7-8-9 bottom)
        case "KeyQ":
        case "Numpad1":
        case "Digit1":
            movePlayer(-1, -1); // Northwest (1 = up-left)
            break;
        case "KeyE":
        case "Numpad3":
        case "Digit3":
            movePlayer(1, -1); // Northeast (3 = up-right)
            break;
        case "KeyZ":
        case "Numpad7":
        case "Digit7":
            movePlayer(-1, 1); // Southwest (7 = down-left)
            break;
        case "KeyC":
        case "Numpad9":
        case "Digit9":
            movePlayer(1, 1); // Southeast (9 = down-right)
            break;
        // Use potion
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
    const key = e.data || keyboardProxy.value;

    if (key) {
        const char = key.charAt(key.length - 1); // Get last character

        // Toggle look mode
        if (char === 'l' || char === 'L') {
            toggleLookMode();
        }
        // In look mode, use movement for cursor
        else if (game.lookMode) {
            switch(char) {
                case '2':
                    moveLookCursor(0, -1); // Up
                    break;
                case '8':
                    moveLookCursor(0, 1); // Down
                    break;
                case '4':
                    moveLookCursor(-1, 0); // Left
                    break;
                case '6':
                    moveLookCursor(1, 0); // Right
                    break;
                case '1':
                    moveLookCursor(-1, -1); // Northwest (up-left)
                    break;
                case '3':
                    moveLookCursor(1, -1); // Northeast (up-right)
                    break;
                case '7':
                    moveLookCursor(-1, 1); // Southwest (down-left)
                    break;
                case '9':
                    moveLookCursor(1, 1); // Southeast (down-right)
                    break;
                case 'q':
                case 'Q':
                    moveLookCursor(-1, -1); // Northwest
                    break;
                case 'e':
                case 'E':
                    moveLookCursor(1, -1); // Northeast
                    break;
                case 'z':
                case 'Z':
                    moveLookCursor(-1, 1); // Southwest
                    break;
                case 'c':
                case 'C':
                    moveLookCursor(1, 1); // Southeast
                    break;
            }
        }
        // Normal game mode
        else {
            switch(char) {
                // Vertical movement (phone layout: 2 at top = up, 8 at bottom = down)
                case '2':
                    movePlayer(0, -1); // Up
                    break;
                case '8':
                    movePlayer(0, 1); // Down
                    break;
                // Horizontal movement
                case '4':
                    movePlayer(-1, 0); // Left
                    break;
                case '6':
                    movePlayer(1, 0); // Right
                    break;
                // Diagonal movement (phone layout: 1-2-3 at top, 7-8-9 at bottom)
                case '1':
                    movePlayer(-1, -1); // Northwest (up-left)
                    break;
                case '3':
                    movePlayer(1, -1); // Northeast (up-right)
                    break;
                case '7':
                    movePlayer(-1, 1); // Southwest (down-left)
                    break;
                case '9':
                    movePlayer(1, 1); // Southeast (down-right)
                    break;
                // Q/E/Z/C letter keys (secondary controls)
                case 'q':
                case 'Q':
                    movePlayer(-1, -1); // Northwest
                    break;
                case 'e':
                case 'E':
                    movePlayer(1, -1); // Northeast
                    break;
                case 'z':
                case 'Z':
                    movePlayer(-1, 1); // Southwest
                    break;
                case 'c':
                case 'C':
                    movePlayer(1, 1); // Southeast
                    break;
                // Use potion
                case '5':
                case 'h':
                case 'H':
                    usePotion();
                    break;
                // Restart
                case 'r':
                case 'R':
                    if (game.gameOver || game.victory) {
                        restartGame();
                    }
                    break;
            }
        }
    }

    // Clear the input to prevent autocomplete
    setTimeout(() => {
        keyboardProxy.value = '';
    }, 0);
});

// Also handle keydown on the proxy
keyboardProxy.addEventListener('keydown', (e) => {
    e.preventDefault();
    handleKey(e.code);
});

// Handle keyup as well for better Android compatibility
keyboardProxy.addEventListener('keyup', (e) => {
    keyboardProxy.value = '';
});

// ===== GAME INITIALIZATION =====
function restartGame() {
    // Clear saved game
    localStorage.removeItem('roguelikeSave');

    game = {
        currentLevel: 1,
        gameOver: false,
        victory: false,
        messages: [],
        map: {},
        freeSpaces: [],
        explored: new Set(),
        visible: new Set(),
        lookMode: false,
        lookX: 0,
        lookY: 0
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
    saveGame();
}

// Start the game!
if (!loadGame()) {
    restartGame();
} else {
    draw();
}
