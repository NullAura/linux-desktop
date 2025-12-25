// 全局变量
let currentPath = '~';
let fileManagerHistory = [];
let selectedFile = null;
let zIndex = 100;
const DESKTOP_WALLPAPER_KEY = 'linuxDesktop.wallpaper';
const TERMINAL_PROMPT_MARKER = '__LINUX_DESKTOP_PROMPT__';
const TERMINAL_PWD_MARKER = '__LINUX_DESKTOP_PWD__';
let terminalSessionActive = false;
let terminalPollingTimer = null;
let terminalPollingInFlight = false;
let lastTerminalCommand = '';
let terminalActiveProgram = '';
let terminalStartPromise = null;
let terminalFallbackNotified = false;
let terminalCwd = '';
let terminalHome = '';
let terminalPrompt = '#';
let terminalInitPending = false;
let fileViewerPath = '';
let processRefreshTimer = null;
let processRefreshInFlight = false;
let processSortKey = '';
let processSortDir = 'asc';
let lastProcessList = [];
let dashboardTimer = null;
let dashboardInFlight = false;
let dashboardLastNetSample = null;
let dashboardLastNetTimestamp = 0;
let dashboardHideTimer = null;
let fileManagerDragCounter = 0;
const windowMeta = {
    fileManagerWindow: { title: '文件管理器', iconKey: 'folder' },
    processWindow: { title: '进程管理', iconKey: 'process' },
    terminalWindow: { title: '终端', iconKey: 'terminal' },
    fileViewerWindow: { title: '文件查看器', iconKey: 'doc' }
};
const openWindows = new Map();
const IMAGE_EXTS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff', 'ico', 'icns', 'heic', 'avif'
]);
const SCRIPT_EXTS = new Set([
    'sh', 'bash', 'zsh', 'fish', 'ksh', 'csh', 'ps1', 'bat', 'cmd', 'vbs', 'py', 'rb', 'pl', 'php', 'lua'
]);
const CODE_EXTS = new Set([
    'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'java', 'c', 'cc', 'cpp', 'h', 'hpp', 'go', 'rs',
    'swift', 'kt', 'kts', 'scala', 'cs', 'm', 'mm', 'sql'
]);
const CONFIG_EXTS = new Set([
    'json', 'yml', 'yaml', 'toml', 'ini', 'conf', 'cfg', 'env', 'properties', 'lock'
]);
const ARCHIVE_EXTS = new Set([
    'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst', 'tbz', 'tbz2', 'txz'
]);
const AUDIO_EXTS = new Set([
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'aiff', 'amr'
]);
const VIDEO_EXTS = new Set([
    'mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'm4v', 'mpg', 'mpeg', '3gp'
]);
const DOC_EXTS = new Set([
    'txt', 'md', 'markdown', 'rtf', 'doc', 'docx'
]);
const SHEET_EXTS = new Set([
    'xls', 'xlsx', 'csv', 'tsv', 'ods'
]);
const SLIDE_EXTS = new Set([
    'ppt', 'pptx', 'key', 'odp'
]);
const DB_EXTS = new Set([
    'db', 'sqlite', 'sqlite3', 'mdb'
]);
const FONT_EXTS = new Set([
    'ttf', 'otf', 'woff', 'woff2'
]);
const LOG_EXTS = new Set([
    'log'
]);
const PACKAGE_EXTS = new Set([
    'deb', 'rpm', 'pkg', 'dmg', 'apk', 'ipa'
]);
const SPECIAL_FILE_ICON_KEYS = {
    '.bashrc': 'script',
    '.zshrc': 'script',
    '.profile': 'script',
    '.bash_profile': 'script',
    '.gitignore': 'config',
    '.env': 'config',
    '.editorconfig': 'config',
    '.npmrc': 'config',
    '.vimrc': 'config',
    'makefile': 'script',
    'dockerfile': 'config',
    'docker-compose.yml': 'config',
    'docker-compose.yaml': 'config',
    'readme': 'doc',
    'readme.md': 'doc',
    'license': 'doc',
    'license.md': 'doc'
};
const FILE_ICON_SVGS = {
    file: buildIconSvg(
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/>'
    ),
    folder: buildIconSvg(
        '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z"/>'
    ),
    link: buildIconSvg(
        '<path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L11 4"/>' +
        '<path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07L13 20"/>'
    ),
    image: buildIconSvg(
        '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
        '<circle cx="8.5" cy="8.5" r="1.5"/>' +
        '<polyline points="21 15 16 10 5 21"/>'
    ),
    script: buildIconSvg(
        '<polyline points="4 17 10 11 4 5"/>' +
        '<line x1="12" y1="19" x2="20" y2="19"/>'
    ),
    code: buildIconSvg(
        '<polyline points="16 18 22 12 16 6"/>' +
        '<polyline points="8 6 2 12 8 18"/>'
    ),
    config: buildIconSvg(
        '<line x1="4" y1="21" x2="4" y2="14"/>' +
        '<line x1="4" y1="10" x2="4" y2="3"/>' +
        '<line x1="12" y1="21" x2="12" y2="12"/>' +
        '<line x1="12" y1="8" x2="12" y2="3"/>' +
        '<line x1="20" y1="21" x2="20" y2="16"/>' +
        '<line x1="20" y1="12" x2="20" y2="3"/>' +
        '<circle cx="4" cy="12" r="2"/>' +
        '<circle cx="12" cy="10" r="2"/>' +
        '<circle cx="20" cy="14" r="2"/>'
    ),
    archive: buildIconSvg(
        '<rect x="3" y="4" width="18" height="4"/>' +
        '<path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>' +
        '<line x1="10" y1="12" x2="14" y2="12"/>'
    ),
    audio: buildIconSvg(
        '<path d="M9 18V5l12-2v13"/>' +
        '<circle cx="6" cy="18" r="3"/>' +
        '<circle cx="18" cy="16" r="3"/>'
    ),
    video: buildIconSvg(
        '<rect x="2" y="7" width="15" height="10" rx="2"/>' +
        '<polygon points="23 7 16 12 23 17"/>'
    ),
    pdf: buildIconSvg(
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/>' +
        '<path d="M7 14h3a2 2 0 0 0 0-4H7v8"/>' +
        '<path d="M14 10h2a2 2 0 0 1 0 4h-2v4"/>'
    ),
    sheet: buildIconSvg(
        '<rect x="4" y="3" width="16" height="18" rx="2"/>' +
        '<line x1="8" y1="7" x2="16" y2="7"/>' +
        '<line x1="8" y1="11" x2="16" y2="11"/>' +
        '<line x1="8" y1="15" x2="16" y2="15"/>' +
        '<line x1="12" y1="7" x2="12" y2="19"/>'
    ),
    slide: buildIconSvg(
        '<rect x="3" y="4" width="18" height="12" rx="2"/>' +
        '<line x1="8" y1="20" x2="16" y2="20"/>' +
        '<line x1="12" y1="16" x2="12" y2="20"/>'
    ),
    doc: buildIconSvg(
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/>' +
        '<line x1="8" y1="13" x2="16" y2="13"/>' +
        '<line x1="8" y1="17" x2="16" y2="17"/>'
    ),
    db: buildIconSvg(
        '<ellipse cx="12" cy="5" rx="9" ry="3"/>' +
        '<path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>' +
        '<path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>'
    ),
    font: buildIconSvg(
        '<polyline points="4 7 4 4 20 4 20 7"/>' +
        '<line x1="9" y1="20" x2="15" y2="20"/>' +
        '<line x1="12" y1="4" x2="12" y2="20"/>'
    ),
    log: buildIconSvg(
        '<path d="M5 3h10l4 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>' +
        '<line x1="7" y1="13" x2="17" y2="13"/>' +
        '<line x1="7" y1="17" x2="17" y2="17"/>'
    ),
    package: buildIconSvg(
        '<path d="M16.5 9.4L7.5 4.21"/>' +
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
        '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
        '<line x1="12" y1="22.08" x2="12" y2="12"/>'
    ),
    terminal: buildIconSvg(
        '<polyline points="6 9 10 12 6 15"/>' +
        '<line x1="12" y1="15" x2="18" y2="15"/>'
    ),
    process: buildIconSvg(
        '<line x1="6" y1="18" x2="6" y2="10"/>' +
        '<line x1="12" y1="18" x2="12" y2="6"/>' +
        '<line x1="18" y1="18" x2="18" y2="12"/>'
    )
};

// 获取应用上下文路径
function getContextPath() {
    const path = window.location.pathname;
    // 如果路径是 /linux-desktop/ 或 /linux-desktop/index.jsp
    if (path.startsWith('/linux-desktop')) {
        return '/linux-desktop';
    }
    // 否则尝试提取第一个路径段
    const index = path.indexOf('/', 1);
    if (index > 0) {
        return path.substring(0, index);
    }
    return '';
}

const API_BASE = getContextPath();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // SSH连接表单提交
    document.getElementById('sshForm').addEventListener('submit', function(e) {
        e.preventDefault();
        connectSSH();
    });
    
    // 密码明文切换
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // 检查SSH连接状态并切换页面
    checkSSHConnection().then(connected => {
        switchPage(connected);
    });
    
    // 初始化窗口拖拽
    initWindowDragging();
    
    // 初始化右键菜单
    initContextMenu();
    initFileManagerContextMenu();
    initFileManagerDragUpload();
    initDashboard();
    
    // 任务栏时钟
    startTaskbarClock();

    // 桌面右键菜单与背景
    initDesktopContextMenu();
    initWallpaperPicker();
    restoreDesktopBackground();

    // 终端快捷键由 inline input 绑定
    document.addEventListener('keydown', handleTerminalGlobalKeyDown);
});

