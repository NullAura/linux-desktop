package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.bean.FileInfo;
import com.linuxdesktop.service.SSHService;
import com.linuxdesktop.util.FileParser;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 文件列表控制器
 */
public class FileListServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        
        String path = request.getParameter("path");
        if (path == null || path.isEmpty()) {
            path = "~";
        }
        
        // 替换~为实际路径
        if (path.equals("~")) {
            SSHService sshService = SSHService.getInstance();
            String homeDir = sshService.executeCommand("echo $HOME").trim();
            path = homeDir;
        }
        
        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();
        
        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else {
            try {
                // 执行ls -l命令
                String command = "ls -lah '" + path + "'";
                String output = sshService.executeCommand(command);
                
                List<FileInfo> fileList = FileParser.parseLsOutput(output, path);
                
                result.put("success", true);
                result.put("path", path);
                result.put("files", fileList);
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "获取文件列表失败: " + e.getMessage());
            }
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
