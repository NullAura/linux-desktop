package com.linuxdesktop.bean;

/**
 * 进程信息JavaBean
 */
public class ProcessInfo {
    private String pid;
    private String user;
    private double cpu;
    private double memory;
    private String command;
    private String startTime;
    
    public ProcessInfo() {
    }
    
    public ProcessInfo(String pid, String user, String command) {
        this.pid = pid;
        this.user = user;
        this.command = command;
    }
    
    // Getters and Setters
    public String getPid() {
        return pid;
    }
    
    public void setPid(String pid) {
        this.pid = pid;
    }
    
    public String getUser() {
        return user;
    }
    
    public void setUser(String user) {
        this.user = user;
    }
    
    public double getCpu() {
        return cpu;
    }
    
    public void setCpu(double cpu) {
        this.cpu = cpu;
    }
    
    public double getMemory() {
        return memory;
    }
    
    public void setMemory(double memory) {
        this.memory = memory;
    }
    
    public String getCommand() {
        return command;
    }
    
    public void setCommand(String command) {
        this.command = command;
    }
    
    public String getStartTime() {
        return startTime;
    }
    
    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }
}