// 切换页面显示
function switchPage(showDesktop) {
    const connectionPage = document.getElementById('connectionPage');
    const desktopPage = document.getElementById('desktopPage');
    
    if (showDesktop) {
        // 显示桌面页面
        connectionPage.classList.add('hidden');
        desktopPage.classList.remove('hidden');
        // 初始化桌面图标
        initDesktopIcons();
    } else {
        // 显示连接页面
        connectionPage.classList.remove('hidden');
        desktopPage.classList.add('hidden');
    }
}

// 更新连接状态显示
function updateConnectionStatus(connected, username, host) {
    const statusElement = document.getElementById('connectionStatus');
    if (connected && username && host) {
        statusElement.textContent = '已连接: ' + username + '@' + host;
        statusElement.classList.add('connected');
        // 切换到桌面页面
        switchPage(true);
    } else {
        statusElement.textContent = '未连接';
        statusElement.classList.remove('connected');
        // 切换到连接页面
        switchPage(false);
        stopTerminalSession();
        stopProcessAutoRefresh();
        closeDashboardPanel();
        clearOpenWindows();
    }
}

// 检查SSH连接状态（返回Promise）
function checkSSHConnection() {
    return fetch(API_BASE + '/ssh/connect')
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error('非JSON响应');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data && data.connected) {
                if (data.desktopPath) {
                    window.desktopPath = data.desktopPath;
                }
            } else {
                window.desktopPath = null;
            }
            updateConnectionStatus(data.connected, data.username, data.host);
            return data.connected;
        })
        .catch(error => {
            console.error('检查连接状态失败:', error);
            updateConnectionStatus(false);
            return false;
        });
}

// 显示消息提示
function showMessage(message, type) {
    // 创建提示框
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-toast ' + (type || 'info');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 显示SSH连接对话框（切换到连接页面）
function showSSHDialog() {
    switchPage(false);
}

// 断开连接并返回连接页面
function disconnectSSH() {
    // 可以添加断开连接的逻辑
    stopTerminalSession();
    updateConnectionStatus(false);
}

// 切换任务栏位置（顶部/底部）
function toggleTaskbarPosition() {
    const taskbar = document.querySelector('.taskbar');
    if (!taskbar) return;
    const isTop = taskbar.classList.toggle('taskbar-top');
    document.body.classList.toggle('taskbar-top', isTop);
}

// 任务栏窗口列表渲染
function renderTaskbarWindows() {
    const container = document.getElementById('taskbarWindows');
    if (!container) return;
    container.innerHTML = '';
    openWindows.forEach((meta, id) => {
        const btn = document.createElement('button');
        btn.className = 'taskbar-window-btn';
        const windowEl = document.getElementById(id);
        const isVisible = windowEl && !windowEl.classList.contains('hidden');
        if (isVisible) {
            btn.classList.add('active');
        }
        const iconKey = meta.iconKey || 'file';
        btn.innerHTML = `
            <span class="taskbar-window-icon file-icon--${iconKey}">${getFileIconSvg(iconKey)}</span>
            <span class="taskbar-window-title">${meta.title}</span>
        `;
        btn.addEventListener('click', () => {
            if (windowEl) {
                windowEl.classList.remove('hidden');
                bringWindowToFront(id);
                renderTaskbarWindows();
            }
        });
        container.appendChild(btn);
    });
}

function registerWindow(windowId) {
    if (windowMeta[windowId]) {
        openWindows.set(windowId, windowMeta[windowId]);
        renderTaskbarWindows();
    }
}

function unregisterWindow(windowId) {
    if (openWindows.has(windowId)) {
        openWindows.delete(windowId);
        renderTaskbarWindows();
    }
}

function clearOpenWindows() {
    openWindows.clear();
    renderTaskbarWindows();
}

function ensureWindowPosition(windowId, offsetIndex) {
    const windowEl = document.getElementById(windowId);
    if (!windowEl) return;
    const positioned = windowEl.dataset.positioned === 'true';
    if (!positioned) {
        const baseTop = 80 + (offsetIndex || 0) * 30;
        const baseLeft = 120 + (offsetIndex || 0) * 30;
        windowEl.style.top = baseTop + 'px';
        windowEl.style.left = baseLeft + 'px';
        windowEl.style.transform = '';
        windowEl.dataset.positioned = 'true';
    }
}

// 任务栏时钟
function startTaskbarClock() {
    const clockEl = document.getElementById('taskbarClock');
    if (!clockEl) return;
    const update = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        const mon = (now.getMonth() + 1).toString().padStart(2, '0');
        clockEl.textContent = `${h}:${m}  ${mon}-${d}`;
    };
    update();
    setInterval(update, 1000);
}

// 切换密码明文显示
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    if (!passwordInput || !toggleBtn) {
        return;
    }
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    const isVisible = showPassword;
    toggleBtn.classList.toggle('is-hidden', !isVisible);
    toggleBtn.setAttribute('aria-label', isVisible ? '隐藏密码' : '显示密码');
    toggleBtn.setAttribute('title', isVisible ? '隐藏密码' : '显示密码');
}

// 连接SSH
function connectSSH() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 验证输入
    if (!host || !port || !username || !password) {
        alert('请填写完整的连接信息');
        return;
    }
    
    // 显示连接状态
    const connectBtn = document.getElementById('connectBtn');
    const connectingStatus = document.getElementById('connectingStatus');
    const connectingText = connectingStatus.querySelector('.connecting-text');
    
    // 禁用按钮，显示加载状态
    connectBtn.disabled = true;
    connectingStatus.classList.remove('hidden');
    connectingText.textContent = '正在连接服务器...';
    
    const formData = new URLSearchParams();
    formData.append('host', host);
    formData.append('port', port);
    formData.append('username', username);
    formData.append('password', password);
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 35000); // 35秒超时（比后端的30秒稍长）
    
    fetch(API_BASE + '/ssh/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        // 更新状态提示
        connectingText.textContent = '正在验证连接...';
        
        // 检查响应状态
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error('HTTP错误 ' + response.status + ': ' + text.substring(0, 100));
            });
        }
        // 检查Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                throw new Error('服务器返回的不是JSON格式: ' + text.substring(0, 100));
            });
        }
        return response.json();
    })
    .then(data => {
        clearTimeout(timeoutId);
        
        // 更新状态提示
        connectingText.textContent = '连接成功！';
        
        if (data.success) {
            // 短暂延迟后切换到桌面页面，让用户看到成功提示
            setTimeout(() => {
                // 重置UI状态
                connectBtn.disabled = false;
                connectingStatus.classList.add('hidden');
                
                // 保存桌面路径
                if (data.desktopPath) {
                    window.desktopPath = data.desktopPath;
                } else {
                    window.desktopPath = null;
                }
                
                // 更新连接状态（会自动切换到桌面页面）
                updateConnectionStatus(true, username, host);
                
                // 显示成功提示（包含桌面文件夹信息）
                let message = '连接成功！';
                if (data.desktopPath) {
                    message += ' 桌面文件夹: ' + data.desktopPath;
                }
                showMessage(message, 'success');
            }, 500);
        } else {
            // 连接失败
            connectBtn.disabled = false;
            connectingStatus.classList.add('hidden');
            alert('连接失败: ' + data.message);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        
        // 重置UI状态
        connectBtn.disabled = false;
        connectingStatus.classList.add('hidden');
        
        console.error('SSH连接错误详情:', error);
        let errorMessage = '连接错误: ';
        
        if (error.name === 'AbortError') {
            errorMessage = '连接超时: 请检查网络连接和服务器是否可达';
        } else if (error.message.includes('JSON') || error.message.includes('<html')) {
            errorMessage = '连接失败: 服务器响应格式错误。请检查服务器是否正常运行，或刷新页面重试。';
        } else if (error.message.includes('HTTP')) {
            errorMessage = '连接失败: ' + error.message;
        } else {
            errorMessage = '连接失败: ' + error.message;
        }
        
        alert(errorMessage);
    });
}

// 检查SSH是否已连接（实际检查）
function isSSHConnected() {
    const statusElement = document.getElementById('connectionStatus');
    return statusElement && statusElement.classList.contains('connected');
}

// 打开文件管理器
function openFileManager(targetPath) {
    // 检查是否已连接SSH（使用异步检查以确保准确性）
    checkSSHConnection().then(() => {
        const connected = isSSHConnected();
        if (!connected) {
            alert('请先连接SSH服务器！');
            showSSHDialog();
            return;
        }
        
        const window = document.getElementById('fileManagerWindow');
        window.classList.remove('hidden');
        ensureWindowPosition('fileManagerWindow', 0);
        bringWindowToFront('fileManagerWindow');
        registerWindow('fileManagerWindow');
        if (targetPath) {
            currentPath = targetPath;
            fileManagerHistory = [];
            loadFileList(currentPath);
        } else {
            fileManagerGoHome();
        }
    });
}

// 文件管理器 - 返回主页（桌面文件夹）
function fileManagerGoHome() {
    // 优先使用桌面文件夹，如果没有则使用用户主目录
    if (window.desktopPath) {
        currentPath = window.desktopPath;
    } else {
        currentPath = '~';
    }
    fileManagerHistory = [];
    loadFileList(currentPath);
}

// 文件管理器 - 返回上一级
function fileManagerGoBack() {
    if (fileManagerHistory.length > 0) {
        currentPath = fileManagerHistory.pop();
        loadFileList(currentPath);
    }
}

// 文件管理器 - 刷新
function fileManagerRefresh() {
    loadFileList(currentPath);
}

