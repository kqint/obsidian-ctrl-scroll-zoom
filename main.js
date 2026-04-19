/* main.js */
const { Plugin, PluginSettingTab, Setting, normalizePath } = require('obsidian');
const { webFrame } = require('electron');

// 1. 定义默认配置
const DEFAULT_SETTINGS = {
    zoomStep: 0.05,
    modifierKey: 'ctrl',
    language: 'auto'
}

// 2. 自定义配置文件名
const CONFIG_FILE_NAME = "data.json";

// 3. i18n 类
class I18n {
    constructor(plugin) {
        this.plugin = plugin;
        this.lang = 'en';
        this.translations = {};
    }

    async load() {
        // 获取用户设置的语言
        let userLang = this.plugin.settings?.language || 'auto';
        
        // 如果是 auto，则使用 Obsidian 界面语言
        if (userLang === 'auto') {
            const obsidianLang = window.localStorage.getItem('language');
            userLang = obsidianLang || 'en';
        }
        
        this.lang = userLang;
        
        // 只支持 zh 和 en，其他语言默认使用 en
        if (this.lang !== 'zh' && this.lang !== 'en') {
            this.lang = 'en';
        }

        try {
            const langPath = normalizePath(`${this.plugin.manifest.dir}/languages/${this.lang}.json`);
            if (await this.plugin.app.vault.adapter.exists(langPath)) {
                const data = await this.plugin.app.vault.adapter.read(langPath);
                this.translations = JSON.parse(data);
            } else {
                // 如果语言文件不存在，使用内置默认
                this.translations = this.getDefaultTranslations();
            }
        } catch (error) {
            console.error('Failed to load language file:', error);
            this.translations = this.getDefaultTranslations();
        }
    }

    getDefaultTranslations() {
        // 内置默认英文翻译（作为回退）
        return {
            settings: {
                title: "Zone Scroll Zoom Settings",
                language: {
                    name: "Language",
                    desc: "Select the display language for this plugin. Auto will follow Obsidian's language setting.",
                    options: {
                        auto: "Auto",
                        en: "English",
                        zh: "中文"
                    }
                },
                modifierKey: {
                    name: "Modifier Key",
                    desc: "Select the modifier key combination to trigger zoom (used with scroll wheel).",
                    options: {
                        ctrl: "Ctrl / Cmd",
                        shift: "Shift",
                        alt: "Alt",
                        "ctrl+shift": "Ctrl+Shift / Cmd+Shift",
                        "ctrl+alt": "Ctrl+Alt / Cmd+Alt",
                        "shift+alt": "Shift+Alt"
                    }
                },
                zoomStep: {
                    name: "Zoom Step (Precision)",
                    desc: "The ratio of interface zoom change per scroll wheel tick.",
                    placeholder: "0.05"
                },
                currentZoom: {
                    name: "Current Interface Zoom",
                    desc: "Current: {value}%",
                    reset: "Reset to 100%",
                    resetTip: "Interface reset: 100%"
                },
                currentFontSize: {
                    name: "Current Editor Font Size",
                    desc: "Current: {value}px",
                    reset: "Reset to 16px",
                    resetTip: "Font reset: 16px"
                }
            },
            tips: {
                fontSize: "Font Size: {value}px",
                zoomLevel: "Zoom: {value}%"
            },
            console: {
                loading: "Loading Zone Scroll Zoom plugin",
                settingsLoaded: "Settings loaded from data.json",
                settingsSaved: "Settings saved to data.json",
                loadFailed: "Failed to load settings:",
                saveFailed: "Failed to save settings:"
            }
        };
    }

    t(key, vars = {}) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // 如果找不到，返回 key 本身
            }
        }
        
        if (typeof value === 'string') {
            // 替换变量，如 {value}
            return value.replace(/\{([^}]+)\}/g, (match, varName) => {
                return vars[varName] !== undefined ? vars[varName] : match;
            });
        }
        
        return key;
    }
}

