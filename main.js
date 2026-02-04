/* main.js */
const { Plugin, Notice } = require('obsidian');
// 获取 Electron 的 webFrame，用于控制缩放
const { webFrame } = require('electron');

module.exports = class CtrlScrollZoomPlugin extends Plugin {
    async onload() {
        console.log('加载 Ctrl+Scroll Zoom 插件');

        // 注册滚轮事件监听器
        this.registerDomEvent(window, 'wheel', (evt) => {
            // 检查是否按下了 Ctrl 键 (Mac上通常是 Cmd，但在 Web 事件中 ctrlKey 对应 Ctrl)
            // 如果需要兼容 Mac 的 Command 键，可以使用 evt.metaKey
            if (evt.ctrlKey) {
                
                // 1. 阻止默认的滚轮行为（防止滚动页面）
                evt.preventDefault();

                // 2. 获取当前缩放比例
                let currentZoom = webFrame.getZoomFactor();

                // 3. 确定缩放方向 (deltaY < 0 是向上滚动，即放大)
                // 精度设置为 0.1 (10%)
                const step = 0.1;
                let newZoom = currentZoom;

                if (evt.deltaY < 0) {
                    newZoom += step;
                } else {
                    newZoom -= step;
                }

                // 4. 限制最小和最大缩放比例 (例如 0.5 到 3.0)
                // 加上 .toFixed(1) 防止浮点数精度问题（如 1.10000002）
                newZoom = parseFloat(newZoom.toFixed(1));
                if (newZoom < 0.5) newZoom = 0.5;
                if (newZoom > 3.0) newZoom = 3.0;

                // 5. 应用新的缩放比例
                webFrame.setZoomFactor(newZoom);

                // 6. (可选) 弹窗提示当前比例，提升体验
                // 使用防抖或简单的 Notice
                new Notice(`Zoom: ${Math.round(newZoom * 100)}%`, 500);
            }
        }, { passive: false }); // passive: false 是必须的，否则无法 preventDefault
    }

    onunload() {
        console.log('卸载 Ctrl+Scroll Zoom 插件');
        // Obsidian 会自动移除 registerDomEvent 注册的事件，无需手动清理
    }
}