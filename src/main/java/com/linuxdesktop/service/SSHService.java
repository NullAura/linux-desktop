package com.linuxdesktop.service;

import com.jcraft.jsch.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * SSH连接服务类
 * 负责管理与Linux服务器的SSH连接
 */
public class SSHService {
    private static SSHService instance;
    private Session session;
    private String host;
    private int port;
    private String username;
    private ChannelShell shellChannel;
    private InputStream shellInput;
    private OutputStream shellOutput;
    private Thread shellReaderThread;
    private final Object shellLock = new Object();
    private StringBuilder shellBuffer = new StringBuilder();
    private static final int SHELL_BUFFER_MAX = 200000;
    private String lastShellError;
    
    private SSHService() {
    }
    
    public static SSHService getInstance() {
        if (instance == null) {
            instance = new SSHService();
        }
        return instance;
    }
    
    /**
     * 建立SSH连接
     */
    public boolean connect(String host, int port, String username, String password) {
        try {
            // 如果已有连接，先断开
            if (session != null && session.isConnected()) {
                stopShell();
                session.disconnect();
            }
            
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            session.setPassword(password);
            
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            // 兼容大多数 sshd 的密码/质询认证和常见算法（过滤掉 JSch 0.1.55 不支持的 curve25519/ed25519，避免 NPE）
            config.put("PreferredAuthentications", "password,keyboard-interactive");
            config.put("server_host_key", "ecdsa-sha2-nistp256,ecdsa-sha2-nistp384,ecdsa-sha2-nistp521,ssh-rsa");
            config.put("kex", "diffie-hellman-group-exchange-sha256,diffie-hellman-group14-sha256,diffie-hellman-group14-sha1,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521");
            config.put("cipher.c2s", "aes128-ctr,aes192-ctr,aes256-ctr,aes128-cbc,3des-cbc");
            config.put("cipher.s2c", "aes128-ctr,aes192-ctr,aes256-ctr,aes128-cbc,3des-cbc");
            config.put("mac.c2s", "hmac-sha2-256,hmac-sha2-512,hmac-sha1");
            config.put("mac.s2c", "hmac-sha2-256,hmac-sha2-512,hmac-sha1");
            session.setConfig(config);
            
            // 设置连接超时为30秒
            session.connect(30000);
            
            // 验证连接是否真正建立
            if (!session.isConnected()) {
                return false;
            }
            
            // 执行一个简单命令来验证连接可用性
            try {
                String testResult = executeCommand("echo 'test'");
                if (testResult == null || testResult.contains("错误")) {
                    // 连接不可用
                    session.disconnect();
                    return false;
                }
            } catch (Exception e) {
                // 测试命令失败，连接可能有问题
                if (session != null && session.isConnected()) {
                    session.disconnect();
                }
                return false;
            }
            
            this.host = host;
            this.port = port;
            this.username = username;
            
            return true;
        } catch (JSchException e) {
            e.printStackTrace();
            // 确保在异常时清理session
            if (session != null && session.isConnected()) {
                try {
                    session.disconnect();
                } catch (Exception ex) {
                    // 忽略断开连接时的异常
                }
            }
            return false;
        }
    }
    
    /**
     * 执行Linux命令
     */
    public String executeCommand(String command) {
        if (session == null || !session.isConnected()) {
            return "错误: 未连接到SSH服务器";
        }
        
        Channel channel = null;
        try {
            channel = session.openChannel("exec");
            ((ChannelExec) channel).setCommand(command);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
            
            channel.setInputStream(null);
            ((ChannelExec) channel).setErrStream(errorStream);
            channel.setOutputStream(outputStream);
            
            channel.connect();
            
            // 等待命令执行完成
            while (!channel.isClosed()) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            
            String result = outputStream.toString("UTF-8");
            String error = errorStream.toString("UTF-8");
            
            if (error != null && !error.isEmpty()) {
                return result + "\n错误: " + error;
            }
            
            return result;
        } catch (Exception e) {
            return "错误: " + e.getMessage();
        } finally {
            if (channel != null) {
                channel.disconnect();
            }
        }
    }
    
    /**
     * 检查连接状态
     */
    public boolean isConnected() {
        return session != null && session.isConnected();
    }
    
    /**
     * 断开连接
     */
    public void disconnect() {
        if (session != null && session.isConnected()) {
            stopShell();
            session.disconnect();
        }
    }
    
    public String getHost() {
        return host;
    }
    
