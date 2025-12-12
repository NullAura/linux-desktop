package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.bean.ProcessInfo;
import com.linuxdesktop.service.SSHService;
import com.linuxdesktop.util.ProcessParser;

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
 * 进程列表控制器
 */
public class ProcessListServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        
        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();
        
        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else {
            try {
                String command = "ps aux";
                String output = sshService.executeCommand(command);
                
                List<ProcessInfo> processList = ProcessParser.parsePsOutput(output);
                
                result.put("success", true);
                result.put("processes", processList);
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "获取进程列表失败: " + e.getMessage());
            }
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