// 文件管理器 - 导航到指定路径
function fileManagerNavigate() {
    const path = document.getElementById('filePathInput').value;
    if (path) {
        currentPath = path;
        fileManagerHistory = [];
        loadFileList(currentPath);
    }
}

// 加载文件列表
function loadFileList(path) {
    const content = document.getElementById('fileManagerContent');
    content.innerHTML = '<div class="loading">正在加载...</div>';
    
    fetch(`${API_BASE}/api/file/list?path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentPath = data.path;
                document.getElementById('filePathInput').value = currentPath;
                
                let html = '<div class="file-list">';
                
                // 如果不是根目录，添加返回上一级选项
                if (path !== '/' && path !== '~' && !path.startsWith('/home')) {
                    const folderSvg = getFileIconSvg('folder');
                    html += `
                        <div class="file-item" onclick="fileManagerNavigateTo('..')">
                            <div class="file-icon file-icon--folder">${folderSvg}</div>
                            <div class="file-name">..</div>
                        </div>
                    `;
                }
                
                data.files.forEach(file => {
                    // 跳过 . 和 .. 目录
                    if (file.name === '.' || file.name === '..') {
                        return;
                    }
                    
                    const iconKey = getFileIconKey(file.name, file.type, file.isDirectory);
                    const iconSvg = getFileIconSvg(iconKey);
                    html += `
                        <div class="file-item" 
                             data-path="${escapeHtml(file.path)}"
                             data-name="${escapeHtml(file.name)}"
                             data-type="${file.type}"
                             onclick="fileItemClick(this, event)"
                             oncontextmenu="showFileContextMenu(event, '${escapeHtml(file.path)}', '${file.type}')">
                            <div class="file-icon file-icon--${iconKey}">${iconSvg}</div>
                            <div class="file-name">${escapeHtml(file.name)}</div>
                        </div>
                    `;
                });
                
                html += '</div>';
                content.innerHTML = html;
            } else {
                content.innerHTML = '<div class="loading">错误: ' + data.message + '</div>';
            }
        })
        .catch(error => {
            content.innerHTML = '<div class="loading">加载失败: ' + error.message + '</div>';
        });
}

// 文件项点击
function fileItemClick(element, event) {
    event.preventDefault();
    event.stopPropagation();
    
    // 移除其他选中状态
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 选中当前项
    element.classList.add('selected');
    selectedFile = {
        path: element.dataset.path,
        name: element.dataset.name,
        type: element.dataset.type
    };
    
    // 双击打开
    if (event.detail === 2) {
        if (element.dataset.type === 'directory') {
            fileManagerNavigateTo(element.dataset.path);
        } else {
            openFile(element.dataset.path);
        }
    }
}

// 导航到指定路径
function fileManagerNavigateTo(path) {
    if (path === '..') {
        // 返回到上一级目录
        const pathParts = currentPath.split('/').filter(p => p);
        if (pathParts.length > 0) {
            pathParts.pop();
            currentPath = '/' + pathParts.join('/');
            if (currentPath === '/') {
                currentPath = '/';
            }
        } else {
            currentPath = '~';
        }
    } else {
        fileManagerHistory.push(currentPath);
        currentPath = path;
    }
    loadFileList(currentPath);
}

// 打开文件
function openFile(filePath) {
    fetch(API_BASE + '/api/file/open', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'path=' + encodeURIComponent(filePath) + '&action=edit'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.type === 'image') {
                openImageViewer(filePath, data.content || '', data.mimeType || 'image/*');
            } else if (data.type === 'text' || data.type === 'edit') {
                openFileViewer(filePath, data.content || '');
            } else {
                alert('文件内容:\n' + data.content);
            }
        } else {
            alert('打开文件失败: ' + data.message);
        }
    })
    .catch(error => {
        alert('打开文件错误: ' + error.message);
    });
}

// 打开文件查看器
function openFileViewer(filePath, content) {
    const window = document.getElementById('fileViewerWindow');
    document.getElementById('fileViewerTitle').textContent = '文件查看器 - ' + filePath;
    const contentInput = document.getElementById('fileViewerContent');
    fileViewerPath = filePath;
    showFileViewerTextMode();
    contentInput.value = content || '';
    contentInput.onkeydown = handleFileViewerKeyDown;
    window.classList.remove('hidden');
    ensureWindowPosition('fileViewerWindow', 3);
    bringWindowToFront('fileViewerWindow');
    registerWindow('fileViewerWindow');
}

function handleFileViewerKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveFileViewerContent();
    }
}

function openImageViewer(filePath, base64Data, mimeType) {
    const window = document.getElementById('fileViewerWindow');
    const image = document.getElementById('fileViewerImage');
    if (!window || !image) {
        showMessage('图片预览失败', 'error');
        return;
    }
    if (!base64Data) {
        showMessage('图片内容为空', 'error');
        return;
    }
    document.getElementById('fileViewerTitle').textContent = '文件查看器 - ' + filePath;
    fileViewerPath = filePath;
    showFileViewerImageMode(base64Data, mimeType || 'image/*');
    window.classList.remove('hidden');
    ensureWindowPosition('fileViewerWindow', 3);
    bringWindowToFront('fileViewerWindow');
    registerWindow('fileViewerWindow');
}

function showFileViewerTextMode() {
    const contentInput = document.getElementById('fileViewerContent');
    const imageWrap = document.getElementById('fileViewerImageWrap');
    const image = document.getElementById('fileViewerImage');
    if (contentInput) {
        contentInput.classList.remove('hidden');
    }
    if (imageWrap) {
        imageWrap.classList.add('hidden');
    }
    if (image) {
        image.src = '';
    }
    toggleFileViewerSave(true);
}

function showFileViewerImageMode(base64Data, mimeType) {
    const contentInput = document.getElementById('fileViewerContent');
    const imageWrap = document.getElementById('fileViewerImageWrap');
    const image = document.getElementById('fileViewerImage');
    if (contentInput) {
        contentInput.classList.add('hidden');
    }
    if (imageWrap) {
        imageWrap.classList.remove('hidden');
    }
    if (image) {
        image.src = base64Data ? `data:${mimeType};base64,${base64Data}` : '';
    }
    toggleFileViewerSave(false);
}

function toggleFileViewerSave(show) {
    const button = document.getElementById('fileViewerSaveBtn');
    if (button) {
        button.style.display = show ? '' : 'none';
    }
}

function isFileViewerImageMode() {
    const imageWrap = document.getElementById('fileViewerImageWrap');
    return imageWrap && !imageWrap.classList.contains('hidden');
}

// 显示文件右键菜单
function showFileContextMenu(event, filePath, fileType) {
    event.preventDefault();
    event.stopPropagation();
    
    const menu = document.getElementById('contextMenu') || createContextMenu();
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="handleFileOpenAction('${filePath.replace(/'/g, "\\'")}', '${fileType}')">打开</div>
        <div class="context-menu-item" onclick="showFileProperty('${filePath.replace(/'/g, "\\'")}')">属性</div>
        <div class="context-menu-item" onclick="promptDeleteFileItem('${filePath.replace(/'/g, "\\'")}', '${fileType}')">删除</div>
    `;
    
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('show');
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

function promptDeleteFileItem(filePath, fileType) {
    const isDir = fileType === 'directory';
    const label = isDir ? '确认删除文件夹及其内容？' : '确认删除该文件？';
    if (!confirm(label)) {
        return;
    }
    deleteFileItem(filePath);
}

function deleteFileItem(filePath) {
    const payload = 'path=' + encodeURIComponent(filePath);
    fetch(API_BASE + '/api/file/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('删除成功', 'success');
            loadFileList(getCurrentDirectory());
            refreshDesktopFiles();
        } else {
            showMessage('删除失败: ' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        showMessage('删除失败: ' + error.message, 'error');
    });
}

function handleFileOpenAction(filePath, fileType) {
    if (fileType === 'directory') {
        openFileManager(filePath);
        return;
    }
    openFile(filePath);
}

function showFileManagerContextMenu(event) {
    const menu = document.getElementById('contextMenu') || createContextMenu();
    menu.innerHTML = `
        <div class="context-menu-item" onclick="promptCreateFileItem('directory')">新建文件夹</div>
        <div class="context-menu-item" onclick="promptCreateFileItem('file')">新建文件</div>
        <div class="context-menu-item" onclick="fileManagerRefresh()">刷新</div>
    `;
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('show');

    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

// 创建右键菜单
function createContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    document.body.appendChild(menu);
    return menu;
}

// 初始化右键菜单
function initContextMenu() {
    createContextMenu();
}

function initFileManagerContextMenu() {
    const content = document.getElementById('fileManagerContent');
    if (!content) return;
    content.addEventListener('contextmenu', (event) => {
        if (event.target.closest('.file-item')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        showFileManagerContextMenu(event);
    });
}

function initFileManagerDragUpload() {
    const content = document.getElementById('fileManagerContent');
    if (!content) return;

    document.addEventListener('dragover', (event) => {
        if (hasFileDrag(event)) {
            event.preventDefault();
        }
    });

    document.addEventListener('drop', (event) => {
        if (hasFileDrag(event)) {
            event.preventDefault();
        }
    });

    content.addEventListener('dragenter', (event) => {
        if (!hasFileDrag(event)) return;
        if (isFileManagerHidden()) return;
        event.preventDefault();
        fileManagerDragCounter += 1;
        content.classList.add('drag-over');
    });

    content.addEventListener('dragover', (event) => {
        if (!hasFileDrag(event)) return;
        if (isFileManagerHidden()) return;
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    });

    content.addEventListener('dragleave', (event) => {
        if (!hasFileDrag(event)) return;
        if (isFileManagerHidden()) return;
        event.preventDefault();
        fileManagerDragCounter -= 1;
        if (fileManagerDragCounter <= 0) {
            fileManagerDragCounter = 0;
            content.classList.remove('drag-over');
        }
    });

    content.addEventListener('drop', (event) => {
        if (!hasFileDrag(event)) return;
        if (isFileManagerHidden()) return;
        event.preventDefault();
        fileManagerDragCounter = 0;
        content.classList.remove('drag-over');
        const files = Array.from(event.dataTransfer ? event.dataTransfer.files : []);
        if (!files.length) return;
        uploadFilesToCurrentDir(files);
    });
}

function hasFileDrag(event) {
    if (!event.dataTransfer || !event.dataTransfer.types) {
        return false;
    }
    return Array.from(event.dataTransfer.types).includes('Files');
}

function isFileManagerHidden() {
    const window = document.getElementById('fileManagerWindow');
    return !window || window.classList.contains('hidden');
}

function uploadFilesToCurrentDir(files) {
    if (!files || files.length === 0) {
        return;
    }
    if (!isSSHConnected()) {
        showMessage('请先连接SSH服务器', 'error');
        return;
    }
    const targetDir = getCurrentDirectory();
    if (!targetDir) {
        showMessage('目标目录无效', 'error');
        return;
    }

    const total = files.length;
    let uploaded = 0;
    let failed = 0;
    let chain = Promise.resolve();

    showMessage(`正在上传 ${total} 个文件...`, 'info');

    files.forEach(file => {
        chain = chain.then(() => uploadSingleFile(file, targetDir)
            .then(() => {
                uploaded += 1;
            })
            .catch(error => {
                failed += 1;
                const message = error && error.message ? error.message : String(error || '上传失败');
                showMessage(`上传失败: ${file.name || '未命名文件'} (${message})`, 'error');
            }));
    });

    chain.then(() => {
        loadFileList(targetDir);
        refreshDesktopFiles();
        if (failed === 0) {
            showMessage(`上传完成 (${uploaded}/${total})`, 'success');
        } else if (uploaded > 0) {
            showMessage(`上传完成，失败 ${failed} 个`, 'error');
        } else {
            showMessage('上传失败', 'error');
        }
    });
}

function uploadSingleFile(file, targetDir) {
    const formData = new FormData();
    formData.append('path', targetDir);
    formData.append('file', file, file.name);

    return fetch(API_BASE + '/api/file/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return response.text().then(text => {
                throw new Error('非JSON响应');
            });
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.success) {
            throw new Error((data && data.message) ? data.message : '上传失败');
        }
        return data;
    });
}

