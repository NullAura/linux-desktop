# Linux可视化桌面系统

基于JSP/Servlet的Linux远程可视化桌面系统，通过SSH连接远程服务器，在浏览器中完成文件管理、终端操作和系统监控等任务。

## 功能特性

- SSH远程连接，支持密码登录
- 桌面与窗口管理，任务栏支持上下切换
- 文件管理器：浏览目录、右键菜单、创建/删除、拖拽上传
- 文件预览与编辑：文本编辑、图片预览
- 终端模拟：交互式输出、Tab补全与模糊匹配、Ctrl+C终止
- 进程管理：动态刷新、按CPU/内存排序
- 系统仪表盘：CPU/磁盘/网络实时数据（右侧浮窗）
- 桌面背景更换、图标排序与布局重置
- macOS风格图标与按钮样式

## 技术栈

- 后端：JSP、Servlet、JavaBean
- 前端：HTML5、CSS3、JavaScript
- SSH：JSch
- JSON：Gson
- 构建：Maven
- 服务器：Tomcat 7/8/9（Servlet 3.1）

## 项目结构

```
web-final/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/com/linuxdesktop/
        │   ├── bean/
        │   │   ├── FileInfo.java
        │   │   └── ProcessInfo.java
        │   ├── filter/
        │   │   └── CharacterEncodingFilter.java
        │   ├── service/
        │   │   └── SSHService.java
        │   ├── servlet/
        │   │   ├── SSHConnectServlet.java
        │   │   ├── FileListServlet.java
        │   │   ├── FileOpenServlet.java
        │   │   ├── FileSaveServlet.java
        │   │   ├── FileCreateServlet.java
        │   │   ├── FileDeleteServlet.java
        │   │   ├── FileUploadServlet.java
        │   │   ├── FilePropertyServlet.java
        │   │   ├── TerminalStartServlet.java
        │   │   ├── TerminalSendServlet.java
        │   │   ├── TerminalPollServlet.java
        │   │   ├── TerminalStopServlet.java
        │   │   ├── TerminalCompleteServlet.java
        │   │   ├── CommandExecuteServlet.java
        │   │   ├── ProcessListServlet.java
        │   │   └── SystemMetricsServlet.java
        │   └── util/
        │       ├── FileParser.java
        │       └── ProcessParser.java
        └── webapp/
            ├── WEB-INF/web.xml
            ├── index.jsp
            ├── css/
            │   ├── desktop.css
            │   └── connection-page.css
            └── js/
                └── desktop.js
```

## 快速启动（本地）

1. 安装JDK 8+ 与 Maven 3.6+
2. 进入项目根目录
3. 启动内置Tomcat：

```bash
mvn tomcat7:run
```

访问 `http://localhost:8080/linux-desktop/`，在登录页输入SSH信息即可。

> 默认端口为8080，若冲突可临时指定端口：  
> `mvn -Dtomcat.port=8081 tomcat7:run`

## 打包部署（外部Tomcat）

```bash
mvn clean package
```

将生成的 `target/linux-desktop.war` 部署到Tomcat 7/8/9的 `webapps` 目录，访问：
`http://<服务器IP>:<端口>/linux-desktop/`

## 跨系统部署指南

### macOS

```bash
brew install maven
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
mvn -v
mvn tomcat7:run
```

### Windows（PowerShell）

1. 安装JDK（建议Temurin 8/11/17）与Maven  
2. 配置环境变量 `JAVA_HOME` 和 `Path`

```powershell
mvn -v
mvn tomcat7:run
```

### Linux

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y openjdk-11-jdk maven

# CentOS/RHEL
sudo yum install -y java-11-openjdk-devel maven

mvn -v
mvn tomcat7:run
```

## 远端Linux服务器要求

- 允许SSH密码登录（或按需扩展为密钥）
- 启用SFTP子系统（用于拖拽上传）
- 常用命令可用：`bash`、`ls`、`ps`、`df`、`file`、`base64`、`head`、`cat`、`mkdir`、`rm`、`chmod`
- 终端补全使用 `compgen`，建议默认Shell为bash

## 配置说明

- 修改端口：`pom.xml` 中 `tomcat.port` 或运行时 `-Dtomcat.port=xxxx`
- 修改访问路径：`pom.xml` 中 tomcat7插件的 `path`

## API接口

### SSH
- `POST /ssh/connect` 建立连接（host, port, username, password）
- `GET /ssh/connect` 查询连接状态

### 文件
- `GET /api/file/list?path=xxx`
- `GET /api/file/property?path=xxx`
- `POST /api/file/open`（path, action: view/edit/execute）
- `POST /api/file/save`（path, contentBase64）
- `POST /api/file/create`（path, type）
- `POST /api/file/delete`（path）
- `POST /api/file/upload`（multipart: file, path）

### 终端
- `POST /api/terminal/start`
- `POST /api/terminal/send`
- `GET /api/terminal/poll`
- `POST /api/terminal/stop`
- `GET /api/terminal/complete?prefix=...`

### 进程
- `GET /api/process/list`

### 仪表盘
- `GET /api/metrics`

## 常见问题

- 端口被占用：修改 `tomcat.port` 或结束占用进程
- 图片预览失败：确保远端有 `base64` 命令且文件可读
- 上传失败：检查SFTP是否启用、目录权限是否允许写入
- 仪表盘显示空值：非Linux环境运行时无法读取 `/proc`，可忽略
- Tomcat启动出现 `module-info.class` 警告：Tomcat 7扫描依赖时的已知提示，不影响功能

## 许可证

本项目仅供学习与研究使用。

## 更新日志

### v1.2.0
- 文件上传与图片预览
- 终端补全与模糊匹配
- 进程排序与系统仪表盘
- macOS风格图标与桌面优化
