package com.linuxdesktop.servlet;

import com.google.gson.Gson;
import com.linuxdesktop.service.SSHService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 终端补全
 */
public class TerminalCompleteServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        String prefix = request.getParameter("prefix");
        String kind = request.getParameter("kind");
        String cwd = request.getParameter("cwd");

        if (prefix == null) {
            prefix = "";
        }
        if (kind == null || kind.isEmpty()) {
            kind = "path";
        }

        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();

        if (!sshService.isConnected()) {
            result.put("success", false);
            result.put("message", "未连接到SSH服务器");
        } else {
            String baseDir = (cwd != null && !cwd.isEmpty()) ? cwd : sshService.getShellCwd();
            if (baseDir == null || baseDir.isEmpty()) {
                baseDir = "~";
            }
            StringBuilder command = new StringBuilder();
            if ("command".equals(kind)) {
                command.append("compgen -c ");
                command.append(escapeShell(prefix));
            } else if ("dir".equals(kind)) {
                command.append("cd ");
                command.append(escapeShell(baseDir));
                command.append(" && compgen -d ");
                command.append(escapeShell(prefix));
            } else {
                command.append("cd ");
                command.append(escapeShell(baseDir));
                command.append(" && compgen -f ");
                command.append(escapeShell(prefix));
            }
            String output = sshService.executeCommand(command.toString());
            List<String> suggestions = new ArrayList<>();
            if (output != null && !output.startsWith("错误")) {
                String[] lines = output.split("\n");
                Set<String> uniq = new LinkedHashSet<>();
                for (String line : lines) {
                    String value = line.trim();
                    if (!value.isEmpty()) {
                        uniq.add(value);
                    }
                }
                suggestions.addAll(uniq);
            }
            result.put("success", true);
            result.put("suggestions", suggestions);
        }

        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }

    private String escapeShell(String value) {
        return "'" + value.replace("'", "'\\''") + "'";
    }
}