// 初始化桌面右键菜单
function initDesktopContextMenu() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    desktop.addEventListener('contextmenu', (event) => {
        if (event.target.closest('.desktop-icon')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        showDesktopContextMenu(event);
    });
}

// 显示桌面空白处右键菜单
function showDesktopContextMenu(event) {
    const menu = document.getElementById('contextMenu') || createContextMenu();
    menu.innerHTML = `
        <div class="context-menu-item" onclick="promptCreateFileItem('directory', getDesktopDirectoryFallback())">新建文件夹</div>
        <div class="context-menu-item" onclick="promptCreateFileItem('file', getDesktopDirectoryFallback())">新建文件</div>
        <div class="context-menu-item" onclick="triggerWallpaperPicker()">更换背景...</div>
        <div class="context-menu-item" onclick="resetDesktopBackground()">恢复默认背景</div>
        <div class="context-menu-item" onclick="sortDesktopIconsByName(false)">图标按名称排序</div>
        <div class="context-menu-item" onclick="sortDesktopIconsByName(true)">图标按名称倒序</div>
        <div class="context-menu-item" onclick="resetDesktopIconLayout()">重置图标位置</div>
    `;
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('show');
    
    setTimeout(() => {
        const closeMenu = function() {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }, 100);
}

function triggerWallpaperPicker() {
    const input = document.getElementById('wallpaperPicker');
    if (input) {
        input.click();
    }
}

function initWallpaperPicker() {
    const input = document.getElementById('wallpaperPicker');
    if (!input) return;
    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
            showMessage('请选择图片文件', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            applyDesktopBackground(reader.result, true, file.size);
        };
        reader.readAsDataURL(file);
    });
}

function applyDesktopBackground(dataUrl, persist, fileSize) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    desktop.style.backgroundImage = `url('${dataUrl}')`;
    desktop.style.backgroundSize = 'cover';
    desktop.style.backgroundPosition = 'center';
    desktop.style.backgroundRepeat = 'no-repeat';
    try {
        if (persist && typeof fileSize === 'number' && fileSize <= 2 * 1024 * 1024) {
            localStorage.setItem(DESKTOP_WALLPAPER_KEY, dataUrl);
        } else if (persist) {
            localStorage.removeItem(DESKTOP_WALLPAPER_KEY);
        }
    } catch (e) {
        if (persist) {
            localStorage.removeItem(DESKTOP_WALLPAPER_KEY);
        }
    }
}

function resetDesktopBackground() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    desktop.style.backgroundImage = '';
    desktop.style.backgroundSize = '';
    desktop.style.backgroundPosition = '';
    desktop.style.backgroundRepeat = '';
    localStorage.removeItem(DESKTOP_WALLPAPER_KEY);
}

function restoreDesktopBackground() {
    try {
        const saved = localStorage.getItem(DESKTOP_WALLPAPER_KEY);
        if (saved) {
            applyDesktopBackground(saved, false);
        }
    } catch (e) {
        localStorage.removeItem(DESKTOP_WALLPAPER_KEY);
    }
}

function initDashboard() {
    const overlay = document.getElementById('dashboardOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => toggleDashboard(false));
    }
    const closeBtn = document.getElementById('dashboardClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleDashboard(false));
    }
    const edgeToggle = document.getElementById('dashboardEdgeToggle');
    if (edgeToggle) {
        edgeToggle.addEventListener('click', () => toggleDashboard(true));
    }
}

function toggleDashboard(forceOpen) {
    const panel = document.getElementById('dashboardPanel');
    if (!panel) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('open');
    if (shouldOpen) {
        openDashboardPanel();
    } else {
        closeDashboardPanel();
    }
}

function openDashboardPanel() {
    const panel = document.getElementById('dashboardPanel');
    const overlay = document.getElementById('dashboardOverlay');
    const toggleBtn = document.querySelector('.dashboard-toggle');
    const edgeZone = document.getElementById('dashboardEdgeZone');
    if (!panel || !overlay) return;
    if (dashboardHideTimer) {
        clearTimeout(dashboardHideTimer);
        dashboardHideTimer = null;
    }
    panel.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => {
        panel.classList.add('open');
        overlay.classList.add('show');
    });
    if (toggleBtn) {
        toggleBtn.classList.add('active');
    }
    if (edgeZone) {
        edgeZone.classList.add('open');
    }
    resetDashboardDisplay();
    startDashboardPolling();
}

function closeDashboardPanel() {
    const panel = document.getElementById('dashboardPanel');
    const overlay = document.getElementById('dashboardOverlay');
    const toggleBtn = document.querySelector('.dashboard-toggle');
    const edgeZone = document.getElementById('dashboardEdgeZone');
    if (!panel || !overlay) return;
    panel.classList.remove('open');
    overlay.classList.remove('show');
    stopDashboardPolling();
    if (toggleBtn) {
        toggleBtn.classList.remove('active');
    }
    if (edgeZone) {
        edgeZone.classList.remove('open');
    }
    if (dashboardHideTimer) {
        clearTimeout(dashboardHideTimer);
    }
    dashboardHideTimer = setTimeout(() => {
        panel.hidden = true;
        overlay.hidden = true;
        dashboardHideTimer = null;
    }, 250);
}

function startDashboardPolling() {
    if (dashboardTimer) {
        return;
    }
    fetchDashboardMetrics();
    dashboardTimer = setInterval(fetchDashboardMetrics, 2000);
}

function stopDashboardPolling() {
    if (dashboardTimer) {
        clearInterval(dashboardTimer);
        dashboardTimer = null;
    }
    dashboardInFlight = false;
    dashboardLastNetSample = null;
    dashboardLastNetTimestamp = 0;
}

function fetchDashboardMetrics() {
    if (dashboardInFlight) {
        return;
    }
    dashboardInFlight = true;
    fetch(API_BASE + '/api/metrics')
        .then(response => response.json())
        .then(data => {
            dashboardInFlight = false;
            if (data && data.success) {
                updateDashboardMetrics(data);
            }
        })
        .catch(() => {
            dashboardInFlight = false;
        });
}

function updateDashboardMetrics(data) {
    const cpuUsage = clampMetric(data.cpuUsage);
    const diskUsage = clampMetric(data.diskUsage);
    updatePieChart('cpuPie', 'cpuValue', cpuUsage, '#6dd3fb');
    updatePieChart('diskPie', 'diskValue', diskUsage, '#f7b267');
    updateDashboardText('cpuMeta', cpuUsage !== null ? `使用率 ${cpuUsage.toFixed(1)}%` : '数据获取中');
    updateDashboardText('diskMeta', buildDiskMeta(data));
    updateNetworkMetrics(data);
}

function resetDashboardDisplay() {
    updatePieChart('cpuPie', 'cpuValue', null, '#6dd3fb');
    updatePieChart('diskPie', 'diskValue', null, '#f7b267');
    updateDashboardText('cpuMeta', '数据获取中');
    updateDashboardText('diskMeta', '数据获取中');
    const downEl = document.getElementById('netDown');
    const upEl = document.getElementById('netUp');
    const totalEl = document.getElementById('netTotal');
    if (downEl) downEl.textContent = '--';
    if (upEl) upEl.textContent = '--';
    if (totalEl) totalEl.textContent = '--';
}

