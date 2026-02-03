# Copilot Instructions for arseneferret Portfolio

## Project Overview
This is a minimal portfolio website showcasing projects with a modal overlay image viewer. The site uses vanilla HTML, CSS, and JavaScript without external dependencies or build tools.

**Key Files:**
- `index.html` - Portfolio structure with project links
- `style.css` - Styling with CSS variables, overlay modal, and glitch animation
- `script.js` - Event handling for project image display
- `images/` - Directory for project images (e.g., `creepy1.png`)

## Architecture & Data Flow
1. **Project Links** → User clicks `.project-link` element with `data-image` attribute
2. **Event Handler** → `script.js` listener extracts image path and updates overlay
3. **Modal Display** → Overlay becomes visible via `.active` class (display: none → flex)
4. **Auto-Hide** → setTimeout removes `.active` class after 1500ms

## Known Issues & Bugs to Fix
When modifying this codebase, be aware of existing bugs:

- **script.js line 2**: `getElementByID` should be `getElementById` (wrong case)
- **script.js line 10**: `setTimeout() => {` should be `setTimeout(() => {` (syntax error)
- **style.css line 14**: `font: size` should be `font-size` (invalid syntax)
- **style.css line 15**: `font: weight` should be `font-weight` (invalid syntax)
- **style.css line 34**: `background: rgba (O,0,0,0.9)` has letter `O` instead of `0`
- **style.css line 41**: Missing semicolon after `300px`
- **index.html line 13**: Malformed closing tag structure and duplicate `<h1>` with unclosed bracket
- **index.html line 27**: Script tag has `src="script.js"` but should be `<script src="script.js"></script>`

## Coding Conventions
- **CSS Variables**: Uses `var(--text)` and `var(--accent)` for theming (currently undefined in CSS)
- **DOM Selectors**: Relies on class and ID selectors (`.project-link`, `#overlay`)
- **Event Pattern**: Single event listener on link click with `data-*` attributes for configuration
- **Data Attributes**: Image paths stored as `data-image="images/filename.png"`

## Development Notes
- No build process, CSS preprocessor, or bundler - all vanilla code
- Styling follows flexbox for overlay modal centering
- Animation uses `@keyframes glitch` for green text effect (hacker aesthetic)
- Portfolio currently has one incomplete project entry
