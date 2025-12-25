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
 * 系统指标控制器
 */
public class SystemMetricsServlet extends HttpServlet {
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
            CpuSample cpuSample = readCpuUsage(sshService);
            DiskSample diskSample = readDiskUsage(sshService);
            NetSample netSample = readNetSample(sshService);

            result.put("success", true);
            result.put("timestamp", System.currentTimeMillis());
            if (cpuSample != null) {
                result.put("cpuUsage", cpuSample.usage);
            }
            if (diskSample != null) {
                result.put("diskUsage", diskSample.usagePercent);
                result.put("diskTotalKb", diskSample.totalKb);
                result.put("diskUsedKb", diskSample.usedKb);
            }
            if (netSample != null) {
                result.put("netRxBytes", netSample.rxBytes);
                result.put("netTxBytes", netSample.txBytes);
            }
        }

        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }

    private CpuSample readCpuUsage(SSHService sshService) {
        CpuTimes first = readCpuTimes(sshService);
        if (first == null) {
            return null;
        }
        try {
            Thread.sleep(150);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        CpuTimes second = readCpuTimes(sshService);
        if (second == null) {
            return null;
        }
        long totalDelta = second.total - first.total;
        long idleDelta = second.idle - first.idle;
        double usage = 0;
        if (totalDelta > 0) {
            usage = (double) (totalDelta - idleDelta) / (double) totalDelta * 100.0;
        }
        return new CpuSample(usage);
    }

    private CpuTimes readCpuTimes(SSHService sshService) {
        String output = sshService.executeCommand("cat /proc/stat | head -n 1");
        if (output == null || output.contains("错误:")) {
            return null;
        }
        String line = output.split("\n")[0].trim();
        if (!line.startsWith("cpu")) {
            return null;
        }
        String[] parts = line.split("\\s+");
        if (parts.length < 5) {
            return null;
        }
        long total = 0;
        for (int i = 1; i < parts.length; i++) {
            total += parseLong(parts[i]);
        }
        long idle = parseLong(parts[4]);
        long iowait = parts.length > 5 ? parseLong(parts[5]) : 0;
        return new CpuTimes(total, idle + iowait);
    }

    private DiskSample readDiskUsage(SSHService sshService) {
        String output = sshService.executeCommand("df -P /");
        if (output == null || output.contains("错误:")) {
            return null;
        }
        String[] lines = output.split("\n");
        if (lines.length < 2) {
            return null;
        }
        String line = lines[1].trim();
        String[] parts = line.split("\\s+");
        if (parts.length < 5) {
            return null;
        }
        long total = parseLong(parts[1]);
        long used = parseLong(parts[2]);
        String percentText = parts[4].replace("%", "");
        double usagePercent = parseDouble(percentText);
        return new DiskSample(usagePercent, total, used);
    }

    private NetSample readNetSample(SSHService sshService) {
        String output = sshService.executeCommand("cat /proc/net/dev");
        if (output == null || output.contains("错误:")) {
            return null;
        }
        String[] lines = output.split("\n");
        long rx = 0;
        long tx = 0;
        for (String line : lines) {
            if (!line.contains(":")) {
                continue;
            }
            String[] parts = line.split(":");
            if (parts.length < 2) {
                continue;
            }
            String iface = parts[0].trim();
            if ("lo".equals(iface)) {
                continue;
            }
            String[] cols = parts[1].trim().split("\\s+");
            if (cols.length < 9) {
                continue;
            }
            rx += parseLong(cols[0]);
            tx += parseLong(cols[8]);
        }
        return new NetSample(rx, tx);
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private double parseDouble(String value) {
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static class CpuTimes {
        private final long total;
        private final long idle;

        private CpuTimes(long total, long idle) {
            this.total = total;
            this.idle = idle;
        }
    }

    private static class CpuSample {
        private final double usage;

        private CpuSample(double usage) {
            this.usage = usage;
        }
    }

    private static class DiskSample {
        private final double usagePercent;
        private final long totalKb;
        private final long usedKb;

        private DiskSample(double usagePercent, long totalKb, long usedKb) {
            this.usagePercent = usagePercent;
            this.totalKb = totalKb;
            this.usedKb = usedKb;
        }
    }

    private static class NetSample {
        private final long rxBytes;
        private final long txBytes;

        private NetSample(long rxBytes, long txBytes) {
            this.rxBytes = rxBytes;
            this.txBytes = txBytes;
        }
    }
}
