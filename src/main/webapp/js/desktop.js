// 全局变量
let currentPath = '~';
let fileManagerHistory = [];
let selectedFile = null;
let zIndex = 100;

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
    // 检查SSH连接状态
    checkSSHConnection();
    
    // SSH连接表单提交
    document.getElementById('sshForm').addEventListener('submit', function(e) {
        e.preventDefault();
        connectSSH();
    });
    
    // 初始化桌面图标
    initDesktopIcons();
    
    // 初始化窗口拖拽
    initWindowDragging();
    
    // 初始化右键菜单
    initContextMenu();
});

// 更新连接状态显示
function updateConnectionStatus(connected, username, host) {
    const statusElement = document.getElementById('connectionStatus');
    if (connected && username && host) {
        statusElement.textContent = '已连接: ' + username + '@' + host;
        statusElement.classList.add('connected');
        // 更新桌面图标
        setTimeout(initDesktopIcons, 100);
    } else {
        statusElement.textContent = '未连接';
        statusElement.classList.remove('connected');
        // 更新桌面图标
        setTimeout(initDesktopIcons, 100);
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

// 显示SSH连接对话框
function showSSHDialog() {
    document.getElementById('sshDialog').classList.remove('hidden');
}

// 关闭SSH连接对话框
function closeSSHDialog() {
    document.getElementById('sshDialog').classList.add('hidden');
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
    const cancelBtn = document.getElementById('cancelBtn');
    const connectingStatus = document.getElementById('connectingStatus');
    const connectingText = connectingStatus.querySelector('.connecting-text');
    
    // 禁用按钮，显示加载状态
    connectBtn.disabled = true;
    cancelBtn.disabled = true;
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
            // 短暂延迟后关闭对话框，让用户看到成功提示
            setTimeout(() => {
                // 更新连接状态
                updateConnectionStatus(true, username, host);
                
                // 重置UI状态
                connectBtn.disabled = false;
                cancelBtn.disabled = false;
                connectingStatus.classList.add('hidden');
                closeSSHDialog();
                
                // 显示成功提示（包含桌面文件夹信息）
                let message = '连接成功！';
                if (data.desktopPath) {
                    message += ' 桌面文件夹: ' + data.desktopPath;
                    // 保存桌面路径到全局变量
                    window.desktopPath = data.desktopPath;
                } else {
                    window.desktopPath = null;
                }
                showMessage(message, 'success');
                
                // 连接成功后显示桌面图标
                initDesktopIcons();
            }, 500);
        } else {
            // 连接失败
            connectBtn.disabled = false;
            cancelBtn.disabled = false;
            connectingStatus.classList.add('hidden');
            alert('连接失败: ' + data.message);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        
        // 重置UI状态
        connectBtn.disabled = false;
        cancelBtn.disabled = false;
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
function openFileManager() {
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
        bringWindowToFront('fileManagerWindow');
        fileManagerGoHome();
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
                    html += `
                        <div class="file-item" onclick="fileManagerNavigateTo('..')">
                            <div class="file-icon">📁</div>
                            <div class="file-name">..</div>
                        </div>
                    `;
                }
                
                data.files.forEach(file => {
                    // 跳过 . 和 .. 目录
                    if (file.name === '.' || file.name === '..') {
                        return;
                    }
                    
                    const icon = file.isDirectory ? '📁' : '📄';
                    html += `
                        <div class="file-item" 
                             data-path="${escapeHtml(file.path)}"
                             data-name="${escapeHtml(file.name)}"
                             data-type="${file.type}"
                             onclick="fileItemClick(this, event)"
                             oncontextmenu="showFileContextMenu(event, '${escapeHtml(file.path)}', '${file.type}')">
                            <div class="file-icon">${icon}</div>
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
        body: 'path=' + encodeURIComponent(filePath)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.type === 'text') {
                openFileViewer(filePath, data.content);
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
    document.getElementById('fileViewerContent').textContent = content;
    window.classList.remove('hidden');
    bringWindowToFront('fileViewerWindow');
}

// 显示文件右键菜单
function showFileContextMenu(event, filePath, fileType) {
    event.preventDefault();
    event.stopPropagation();
    
    const menu = document.getElementById('contextMenu') || createContextMenu();
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="openFile('${filePath.replace(/'/g, "\\'")}')">打开</div>
        <div class="context-menu-item" onclick="showFileProperty('${filePath.replace(/'/g, "\\'")}')">属性</div>
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

// 关闭属性对话框
function closePropertyDialog() {
    document.getElementById('propertyDialog').classList.add('hidden');
}

// 打开进程管理
function openProcessManager() {
    const window = document.getElementById('processWindow');
    window.classList.remove('hidden');
    bringWindowToFront('processWindow');
    refreshProcessList();
}

// 刷新进程列表
function refreshProcessList() {
    const content = document.getElementById('processContent');
    content.innerHTML = '<div class="loading">正在加载...</div>';
    
    fetch(API_BASE + '/api/process/list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let html = `
                    <table class="process-table">
                        <thead>
                            <tr>
                                <th>PID</th>
                                <th>用户</th>
                                <th>CPU%</th>
                                <th>内存%</th>
                                <th>命令</th>
                                <th>启动时间</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.processes.forEach(process => {
                    html += `
                        <tr>
                            <td>${escapeHtml(process.pid)}</td>
                            <td>${escapeHtml(process.user)}</td>
                            <td>${process.cpu.toFixed(2)}</td>
                            <td>${process.memory.toFixed(2)}</td>
                            <td>${escapeHtml(process.command.substring(0, 50))}${process.command.length > 50 ? '...' : ''}</td>
                            <td>${escapeHtml(process.startTime)}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table>';
                content.innerHTML = html;
            } else {
                content.innerHTML = '<div class="loading">错误: ' + data.message + '</div>';
            }
        })
        .catch(error => {
            content.innerHTML = '<div class="loading">加载失败: ' + error.message + '</div>';
        });
}

// 打开终端
function openTerminal() {
    const window = document.getElementById('terminalWindow');
    window.classList.remove('hidden');
    bringWindowToFront('terminalWindow');
    document.getElementById('terminalInput').focus();
}

// 终端按键处理
function handleTerminalKeyPress(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminalInput');
        const command = input.value;
        
        if (command.trim()) {
            executeTerminalCommand(command);
            input.value = '';
        }
    }
}

// 执行终端命令
function executeTerminalCommand(command) {
    const output = document.getElementById('terminalOutput');
    output.innerHTML += '<div>$ ' + escapeHtml(command) + '</div>';
    
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
            output.innerHTML += '<div>' + escapeHtml(data.output) + '</div>';
        } else {
            output.innerHTML += '<div style="color: #ff4444;">错误: ' + escapeHtml(data.message) + '</div>';
        }
        output.scrollTop = output.scrollHeight;
    })
    .catch(error => {
        output.innerHTML += '<div style="color: #ff4444;">错误: ' + escapeHtml(error.message) + '</div>';
        output.scrollTop = output.scrollHeight;
    });
}

// 窗口管理
function closeWindow(windowId) {
    document.getElementById(windowId).classList.add('hidden');
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
            icon: '📁',
            name: '文件管理器',
            action: function() { openFileManager(); }
        },
        {
            id: 'terminal',
            icon: '💻',
            name: '终端',
            action: function() { openTerminal(); }
        },
        {
            id: 'processManager',
            icon: '⚙️',
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
    
    // 如果已连接，显示所有应用图标（竖向排列）
    let html = '';
    desktopApps.forEach((app, index) => {
        // 竖向排列：固定left，根据index计算top
        const left = 20;
        const top = 20 + index * 120; // 每个图标间距120px
        html += `
            <div class="desktop-icon" 
                 data-app-id="${app.id}"
                 style="left: ${left}px; top: ${top}px;"
                 onclick="desktopIconClick('${app.id}')"
                 oncontextmenu="showDesktopIconContextMenu(event, '${app.id}'); return false;">
                <div class="desktop-icon-icon">${app.icon}</div>
                <div class="desktop-icon-label">${app.name}</div>
            </div>
        `;
    });
    
    desktop.innerHTML = html;
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
        document.querySelectorAll('.desktop-icon').forEach(i => {
            i.classList.remove('selected');
        });
        const icon = document.querySelector(`[data-app-id="${appId}"]`);
        if (icon) icon.classList.add('selected');
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
    
    const appIcons = {
        'fileManager': '📁',
        'terminal': '💻',
        'processManager': '⚙️'
    };
    
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
            <div class="property-value">${appIcons[appId]}</div>
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