module.exports = class ZoneScrollZoomPlugin extends Plugin {
    tipElement = null;
    hideTimer = null;
    settings = null;
    i18n = null;

    async onload() {
        // 先加载设置，因为 i18n 需要 language 设置
        await this.loadSettings();
        
        // 初始化 i18n
        this.i18n = new I18n(this);
        await this.i18n.load();
        
        console.log(this.i18n.t('console.loading'));

        this.addSettingTab(new ZoneScrollZoomSettingTab(this.app, this));

        this.registerDomEvent(window, 'wheel', (evt) => {
            if (this.isModifierKeyPressed(evt)) {
                evt.preventDefault();
                const target = evt.target;
                const isEditor = target.closest('.markdown-source-view') || 
                                 target.closest('.markdown-preview-view');
                if (isEditor) {
                    this.adjustEditorFontSize(evt.deltaY);
                } else {
                    this.adjustInterfaceZoom(evt.deltaY);
                }
            }
        }, { passive: false });
    }
    
    // 检查修饰键是否按下
    isModifierKeyPressed(evt) {
        const key = this.settings.modifierKey || 'ctrl';
        switch (key) {
            case 'ctrl':
                return evt.ctrlKey || evt.metaKey;
            case 'shift':
                return evt.shiftKey;
            case 'alt':
                return evt.altKey;
            case 'ctrl+shift':
                return (evt.ctrlKey || evt.metaKey) && evt.shiftKey;
            case 'ctrl+alt':
                return (evt.ctrlKey || evt.metaKey) && evt.altKey;
            case 'shift+alt':
                return evt.shiftKey && evt.altKey;
            default:
                return evt.ctrlKey || evt.metaKey;
        }
    }
    
    // 获取配置文件的完整路径
    getConfigPath() {
        return normalizePath(`${this.manifest.dir}/${CONFIG_FILE_NAME}`);
    }

    async loadSettings() {
        const path = this.getConfigPath();
        try {
            // 检查文件是否存在
            if (await this.app.vault.adapter.exists(path)) {
                // 读取文件内容
                const data = await this.app.vault.adapter.read(path);
                // 解析 JSON 并合并默认设置
                this.settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(data));
            } else {
                // 文件不存在则使用默认值
                this.settings = Object.assign({}, DEFAULT_SETTINGS);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            this.settings = Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    async saveSettings() {
        const path = this.getConfigPath();
        try {
            // 将设置对象转换为 JSON 字符串
            const jsonString = JSON.stringify(this.settings, null, 2);
            // 写入文件
            await this.app.vault.adapter.write(path, jsonString);
            if (this.i18n) {
                console.log(this.i18n.t('console.settingsSaved'));
            }
        } catch (error) {
            if (this.i18n) {
                console.error(this.i18n.t('console.saveFailed'), error);
            } else {
                console.error("Failed to save settings:", error);
            }
        }
    }
    // ============================================================

    // --- 显示实时提示 ---
    showZoomTip(text) {
        if (!this.tipElement) {
            this.tipElement = document.createElement('div');
            this.tipElement.style.cssText = `
                position: fixed;
                top: 10%; 
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.75);
                color: rgba(255, 255, 255, 0.95);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 16px;
                font-weight: bold;
                z-index: 9999;
                pointer-events: none;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
            `;
            document.body.appendChild(this.tipElement);
        }
        this.tipElement.innerText = text;
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            if (this.tipElement) {
                this.tipElement.remove();
                this.tipElement = null;
            }
        }, 800);
    }

    // --- 编辑区字体调整 ---
    adjustEditorFontSize(deltaY) {
        let currentSize = this.app.vault.getConfig('baseFontSize') || 16;
        const step = 1;
        let newSize = currentSize;
        if (deltaY < 0) newSize += step;
        else newSize -= step;
        if (newSize < 10) newSize = 10;
        if (newSize > 100) newSize = 100;
        if (newSize !== currentSize) {
            this.app.vault.setConfig('baseFontSize', newSize);
            this.app.updateFontSize();
            this.showZoomTip(this.i18n.t('tips.fontSize', { value: newSize }));
        }
    }

    // --- 界面缩放调整 ---
    adjustInterfaceZoom(deltaY) {
        let currentZoom = webFrame.getZoomFactor();
        const step = this.settings.zoomStep;
        let newZoom = currentZoom;
        if (deltaY < 0) newZoom += step;
        else newZoom -= step;
        newZoom = parseFloat(newZoom.toFixed(2));
        if (newZoom < 0.5) newZoom = 0.5;
        if (newZoom > 5.0) newZoom = 5.0;
        if (newZoom !== parseFloat(currentZoom.toFixed(2))) {
            webFrame.setZoomFactor(newZoom);
            this.showZoomTip(this.i18n.t('tips.zoomLevel', { value: Math.round(newZoom * 100) }));
        }
    }

    onunload() {
        if (this.tipElement) this.tipElement.remove();
    }
}

