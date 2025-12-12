package com.linuxdesktop.util;

import com.linuxdesktop.bean.FileInfo;
import java.util.ArrayList;
import java.util.List;

/**
 * 文件列表解析工具类
 */
public class FileParser {
    
    /**
     * 解析ls -l命令的输出
     */
    public static List<FileInfo> parseLsOutput(String output, String currentPath) {
        List<FileInfo> fileList = new ArrayList<>();
        
        if (output == null || output.trim().isEmpty()) {
            return fileList;
        }
        
        String[] lines = output.split("\n");
        for (String line : lines) {
            if (line.trim().isEmpty() || line.startsWith("total")) {
                continue;
            }
            
            FileInfo fileInfo = parseLsLine(line, currentPath);
            if (fileInfo != null) {
                fileList.add(fileInfo);
            }
        }
        
        return fileList;
    }
    
    /**
     * 解析单行ls -l输出
     * 格式: -rw-r--r-- 1 user group 1234 Dec 25 10:30 filename
     */
    private static FileInfo parseLsLine(String line, String currentPath) {
        try {
            String[] parts = line.trim().split("\\s+", 9);
            if (parts.length < 9) {
                return null;
            }
            
            FileInfo fileInfo = new FileInfo();
            
            // 权限和类型
            String permissions = parts[0];
            fileInfo.setPermissions(permissions);
            fileInfo.setType(permissions.startsWith("d") ? "directory" : 
                           permissions.startsWith("l") ? "link" : "file");
            fileInfo.setDirectory(permissions.startsWith("d"));
            fileInfo.setLink(permissions.startsWith("l"));
            
            // 所有者
            fileInfo.setOwner(parts[2]);
            
            // 组
            fileInfo.setGroup(parts[3]);
            
            // 大小
            try {
                fileInfo.setSize(Long.parseLong(parts[4]));
            } catch (NumberFormatException e) {
                fileInfo.setSize(0);
            }
            
            // 时间 (格式: Dec 25 10:30 或 Dec 25 2023)
            String dateStr = parts[5] + " " + parts[6] + " " + parts[7];
            fileInfo.setModifiedTime(dateStr);
            
            // 文件名
            String fileName = parts[8];
            // 处理链接文件 (filename -> target)
            if (fileName.contains(" -> ")) {
                fileName = fileName.split(" -> ")[0];
            }
            fileInfo.setName(fileName);
            
            // 路径
            String path = currentPath.endsWith("/") ? 
                currentPath + fileName : currentPath + "/" + fileName;
            fileInfo.setPath(path);
            
            return fileInfo;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
