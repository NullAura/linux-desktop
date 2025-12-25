<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linux可视化桌面</title>
    <link rel="stylesheet" href="css/desktop.css?v=20250308">
    <link rel="stylesheet" href="css/connection-page.css?v=20250308">
</head>
<body>
    <!-- 连接页面 -->
    <div id="connectionPage" class="connection-page">
        <div class="connection-container">
            <div class="connection-header">
                <h1>Linux可视化桌面</h1>
                <p>通过SSH连接远程Linux服务器</p>
            </div>
            <div class="connection-form-wrapper">
                <form id="sshForm" class="connection-form">
                    <h2>SSH连接</h2>
                    <div class="form-group">
                        <label>主机地址:</label>
                        <input type="text" id="host" name="host" value="localhost" required>
                    </div>
                    <div class="form-group">
                        <label>端口:</label>
                        <input type="number" id="port" name="port" value="22" required>
                    </div>
                    <div class="form-group">
                        <label>用户名:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>密码:</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="password" name="password" required>
                            <button type="button" id="togglePassword" class="toggle-password-btn is-hidden" aria-label="显示密码" title="显示密码">
                                <span class="eye-icon" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" id="connectBtn">连接</button>
                    </div>
                    <div id="connectingStatus" class="connecting-status hidden">
                        <div class="spinner"></div>
                        <span class="connecting-text">正在连接服务器...</span>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- 桌面页面 -->
    <div id="desktopPage" class="desktop-page hidden">
        <!-- 桌面顶部工具栏 -->
    <div class="taskbar">
        <div class="taskbar-left">
            <button class="taskbar-btn" onclick="disconnectSSH()" title="断开连接">
                <span>🔌</span> 断开连接
            </button>
            <button class="taskbar-btn" onclick="openFileManager()" title="文件管理器">
                <span>📁</span> 文件管理器
            </button>
            <button class="taskbar-btn" onclick="openProcessManager()" title="进程管理">
                <span>⚙️</span> 进程管理
            </button>
            <button class="taskbar-btn" onclick="openTerminal()" title="终端">
                <span>💻</span> 终端
            </button>
        </div>
        <div class="taskbar-center taskbar-windows" id="taskbarWindows">
            <!-- 打开的窗口会显示在这里 -->
        </div>
        <div class="taskbar-right">
            <button class="taskbar-btn ghost" type="button" onclick="toggleTaskbarPosition()" title="切换任务栏位置（顶部/底部）">
                ⬍
            </button>
            <button class="taskbar-btn ghost" type="button" onclick="toggleDashboard()" title="系统仪表盘">
                📊
            </button>
            <span id="taskbarClock" class="taskbar-clock">--:--</span>
            <span id="connectionStatus" class="status-indicator">未连接</span>
        </div>
    </div>

        <!-- 桌面区域 -->
        <div class="desktop" id="desktop">
            <!-- 桌面图标将在这里动态生成 -->
        </div>
        <input type="file" id="wallpaperPicker" accept="image/*" style="display:none">
        <div id="dashboardOverlay" class="dashboard-overlay" hidden></div>
        <aside id="dashboardPanel" class="dashboard-panel" hidden>
            <div class="dashboard-header">
                <div>
                    <div class="dashboard-title">系统仪表盘</div>
                    <div class="dashboard-subtitle">实时状态</div>
                </div>
                <button class="dashboard-close" id="dashboardClose" type="button" title="关闭">×</button>
            </div>
            <div class="dashboard-content">
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-title">CPU 使用率</div>
                        <div class="pie-chart" id="cpuPie">
                            <span class="pie-value" id="cpuValue">--%</span>
                        </div>
                        <div class="card-meta" id="cpuMeta">--</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-title">磁盘占用</div>
                        <div class="pie-chart" id="diskPie">
                            <span class="pie-value" id="diskValue">--%</span>
                        </div>
                        <div class="card-meta" id="diskMeta">--</div>
                    </div>
                </div>
                <div class="dashboard-card wide">
                    <div class="card-title">网络速率</div>
                    <div class="network-stats">
                        <div class="network-row">
                            <span>下行</span>
                            <span id="netDown">--</span>
                        </div>
                        <div class="network-row">
                            <span>上行</span>
                            <span id="netUp">--</span>
                        </div>
                        <div class="network-row subtle">
                            <span>累计</span>
                            <span id="netTotal">--</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </div>

    <!-- 文件管理器窗口 -->
    <div id="fileManagerWindow" class="window hidden">
        <div class="window-header">
            <span class="window-title">文件管理器</span>
            <div class="window-controls">
                <button class="window-btn minimize" onclick="minimizeWindow('fileManagerWindow')">−</button>
                <button class="window-btn maximize" onclick="maximizeWindow('fileManagerWindow')">□</button>
                <button class="window-btn close" onclick="closeWindow('fileManagerWindow')">×</button>
            </div>
        </div>
        <div class="window-content">
            <div class="file-manager-toolbar">
                <button onclick="fileManagerGoHome()">🏠 主页</button>
                <button onclick="fileManagerGoBack()">← 返回</button>
                <button onclick="fileManagerRefresh()">🔄 刷新</button>
                <input type="text" id="filePathInput" placeholder="当前路径" onkeypress="if(event.key==='Enter') fileManagerNavigate()">
                <button onclick="fileManagerNavigate()">前往</button>
            </div>
            <div class="file-manager-content" id="fileManagerContent">
                <div class="loading">正在加载...</div>
            </div>
        </div>
    </div>

    <!-- 进程管理窗口 -->
    <div id="processWindow" class="window hidden">
        <div class="window-header">
            <span class="window-title">进程管理</span>
            <div class="window-controls">
                <button class="window-btn minimize" onclick="minimizeWindow('processWindow')">−</button>
                <button class="window-btn maximize" onclick="maximizeWindow('processWindow')">□</button>
                <button class="window-btn close" onclick="closeWindow('processWindow')">×</button>
            </div>
        </div>
        <div class="window-content">
            <div class="process-toolbar">
                <button onclick="refreshProcessList()">🔄 刷新</button>
            </div>
            <div class="process-content" id="processContent">
                <div class="loading">正在加载...</div>
            </div>
        </div>
    </div>

    <!-- 终端窗口 -->
    <div id="terminalWindow" class="window hidden">
        <div class="window-header">
            <span class="window-title">终端</span>
            <div class="window-controls">
                <button class="window-btn minimize" onclick="minimizeWindow('terminalWindow')">−</button>
                <button class="window-btn maximize" onclick="maximizeWindow('terminalWindow')">□</button>
                <button class="window-btn close" onclick="closeWindow('terminalWindow')">×</button>
            </div>
        </div>
        <div class="window-content">
            <div class="terminal-output" id="terminalOutput"></div>
        </div>
    </div>

    <!-- 文件属性对话框 -->
    <div id="propertyDialog" class="dialog-overlay hidden">
        <div class="dialog-content">
            <h2>文件属性</h2>
            <div id="propertyContent"></div>
            <div class="form-buttons">
                <button onclick="closePropertyDialog()">关闭</button>
            </div>
        </div>
    </div>

    <!-- 文件查看器窗口 -->
    <div id="fileViewerWindow" class="window hidden">
        <div class="window-header">
            <span class="window-title" id="fileViewerTitle">文件查看器</span>
            <div class="window-controls">
                <button class="window-btn minimize" onclick="minimizeWindow('fileViewerWindow')">−</button>
                <button class="window-btn maximize" onclick="maximizeWindow('fileViewerWindow')">□</button>
                <button class="window-btn close" onclick="closeWindow('fileViewerWindow')">×</button>
            </div>
        </div>
        <div class="window-content">
            <div class="file-viewer-toolbar">
                <button onclick="saveFileViewerContent()">💾 保存</button>
            </div>
            <textarea id="fileViewerContent" class="file-viewer-content" spellcheck="false"></textarea>
        </div>
    </div>

    <script src="js/desktop.js?v=20250308"></script>
</body>
</html>