function updatePieChart(containerId, valueId, percent, color) {
    const container = document.getElementById(containerId);
    const valueEl = document.getElementById(valueId);
    if (!container || !valueEl) return;
    if (percent === null) {
        valueEl.textContent = '--%';
        container.style.background = 'conic-gradient(rgba(255,255,255,0.1) 0deg, rgba(255,255,255,0.1) 360deg)';
        return;
    }
    const clamped = Math.max(0, Math.min(100, percent));
    const angle = clamped * 3.6;
    container.style.background = `conic-gradient(${color} 0deg ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`;
    valueEl.textContent = `${clamped.toFixed(1)}%`;
}

function updateDashboardText(id, text) {
    const node = document.getElementById(id);
    if (node) {
        node.textContent = text;
    }
}

function clampMetric(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return null;
    }
    return Math.max(0, Math.min(100, value));
}

function buildDiskMeta(data) {
    if (!data || typeof data.diskUsedKb !== 'number' || typeof data.diskTotalKb !== 'number') {
        return '数据获取中';
    }
    const used = formatKilobytes(data.diskUsedKb);
    const total = formatKilobytes(data.diskTotalKb);
    return `已用 ${used} / ${total}`;
}

function updateNetworkMetrics(data) {
    const downEl = document.getElementById('netDown');
    const upEl = document.getElementById('netUp');
    const totalEl = document.getElementById('netTotal');
    if (!downEl || !upEl || !totalEl) return;
    const rx = typeof data.netRxBytes === 'number' ? data.netRxBytes : null;
    const tx = typeof data.netTxBytes === 'number' ? data.netTxBytes : null;
    const now = Date.now();
    let downRate = null;
    let upRate = null;
    if (rx !== null && tx !== null && dashboardLastNetSample) {
        const deltaTime = (now - dashboardLastNetTimestamp) / 1000;
        if (deltaTime > 0) {
            downRate = Math.max(0, (rx - dashboardLastNetSample.rx) / deltaTime);
            upRate = Math.max(0, (tx - dashboardLastNetSample.tx) / deltaTime);
        }
    }
    if (rx !== null && tx !== null) {
        dashboardLastNetSample = { rx, tx };
        dashboardLastNetTimestamp = now;
    }
    downEl.textContent = downRate === null ? '--' : `${formatBytes(downRate)}/s`;
    upEl.textContent = upRate === null ? '--' : `${formatBytes(upRate)}/s`;
    if (rx !== null && tx !== null) {
        totalEl.textContent = `${formatBytes(rx)} / ${formatBytes(tx)}`;
    } else {
        totalEl.textContent = '--';
    }
}

function formatKilobytes(value) {
    if (value <= 0) {
        return '0 KB';
    }
    const kb = value;
    const mb = kb / 1024;
    const gb = mb / 1024;
    if (gb >= 1) {
        return `${gb.toFixed(1)} GB`;
    }
    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }
    return `${Math.round(kb)} KB`;
}

function formatBytes(value) {
    if (value <= 0) {
        return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 显示文件属性
function showFileProperty(filePath) {
    fetch(API_BASE + '/api/file/property?path=' + encodeURIComponent(filePath))
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const file = data.file;
                const content = document.getElementById('propertyContent');
                content.innerHTML = `
                    <div class="property-item">
                        <div class="property-label">名称:</div>
                        <div class="property-value">${escapeHtml(file.name)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">路径:</div>
                        <div class="property-value">${escapeHtml(file.path)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">类型:</div>
                        <div class="property-value">${escapeHtml(file.type)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">大小:</div>
                        <div class="property-value">${formatFileSize(file.size)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">权限:</div>
                        <div class="property-value">${escapeHtml(file.permissions)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">所有者:</div>
                        <div class="property-value">${escapeHtml(file.owner)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">组:</div>
                        <div class="property-value">${escapeHtml(file.group)}</div>
                    </div>
                    <div class="property-item">
                        <div class="property-label">修改时间:</div>
                        <div class="property-value">${escapeHtml(file.modifiedTime)}</div>
                    </div>
                `;
                document.getElementById('propertyDialog').classList.remove('hidden');
            } else {
                alert('获取文件属性失败: ' + data.message);
            }
        })
        .catch(error => {
            alert('获取文件属性错误: ' + error.message);
        });
}

function promptCreateFileItem(type, targetDir) {
    const label = type === 'directory' ? '新建文件夹' : '新建文件';
    const name = prompt(label + '名称');
    if (name === null) {
        return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
        showMessage('名称不能为空', 'error');
        return;
    }
    if (!isValidFileName(trimmed)) {
        showMessage('名称不能包含 / 或 \\', 'error');
        return;
    }
    createFileItem(trimmed, type, targetDir);
}

function createFileItem(name, type, targetDir) {
    const dir = targetDir || getCurrentDirectory();
    const path = joinPath(dir, name);
    const payload = 'path=' + encodeURIComponent(path) + '&type=' + encodeURIComponent(type);
    fetch(API_BASE + '/api/file/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(type === 'directory' ? '文件夹已创建' : '文件已创建', 'success');
            loadFileList(dir);
            refreshDesktopFiles();
        } else {
            showMessage('创建失败: ' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        showMessage('创建失败: ' + error.message, 'error');
    });
}

function getFileIconKey(fileName, fileType, isDirectory) {
    if (fileType === 'directory' || isDirectory) {
        return 'folder';
    }
    if (fileType === 'link') {
        return 'link';
    }
    const name = (fileName || '').toLowerCase().trim();
    if (!name || name === '.' || name === '..') {
        return 'file';
    }
    if (SPECIAL_FILE_ICON_KEYS[name]) {
        return SPECIAL_FILE_ICON_KEYS[name];
    }
    if (name.endsWith('.tar.gz') || name.endsWith('.tar.bz2') || name.endsWith('.tar.xz') || name.endsWith('.tar.zst')) {
        return 'archive';
    }
    const ext = getFileExtension(name);
    if (!ext) {
        return 'file';
    }
    if (IMAGE_EXTS.has(ext)) {
        return 'image';
    }
    if (SCRIPT_EXTS.has(ext)) {
        return 'script';
    }
    if (CODE_EXTS.has(ext)) {
        return 'code';
    }
    if (CONFIG_EXTS.has(ext)) {
        return 'config';
    }
    if (ARCHIVE_EXTS.has(ext)) {
        return 'archive';
    }
    if (AUDIO_EXTS.has(ext)) {
        return 'audio';
    }
    if (VIDEO_EXTS.has(ext)) {
        return 'video';
    }
    if (ext === 'pdf') {
        return 'pdf';
    }
    if (SHEET_EXTS.has(ext)) {
        return 'sheet';
    }
    if (SLIDE_EXTS.has(ext)) {
        return 'slide';
    }
    if (DOC_EXTS.has(ext)) {
        return 'doc';
    }
    if (DB_EXTS.has(ext)) {
        return 'db';
    }
    if (FONT_EXTS.has(ext)) {
        return 'font';
    }
    if (LOG_EXTS.has(ext)) {
        return 'log';
    }
    if (PACKAGE_EXTS.has(ext)) {
        return 'package';
    }
    return 'file';
}

function getFileIconSvg(key) {
    return FILE_ICON_SVGS[key] || FILE_ICON_SVGS.file;
}

function buildIconSvg(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" ' +
        'stroke="currentColor" stroke-width="1.7" fill="none" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
}

function getFileExtension(name) {
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0 || lastDot === name.length - 1) {
        return '';
    }
    return name.substring(lastDot + 1);
}

function getCurrentDirectory() {
    const input = document.getElementById('filePathInput');
    if (input && input.value) {
        return input.value.trim();
    }
    return currentPath || '~';
}

function getDesktopDirectory() {
    return window.desktopPath || '';
}

function getDesktopDirectoryFallback() {
    return window.desktopPath || '~/Desktop';
}

function joinPath(base, name) {
    if (!base) {
        return name;
    }
    if (base.endsWith('/')) {
        return base + name;
    }
    return base + '/' + name;
}

function isValidFileName(name) {
    if (!name || name === '.' || name === '..') {
        return false;
    }
    return !/[\\/]/.test(name);
}

