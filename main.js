/* main.js */
const { Plugin } = require('obsidian');
const { webFrame } = require('electron');

module.exports = class CtrlScrollZoomPlugin extends Plugin {
    // 用于存储悬浮提示框的 DOM 元素引用
    tipElement = null;
    // 用于存储隐藏提示框的定时器
    hideTimer = null;

    async onload() {
        console.log('加载智能缩放插件 (实时单行提示版)');

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

    // --- 显示实时提示 (核心改进) ---
    showZoomTip(text) {
        // 1. 如果提示框不存在，创建一个
        if (!this.tipElement) {
            this.tipElement = document.createElement('div');
            
            // 设置样式：居中、半透明黑底、圆角、置顶
            this.tipElement.style.cssText = `
                position: fixed;
                top: 10%; 
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--background-modifier-cover); 
                color: var(--text-normal);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 16px;
                font-weight: bold;
                z-index: 9999;
                pointer-events: none;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                border: 1px solid var(--background-modifier-border);
                backdrop-filter: blur(5px);
            `;
            document.body.appendChild(this.tipElement);
        }

        // 2. 更新文字内容
        this.tipElement.innerText = text;

        // 3. 清除之前的销毁定时器（防止滚动中途消失）
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }

        // 4. 设置新的销毁定时器 (0.8秒后消失)
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
        if (newSize > 64) newSize = 64;

        if (newSize !== currentSize) {
            this.app.vault.setConfig('baseFontSize', newSize);
            this.app.updateFontSize();
            // 调用新的提示函数
            this.showZoomTip(`字体大小: ${newSize}px`);
        }
    }

    // --- 界面缩放调整 ---
    adjustInterfaceZoom(deltaY) {
        let currentZoom = webFrame.getZoomFactor();
        const step = 0.05;
        let newZoom = currentZoom;

        if (deltaY < 0) newZoom += step;
        else newZoom -= step;

        newZoom = parseFloat(newZoom.toFixed(2));

        if (newZoom < 0.5) newZoom = 0.5;
        if (newZoom > 3.0) newZoom = 3.0;

        if (newZoom !== parseFloat(currentZoom.toFixed(2))) {
            webFrame.setZoomFactor(newZoom);
            // 调用新的提示函数
            this.showZoomTip(`界面缩放: ${Math.round(newZoom * 100)}%`);
        }
    }

    onunload() {
        // 卸载时如果还有残留的提示框，清理掉
        if (this.tipElement) {
            this.tipElement.remove();
        }
    }
}