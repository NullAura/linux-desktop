package com.linuxdesktop.bean;

/**
 * 文件信息JavaBean
 */
public class FileInfo {
    private String name;
    private String path;
    private String type; // file, directory, link
    private long size;
    private String permissions;
    private String owner;
    private String group;
    private String modifiedTime;
    private boolean isDirectory;
    private boolean isLink;
    
    public FileInfo() {
    }
    
    public FileInfo(String name, String path, boolean isDirectory) {
        this.name = name;
        this.path = path;
        this.isDirectory = isDirectory;
        this.type = isDirectory ? "directory" : "file";
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public long getSize() {
        return size;
    }
    
    public void setSize(long size) {
        this.size = size;
    }
    
    public String getPermissions() {
        return permissions;
    }
    
    public void setPermissions(String permissions) {
        this.permissions = permissions;
    }
    
    public String getOwner() {
        return owner;
    }
    
    public void setOwner(String owner) {
        this.owner = owner;
    }
    
    public String getGroup() {
        return group;
    }
    
    public void setGroup(String group) {
        this.group = group;
    }
    
    public String getModifiedTime() {
        return modifiedTime;
    }
    
    public void setModifiedTime(String modifiedTime) {
        this.modifiedTime = modifiedTime;
    }
    
    public boolean isDirectory() {
        return isDirectory;
    }
    
    public void setDirectory(boolean directory) {
        isDirectory = directory;
    }
    
    public boolean isLink() {
        return isLink;
    }
    
    public void setLink(boolean link) {
        isLink = link;
    }
}