function refreshDesktopFiles() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const isConnected = document.getElementById('connectionStatus') &&
                       document.getElementById('connectionStatus').classList.contains('connected');
    if (!isConnected) return;
    const desktopDir = getDesktopDirectory();
    if (!desktopDir) {
        layoutDesktopIcons(Array.from(desktop.querySelectorAll('.desktop-icon')));
        return;
    }
    fetch(`${API_BASE}/api/file/list?path=${encodeURIComponent(desktopDir)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success || !Array.isArray(data.files)) {
                layoutDesktopIcons(Array.from(desktop.querySelectorAll('.desktop-icon')));
                return;
            }
            desktop.querySelectorAll('.desktop-icon.desktop-file').forEach(node => {
                node.remove();
            });
            data.files.forEach(file => {
                if (file.name === '.' || file.name === '..') {
                    return;
                }
                const icon = document.createElement('div');
                icon.className = 'desktop-icon desktop-file';
                icon.dataset.filePath = file.path;
                icon.dataset.fileType = file.type;
                icon.dataset.fileName = file.name;
                icon.addEventListener('click', (event) => desktopFileClick(icon, event));
                icon.addEventListener('contextmenu', (event) => {
                    showFileContextMenu(event, file.path, file.type);
                });
                const iconGlyph = document.createElement('div');
                const iconKey = getFileIconKey(file.name, file.type, file.isDirectory);
                iconGlyph.className = `desktop-icon-icon file-icon--${iconKey}`;
                iconGlyph.innerHTML = getFileIconSvg(iconKey);
                const label = document.createElement('div');
                label.className = 'desktop-icon-label';
                label.textContent = file.name;
                icon.appendChild(iconGlyph);
                icon.appendChild(label);
                desktop.appendChild(icon);
            });
            layoutDesktopIcons(Array.from(desktop.querySelectorAll('.desktop-icon')));
        })
        .catch(() => {
            layoutDesktopIcons(Array.from(desktop.querySelectorAll('.desktop-icon')));
        });
}

// 关闭属性对话框
function closePropertyDialog() {
    document.getElementById('propertyDialog').classList.add('hidden');
}

function saveFileViewerContent() {
    const contentInput = document.getElementById('fileViewerContent');
    if (!fileViewerPath || !contentInput) {
        showMessage('未打开可保存的文件', 'error');
        return;
    }
    if (isFileViewerImageMode()) {
        showMessage('图片不支持编辑', 'error');
        return;
    }
    const encoded = encodeBase64Utf8(contentInput.value || '');
    const payload = 'path=' + encodeURIComponent(fileViewerPath) +
        '&contentBase64=' + encodeURIComponent(encoded);
    fetch(API_BASE + '/api/file/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('文件已保存', 'success');
            refreshDesktopFiles();
        } else {
            showMessage('保存失败: ' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        showMessage('保存失败: ' + error.message, 'error');
    });
}

function encodeBase64Utf8(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function resetFileViewer() {
    fileViewerPath = '';
    const contentInput = document.getElementById('fileViewerContent');
    if (contentInput) {
        contentInput.value = '';
        contentInput.classList.remove('hidden');
    }
    const imageWrap = document.getElementById('fileViewerImageWrap');
    if (imageWrap) {
        imageWrap.classList.add('hidden');
    }
    const image = document.getElementById('fileViewerImage');
    if (image) {
        image.src = '';
    }
    toggleFileViewerSave(true);
}

// 打开进程管理
function openProcessManager() {
    const window = document.getElementById('processWindow');
    window.classList.remove('hidden');
    ensureWindowPosition('processWindow', 2);
    bringWindowToFront('processWindow');
    registerWindow('processWindow');
    startProcessAutoRefresh();
}

// 刷新进程列表
function refreshProcessList(options) {
    if (processRefreshInFlight) {
        return;
    }
    processRefreshInFlight = true;
    const silent = options && options.silent;
    const content = document.getElementById('processContent');
    if (!silent) {
        content.innerHTML = '<div class="loading">正在加载...</div>';
    }
    
    fetch(API_BASE + '/api/process/list')
        .then(response => response.json())
        .then(data => {
            processRefreshInFlight = false;
            if (data.success) {
                lastProcessList = Array.isArray(data.processes) ? data.processes : [];
                const processes = sortProcessList(lastProcessList);
                content.innerHTML = renderProcessTable(processes);
            } else if (!silent) {
                content.innerHTML = '<div class="loading">错误: ' + data.message + '</div>';
            }
        })
        .catch(error => {
            processRefreshInFlight = false;
            if (!silent) {
                content.innerHTML = '<div class="loading">加载失败: ' + error.message + '</div>';
            }
        });
}

function renderProcessTable(processes) {
    let html = `
        <table class="process-table">
            <thead>
                <tr>
                    <th class="sortable" onclick="toggleProcessSort('pid')">PID${getProcessSortIndicator('pid')}</th>
                    <th class="sortable" onclick="toggleProcessSort('user')">用户${getProcessSortIndicator('user')}</th>
                    <th class="sortable" onclick="toggleProcessSort('cpu')">CPU%${getProcessSortIndicator('cpu')}</th>
                    <th class="sortable" onclick="toggleProcessSort('memory')">内存%${getProcessSortIndicator('memory')}</th>
                    <th class="sortable" onclick="toggleProcessSort('command')">命令${getProcessSortIndicator('command')}</th>
                    <th class="sortable" onclick="toggleProcessSort('startTime')">启动时间${getProcessSortIndicator('startTime')}</th>
                </tr>
            </thead>
            <tbody>
    `;
    processes.forEach(process => {
        const command = process.command || '';
        html += `
            <tr>
                <td>${escapeHtml(process.pid)}</td>
                <td>${escapeHtml(process.user)}</td>
                <td>${Number(process.cpu || 0).toFixed(2)}</td>
                <td>${Number(process.memory || 0).toFixed(2)}</td>
                <td>${escapeHtml(command.substring(0, 50))}${command.length > 50 ? '...' : ''}</td>
                <td>${escapeHtml(process.startTime)}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    return html;
}

function toggleProcessSort(key) {
    if (processSortKey === key) {
        processSortDir = processSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        processSortKey = key;
        processSortDir = getProcessDefaultSortDir(key);
    }
    if (lastProcessList.length) {
        const content = document.getElementById('processContent');
        if (content) {
            content.innerHTML = renderProcessTable(sortProcessList(lastProcessList));
        }
    }
}

function getProcessDefaultSortDir(key) {
    if (key === 'cpu' || key === 'memory') {
        return 'desc';
    }
    return 'asc';
}

function getProcessSortIndicator(key) {
    if (processSortKey !== key) {
        return '';
    }
    const marker = processSortDir === 'asc' ? '^' : 'v';
    return ' <span class="sort-indicator">' + marker + '</span>';
}

function sortProcessList(processes) {
    if (!processSortKey) {
        return processes;
    }
    const dir = processSortDir === 'asc' ? 1 : -1;
    const sorted = processes.slice();
    sorted.sort((a, b) => {
        const aVal = getProcessSortValue(a, processSortKey);
        const bVal = getProcessSortValue(b, processSortKey);
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * dir;
        }
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return aStr.localeCompare(bStr, 'zh-CN') * dir;
    });
    return sorted;
}

function getProcessSortValue(process, key) {
    if (!process) {
        return '';
    }
    switch (key) {
        case 'pid':
            return Number(process.pid) || 0;
        case 'cpu':
            return Number(process.cpu) || 0;
        case 'memory':
            return Number(process.memory) || 0;
        case 'user':
            return process.user || '';
        case 'command':
            return process.command || '';
        case 'startTime':
            return process.startTime || '';
        default:
            return '';
    }
}

function startProcessAutoRefresh() {
    if (processRefreshTimer) {
        return;
    }
    refreshProcessList();
    processRefreshTimer = setInterval(() => {
        const window = document.getElementById('processWindow');
        if (!window || window.classList.contains('hidden')) {
            stopProcessAutoRefresh();
            return;
        }
        refreshProcessList({ silent: true });
    }, 3000);
}

function stopProcessAutoRefresh() {
    if (processRefreshTimer) {
        clearInterval(processRefreshTimer);
        processRefreshTimer = null;
    }
    processRefreshInFlight = false;
}

function sanitizeTerminalChunk(chunk) {
    if (!chunk) {
        return { text: '', clear: false };
    }
    const shouldClear = /\x1b\[[0-9;?]*[HJ]/.test(chunk);
    let text = chunk.replace(/\x1B\[[0-9;?=]*[A-Za-z]/g, '');
    text = text.replace(/\x1B\][^\x07]*\x07/g, '');
    text = text.replace(/\r/g, '');
    return { text, clear: shouldClear };
}

function appendTerminalOutput(chunk) {
    const output = document.getElementById('terminalOutput');
    if (!output) return;
    const parsed = sanitizeTerminalChunk(chunk);
    if (parsed.clear) {
        output.textContent = '';
    }
    if (parsed.text) {
        appendTerminalText(stripTerminalMarkers(parsed.text));
    }
    output.scrollTop = output.scrollHeight;
}

function stripTerminalMarkers(text) {
    const pwdRegex = new RegExp(TERMINAL_PWD_MARKER + '(.*?)' + TERMINAL_PWD_MARKER, 'g');
    let match;
    while ((match = pwdRegex.exec(text)) !== null) {
        const path = match[1].trim();
        if (path) {
            terminalCwd = path;
            if (!terminalHome) {
                terminalHome = path;
            }
        }
    }
    let cleaned = text.replace(pwdRegex, '');
    let promptCount = 0;
    cleaned = cleaned.replace(new RegExp(TERMINAL_PROMPT_MARKER, 'g'), () => {
        promptCount++;
        return '';
    });
    cleaned = filterTerminalInitNoise(cleaned);
    if (promptCount > 0) {
        terminalInitPending = false;
        if (!getTerminalInlineInput()) {
            renderTerminalPromptLine();
        }
    }
    return cleaned;
}

function filterTerminalInitNoise(text) {
    if (!terminalInitPending || !text) {
        return text;
    }
    const lines = text.split('\n');
    const filtered = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            return true;
        }
        if (trimmed.includes('stty -echo')) {
            return false;
        }
        if (trimmed.includes('export PS1=')) {
            return false;
        }
        return true;
    });
    return filtered.join('\n');
}

function appendTerminalText(text, className) {
    const output = document.getElementById('terminalOutput');
    if (!output || !text) return;
    let node;
    if (className) {
        node = document.createElement('span');
        node.className = className;
        node.textContent = text;
    } else {
        node = document.createTextNode(text);
    }
    const promptLine = getTerminalPromptLine();
    if (promptLine) {
        output.insertBefore(node, promptLine);
    } else {
        output.appendChild(node);
    }
    trimTerminalOutput(output, 50000);
}