// --- 设置界面 ---
class ZoneScrollZoomSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        const i18n = this.plugin.i18n;
        containerEl.empty();

        containerEl.createEl('h2', { text: i18n.t('settings.title') });

        // 语言设置
        new Setting(containerEl)
            .setName(i18n.t('settings.language.name'))
            .setDesc(i18n.t('settings.language.desc'))
            .addDropdown(dropdown => dropdown
                .addOption('auto', i18n.t('settings.language.options.auto'))
                .addOption('en', i18n.t('settings.language.options.en'))
                .addOption('zh', i18n.t('settings.language.options.zh'))
                .setValue(this.plugin.settings.language)
                .onChange(async (value) => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                    // 重新加载 i18n
                    await this.plugin.i18n.load();
                    // 刷新设置界面
                    this.display();
                }));

        // 修饰键设置
        new Setting(containerEl)
            .setName(i18n.t('settings.modifierKey.name'))
            .setDesc(i18n.t('settings.modifierKey.desc'))
            .addDropdown(dropdown => dropdown
                .addOption('ctrl', i18n.t('settings.modifierKey.options.ctrl'))
                .addOption('shift', i18n.t('settings.modifierKey.options.shift'))
                .addOption('alt', i18n.t('settings.modifierKey.options.alt'))
                .addOption('ctrl+shift', i18n.t('settings.modifierKey.options.ctrl+shift'))
                .addOption('ctrl+alt', i18n.t('settings.modifierKey.options.ctrl+alt'))
                .addOption('shift+alt', i18n.t('settings.modifierKey.options.shift+alt'))
                .setValue(this.plugin.settings.modifierKey)
                .onChange(async (value) => {
                    this.plugin.settings.modifierKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(i18n.t('settings.zoomStep.name'))
            .setDesc(i18n.t('settings.zoomStep.desc'))
            .addText(text => text
                .setPlaceholder(i18n.t('settings.zoomStep.placeholder'))
                .setValue(String(this.plugin.settings.zoomStep))
                .onChange(async (value) => {
                    let val = parseFloat(value);
                    if (isNaN(val) || val <= 0) val = 0.05;
                    this.plugin.settings.zoomStep = val;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('br');

        const currentZoom = Math.round(webFrame.getZoomFactor() * 100);
        const zoomInfoSetting = new Setting(containerEl)
            .setName(i18n.t('settings.currentZoom.name'))
            .setDesc(i18n.t('settings.currentZoom.desc', { value: currentZoom }))
            .addButton(btn => btn
                .setButtonText(i18n.t('settings.currentZoom.reset'))
                .setCta()
                .onClick(async () => {
                    webFrame.setZoomFactor(1.0);
                    zoomInfoSetting.setDesc(i18n.t('settings.currentZoom.desc', { value: 100 }));
                    this.plugin.showZoomTip(i18n.t('settings.currentZoom.resetTip'));
                }));

        const currentFontSize = this.app.vault.getConfig('baseFontSize') || 16;
        const fontInfoSetting = new Setting(containerEl)
            .setName(i18n.t('settings.currentFontSize.name'))
            .setDesc(i18n.t('settings.currentFontSize.desc', { value: currentFontSize }))
            .addButton(btn => btn
                .setButtonText(i18n.t('settings.currentFontSize.reset'))
                .onClick(async () => {
                    this.app.vault.setConfig('baseFontSize', 16);
                    this.app.updateFontSize();
                    fontInfoSetting.setDesc(i18n.t('settings.currentFontSize.desc', { value: 16 }));
                    this.plugin.showZoomTip(i18n.t('settings.currentFontSize.resetTip'));
                }));
    }
}
