/* main.js */
const { Plugin, Notice } = require('obsidian');
const { webFrame } = require('electron');

module.exports = class CtrlScrollZoomPlugin extends Plugin {
    async onload() {
        console.log('加载智能缩放插件：编辑器缩放字体 / 外部缩放界面');

        this.registerDomEvent(window, 'wheel', (evt) => {
            // 检查是否按下了 Ctrl (或 Mac 的 Meta/Command 键)
            if (evt.ctrlKey || evt.metaKey) {
                
                // 1. 阻止默认滚动行为
                evt.preventDefault();

                // 2. 核心逻辑：判断鼠标当前下的元素是否属于编辑器
                // .markdown-source-view 是编辑模式
                // .markdown-preview-view 是阅读模式
                // .cm-editor 是源码编辑器的核心区域
                const target = evt.target;
                const isEditor = target.closest('.markdown-source-view') || 
                                 target.closest('.markdown-preview-view');

                if (isEditor) {
                    // === 场景 A：在编辑区，只调整字体大小 ===
                    this.adjustEditorFontSize(evt.deltaY);
                } else {
                    // === 场景 B：在非编辑区，调整整个界面缩放 ===
                    this.adjustInterfaceZoom(evt.deltaY);
                }
            }
        }, { passive: false });
    }

    // 调整编辑器字体大小 (修改 Obsidian 的外观设置)
    adjustEditorFontSize(deltaY) {
        // 获取当前基础字体大小 (默认为 16)
        let currentSize = this.app.vault.getConfig('baseFontSize') || 16;
        
        // 向上滚动 (deltaY < 0) 字体变大，向下变小
        // 步进设置为 1px
        const step = 1;
        let newSize = currentSize;

        if (deltaY < 0) {
            newSize += step;
        } else {
            newSize -= step;
        }

        // 限制字体大小范围 (例如 10px 到 64px)
        if (newSize < 10) newSize = 10;
        if (newSize > 64) newSize = 64;

        // 如果大小有变化，则应用设置
        if (newSize !== currentSize) {
            this.app.vault.setConfig('baseFontSize', newSize);
            // 触发样式更新
            this.app.updateFontSize(); 
            
            // 提示
            new Notice(`字体大小: ${newSize}px`, 500);
        }
    }

    // 调整整体界面缩放 (Electron 层级)
    adjustInterfaceZoom(deltaY) {
        let currentZoom = webFrame.getZoomFactor();
        
        // 步进 10%
        const step = 0.1;
        let newZoom = currentZoom;

        if (deltaY < 0) {
            newZoom += step;
        } else {
            newZoom -= step;
        }

        // 限制界面缩放范围 (0.5 到 3.0)
        newZoom = parseFloat(newZoom.toFixed(1));
        if (newZoom < 0.5) newZoom = 0.5;
        if (newZoom > 3.0) newZoom = 3.0;

        if (newZoom !== currentZoom) {
            webFrame.setZoomFactor(newZoom);
            new Notice(`界面缩放: ${Math.round(newZoom * 100)}%`, 500);
        }
    }

    onunload() {
        console.log('卸载智能缩放插件');
    }
}