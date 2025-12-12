# Linux可视化桌面系统

一个基于JSP/JavaBean的Linux远程可视化桌面系统，通过SSH连接实现远程Linux服务器的可视化操作。

## 功能特性

- ✅ **SSH远程连接**: 通过SSH协议连接Linux服务器
- ✅ **文件管理器**: 可视化浏览Linux文件系统，支持双击打开文件/文件夹
- ✅ **文件属性查看**: 右键查看文件详细属性（权限、所有者、大小等）
- ✅ **终端模拟**: 在Web界面执行Linux命令
- ✅ **进程管理**: 查看系统运行进程信息
- ✅ **窗口管理**: 支持拖拽、最小化、最大化等窗口操作
- ✅ **桌面图标**: 双击图标快速打开应用程序

## 技术架构

### 开发模式
- **MVC架构模式**
  - **Model**: JavaBean (FileInfo, ProcessInfo)
  - **View**: JSP页面
  - **Controller**: Servlet

### 技术栈
- **后端**: JSP, Servlet, JavaBean
- **前端**: HTML5, CSS3, JavaScript
- **SSH连接**: JSch库
- **构建工具**: Maven
- **服务器**: Tomcat 8.5+

## 项目结构

```
web-final/
├── pom.xml                          # Maven配置文件
├── README.md                        # 项目说明文档
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── linuxdesktop/
        │           ├── bean/        # JavaBean模型层
        │           │   ├── FileInfo.java
        │           │   └── ProcessInfo.java
        │           ├── filter/      # 过滤器
        │           │   └── CharacterEncodingFilter.java
        │           ├── service/     # 业务逻辑层
        │           │   └── SSHService.java
        │           ├── servlet/     # Servlet控制器层
        │           │   ├── SSHConnectServlet.java
        │           │   ├── FileListServlet.java
        │           │   ├── FilePropertyServlet.java
        │           │   ├── FileOpenServlet.java
        │           │   ├── CommandExecuteServlet.java
        │           │   └── ProcessListServlet.java
        │           └── util/        # 工具类
        │               ├── FileParser.java
        │               └── ProcessParser.java
        └── webapp/
            ├── WEB-INF/
            │   └── web.xml          # Web应用配置文件
            ├── index.jsp            # 主页面
            ├── css/
            │   └── desktop.css      # 样式文件
            └── js/
                └── desktop.js       # 前端脚本
```

## 安装和部署

### 环境要求

- JDK 1.8 或更高版本
- Maven 3.6+
- Tomcat 8.5+ 或支持Servlet 3.1的Web服务器
- 一个可访问的Linux服务器（用于SSH连接）

### 编译和打包

1. 克隆或下载项目到本地

2. 在项目根目录执行Maven打包命令：
```bash
mvn clean package
```

3. 打包完成后，在 `target` 目录下会生成 `linux-desktop.war` 文件

### 部署到Tomcat

1. 将 `linux-desktop.war` 复制到Tomcat的 `webapps` 目录

2. 启动Tomcat服务器

3. 访问 `http://localhost:8080/linux-desktop/`

### 使用说明

1. **连接SSH服务器**
   - 点击任务栏的"SSH连接"按钮
   - 输入Linux服务器的主机地址、端口、用户名和密码
   - 点击"连接"按钮

2. **文件管理**
   - 点击任务栏的"文件管理器"按钮
   - 双击文件夹进入目录
   - 双击文件打开文件（文本文件会在新窗口显示）
   - 右键点击文件选择"属性"查看详细信息

3. **终端使用**
   - 点击任务栏的"终端"按钮
   - 输入Linux命令并按Enter执行
   - 查看命令执行结果

4. **进程管理**
   - 点击任务栏的"进程管理"按钮
   - 查看系统运行的所有进程
   - 点击"刷新"更新进程列表

## API接口说明

### SSH连接
- **POST** `/ssh/connect` - 建立SSH连接
  - 参数: host, port, username, password
- **GET** `/ssh/connect` - 检查连接状态

### 文件操作
- **GET** `/api/file/list?path=xxx` - 获取文件列表
- **GET** `/api/file/property?path=xxx` - 获取文件属性
- **POST** `/api/file/open` - 打开文件
  - 参数: path, action (可选: view, edit, execute)

### 命令执行
- **POST** `/api/command/execute` - 执行Linux命令
  - 参数: command

### 进程管理
- **GET** `/api/process/list` - 获取进程列表

## 注意事项

1. **安全性**: 
   - 本系统仅用于开发和测试环境
   - 生产环境使用请加强安全措施（HTTPS、身份验证等）
   - SSH密码以明文传输，建议使用密钥认证

2. **性能**: 
   - SSH连接会保持会话状态
   - 建议在会话超时后重新连接
   - 大文件传输可能较慢

3. **兼容性**: 
   - 支持主流Linux发行版（Ubuntu, CentOS, Debian等）
   - 浏览器支持：Chrome, Firefox, Safari, Edge（最新版本）

## 开发说明

### MVC架构说明

1. **Model层 (JavaBean)**
   - `FileInfo.java`: 文件信息模型
   - `ProcessInfo.java`: 进程信息模型

2. **View层 (JSP)**
   - `index.jsp`: 主视图，包含桌面UI和所有窗口

3. **Controller层 (Servlet)**
   - 各功能Servlet负责处理HTTP请求，调用Service层，返回JSON数据

4. **Service层**
   - `SSHService.java`: SSH连接和命令执行服务

### 扩展功能建议

- 文件上传/下载功能
- 文件编辑功能
- 文件/文件夹重命名、删除、创建
- 支持SSH密钥认证
- 多用户会话管理
- 文件预览（图片、PDF等）
- 系统监控面板

## 许可证

本项目仅供学习和研究使用。

## 作者

Linux可视化桌面系统开发团队

## 更新日志

### v1.0.0 (2024-12-25)
- 初始版本发布
- 实现SSH连接功能
- 实现文件管理器功能
- 实现终端模拟功能
- 实现进程管理功能
- 实现文件属性查看功能
