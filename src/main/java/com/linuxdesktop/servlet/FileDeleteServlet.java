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
 * 删除文件/文件夹控制器
 */
public class FileDeleteServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        String filePath = request.getParameter("path");

        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();

        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else if (filePath == null || filePath.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "文件路径不能为空");
        } else {
            String normalizedPath = normalizePath(filePath.trim(), sshService);
            if (normalizedPath == null || normalizedPath.isEmpty()) {
                result.put("success", false);
                result.put("message", "路径无效");
            } else if ("/".equals(normalizedPath)) {
                result.put("success", false);
                result.put("message", "禁止删除根目录");
            } else {
                String escapedPath = escapeShell(normalizedPath);
                String command = "if [ -d " + escapedPath + " ]; then rm -rf "
                        + escapedPath + "; else rm -f " + escapedPath + "; fi";
                String output = sshService.executeCommand(command);
                if (output != null && output.contains("错误:")) {
                    result.put("success", false);
                    result.put("message", output.trim());
                } else {
                    result.put("success", true);
                }
            }
        }

        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }

    private String normalizePath(String path, SSHService sshService) {
        if (path == null) {
            return null;
        }
        if (!path.startsWith("~")) {
            return path;
        }
        String homeDir = getHomeDir(sshService);
        if (homeDir == null || homeDir.isEmpty()) {
            return path;
        }
        if ("~".equals(path)) {
            return homeDir;
        }
        if (path.startsWith("~/")) {
            return homeDir + path.substring(1);
        }
        return path;
    }

    private String getHomeDir(SSHService sshService) {
        String output = sshService.executeCommand("echo $HOME");
        if (output == null) {
            return null;
        }
        String firstLine = output.split("\n")[0].trim();
        if (firstLine.isEmpty() || firstLine.startsWith("错误")) {
            return null;
        }
        return firstLine;
    }

    private String escapeShell(String value) {
        return "'" + value.replace("'", "'\\''") + "'";
    }
}
