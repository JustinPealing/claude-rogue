# Development Instructions for Claude

## Testing & Verification

### Always Update Title for Testing
When making changes to the web game, **always update the `<title>` tag in `index.html`** to verify that:
- Changes are being deployed correctly
- Browser cache is refreshed
- The user sees the latest version

Example:
```html
<!-- Update version number or add descriptive text -->
<title>Dungeon Escape - v1.2 (Latest Fix)</title>
```

This helps confirm that the page has been properly refreshed on mobile/desktop browsers.

## Android Keyboard Support

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
   - **Input event listener**: Captures typed characters (2, 4, 8, 6, 5)
   - **Keydown event listener**: Captures key codes for broader compatibility
   - Value cleared immediately after each keystroke

### Mobile Controls
- **2** = Move Up
- **8** = Move Down
- **4** = Move Left
- **6** = Move Right
- **5** = Use Potion
- **R** = Restart

### Desktop Controls
- Arrow Keys or WASD for movement
- H or 5 for potion
- R for restart

## Best Practices

1. **Never remove the keyboard proxy** - it's essential for Android support
2. **Keep autocomplete disabled** - prevents Android from interfering
3. **Clear input value immediately** - prevents autocomplete suggestions
4. **Test on actual Android devices** - emulators don't always match real behavior
5. **Update title when deploying** - helps verify cache refresh
