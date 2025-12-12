package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.service.SSHService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件打开控制器
 */
public class FileOpenServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        
        String filePath = request.getParameter("path");
        String action = request.getParameter("action"); // view, edit, execute
        
        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();
        
        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else if (filePath == null || filePath.isEmpty()) {
            result.put("success", false);
            result.put("message", "文件路径不能为空");
        } else {
            try {
                if ("view".equals(action)) {
                    // 查看文本文件内容
                    String command = "head -n 1000 '" + filePath + "'";
                    String content = sshService.executeCommand(command);
                    result.put("success", true);
                    result.put("content", content);
                    result.put("type", "text");
                } else if ("edit".equals(action)) {
                    // 读取完整文件内容用于编辑
                    String command = "cat '" + filePath + "'";
                    String content = sshService.executeCommand(command);
                    result.put("success", true);
                    result.put("content", content);
                    result.put("type", "edit");
                } else if ("execute".equals(action)) {
                    // 执行可执行文件
                    String command = "'" + filePath + "'";
                    String output = sshService.executeCommand(command);
                    result.put("success", true);
                    result.put("output", output);
                    result.put("type", "execute");
                } else {
                    // 默认判断文件类型
                    String fileTypeCmd = "file -b '" + filePath + "'";
                    String fileType = sshService.executeCommand(fileTypeCmd).trim();
                    
                    if (fileType.contains("text") || fileType.contains("ASCII")) {
                        String command = "head -n 1000 '" + filePath + "'";
                        String content = sshService.executeCommand(command);
                        result.put("success", true);
                        result.put("content", content);
                        result.put("type", "text");
                    } else {
                        result.put("success", false);
                        result.put("message", "不支持的文件类型: " + fileType);
                    }
                }
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "打开文件失败: " + e.getMessage());
            }
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
