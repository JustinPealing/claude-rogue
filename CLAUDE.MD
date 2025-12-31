# Development Instructions for Claude

## CRITICAL: Version Number Management

### MANDATORY: Update Version for EVERY Change
**For EVERY single change you make to the game, you MUST:**

1. **Increment the version number** in both locations:
   - `<h1>` tag in `index.html` (visible on page)
   - `<title>` tag in `index.html` (browser tab)

2. **Tell the user the new version number** explicitly in your response
   - Example: "**Updated to v1.8** - Fixed diagonal movement bug"

3. **Use semantic versioning:**
   - Major features: v1.6 → v2.0
   - Minor features/improvements: v1.6 → v1.7
   - Bug fixes: v1.6 → v1.6.1

### Why This Matters
- User needs to verify they're seeing the latest changes
- Browser caching can show stale versions
- Version number is the ONLY reliable way to confirm deployment

**Example:**
```html
<!-- Update BOTH of these for EVERY change -->
<h1>DUNGEON ESCAPE - v1.7 (FOV Fixed)</h1>
<title>Dungeon Escape - v1.7 (FOV Fixed)</title>
```

### Your Response Template
When making changes, always say:
> "**Updated to v1.X** - [Brief description of change]. The version number in the title confirms you're seeing the latest version."

## Android Keyboard Support

### IMPORTANT: Primary Platform
**This game is primarily designed for Android keyboard input.**
- Numpad/digit keys (1-9) are the PRIMARY controls
- Letter keys (Q/E/Z/C, WASD) are SECONDARY convenience features
- When making control decisions, prioritize Android keyboard compatibility

### Current Implementation
The game uses a hidden keyboard proxy input to trigger the Android virtual keyboard:

1. **Hidden Input Field** (`index.html:15`)
   - Off-screen, invisible input element
   - Positioned at `-100px, -100px` with `opacity: 0`
   - Has autocomplete/autocorrect disabled

2. **Keyboard Activation** (`game.js:417-424`)
   - Canvas click/touch focuses the proxy input
   - This triggers Android virtual keyboard to appear

3. **Input Handling** (`game.js:436-473`)
   - **Input event listener**: Captures typed characters (primary for Android)
   - **Keydown event listener**: Captures key codes for desktop compatibility
   - Value cleared immediately after each keystroke

### PRIMARY Controls (Android/Numpad - Highest Priority)

**CRITICAL: Phone numpad layout has 1-2-3 at TOP (not bottom like PC numpad)**

```
Phone Numpad Layout:
┌─────┬─────┬─────┐
│  1  │  2  │  3  │  ← TOP ROW
│ ↖   │  ↑  │  ↗  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │  ← MIDDLE ROW
│  ←  │  🧪  │  →  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │  ← BOTTOM ROW
│ ↙   │  ↓  │  ↘  │
└─────┴─────┴─────┘
```

- **1** = Northwest (up-left) diagonal
- **2** = Move Up
- **3** = Northeast (up-right) diagonal
- **4** = Move Left
- **5** = Use Potion
- **6** = Move Right
- **7** = Southwest (down-left) diagonal
- **8** = Move Down
- **9** = Southeast (down-right) diagonal
- **R** = Restart

**Remember:** On phones, 2 is at the TOP so it moves UP. This is opposite of PC numpads!

### SECONDARY Controls (Desktop - Lower Priority)
- Arrow Keys or WASD for cardinal movement
- Q/E/Z/C for diagonal movement
- H for potion
- R for restart

## Best Practices

1. **Never remove the keyboard proxy** - it's essential for Android support
2. **Keep autocomplete disabled** - prevents Android from interfering
3. **Clear input value immediately** - prevents autocomplete suggestions
4. **Test on actual Android devices** - emulators don't always match real behavior
5. **Update H1 when deploying** - helps verify cache refresh (more visible than title tag)
