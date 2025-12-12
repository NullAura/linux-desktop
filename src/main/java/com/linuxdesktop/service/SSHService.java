package com.linuxdesktop.service;

import com.jcraft.jsch.*;
import java.io.*;
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
                session.disconnect();
            }
            
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            session.setPassword(password);
            
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            config.put("PreferredAuthentications", "password");
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
}
