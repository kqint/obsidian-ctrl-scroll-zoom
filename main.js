/* main.js */
const { Plugin, PluginSettingTab, Setting, normalizePath } = require('obsidian');
const { webFrame } = require('electron');

// 1. 定义默认配置
const DEFAULT_SETTINGS = {
    zoomStep: 0.05
}

// 2. 自定义配置文件名
const CONFIG_FILE_NAME = "config.json";

module.exports = class CtrlScrollZoomPlugin extends Plugin {
    tipElement = null;
    hideTimer = null;
    settings = null;

    async onload() {
        console.log('加载缩放插件');

        await this.loadSettings();
        this.addSettingTab(new CtrlScrollZoomSettingTab(this.app, this));

        this.registerDomEvent(window, 'wheel', (evt) => {
            if (evt.ctrlKey || evt.metaKey) {
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
    
    // 获取配置文件的完整路径： .obsidian/plugins/插件名/config.json
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
                console.log("配置已从 config.json 加载");
            } else {
                // 文件不存在则使用默认值
                this.settings = Object.assign({}, DEFAULT_SETTINGS);
            }
        } catch (error) {
            console.error("加载配置文件失败:", error);
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
            console.log("配置已保存到 config.json");
        } catch (error) {
            console.error("保存配置文件失败:", error);
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
            this.showZoomTip(`字体大小: ${newSize}px`);
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
            this.showZoomTip(`界面缩放: ${Math.round(newZoom * 100)}%`);
        }
    }

    onunload() {
        if (this.tipElement) this.tipElement.remove();
    }
}

// --- 设置界面 ---
class CtrlScrollZoomSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Ctrl+滚轮缩放设置' });

        new Setting(containerEl)
            .setName('界面缩放步长 (精度)')
            .setDesc('每次滚轮滚动时，界面缩放变化的比例。')
            .addText(text => text
                .setPlaceholder('0.05')
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
            .setName('当前界面缩放比例')
            .setDesc(`当前: ${currentZoom}%`)
            .addButton(btn => btn
                .setButtonText('重置为 100%')
                .setCta()
                .onClick(async () => {
                    webFrame.setZoomFactor(1.0);
                    zoomInfoSetting.setDesc(`当前: 100%`);
                    this.plugin.showZoomTip('界面已重置: 100%');
                }));

        const currentFontSize = this.app.vault.getConfig('baseFontSize') || 16;
        const fontInfoSetting = new Setting(containerEl)
            .setName('当前编辑器字体大小')
            .setDesc(`当前: ${currentFontSize}px`)
            .addButton(btn => btn
                .setButtonText('重置为 16px')
                .onClick(async () => {
                    this.app.vault.setConfig('baseFontSize', 16);
                    this.app.updateFontSize();
                    fontInfoSetting.setDesc(`当前: 16px`);
                    this.plugin.showZoomTip('字体已重置: 16px');
                }));
    }
}