function renderTerminalPromptLine() {
    const output = document.getElementById('terminalOutput');
    if (!output) return;
    const existing = getTerminalInlineInput();
    if (existing) {
        existing.focus();
        return;
    }
    const line = document.createElement('div');
    line.className = 'terminal-line';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = terminalPrompt + ' ';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-inline-input';
    input.id = 'terminalInlineInput';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.addEventListener('keydown', handleTerminalInlineKeyDown);
    line.appendChild(prompt);
    line.appendChild(input);
    output.appendChild(line);
    input.focus();
    output.scrollTop = output.scrollHeight;
}

function getTerminalInlineInput() {
    return document.getElementById('terminalInlineInput');
}

function getTerminalPromptLine() {
    const input = getTerminalInlineInput();
    return input ? input.parentElement : null;
}

function handleTerminalInlineKeyDown(event) {
    if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        const input = event.target;
        const command = input.value;
        finalizeTerminalInputLine(input, command);
        appendTerminalText('^C\n');
        terminalActiveProgram = '';
        if (terminalSessionActive) {
            sendTerminalInput('\u0003', true);
        }
        renderTerminalPromptLine();
        return;
    }
    if (event.key === 'Tab') {
        event.preventDefault();
        handleTerminalTabCompletion();
        return;
    }
    if (event.key === 'Enter') {
        const input = event.target;
        const command = input.value;
        finalizeTerminalInputLine(input, command);
        if (command.trim()) {
            executeTerminalCommand(command);
        } else if (terminalSessionActive) {
            sendTerminalInput('\n', true);
        } else {
            renderTerminalPromptLine();
        }
    }
}

function handleTerminalGlobalKeyDown(event) {
    if (!(event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'c')) {
        return;
    }
    const terminalWindow = document.getElementById('terminalWindow');
    if (!terminalWindow || terminalWindow.classList.contains('hidden')) {
        return;
    }
    const activeElement = document.activeElement;
    const inlineInput = getTerminalInlineInput();
    if (inlineInput && activeElement === inlineInput) {
        return;
    }
    if (!terminalActiveProgram && (!activeElement || !terminalWindow.contains(activeElement))) {
        return;
    }
    event.preventDefault();
    appendTerminalText('^C\n');
    terminalActiveProgram = '';
    if (terminalSessionActive) {
        sendTerminalInput('\u0003', true);
    }
    renderTerminalPromptLine();
}

function finalizeTerminalInputLine(input, command) {
    const line = input.parentElement;
    input.removeAttribute('id');
    input.disabled = true;
    input.classList.add('terminal-inline-input-disabled');
    const text = document.createElement('span');
    text.className = 'terminal-command';
    text.textContent = command;
    line.removeChild(input);
    line.appendChild(text);
}

function updateTerminalPrompt() {
    terminalPrompt = '#';
}

function initializeShellPrompt() {
    terminalInitPending = true;
    sendTerminalInput('stty -echo\n', true);
    sendTerminalInput('export PS1="' + TERMINAL_PROMPT_MARKER + '"\n', true);
}

function trimTerminalOutput(output, maxLength) {
    let currentLength = output.textContent.length;
    if (currentLength <= maxLength) {
        return;
    }
    while (output.firstChild && currentLength > maxLength) {
        const len = output.firstChild.textContent.length;
        output.removeChild(output.firstChild);
        currentLength -= len;
    }
}

function startTerminalSession() {
    if (terminalSessionActive) {
        startTerminalPolling();
        return Promise.resolve(true);
    }
    if (terminalStartPromise) {
        return terminalStartPromise;
    }
    terminalStartPromise = fetch(API_BASE + '/api/terminal/start', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            terminalSessionActive = true;
            lastTerminalCommand = '';
            terminalActiveProgram = '';
            terminalFallbackNotified = false;
            startTerminalPolling();
            initializeShellPrompt();
            refreshTerminalCwd();
            updateTerminalPrompt();
            if (!getTerminalInlineInput()) {
                renderTerminalPromptLine();
            }
            return true;
        }
        terminalSessionActive = false;
        appendTerminalOutput('终端启动失败: ' + (data.message || '未知错误') + '\n');
        return false;
    })
    .catch(error => {
        terminalSessionActive = false;
        appendTerminalOutput('终端启动失败: ' + error.message + '\n');
        return false;
    })
    .finally(() => {
        terminalStartPromise = null;
    });
    return terminalStartPromise;
}

function startTerminalPolling() {
    if (terminalPollingTimer) return;
    pollTerminalOutput();
    terminalPollingTimer = setInterval(pollTerminalOutput, 500);
}

function pollTerminalOutput() {
    if (!terminalSessionActive || terminalPollingInFlight) return;
    terminalPollingInFlight = true;
    fetch(API_BASE + '/api/terminal/poll')
        .then(response => response.json())
        .then(data => {
            terminalPollingInFlight = false;
            if (!data || data.success === false) {
                return;
            }
            if (!data.active) {
                stopTerminalSession(false);
                return;
            }
            if (data.output) {
                appendTerminalOutput(data.output);
            }
        })
        .catch(() => {
            terminalPollingInFlight = false;
        });
}

function sendTerminalInput(text, raw) {
    const payload = 'input=' + encodeURIComponent(text) + (raw ? '&raw=1' : '');
    return fetch(API_BASE + '/api/terminal/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            appendTerminalOutput('命令发送失败: ' + (data.message || '未知错误') + '\n');
        }
    })
    .catch(error => {
        appendTerminalOutput('命令发送失败: ' + error.message + '\n');
    });
}

function interruptTerminal() {
    return sendTerminalInput('\u0003', true);
}

function sendCommandToShell(command) {
    const isTopCommand = /^\s*(sudo\s+)?(top|htop)(\s|$)/i.test(command);
    const shouldInterrupt = terminalActiveProgram === 'top';
    lastTerminalCommand = command;
    if (/^\s*cd\b/.test(command)) {
        sendTerminalInput(command + '\n');
        sendTerminalInput('printf "' + TERMINAL_PWD_MARKER + '%s' + TERMINAL_PWD_MARKER + '\\n" "$PWD"\n', true);
        return;
    }
    if (shouldInterrupt) {
        terminalActiveProgram = '';
        interruptTerminal().then(() => {
            setTimeout(() => {
                terminalActiveProgram = isTopCommand ? 'top' : '';
                sendTerminalInput(command + '\n');
            }, 250);
        });
    } else {
        terminalActiveProgram = isTopCommand ? 'top' : '';
        sendTerminalInput(command + '\n');
    }
}

function stopTerminalSession(sendStopRequest) {
    terminalSessionActive = false;
    lastTerminalCommand = '';
    terminalActiveProgram = '';
    terminalFallbackNotified = false;
    terminalCwd = '';
    terminalPrompt = '#';
    terminalInitPending = false;
    if (terminalPollingTimer) {
        clearInterval(terminalPollingTimer);
        terminalPollingTimer = null;
    }
    terminalPollingInFlight = false;
    if (sendStopRequest === false) {
        return;
    }
    fetch(API_BASE + '/api/terminal/stop', {
        method: 'POST'
    }).catch(() => {});
}

function refreshTerminalCwd() {
    fetch(API_BASE + '/api/command/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'command=' + encodeURIComponent('pwd')
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.output) {
            const line = data.output.split('\n')[0].trim();
            if (line) {
                terminalCwd = line;
                if (!terminalHome) {
                    terminalHome = line;
                }
            }
        }
    })
    .catch(() => {});
}

function normalizePath(path) {
    if (!path) {
        return '';
    }
    const isAbs = path.startsWith('/');
    const parts = path.split('/').filter(part => part && part !== '.');
    const stack = [];
    parts.forEach(part => {
        if (part === '..') {
            if (stack.length) {
                stack.pop();
            }
        } else {
            stack.push(part);
        }
    });
    const normalized = (isAbs ? '/' : '') + stack.join('/');
    return normalized || (isAbs ? '/' : '');
}

function updateTerminalCwdFromCommand(command) {
    const trimmed = command.trim();
    const match = trimmed.match(/^cd(?:\s+(.+))?$/);
    if (!match) {
        return;
    }
    const target = match[1] ? match[1].trim() : '';
    if (!target || target === '~') {
        if (terminalHome) {
            terminalCwd = terminalHome;
        }
        return;
    }
    if (target === '-') {
        return;
    }
    let next;
    if (target.startsWith('/')) {
        next = target;
    } else if (target.startsWith('~')) {
        const home = terminalHome || terminalCwd || '~';
        next = home + target.slice(1);
    } else {
        const base = terminalCwd || terminalHome || '';
        next = base ? base + '/' + target : target;
    }
    terminalCwd = normalizePath(next);
}

function getTerminalCompletionContext(value) {
    const cursor = value.length;
    const before = value.slice(0, cursor);
    const tokenMatch = before.match(/(?:^|\s)([^\s]*)$/);
    const token = tokenMatch ? tokenMatch[1] : '';
    const start = before.length - token.length;
    const trimmed = before.trim();
    const isFirstToken = trimmed.length === token.length;
    let kind = 'path';
    if (isFirstToken) {
        kind = 'command';
    } else if (/^\s*cd\b/.test(trimmed)) {
        kind = 'dir';
    }
    return { token, start, kind };
}

function applyTerminalCompletion(value, start, completion) {
    const prefix = value.slice(0, start);
    return prefix + completion;
}

function longestCommonPrefix(list) {
    if (!list.length) {
        return '';
    }
    let prefix = list[0];
    for (let i = 1; i < list.length; i++) {
        const item = list[i];
        let j = 0;
        while (j < prefix.length && j < item.length && prefix[j] === item[j]) {
            j++;
        }
        prefix = prefix.slice(0, j);
        if (!prefix) {
            break;
        }
    }
    return prefix;
}

