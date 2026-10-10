import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.security.MessageDigest;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/** Test-only, explicit historical fixture import. Never changes schema or disables constraints. */
public class HistoryImporter extends ReadOnlySnapshot {
    static final Gson GSON = new Gson();
    static Path directory;
    static void need(boolean ok, String reason) { if (!ok) throw new IllegalStateException(reason); }
    @SuppressWarnings("unchecked") static <T> T get(Map<String,Object> map, String key) { return (T) map.get(key); }
    static String identifier(String name) {
        need(name.matches("[a-z0-9_]+"), "Invalid identifier"); return "`" + name + "`";
    }
    static Map<String,Object> read(String name) throws Exception {
        return GSON.fromJson(Files.readString(directory.resolve(name)), new TypeToken<Map<String,Object>>(){}.getType());
    }
    static void save(String name, Object value) throws Exception {
        Path path = directory.resolve(name);
        need(!Files.isSymbolicLink(path), "Refusing symbolic link");
        Files.writeString(path, GSON.toJson(value));
        Files.setPosixFilePermissions(path, java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
    }
    static Connection connection(Path config) throws Exception {
        var properties = new HashMap<String,String>();
        for (String line : Files.readAllLines(config)) {
            line = line.strip(); if (line.startsWith("#") || !line.contains("=")) continue;
            int i = line.indexOf('='); properties.put(line.substring(0,i).strip(), line.substring(i+1).strip());
        }
        String url = properties.get("spring.datasource.url");
        need(url != null && url.matches("jdbc:mysql://10\\.1\\.1\\.106(?::3306)?/gaia_wh_init_wzy(?:\\?.*)?"), "Unexpected test URL");
        url += (url.contains("?") ? "&" : "?") + "connectTimeout=10000&socketTimeout=90000&rewriteBatchedStatements=true";
        return DriverManager.getConnection(url, properties.get("spring.datasource.username"), properties.get("spring.datasource.password"));
    }
    static List<Map<String,Object>> table(Connection c, String table, List<String> keys, boolean lock) throws Exception {
        return rows(c, "SELECT * FROM " + identifier(table) + " ORDER BY " + String.join(",", keys.stream().map(HistoryImporter::identifier).toList()) + (lock ? " FOR UPDATE" : ""));
    }
    static void bind(PreparedStatement st, int index, Object value, int type) throws Exception {
        if (value == null) { st.setNull(index, type); return; }
        String s = value.toString();
        switch (type) {
            case Types.DATE -> st.setObject(index, java.time.LocalDate.parse(s));
            case Types.TIMESTAMP, Types.TIMESTAMP_WITH_TIMEZONE -> st.setObject(index, java.time.LocalDateTime.parse(s.replace(' ', 'T')));
            case Types.DECIMAL, Types.NUMERIC, Types.BIGINT, Types.INTEGER, Types.SMALLINT, Types.TINYINT, Types.DOUBLE, Types.FLOAT, Types.REAL -> st.setBigDecimal(index, new java.math.BigDecimal(s));
            case Types.BINARY, Types.VARBINARY, Types.LONGVARBINARY, Types.BLOB -> st.setBytes(index, HexFormat.of().parseHex(s));
            default -> st.setString(index, s);
        }
    }
    static Map<String,Integer> types(Connection c, String table) throws Exception {
        var result = new HashMap<String,Integer>();
        try (var rs = c.getMetaData().getColumns(c.getCatalog(), null, table, null)) {
            while (rs.next()) result.put(rs.getString("COLUMN_NAME"), rs.getInt("DATA_TYPE"));
        }
        return result;
    }
    static void insert(Connection c, String table, List<Map<String,Object>> records) throws Exception {
        if (records.isEmpty()) return;
        var columns = new ArrayList<>(records.getFirst().keySet()); Collections.sort(columns);
        var types = types(c, table);
        String sql = "INSERT INTO " + identifier(table) + " (" + String.join(",", columns.stream().map(HistoryImporter::identifier).toList()) + ") VALUES (" + String.join(",", Collections.nCopies(columns.size(), "?")) + ")";
        try (var st = c.prepareStatement(sql)) {
            int pending = 0;
            for (var record : records) {
                need(record.keySet().equals(records.getFirst().keySet()), "Inconsistent columns");
                for (int i=0; i<columns.size(); i++) bind(st, i+1, record.get(columns.get(i)), types.get(columns.get(i)));
                st.addBatch(); pending++;
                if (pending == 500) { checkBatch(st.executeBatch(), pending); pending=0; }
            }
            if (pending>0) checkBatch(st.executeBatch(), pending);
        }
    }
    static void checkBatch(int[] counts, int size) {
        need(counts.length==size, "Wrong batch size");
        for (int count : counts) need(count==1 || count==Statement.SUCCESS_NO_INFO, "Unexpected insert count");
    }
    static void patch(Connection c, String table, List<String> keys, List<Map<String,Object>> records) throws Exception {
        if (records.isEmpty()) return;
        var columns = new ArrayList<>(records.getFirst().keySet()); columns.removeAll(keys); Collections.sort(columns);
        var types = types(c, table);
        String sql = "UPDATE " + identifier(table) + " SET " + String.join(",", columns.stream().map(k -> identifier(k)+"=?").toList()) + " WHERE " + String.join(" AND ", keys.stream().map(k -> identifier(k)+"=?").toList());
        try (var st = c.prepareStatement(sql)) {
            int pending=0;
            for (var row : records) {
                need(row.keySet().equals(records.getFirst().keySet()), "Inconsistent patch columns");
                int index=1;
                for (String col : columns) bind(st,index++,row.get(col),types.get(col));
                for (String col : keys) bind(st,index++,row.get(col),types.get(col));
                st.addBatch(); pending++;
                if (pending==500) { checkBatch(st.executeBatch(),pending); pending=0; }
            }
            if (pending>0) checkBatch(st.executeBatch(),pending);
        }
    }
    public static void main(String[] args) throws Exception {
        need(args.length==3 && List.of("apply","rehearse","check","restore").contains(args[2]), "Expected config, directory, apply/rehearse/check/restore");
        directory=Path.of(args[1]); String mode=args[2];
        var plan=read("plan.json"); var backup=read("before.json"); var expected=read("expected-after.json");
        Map<String,List<Map<String,Object>>> before=get(backup,"tables"), after=get(expected,"tables"), added=get(plan,"insert_rows"), updates=get(plan,"update_rows"), originals=get(plan,"original_rows");
        Map<String,List<String>> keys=get(backup,"keys"); Map<String,Object> schemas=get(backup,"schemas");
        List<String> guard=get(plan,"guard_tables"), order=get(plan,"insert_order");
        String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(directory.resolve("before.json"))));
        need(hash.equals(plan.get("backup_sha256")), "Backup hash mismatch");
        need(mode.equals("check") || !Files.exists(directory.resolve(mode.equals("restore")?"restored.json":"committed.json")), "Already applied; inspect receipt");
        need(!mode.equals("restore") || Files.exists(directory.resolve("committed.json")), "No confirmed import receipt");
        boolean committed=false;
        try (var c=connection(Path.of(args[0]))) {
            c.setAutoCommit(false);
            try (var st=c.createStatement()) { st.execute("SET SESSION innodb_lock_wait_timeout=15"); st.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"); }
            var target=rows(c,"SELECT DATABASE() db,@@hostname server,NOW() checked_at").getFirst();
            need("mysql84".equals(target.get("server")) && "gaia_wh_init_wzy".equals(target.get("db")), "Unexpected target");
            need(rows(c,"SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE()").isEmpty(), "Unexpected triggers");
            if (backup.containsKey("metadata")) {
                Map<String,Object> metadata=get(backup,"metadata");
                need(rows(c,"SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION").equals(metadata.get("foreign_keys")), "Foreign keys changed");
            }
            for (String t : guard) {
                need(rows(c,"SHOW CREATE TABLE "+identifier(t)).getFirst().get("Create Table").equals(schemas.get(t)), "Schema changed: "+t);
                need(schemas.get(t).toString().contains("ENGINE=InnoDB"), "Nontransactional table");
            }
            var baseline=List.of("apply","rehearse").contains(mode)?before:after;
            System.out.println("Test target verified. Locking and checking "+guard.size()+" tables.");
            for (String t : guard) need(table(c,t,keys.get(t),true).equals(baseline.get(t)), "Concurrent change: "+t);
            if (mode.equals("check")) { c.rollback(); save("independent-verification.json",Map.of("target",target,"verified_tables",guard.size(),"summary",plan.get("summary"))); System.out.println("Independent full-row verification passed."); return; }
            save(mode+"-preflight.json",Map.of("target",target,"backup_sha256",hash,"summary",plan.get("summary")));
            if (List.of("apply","rehearse").contains(mode)) {
                for (String t : order) insert(c,t,added.get(t));
                for (String t : updates.keySet()) patch(c,t,keys.get(t),updates.get(t));
            } else {
                var reversed=new ArrayList<>(order); Collections.reverse(reversed);
                for (String t : reversed) {
                    String where=String.join(" AND ",keys.get(t).stream().map(k->identifier(k)+"=?").toList());
                    try (var st=c.prepareStatement("DELETE FROM "+identifier(t)+" WHERE "+where)) {
                        for (var row : added.get(t)) { int i=1; for(String k:keys.get(t)) st.setString(i++,row.get(k).toString()); need(st.executeUpdate()==1,"Unexpected restoration count"); }
                    }
                }
                for (String t : originals.keySet()) patch(c,t,keys.get(t),originals.get(t));
            }
            var wanted=List.of("apply","rehearse").contains(mode)?after:before;
            for (String t : guard) {
                var actual=table(c,t,keys.get(t),false);
                if (!actual.equals(wanted.get(t))) {
                    save("mismatch-"+t+".json",Map.of("actual",actual,"expected",wanted.get(t)));
                    c.rollback();
                    throw new IllegalStateException("Result mismatch: "+t+"; rolled back");
                }
            }
            if (mode.equals("rehearse")) {
                c.rollback();
                save("rehearsed.json",Map.of("target",target,"backup_sha256",hash,"summary",plan.get("summary"),"verified_tables",guard.size(),"rolled_back",true));
                System.out.println("REHEARSED: constraints and all rows passed; transaction rolled back."); return;
            }
            c.commit(); committed=true;
            save(mode.equals("apply")?"committed.json":"restored.json",Map.of("target",target,"backup_sha256",hash,"summary",plan.get("summary"),"verified_tables",guard.size(),"finished_at",java.time.Instant.now().toString()));
            System.out.println("COMMITTED: "+mode+". Exact rows and preserved data verified.");
        } catch (Exception e) {
            save("failure-"+System.currentTimeMillis()+".json",Map.of("commit_confirmed",committed,"reason",e instanceof IllegalStateException?e.getMessage():e.getClass().getSimpleName()));
            System.err.println("Stopped: "+(e instanceof IllegalStateException?e.getMessage():e.getClass().getSimpleName())+". commit_confirmed="+committed); System.exit(1);
        }
    }
}
