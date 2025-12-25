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
import java.util.Locale;
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
                if ("execute".equals(action)) {
                    // 执行可执行文件
                    String command = "'" + filePath + "'";
                    String output = sshService.executeCommand(command);
                    result.put("success", true);
                    result.put("output", output);
                    result.put("type", "execute");
                } else {
                    String fileTypeCmd = "file -b '" + filePath + "'";
                    String fileTypeRaw = sshService.executeCommand(fileTypeCmd);
                    if (fileTypeRaw == null) {
                        result.put("success", false);
                        result.put("message", "无法识别文件类型");
                    } else {
                        String fileType = fileTypeRaw.trim();
                        if (fileType.startsWith("错误") || fileType.contains("错误:")) {
                            result.put("success", false);
                            result.put("message", fileType);
                        } else if (isImageFileType(fileType)) {
                            String base64Command = "base64 '" + filePath + "' | tr -d '\\n\\r'";
                            String base64Content = sshService.executeCommand(base64Command);
                            if (base64Content == null || base64Content.trim().startsWith("错误")) {
                                result.put("success", false);
                                result.put("message", "读取图片失败: " + (base64Content == null ? "未知错误" : base64Content.trim()));
                            } else {
                                result.put("success", true);
                                result.put("content", base64Content.trim());
                                result.put("type", "image");
                                result.put("mimeType", resolveImageMimeType(filePath, fileType, sshService));
                            }
                        } else if (isTextFileType(fileType)) {
                            boolean useFullContent = "edit".equals(action);
                            String command = useFullContent
                                    ? "cat '" + filePath + "'"
                                    : "head -n 1000 '" + filePath + "'";
                            String content = sshService.executeCommand(command);
                            result.put("success", true);
                            result.put("content", content);
                            result.put("type", useFullContent ? "edit" : "text");
                        } else {
                            result.put("success", false);
                            result.put("message", "不支持的文件类型: " + fileType);
                        }
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

    private boolean isTextFileType(String fileType) {
        if (fileType == null) {
            return false;
        }
        String fileTypeLower = fileType.toLowerCase(Locale.ROOT);
        return fileTypeLower.contains("text")
                || fileTypeLower.contains("ascii")
                || fileTypeLower.contains("utf-8")
                || fileTypeLower.contains("unicode")
                || fileTypeLower.contains("empty");
    }

    private boolean isImageFileType(String fileType) {
        if (fileType == null) {
            return false;
        }
        String fileTypeLower = fileType.toLowerCase(Locale.ROOT);
        return fileTypeLower.contains("image")
                || fileTypeLower.contains("jpeg")
                || fileTypeLower.contains("jpg")
                || fileTypeLower.contains("png")
                || fileTypeLower.contains("gif")
                || fileTypeLower.contains("bmp")
                || fileTypeLower.contains("webp")
                || fileTypeLower.contains("svg")
                || fileTypeLower.contains("tiff");
    }

    private String resolveImageMimeType(String filePath, String fileType, SSHService sshService) {
        String mimeCommand = "file -b --mime-type '" + filePath + "'";
        String mimeOutput = sshService.executeCommand(mimeCommand);
        if (mimeOutput != null) {
            String mimeType = mimeOutput.split("\n")[0].trim();
            if (!mimeType.isEmpty() && !mimeType.startsWith("错误")) {
                return mimeType;
            }
        }
        return mapImageMimeType(fileType);
    }

    private String mapImageMimeType(String fileType) {
        if (fileType == null) {
            return "image/*";
        }
        String fileTypeLower = fileType.toLowerCase(Locale.ROOT);
        if (fileTypeLower.contains("jpeg") || fileTypeLower.contains("jpg")) {
            return "image/jpeg";
        }
        if (fileTypeLower.contains("png")) {
            return "image/png";
        }
        if (fileTypeLower.contains("gif")) {
            return "image/gif";
        }
        if (fileTypeLower.contains("bmp")) {
            return "image/bmp";
        }
        if (fileTypeLower.contains("webp")) {
            return "image/webp";
        }
        if (fileTypeLower.contains("svg")) {
            return "image/svg+xml";
        }
        if (fileTypeLower.contains("tiff") || fileTypeLower.contains("tif")) {
            return "image/tiff";
        }
        return "image/*";
    }
}