function handleTerminalTabCompletion() {
    const input = getTerminalInlineInput();
    if (!input) return;
    const value = input.value;
    const ctx = getTerminalCompletionContext(value);
    const prefix = ctx.token;
    const query = new URLSearchParams();
    query.set('prefix', prefix);
    query.set('kind', ctx.kind);
    if (terminalCwd) {
        query.set('cwd', terminalCwd);
    }
    fetch(API_BASE + '/api/terminal/complete?' + query.toString())
        .then(response => response.json())
        .then(data => {
            if (!data.success || !Array.isArray(data.suggestions)) {
                return;
            }
            const suggestions = data.suggestions;
            if (!suggestions.length) {
                return;
            }
            if (suggestions.length === 1) {
                input.value = applyTerminalCompletion(value, ctx.start, suggestions[0]) + ' ';
                return;
            }
            const common = longestCommonPrefix(suggestions);
            if (common && common.length > prefix.length) {
                input.value = applyTerminalCompletion(value, ctx.start, common);
            }
            appendTerminalText('\n' + suggestions.join('  ') + '\n', 'terminal-suggestion');
        })
        .catch(() => {});
}

// 打开终端
function openTerminal() {
    const window = document.getElementById('terminalWindow');
    window.classList.remove('hidden');
    ensureWindowPosition('terminalWindow', 1);
    bringWindowToFront('terminalWindow');
    registerWindow('terminalWindow');
    if (!getTerminalInlineInput()) {
        renderTerminalPromptLine();
    }
    startTerminalSession();
}

// 终端按键处理

// 执行终端命令
function executeTerminalCommand(command) {
    if (terminalSessionActive) {
        sendCommandToShell(command);
        renderTerminalPromptLine();
        return;
    }
    startTerminalSession().then(active => {
        if (active) {
            sendCommandToShell(command);
            renderTerminalPromptLine();
            return;
        }
        if (!terminalFallbackNotified) {
            appendTerminalOutput('提示: 交互终端未启动，命令以单次执行模式运行（cd 不会保持）。\n');
            terminalFallbackNotified = true;
        }
        fetch(API_BASE + '/api/command/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'command=' + encodeURIComponent(command)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                appendTerminalOutput((data.output || '') + '\n');
            } else {
                appendTerminalOutput('错误: ' + (data.message || '未知错误') + '\n');
            }
        })
        .catch(error => {
            appendTerminalOutput('错误: ' + error.message + '\n');
        });
        renderTerminalPromptLine();
    });
    return;
}

// 窗口管理
function closeWindow(windowId) {
    document.getElementById(windowId).classList.add('hidden');
    unregisterWindow(windowId);
    if (windowId === 'terminalWindow') {
        stopTerminalSession();
    } else if (windowId === 'fileViewerWindow') {
        resetFileViewer();
    } else if (windowId === 'processWindow') {
        stopProcessAutoRefresh();
    }
}

function minimizeWindow(windowId) {
    // 最小化功能可以后续实现
    console.log('最小化窗口: ' + windowId);
}

function maximizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (window.style.width === '100vw') {
        window.style.width = '';
        window.style.height = '';
        window.style.top = '';
        window.style.left = '';
    } else {
        window.style.width = '100vw';
        window.style.height = 'calc(100vh - 50px)';
        window.style.top = '0';
        window.style.left = '0';
    }
}

function bringWindowToFront(windowId) {
    const window = document.getElementById(windowId);
    zIndex++;
    window.style.zIndex = zIndex;
}

// 初始化窗口拖拽
function initWindowDragging() {
    document.querySelectorAll('.window-header').forEach(header => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const window = header.parentElement;
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            if (e.target.classList.contains('window-btn')) {
                return;
            }
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                bringWindowToFront(window.id);
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                setTranslate(currentX, currentY, window);
            }
        }
        
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
        
        function setTranslate(xPos, yPos, el) {
            el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
        }
    });
}

// 初始化桌面图标
function initDesktopIcons() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    
    // 桌面应用图标配置
    const desktopApps = [
        {
            id: 'fileManager',
            iconKey: 'folder',
            name: '文件管理器',
            action: function() { openFileManager(); }
        },
        {
            id: 'terminal',
            iconKey: 'terminal',
            name: '终端',
            action: function() { openTerminal(); }
        },
        {
            id: 'processManager',
            iconKey: 'process',
            name: '进程管理',
            action: function() { openProcessManager(); }
        }
    ];
    
    // 检查是否已连接SSH
    const isConnected = document.getElementById('connectionStatus') && 
                       document.getElementById('connectionStatus').classList.contains('connected');
    
    // 如果未连接，不显示任何图标
    if (!isConnected) {
        desktop.innerHTML = '';
        return;
    }
    
    // 如果已连接，显示所有应用图标
    let html = '';
    desktopApps.forEach((app, index) => {
        html += `
            <div class="desktop-icon" 
                 data-app-id="${app.id}"
                 onclick="desktopIconClick('${app.id}')"
                 oncontextmenu="showDesktopIconContextMenu(event, '${app.id}'); return false;">
                <div class="desktop-icon-icon file-icon--${app.iconKey}">${getFileIconSvg(app.iconKey)}</div>
                <div class="desktop-icon-label">${app.name}</div>
            </div>
        `;
    });
    
    desktop.innerHTML = html;
    refreshDesktopFiles();
}

function layoutDesktopIcons(icons) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const paddingLeft = 20;
    const paddingTop = 20;
    const cellWidth = 100;
    const cellHeight = 110;
    const availableHeight = Math.max(200, desktop.clientHeight - paddingTop);
    const maxRows = Math.max(1, Math.floor(availableHeight / cellHeight));
    icons.forEach((icon, index) => {
        const row = index % maxRows;
        const col = Math.floor(index / maxRows);
        icon.style.left = `${paddingLeft + col * cellWidth}px`;
        icon.style.top = `${paddingTop + row * cellHeight}px`;
    });
}

function sortDesktopIconsByName(desc) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const icons = Array.from(desktop.querySelectorAll('.desktop-icon'));
    icons.sort((a, b) => {
        const nameA = a.querySelector('.desktop-icon-label')?.textContent || '';
        const nameB = b.querySelector('.desktop-icon-label')?.textContent || '';
        const result = nameA.localeCompare(nameB, 'zh-CN');
        return desc ? -result : result;
    });
    layoutDesktopIcons(icons);
}

function resetDesktopIconLayout() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const icons = Array.from(desktop.querySelectorAll('.desktop-icon'));
    layoutDesktopIcons(icons);
}

// 桌面图标点击事件（处理双击）
let desktopIconClickTimers = {};
function desktopIconClick(appId) {
    const now = Date.now();
    const lastClick = desktopIconClickTimers[appId] || 0;
    
    if (now - lastClick < 300) {
        // 双击
        desktopIconDoubleClick(appId);
        desktopIconClickTimers[appId] = 0;
    } else {
        // 单击选中
        const icon = document.querySelector(`[data-app-id="${appId}"]`);
        selectDesktopIcon(icon);
        desktopIconClickTimers[appId] = now;
    }
}

// 桌面图标双击事件
function desktopIconDoubleClick(appId) {
    switch(appId) {
        case 'fileManager':
            openFileManager();
            break;
        case 'terminal':
            openTerminal();
            break;
        case 'processManager':
            openProcessManager();
            break;
        default:
            console.log('Unknown app:', appId);
    }
}

function desktopFileClick(element, event) {
    event.preventDefault();
    event.stopPropagation();
    selectDesktopIcon(element);
    if (event.detail === 2) {
        const filePath = element.dataset.filePath;
        const fileType = element.dataset.fileType;
        if (fileType === 'directory') {
            openFileManager(filePath);
        } else {
            openFile(filePath);
        }
    }
}

function selectDesktopIcon(element) {
    document.querySelectorAll('.desktop-icon').forEach(i => {
        i.classList.remove('selected');
    });
    if (element) {
        element.classList.add('selected');
    }
}

// 显示桌面图标右键菜单
function showDesktopIconContextMenu(event, appId) {
    event.preventDefault();
    event.stopPropagation();
    
    const menu = document.getElementById('contextMenu') || createContextMenu();
    
    const appNames = {
        'fileManager': '文件管理器',
        'terminal': '终端',
        'processManager': '进程管理'
    };
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="desktopIconDoubleClick('${appId}'); document.getElementById('contextMenu').classList.remove('show');">打开</div>
        <div class="context-menu-item" onclick="showDesktopIconProperties('${appId}'); document.getElementById('contextMenu').classList.remove('show');">属性</div>
    `;
    
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('show');
    
    setTimeout(() => {
        const closeMenu = function() {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }, 100);
}

// 显示桌面图标属性
function showDesktopIconProperties(appId) {
    const appNames = {
        'fileManager': '文件管理器',
        'terminal': '终端',
        'processManager': '进程管理'
    };
    
    const appIconKeys = {
        'fileManager': 'folder',
        'terminal': 'terminal',
        'processManager': 'process'
    };
    const iconKey = appIconKeys[appId] || 'file';
    const iconSvg = getFileIconSvg(iconKey);
    
    const content = document.getElementById('propertyContent');
    content.innerHTML = `
        <div class="property-item">
            <div class="property-label">名称:</div>
            <div class="property-value">${appNames[appId]}</div>
        </div>
        <div class="property-item">
            <div class="property-label">类型:</div>
            <div class="property-value">应用程序快捷方式</div>
        </div>
        <div class="property-item">
            <div class="property-label">图标:</div>
            <div class="property-value"><span class="property-icon file-icon--${iconKey}">${iconSvg}</span></div>
        </div>
    `;
    document.getElementById('propertyDialog').classList.remove('hidden');
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
