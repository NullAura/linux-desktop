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
 * 命令执行控制器
 */
public class CommandExecuteServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        
        String command = request.getParameter("command");
        
        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();
        
        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else if (command == null || command.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "命令不能为空");
        } else {
            try {
                String output = sshService.executeCommand(command);
                result.put("success", true);
                result.put("output", output);
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "命令执行失败: " + e.getMessage());
            }
        }
        
        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
