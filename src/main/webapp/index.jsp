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
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                    <path d="M5.5 5.5a8 8 0 1 0 13 0"></path>
                </svg>
                断开连接
            </button>
            <button class="taskbar-btn" onclick="openFileManager()" title="文件管理器">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z"></path>
                </svg>
                文件管理器
            </button>
            <button class="taskbar-btn" onclick="openProcessManager()" title="进程管理">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <line x1="6" y1="18" x2="6" y2="10"></line>
                    <line x1="12" y1="18" x2="12" y2="6"></line>
                    <line x1="18" y1="18" x2="18" y2="12"></line>
                </svg>
                进程管理
            </button>
            <button class="taskbar-btn" onclick="openTerminal()" title="终端">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="6 9 10 12 6 15"></polyline>
                    <line x1="12" y1="15" x2="18" y2="15"></line>
                </svg>
                终端
            </button>
        </div>
        <div class="taskbar-center taskbar-windows" id="taskbarWindows">
            <!-- 打开的窗口会显示在这里 -->
        </div>
        <div class="taskbar-right">
            <button class="taskbar-btn ghost" type="button" onclick="toggleTaskbarPosition()" title="切换任务栏位置（顶部/底部）">
                <svg class="btn-icon solo" viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="6 9 12 3 18 9"></polyline>
                    <polyline points="6 15 12 21 18 15"></polyline>
                </svg>
            </button>
            <button class="taskbar-btn ghost dashboard-toggle" type="button" onclick="toggleDashboard()" title="系统仪表盘" aria-label="系统仪表盘">
                <svg class="dashboard-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="1.6" rx="3"/>
                    <path d="M8 15l2-3 3 2 3-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="8" cy="15" r="1.3" fill="currentColor"/>
                    <circle cx="10" cy="12" r="1.3" fill="currentColor"/>
                    <circle cx="13" cy="14" r="1.3" fill="currentColor"/>
                    <circle cx="16" cy="9" r="1.3" fill="currentColor"/>
                </svg>
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
        <div id="dashboardEdgeZone" class="dashboard-edge-zone" aria-hidden="true">
            <button id="dashboardEdgeToggle" class="dashboard-edge-toggle" type="button" aria-label="展开仪表盘">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
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
                        <div class="card-title">
                            <span class="card-icon cpu" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                    <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor"/>
                                    <path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                </svg>
                            </span>
                            CPU 使用率
                        </div>
                        <div class="pie-chart" id="cpuPie">
                            <span class="pie-value" id="cpuValue">--%</span>
                        </div>
                        <div class="card-meta" id="cpuMeta">--</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-title">
                            <span class="card-icon disk" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <ellipse cx="12" cy="6" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                    <path d="M5 6v8c0 1.7 3.1 3 7 3s7-1.3 7-3V6" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                    <path d="M5 10c0 1.7 3.1 3 7 3s7-1.3 7-3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                </svg>
                            </span>
                            磁盘占用
                        </div>
                        <div class="pie-chart" id="diskPie">
                            <span class="pie-value" id="diskValue">--%</span>
                        </div>
                        <div class="card-meta" id="diskMeta">--</div>
                    </div>
                </div>
                <div class="dashboard-card wide">
                    <div class="card-title">
                        <span class="card-icon net" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <path d="M7 7l5-4 5 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 4v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                <path d="M17 17l-5 4-5-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 20V10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </span>
                        网络速率
                    </div>
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
                <button onclick="fileManagerGoHome()">
                    <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 11l9-7 9 7"></path>
                        <path d="M5 10v10h14V10"></path>
                    </svg>
                    主页
                </button>
                <button onclick="fileManagerGoBack()">
                    <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"></polyline>
                        <line x1="9" y1="12" x2="21" y2="12"></line>
                    </svg>
                    返回
                </button>
                <button onclick="fileManagerRefresh()">
                    <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.5 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    刷新
                </button>
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
                <button onclick="refreshProcessList()">
                    <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.5 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    刷新
                </button>
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
                <button id="fileViewerSaveBtn" onclick="saveFileViewerContent()">
                    <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    保存
                </button>
            </div>
            <textarea id="fileViewerContent" class="file-viewer-content" spellcheck="false"></textarea>
            <div id="fileViewerImageWrap" class="file-viewer-image hidden">
                <img id="fileViewerImage" alt="图片预览" />
            </div>
        </div>
    </div>

    <script src="js/desktop.js?v=20250308"></script>
</body>
</html>
