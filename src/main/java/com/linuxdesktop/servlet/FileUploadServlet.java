package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.service.SSHService;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 */
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 1024L * 1024L * 200L,
        maxRequestSize = 1024L * 1024L * 210L
)
public class FileUploadServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();

        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
            writeResponse(response, result);
            return;
        }

        String dirPath = request.getParameter("path");
        if (dirPath == null || dirPath.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "目标目录不能为空");
            writeResponse(response, result);
            return;
        }

        String normalizedDir = trimTrailingSlash(normalizePath(dirPath.trim(), sshService));
        if (normalizedDir == null || normalizedDir.isEmpty()) {
            result.put("success", false);
            result.put("message", "目录路径无效");
            writeResponse(response, result);
            return;
        }

        Part filePart;
        try {
            filePart = request.getPart("file");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "读取上传文件失败: " + e.getMessage());
            writeResponse(response, result);
            return;
        }

        if (filePart == null) {
            result.put("success", false);
            result.put("message", "未找到上传文件");
            writeResponse(response, result);
            return;
        }

        String submittedName = extractSubmittedFileName(filePart);
        String fileName = sanitizeFileName(submittedName);
        if (fileName == null || fileName.isEmpty()) {
            result.put("success", false);
            result.put("message", "文件名无效");
            writeResponse(response, result);
            return;
        }

        if (!isValidFileName(fileName)) {
            result.put("success", false);
            result.put("message", "文件名非法");
            writeResponse(response, result);
            return;
        }

        String dirCheck = sshService.executeCommand("[ -d " + escapeShell(normalizedDir) + " ] && echo 'dir'");
        if (dirCheck != null && dirCheck.contains("错误:")) {
            result.put("success", false);
            result.put("message", "检查目录失败: " + dirCheck.trim());
            writeResponse(response, result);
            return;
        }
        if (dirCheck == null || !dirCheck.contains("dir")) {
            result.put("success", false);
            result.put("message", "目标目录不存在");
            writeResponse(response, result);
            return;
        }

        String remotePath = joinPath(normalizedDir, fileName);
        try (InputStream input = filePart.getInputStream()) {
            sshService.uploadFile(remotePath, input);
            result.put("success", true);
            result.put("path", remotePath);
            result.put("fileName", fileName);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "上传失败: " + e.getMessage());
        }

        writeResponse(response, result);
    }

    private void writeResponse(HttpServletResponse response, Map<String, Object> result) throws IOException {
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

    private String extractSubmittedFileName(Part part) {
        if (part == null) {
            return null;
        }
        String header = part.getHeader("content-disposition");
        if (header == null) {
            return null;
        }
        String[] tokens = header.split(";");
        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.startsWith("filename=")) {
                String name = trimmed.substring("filename=".length()).trim();
                if (name.startsWith("\"") && name.endsWith("\"") && name.length() >= 2) {
                    name = name.substring(1, name.length() - 1);
                }
                return name;
            }
        }
        return null;
    }

    private String sanitizeFileName(String submittedName) {
        if (submittedName == null) {
            return null;
        }
        String name = submittedName;
        int slashIndex = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slashIndex >= 0 && slashIndex < name.length() - 1) {
            name = name.substring(slashIndex + 1);
        }
        return name.trim();
    }

    private boolean isValidFileName(String name) {
        if (name == null || name.isEmpty()) {
            return false;
        }
        if (".".equals(name) || "..".equals(name)) {
            return false;
        }
        return !name.contains("/") && !name.contains("\\");
    }

    private String joinPath(String dir, String name) {
        if ("/".equals(dir)) {
            return "/" + name;
        }
        return dir + "/" + name;
    }

    private String escapeShell(String value) {
        return "'" + value.replace("'", "'\\''") + "'";
    }
}
