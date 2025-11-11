# Project Overview

This is a web-based arcade game project for the Platanus Hack 25 challenge. The goal is to build a game using **Phaser 3** in pure, vanilla JavaScript. The entire game logic is contained within the `game.js` file.

The project is set up with a Vite development server that provides live feedback on challenge restrictions, such as code size and syntax rules.

**Key Technologies:**
- **Game Engine:** Phaser 3 (v3.87.0), loaded externally via a CDN.
- **Language:** Vanilla JavaScript (ES6+). No modules (`import`/`export`) are allowed in the final game code.
- **Development Server:** Vite with a custom plugin for live restriction checking.
- **Package Manager:** pnpm

# Key Files

- **`game.js`**: This is the main and **only file you should edit** to build the game. It contains the complete game logic, including all Phaser scenes.
- **`metadata.json`**: Contains the metadata for your game, such as the name and description. You should update this file.
- **`cover.png`**: An 800x600 pixel cover image for your game. You must replace the default image with your own.
- **`index.html`**: The main HTML file that loads Phaser and `game.js`. You should not need to edit this.
- **`vite.config.ts`**: Vite configuration. It includes a custom plugin to enforce the challenge's rules during development.

# Building and Running

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Run the Development Server:**
    ```bash
    pnpm dev
    ```
    This will start a server at `http://localhost:3000`. The server will automatically reload when you make changes to `game.js` and will print restriction check results to the console.

# Development Conventions

- **Single File:** All your game code must reside in `game.js`.
- **No Modules:** Do not use `import` or `require` statements in `game.js`. Phaser is available globally as `Phaser`.
- **Stateless:** The game runs in a sandboxed environment. No network requests (`fetch`, `XMLHttpRequest`) or external URLs are allowed.
- **Size Limit:** The final `game.js` file must be under 50KB. The dev server will show the current size.
- **Controls:** The game should be controlled via the arcade button mappings defined in `ARCADE_CONTROLS` at the top of `game.js`. These are mapped to keyboard keys for local development.
