<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linux可视化桌面</title>
    <link rel="stylesheet" href="css/desktop.css">
</head>
<body>
    <!-- SSH连接对话框 -->
    <div id="sshDialog" class="dialog-overlay">
        <div class="dialog-content">
            <h2>SSH连接</h2>
            <form id="sshForm">
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
                    <input type="password" id="password" name="password" required>
                </div>
                <div class="form-buttons">
                    <button type="submit" id="connectBtn">连接</button>
                    <button type="button" onclick="closeSSHDialog()" id="cancelBtn">取消</button>
                </div>
                <div id="connectingStatus" class="connecting-status hidden">
                    <div class="spinner"></div>
                    <span class="connecting-text">正在连接服务器...</span>
                </div>
            </form>
        </div>
    </div>

    <!-- 桌面顶部工具栏 -->
    <div class="taskbar">
        <div class="taskbar-left">
            <button class="taskbar-btn" onclick="showSSHDialog()" title="SSH连接">
                <span>🔌</span> SSH连接
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
        <div class="taskbar-right">
            <span id="connectionStatus" class="status-indicator">未连接</span>
        </div>
    </div>

    <!-- 桌面区域 -->
    <div class="desktop" id="desktop">
        <!-- 桌面图标将在这里动态生成 -->
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
            <div class="terminal-input-line">
                <span class="terminal-prompt">$</span>
                <input type="text" id="terminalInput" class="terminal-input" onkeypress="handleTerminalKeyPress(event)">
            </div>
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
            <pre id="fileViewerContent" class="file-viewer-content"></pre>
        </div>
    </div>

    <script src="js/desktop.js"></script>
</body>
</html>
