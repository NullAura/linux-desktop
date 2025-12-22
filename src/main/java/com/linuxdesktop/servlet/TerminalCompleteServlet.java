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
import java.util.Locale;
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

        String query = prefix == null ? "" : prefix;
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
                baseDir = getHomeDir(sshService);
            }
            if (baseDir == null || baseDir.isEmpty()) {
                baseDir = ".";
            }
            CompletionQuery completionQuery = splitCompletionQuery(query);
            String listDir = resolveListDir(baseDir, completionQuery.dirPart, sshService);
            StringBuilder command = new StringBuilder();
            if ("command".equals(kind)) {
                command.append("compgen -c");
            } else if ("dir".equals(kind)) {
                command.append("cd ");
                command.append(escapeShell(listDir));
                command.append(" && compgen -d");
            } else {
                command.append("cd ");
                command.append(escapeShell(listDir));
                command.append(" && compgen -f");
            }
            String output = sshService.executeCommand(command.toString());
            List<String> suggestions = new ArrayList<>();
            if (output != null && !output.contains("错误:")) {
                String[] lines = output.split("\n");
                Set<String> uniq = new LinkedHashSet<>();
                for (String line : lines) {
                    String value = line.trim();
                    if (!value.isEmpty()) {
                        uniq.add(value);
                    }
                }
                suggestions = buildSuggestions(uniq, completionQuery, "command".equals(kind));
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

    private CompletionQuery splitCompletionQuery(String query) {
        if (query == null) {
            return new CompletionQuery("", "");
        }
        int lastSlash = query.lastIndexOf('/');
        if (lastSlash >= 0) {
            return new CompletionQuery(query.substring(0, lastSlash + 1), query.substring(lastSlash + 1));
        }
        return new CompletionQuery("", query);
    }

    private List<String> buildSuggestions(Set<String> candidates, CompletionQuery completionQuery, boolean commandMode) {
        String token = commandMode ? completionQuery.fullQuery : completionQuery.leafQuery;
        String suggestionPrefix = commandMode ? "" : completionQuery.dirPart;
        boolean hasQuery = token != null && !token.isEmpty();
        List<String> suggestions = new ArrayList<>();
        if (!hasQuery) {
            for (String candidate : candidates) {
                suggestions.add(suggestionPrefix + candidate);
            }
            return suggestions;
        }
        List<CompletionMatch> matches = new ArrayList<>();
        for (String candidate : candidates) {
            int score = fuzzyScore(candidate, token);
            if (score < 0) {
                continue;
            }
            String suggestion = suggestionPrefix + candidate;
            matches.add(new CompletionMatch(suggestion, score, candidate.length()));
        }
        matches.sort((a, b) -> {
            int diff = Integer.compare(b.score, a.score);
            if (diff != 0) {
                return diff;
            }
            diff = Integer.compare(a.length, b.length);
            if (diff != 0) {
                return diff;
            }
            return a.lower.compareTo(b.lower);
        });
        for (CompletionMatch match : matches) {
            suggestions.add(match.suggestion);
        }
        return suggestions;
    }

    private int fuzzyScore(String candidate, String query) {
        if (query == null || query.isEmpty()) {
            return 0;
        }
        String candLower = candidate.toLowerCase(Locale.ROOT);
        String queryLower = query.toLowerCase(Locale.ROOT);
        int score = 0;
        int qi = 0;
        int lastMatch = -1;
        int consecutive = 0;
        for (int i = 0; i < candLower.length() && qi < queryLower.length(); i++) {
            if (candLower.charAt(i) == queryLower.charAt(qi)) {
                if (i == lastMatch + 1) {
                    consecutive++;
                } else {
                    consecutive = 1;
                }
                score += 10 + consecutive * 5;
                lastMatch = i;
                qi++;
            }
        }
        if (qi < queryLower.length()) {
            return -1;
        }
        if (candLower.startsWith(queryLower)) {
            score += 60;
        } else if (candLower.contains(queryLower)) {
            score += 30;
        }
        score -= (candidate.length() - query.length());
        return score;
    }

    private String resolveListDir(String baseDir, String dirPart, SSHService sshService) {
        String resolvedBase = expandHome(baseDir, sshService);
        if (resolvedBase == null || resolvedBase.isEmpty()) {
            resolvedBase = ".";
        }
        if (dirPart == null || dirPart.isEmpty()) {
            return resolvedBase;
        }
        String resolvedDir = expandHome(dirPart, sshService);
        if (resolvedDir.startsWith("/")) {
            return resolvedDir;
        }
        if (resolvedBase.endsWith("/")) {
            return resolvedBase + resolvedDir;
        }
        return resolvedBase + "/" + resolvedDir;
    }

    private String expandHome(String path, SSHService sshService) {
        if (path == null || !path.startsWith("~")) {
            return path;
        }
        String home = getHomeDir(sshService);
        if (home == null || home.isEmpty()) {
            return path;
        }
        if (path.equals("~")) {
            return home;
        }
        if (path.startsWith("~/")) {
            return home + path.substring(1);
        }
        return path;
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

    private static class CompletionQuery {
        private final String dirPart;
        private final String leafQuery;
        private final String fullQuery;

        private CompletionQuery(String dirPart, String leafQuery) {
            this.dirPart = dirPart == null ? "" : dirPart;
            this.leafQuery = leafQuery == null ? "" : leafQuery;
            this.fullQuery = this.dirPart + this.leafQuery;
        }
    }

    private static class CompletionMatch {
        private final String suggestion;
        private final int score;
        private final int length;
        private final String lower;

        private CompletionMatch(String suggestion, int score, int length) {
            this.suggestion = suggestion;
            this.score = score;
            this.length = length;
            this.lower = suggestion.toLowerCase(Locale.ROOT);
        }
    }
}
