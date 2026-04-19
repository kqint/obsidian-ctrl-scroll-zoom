# Obsidian Zone Scroll Zoom

[简体中文](README-zh.md) | English

An Obsidian plugin that scales the interface and font with keyboard shortcuts, where the zoom behavior adapts to your mouse position.

## Features

- **Shortcut Zoom**: Use keyboard shortcuts to zoom in different areas (default: Ctrl + Scroll Wheel).
- **Zone-Based Zooming**:
  - **Mouse in Editor Area**: Zooms the **editor font size**.
  - **Mouse in Non-Editor Area**: Zooms the **entire Obsidian interface** (including sidebar, menus).
- **Real-time Status Display**: A clean **OSD indicator** appears at the top of the screen, showing the current scale/font size in real time.
- **Customizable Settings**: Adjust zoom precision in settings, modify shortcuts (supports Ctrl/Cmd, Shift, Alt). Personal settings are automatically saved to `data.json`.
- **Reset Zoom Ratio**: A button in the settings page to quickly restore default font size (16px) or interface scale (100%).

## Why Use This Plugin?

Obsidian natively supports zooming the interface with `Ctrl + =` and `Ctrl + -`, but this is a **global zoom** — the editor and interface scale together, with no way to adjust font size independently.

This plugin lets you **zoom where your mouse is** — scale only the font in the editor area, and zoom the interface elsewhere. Just scroll, and it's done. Faster and more convenient.

## Installation

#### Manual Installation (This plugin is not yet available in the Obsidian community plugin marketplace)
1. Create an `obsidian-zone-scroll-zoom` folder inside `.obsidian/plugins/`.
2. Download [main.js](main.js) and [manifest.json](manifest.json) and place them into this folder.
3. Enable the plugin in Obsidian settings.

## License

[MIT License](LICENSE)