    public String getUsername() {
        return username;
    }
    
    /**
     * 检查并创建桌面文件夹
     * 如果~/Desktop不存在，则创建它
     * @return 桌面文件夹的完整路径
     */
    public String ensureDesktopFolder() {
        if (!isConnected()) {
            return null;
        }
        
        try {
            // 获取用户主目录
            String homeDir = executeCommand("echo $HOME").trim();
            if (homeDir == null || homeDir.isEmpty()) {
                return null;
            }
            
            String desktopPath = homeDir + "/Desktop";
            
            // 检查Desktop文件夹是否存在
            String checkCommand = "[ -d \"" + desktopPath + "\" ] && echo 'exists' || echo 'not exists'";
            String checkResult = executeCommand(checkCommand).trim();
            
            // 如果不存在，创建它
            if ("not exists".equals(checkResult)) {
                String createCommand = "mkdir -p \"" + desktopPath + "\" && chmod 755 \"" + desktopPath + "\"";
                executeCommand(createCommand);
                // 验证是否创建成功
                checkResult = executeCommand(checkCommand).trim();
                if ("exists".equals(checkResult)) {
                    return desktopPath;
                } else {
                    return null;
                }
            } else {
                return desktopPath;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 获取桌面文件夹路径
     * @return 桌面文件夹的完整路径，如果不存在则返回null
     */
    public String getDesktopFolder() {
        if (!isConnected()) {
            return null;
        }
        
        try {
            // 获取用户主目录
            String homeDir = executeCommand("echo $HOME").trim();
            if (homeDir == null || homeDir.isEmpty()) {
                return null;
            }
            
            String desktopPath = homeDir + "/Desktop";
            
            // 检查Desktop文件夹是否存在
            String checkCommand = "[ -d \"" + desktopPath + "\" ] && echo 'exists' || echo 'not exists'";
            String checkResult = executeCommand(checkCommand).trim();
            
            if ("exists".equals(checkResult)) {
                return desktopPath;
            } else {
                return null;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public synchronized boolean startShell() {
        if (!isConnected()) {
            return false;
        }
        try {
            lastShellError = null;
            if (shellChannel != null && shellChannel.isConnected()) {
                return true;
            }
            stopShell();
            shellChannel = (ChannelShell) session.openChannel("shell");
            shellChannel.setPtyType("xterm");
            shellInput = shellChannel.getInputStream();
            shellOutput = shellChannel.getOutputStream();
            shellChannel.connect(5000);

            shellReaderThread = new Thread(() -> {
                byte[] buffer = new byte[4096];
                try {
                    int read;
                    while (shellChannel != null && shellChannel.isConnected()
                            && (read = shellInput.read(buffer)) != -1) {
                        String chunk = new String(buffer, 0, read, StandardCharsets.UTF_8);
                        synchronized (shellLock) {
                            shellBuffer.append(chunk);
                            if (shellBuffer.length() > SHELL_BUFFER_MAX) {
                                shellBuffer.delete(0, shellBuffer.length() - SHELL_BUFFER_MAX);
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // 连接关闭或中断
                }
            }, "ssh-shell-reader");
            shellReaderThread.setDaemon(true);
            shellReaderThread.start();
            return true;
        } catch (Exception e) {
            lastShellError = e.getMessage() != null ? e.getMessage() : e.toString();
            e.printStackTrace();
            stopShell();
            return false;
        }
    }

    public synchronized boolean isShellActive() {
        return shellChannel != null && shellChannel.isConnected();
    }

    public String getLastShellError() {
        return lastShellError;
    }

    public boolean sendShellInput(String input) {
        if (!isShellActive() || input == null) {
            return false;
        }
        try {
            shellOutput.write(input.getBytes(StandardCharsets.UTF_8));
            shellOutput.flush();
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public String pollShellOutput() {
        synchronized (shellLock) {
            if (shellBuffer.length() == 0) {
                return "";
            }
            String output = shellBuffer.toString();
            shellBuffer.setLength(0);
            return output;
        }
    }

    public synchronized void stopShell() {
        if (shellChannel != null) {
            try {
                shellChannel.disconnect();
            } catch (Exception ignored) {
            }
        }
        shellChannel = null;
        shellInput = null;
        shellOutput = null;
        if (shellReaderThread != null) {
            shellReaderThread.interrupt();
            shellReaderThread = null;
        }
        synchronized (shellLock) {
            shellBuffer.setLength(0);
        }
    }
}
