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
 * 新建文件/文件夹控制器
 */
public class FileCreateServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        String filePath = request.getParameter("path");
        String type = request.getParameter("type");

        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();

        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else if (filePath == null || filePath.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "路径不能为空");
        } else {
            String normalizedPath = trimTrailingSlash(normalizePath(filePath.trim(), sshService));
            if (normalizedPath == null || normalizedPath.isEmpty()) {
                result.put("success", false);
                result.put("message", "路径无效");
            } else if (!isValidName(normalizedPath)) {
                result.put("success", false);
                result.put("message", "名称非法");
            } else {
                boolean isDirectory = "directory".equalsIgnoreCase(type);
                String escapedPath = escapeShell(normalizedPath);
                String checkCommand = "[ -e " + escapedPath + " ] && echo 'exists'";
                String checkResult = sshService.executeCommand(checkCommand);
                if (checkResult != null && checkResult.contains("exists")) {
                    result.put("success", false);
                    result.put("message", "目标已存在");
                } else {
                    String command = isDirectory ? "mkdir -p " + escapedPath : "touch " + escapedPath;
                    String output = sshService.executeCommand(command);
                    if (output != null && output.contains("错误:")) {
                        result.put("success", false);
                        result.put("message", output.trim());
                    } else {
                        result.put("success", true);
                    }
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

    private String trimTrailingSlash(String path) {
        if (path == null) {
            return null;
        }
        String trimmed = path;
        while (trimmed.length() > 1 && trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
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

    private boolean isValidName(String path) {
        String cleaned = path;
        while (cleaned.endsWith("/") && cleaned.length() > 1) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        int lastSlash = cleaned.lastIndexOf('/');
        String name = lastSlash >= 0 ? cleaned.substring(lastSlash + 1) : cleaned;
        if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
            return false;
        }
        return !name.contains("/") && !name.contains("\\");
    }

    private String escapeShell(String value) {
        return "'" + value.replace("'", "'\\''") + "'";
    }
}
