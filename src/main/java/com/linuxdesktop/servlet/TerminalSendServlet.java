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
 * 终端输入发送
 */
public class TerminalSendServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        String input = request.getParameter("input");
        String raw = request.getParameter("raw");
        SSHService sshService = SSHService.getInstance();
        Map<String, Object> result = new HashMap<>();

        if (!sshService.isShellActive()) {
            result.put("success", false);
            result.put("message", "终端未启动");
        } else if (input == null) {
            result.put("success", false);
            result.put("message", "输入不能为空");
        } else {
            boolean isRaw = "1".equals(raw) || "true".equalsIgnoreCase(raw);
            if (!isRaw && !input.endsWith("\n")) {
                input = input + "\n";
            }
            boolean sent = sshService.sendShellInput(input);
            result.put("success", sent);
            if (!sent) {
                result.put("message", "发送失败");
            }
        }

        PrintWriter out = response.getWriter();
        out.print(new Gson().toJson(result));
        out.flush();
    }
}
