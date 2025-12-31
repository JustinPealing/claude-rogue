# DUNGEON ESCAPE

A complete roguelike game created for a game jam! Escape from a 5-level procedurally generated dungeon filled with monsters, treasure, and danger.

## How to Play

Simply open `index.html` in a web browser to start playing!

## Game Overview

You're trapped in a dangerous dungeon. Fight your way through 5 increasingly difficult levels, collect gold and potions, and find the stairs to escape!

## Controls

**Desktop:**
- Arrow Keys or WASD: Move and attack (cardinal directions)
- Q/E/Z/C: Diagonal movement (Q=NW, E=NE, Z=SW, C=SE)
- Numpad: Full 8-directional movement (7,8,9 / 4,5,6 / 1,2,3)
- H or 5: Use health potion
- R: Restart game (when dead or victorious)

**Mobile:**
- Tap the game to show keyboard
- Numpad: 7,9,1,3 for diagonal movement
- 2,8,4,6 for cardinal movement
- Q/E/Z/C keys also work for diagonal
- 5 or H: Use Potion

## Game Mechanics

### Combat
- Bump into enemies to attack them
- Turn-based: each move triggers enemy movement and attacks
- Damage has random variance (-2 to +2 from base attack)

### Enemies
- **Goblin (g)**: Weak but numerous - 15 HP, 3 ATK
- **Orc (o)**: Moderate threat - 25 HP, 5 ATK
- **Troll (T)**: Powerful foe - 40 HP, 8 ATK

Enemy difficulty scales with dungeon level!

### Items
- **Health Potion (!)**: Restores 20 HP when used with 'H' key
- **Gold ($)**: Collect for score (10-30 gold per pile)
- **Stairs (>)**: Walk onto them to descend to the next level

### Victory Condition
Reach the stairs on Level 5 to escape and win!

### Permadeath
When you die, the game is over. Press R to start a new run!

## Features

- Procedurally generated dungeons using ROT.js
- **Field of View (FOV) system** - Explore the darkness! Only see what's in your light radius
- **8-directional movement** - Move diagonally for tactical positioning
- Turn-based tactical combat
- 3 enemy types with AI that hunts the player
- Health potions for strategic healing
- Progressive difficulty across 5 levels
- **Dynamic lighting** - Unexplored areas are dark, explored areas are dim, visible areas are bright
- Clean UI with health bar, stats, and message log
- Full keyboard and mobile support
- Auto-save functionality

## Technologies

- ROT.js - Roguelike toolkit for dungeon generation
- Vanilla JavaScript
- HTML5 Canvas

## Game Jam Scope

This game was designed to be a complete, well-rounded roguelike experience that could be built in an evening, perfect for a game jam!

**Core Features:**
- ✓ Procedural generation
- ✓ Turn-based gameplay
- ✓ Combat system
- ✓ Multiple enemy types
- ✓ Items and inventory
- ✓ Victory and lose conditions
- ✓ Progressive difficulty
- ✓ Clean UI

## License

MIT
