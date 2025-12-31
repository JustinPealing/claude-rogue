// Create a display
const display = new ROT.Display({
    width: 40,
    height: 20,
    fontSize: 16
});

// Add it to the page
document.getElementById('game').appendChild(display.getContainer());

// Player state
const centerX = Math.floor(display._options.width / 2);
const centerY = Math.floor(display._options.height / 2);

let player = {
    x: centerX,
    y: centerY + 2
};

// Function to draw the entire game
function drawGame() {
    display.clear();

    // Draw "Hello World" in the center
    display.drawText(centerX - 5, centerY, "Hello World!");

    // Draw a simple border
    for (let x = 0; x < display._options.width; x++) {
        display.draw(x, 0, "#", "#0f0");
        display.draw(x, display._options.height - 1, "#", "#0f0");
    }

    for (let y = 0; y < display._options.height; y++) {
        display.draw(0, y, "#", "#0f0");
        display.draw(display._options.width - 1, y, "#", "#0f0");
    }

    // Draw the player @ symbol
    display.draw(player.x, player.y, "@", "#ff0");
}

// Function to move player
function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    // Check boundaries (don't allow moving into walls)
    if (newX > 0 && newX < display._options.width - 1 &&
        newY > 0 && newY < display._options.height - 1) {
        player.x = newX;
        player.y = newY;
        drawGame();
    }
}

// Get the mobile input element
const mobileInput = document.getElementById('mobileInput');

// Handle keyboard input for mobile
mobileInput.addEventListener('keydown', function(e) {
    // Handle movement keys: 2=up, 8=down, 4=left, 6=right
    switch(e.key) {
        case '2':
            movePlayer(0, -1); // Up
            break;
        case '8':
            movePlayer(0, 1);  // Down
            break;
        case '4':
            movePlayer(-1, 0); // Left
            break;
        case '6':
            movePlayer(1, 0);  // Right
            break;
    }

    // Clear input to prevent number buildup
    e.preventDefault();
    this.value = '';
});

// Keep input focused to maintain keyboard visibility
mobileInput.addEventListener('blur', function() {
    setTimeout(() => this.focus(), 0);
});

// Initial draw
drawGame();

// Auto-focus the input on page load
setTimeout(() => mobileInput.focus(), 100);

console.log("ROT.js loaded successfully!");
console.log("Mobile controls initialized! Use 2, 4, 8, 6 to move.");
