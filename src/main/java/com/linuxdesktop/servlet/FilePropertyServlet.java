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
 * 文件属性控制器
 */
public class FilePropertyServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        
        String filePath = request.getParameter("path");
        
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
                // 获取文件详细信息
                String command = "ls -lahd '" + filePath + "'";
                String output = sshService.executeCommand(command);
                
                List<FileInfo> fileList = FileParser.parseLsOutput(output, "");
                
                if (fileList != null && !fileList.isEmpty()) {
                    FileInfo fileInfo = fileList.get(0);
                    fileInfo.setPath(filePath);
                    
                    // 获取文件类型
                    String fileTypeCmd = "file -b '" + filePath + "'";
                    String fileType = sshService.executeCommand(fileTypeCmd).trim();
                    fileInfo.setType(fileType);
                    
                    result.put("success", true);
                    result.put("file", fileInfo);
                } else {
                    result.put("success", false);
                    result.put("message", "无法获取文件属性");
                }
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "获取文件属性失败: " + e.getMessage());
            }
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
