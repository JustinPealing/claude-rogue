# DUNGEON ESCAPE

A complete roguelike game created for a game jam! Escape from a 5-level procedurally generated dungeon filled with monsters, treasure, and danger.

## How to Play

Simply open `index.html` in a web browser to start playing!

## Game Overview

You're trapped in a dangerous dungeon. Fight your way through 5 increasingly difficult levels, collect gold and potions, and find the stairs to escape!

## Controls

**Desktop:**
- Arrow Keys or WASD: Move and attack
- H: Use health potion
- R: Restart game (when dead or victorious)

**Mobile:**
- 2: Move Up
- 8: Move Down
- 4: Move Left
- 6: Move Right
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
- Turn-based tactical combat
- 3 enemy types with AI that hunts the player
- Health potions for strategic healing
- Progressive difficulty across 5 levels
- Clean UI with health bar, stats, and message log
- Full keyboard and mobile support

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
