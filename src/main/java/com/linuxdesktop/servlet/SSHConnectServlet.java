package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.service.SSHService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * SSH连接控制器
 */
public class SSHConnectServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        
        String host = request.getParameter("host");
        String portStr = request.getParameter("port");
        String username = request.getParameter("username");
        String password = request.getParameter("password");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            int port = Integer.parseInt(portStr);
            
            SSHService sshService = SSHService.getInstance();
            
            // 如果已连接，先断开
            if (sshService.isConnected()) {
                sshService.disconnect();
            }
            
            boolean connected = sshService.connect(host, port, username, password);
            
            if (connected) {
                // 检查并创建桌面文件夹
                String desktopPath = sshService.ensureDesktopFolder();
                
                // 保存连接信息到session
                HttpSession session = request.getSession();
                session.setAttribute("sshConnected", true);
                session.setAttribute("sshHost", host);
                session.setAttribute("sshUsername", username);
                
                if (desktopPath != null) {
                    session.setAttribute("desktopPath", desktopPath);
                    result.put("success", true);
                    result.put("message", "连接成功，桌面文件夹: " + desktopPath);
                    result.put("desktopPath", desktopPath);
                } else {
                    result.put("success", true);
                    result.put("message", "连接成功，但无法创建桌面文件夹");
                }
            } else {
                result.put("success", false);
                result.put("message", "连接失败，请检查主机地址、端口、用户名和密码");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "连接错误: " + e.getMessage());
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        Map<String, Object> result = new HashMap<>();
        SSHService sshService = SSHService.getInstance();
        
        result.put("connected", sshService.isConnected());
        if (sshService.isConnected()) {
            result.put("host", sshService.getHost());
            result.put("username", sshService.getUsername());
            HttpSession session = request.getSession();
            Object desktopPath = session.getAttribute("desktopPath");
            if (desktopPath == null) {
                String ensured = sshService.ensureDesktopFolder();
                if (ensured != null) {
                    session.setAttribute("desktopPath", ensured);
                    desktopPath = ensured;
                }
            }
            if (desktopPath != null) {
                result.put("desktopPath", desktopPath.toString());
            }
        } else {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.removeAttribute("desktopPath");
            }
        }
        
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
