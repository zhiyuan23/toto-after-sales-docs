import java.awt.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import javax.imageio.ImageIO;

/** Read-only MySQL inspection and clearly labelled synthetic evidence. No SQL writes. */
public class ReadOnlySnapshot {
    static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof Map<?, ?> map) {
            var entries = new ArrayList<String>();
            map.forEach((k, v) -> entries.add(json(k.toString()) + ":" + json(v)));
            return "{" + String.join(",", entries) + "}";
        }
        if (value instanceof Collection<?> items) return "[" + String.join(",", items.stream().map(ReadOnlySnapshot::json).toList()) + "]";
        String s = value.toString();
        var escaped = new StringBuilder("\"");
        for (char ch : s.toCharArray()) switch (ch) {
            case '"' -> escaped.append("\\\"");
            case '\\' -> escaped.append("\\\\");
            case '\n' -> escaped.append("\\n");
            case '\r' -> escaped.append("\\r");
            case '\t' -> escaped.append("\\t");
            default -> { if (ch < 32) escaped.append(String.format("\\u%04x", (int) ch)); else escaped.append(ch); }
        }
        return escaped.append('"').toString();
    }
    static java.util.List<Map<String, Object>> rows(Connection c, String sql) throws Exception {
        var result = new ArrayList<Map<String, Object>>();
        try (var statement = c.createStatement(); var rs = statement.executeQuery(sql)) {
            var metadata = rs.getMetaData();
            while (rs.next()) {
                var row = new TreeMap<String, Object>();
                for (int i = 1; i <= metadata.getColumnCount(); i++) {
                    Object value = rs.getObject(i);
                    row.put(metadata.getColumnLabel(i), value instanceof byte[] bytes ? HexFormat.of().formatHex(bytes) : value == null ? null : value.toString());
                }
                result.add(row);
            }
        }
        return result;
    }
    public static void main(String[] args) throws Exception {
        if (args.length == 2 && args[0].equals("image")) {
            var image = new BufferedImage(900, 480, BufferedImage.TYPE_INT_RGB);
            var g = image.createGraphics();
            g.setColor(Color.WHITE); g.fillRect(0, 0, 900, 480);
            g.setColor(new Color(180, 30, 45)); g.setFont(new Font("SansSerif", Font.BOLD, 72));
            g.drawString("DEMO DATA", 65, 140);
            g.setColor(Color.DARK_GRAY); g.setFont(new Font("SansSerif", Font.PLAIN, 29));
            g.drawString("Synthetic service evidence for software demos", 65, 230);
            g.drawString("NO REAL SERVICE / NO CUSTOMER SIGNATURE", 65, 300);
            g.drawString("Not a real product nameplate or warranty proof", 65, 365);
            g.dispose(); ImageIO.write(image, "png", Path.of(args[1]).toFile()); return;
        }
        if (args.length != 2) throw new IllegalArgumentException("Expected properties and output paths");
        var properties = new HashMap<String, String>();
        for (String line : Files.readAllLines(Path.of(args[0]))) {
            line = line.strip(); if (line.startsWith("#") || !line.contains("=")) continue;
            int split = line.indexOf('='); properties.put(line.substring(0, split).strip(), line.substring(split + 1).strip());
        }
        String url = properties.get("spring.datasource.url");
        if (url == null || !url.matches("jdbc:mysql://10\\.1\\.1\\.106(?::3306)?/gaia_wh_init_wzy(?:\\?.*)?")) throw new IllegalArgumentException("Unexpected test database");
        url += (url.contains("?") ? "&" : "?") + "connectTimeout=10000&socketTimeout=45000";
        try (var c = DriverManager.getConnection(url, properties.get("spring.datasource.username"), properties.get("spring.datasource.password"))) {
            c.setReadOnly(true); c.setAutoCommit(false);
            try (var statement = c.createStatement()) { statement.execute("SET TRANSACTION READ ONLY"); statement.execute("START TRANSACTION WITH CONSISTENT SNAPSHOT"); }
            var target = rows(c, "SELECT DATABASE() db,@@hostname server,NOW() checked_at").getFirst();
            if (!"mysql84".equals(target.get("server")) || !"gaia_wh_init_wzy".equals(target.get("db"))) throw new IllegalArgumentException("Unexpected test target");
            var tables = new TreeMap<String, Object>();
            var keys = new TreeMap<String, Object>();
            var schemas = new TreeMap<String, Object>();
            for (var item : rows(c, "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME LIKE 'afs\\_%' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")) {
                String name = item.get("name").toString();
                if (!name.matches("afs_[a-z0-9_]+") || name.contains("session") || name.startsWith("afs_regbak_") || name.contains("_bak_")) continue;
                var primary = rows(c, "SHOW KEYS FROM `" + name + "` WHERE Key_name='PRIMARY'");
                var columns = primary.stream().map(k -> k.get("Column_name").toString()).toList();
                String order = columns.isEmpty() ? "" : " ORDER BY " + String.join(",", columns.stream().map(k -> "`" + k + "`").toList());
                tables.put(name, rows(c, "SELECT * FROM `" + name + "`" + order));
                keys.put(name, columns);
                schemas.put(name, rows(c, "SHOW CREATE TABLE `" + name + "`").getFirst().get("Create Table"));
            }
            c.rollback();
            Files.writeString(Path.of(args[1]), json(Map.of("target", target, "tables", tables, "keys", keys, "schemas", schemas)));
        } catch (Exception error) {
            System.err.println("Read-only test database inspection failed (" + error.getClass().getSimpleName() + ")");
            System.exit(1);
        }
    }
}
