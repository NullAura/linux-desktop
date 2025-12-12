package com.linuxdesktop.util;

import com.linuxdesktop.bean.ProcessInfo;
import java.util.ArrayList;
import java.util.List;

/**
 * 进程列表解析工具类
 */
public class ProcessParser {
    
    /**
     * 解析ps aux命令的输出
     */
    public static List<ProcessInfo> parsePsOutput(String output) {
        List<ProcessInfo> processList = new ArrayList<>();
        
        if (output == null || output.trim().isEmpty()) {
            return processList;
        }
        
        String[] lines = output.split("\n");
        // 跳过第一行标题
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }
            
            ProcessInfo processInfo = parsePsLine(line);
            if (processInfo != null) {
                processList.add(processInfo);
            }
        }
        
        return processList;
    }
    
    /**
     * 解析单行ps输出
     * 格式: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
     */
    private static ProcessInfo parsePsLine(String line) {
        try {
            String[] parts = line.trim().split("\\s+", 11);
            if (parts.length < 11) {
                return null;
            }
            
            ProcessInfo processInfo = new ProcessInfo();
            processInfo.setUser(parts[0]);
            processInfo.setPid(parts[1]);
            
            try {
                processInfo.setCpu(Double.parseDouble(parts[2]));
            } catch (NumberFormatException e) {
                processInfo.setCpu(0);
            }
            
            try {
                processInfo.setMemory(Double.parseDouble(parts[3]));
            } catch (NumberFormatException e) {
                processInfo.setMemory(0);
            }
            
            processInfo.setStartTime(parts[8]);
            processInfo.setCommand(parts[10]);
            
            return processInfo;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
