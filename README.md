# Obsidian Zone Scroll Zoom

[简体中文](README.zh-CN.md) | English

An Obsidian plugin that scales the interface and font with keyboard shortcuts, where the zoom behavior adapts to your mouse position.

![Demo](assets/demo.gif)

## Features

- **Shortcut Zoom**: Use keyboard shortcuts to zoom in different areas (default: Ctrl + Scroll Wheel).
- **Zone-Based Zooming**:
  - **Mouse in Editor Area**: Zooms the **editor font size**.
  - **Mouse in Non-Editor Area**: Zooms the **entire Obsidian interface** (including sidebar, menus).
- **Real-time Status Display**: A clean **OSD indicator** appears at the top of the screen, showing the current scale/font size in real time.
- **Customizable Settings**: Adjust zoom precision in settings, modify shortcuts (supports Ctrl/Cmd, Shift, Alt). Personal settings are automatically saved to `data.json`.
- **Multi-language Support**: Supports Simplified Chinese and English. Switch languages in settings or follow Obsidian's system language.
- **Reset Zoom Ratio**: A button in the settings page to quickly restore default font size (16px) or interface scale (100%).

## Why Use This Plugin?

Obsidian natively supports zooming the interface with `Ctrl + =` and `Ctrl + -`, but this is a **global zoom** — the editor and interface scale together, with no way to adjust font size independently.

This plugin lets you **zoom where your mouse is** — scale only the font in the editor area, and zoom the interface elsewhere. Just scroll, and it's done. Faster and more convenient.

## Installation

#### Manual Installation (This plugin is not yet available in the Obsidian community plugin marketplace)
1. Download `main.js` and `manifest.json` from [releases/latest](https://github.com/kqint/obsidian-zone-scroll-zoom/releases/latest).
2. Create an `obsidian-zone-scroll-zoom` folder inside `.obsidian/plugins/`, and place `main.js` and `manifest.json` into this folder.
3. Enable the plugin in Obsidian settings.

## Internationalization

Language source files are located in `locales/`:

- `locales/en.json`
- `locales/zh-CN.json`

Use the following command to bundle these language files into `main.js`:

```bash
npm run build
```

To add a new language:

1. Copy `locales/en.json`, for example to `locales/ja.json`.
2. Translate all values.
3. Add the corresponding language option in `src/main.ts` and run `npm run build`.

## License

[MIT License](LICENSE)