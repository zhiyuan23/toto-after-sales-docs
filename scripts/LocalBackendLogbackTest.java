import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.joran.JoranConfigurator;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.boot.logging.LoggingInitializationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

// A private LoggerContext exercises real Spring/Logback parsing, rollover, expiry and domain isolation.
public class LocalBackendLogbackTest {
    static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    public static void main(String[] args) throws Exception {
        Path root = Path.of(args[1]);
        Files.createDirectories(root.resolve("gaia_saas"));
        Path expired = root.resolve("gaia_saas/" + LocalDate.now().minusDays(14) + ".0.all.log.gz");
        Files.write(expired, new byte[0]);
        var environment = new StandardEnvironment();
        environment.setActiveProfiles("develop");
        environment.getPropertySources().addFirst(new MapPropertySource("test", Map.of(
            "spring.application.name", "gaia_saas", "logging.file.path", root.toString())));
        var logging = new LoggerContext();
        logging.setMDCAdapter(MDC.getMDCAdapter());
        var output = System.out;
        System.setOut(new PrintStream(OutputStream.nullOutputStream()));
        try {
            var constructor = Class.forName("org.springframework.boot.logging.logback.SpringBootJoranConfigurator")
                .getDeclaredConstructor(LoggingInitializationContext.class);
            constructor.setAccessible(true);
            var configurator = (JoranConfigurator) constructor.newInstance(new LoggingInitializationContext(environment));
            configurator.setContext(logging);
            configurator.doConfigure(args[0]);
            logging.start();
            check(logging.getStatusManager().getCopyOfStatusList().stream().noneMatch(s -> s.getLevel() == 2), "invalid logging configuration");
            String payload = "x".repeat(80 * 1024);
            for (int i = 0; i < 150; i++) {
                logging.getLogger("shared.Probe").error(payload);
                logging.getLogger("afterSales.telemetry").info(payload);
            }
            MDC.put("traceId", "local-log-isolation");
            logging.getLogger("shared.Probe").error("shared-final-marker");
            logging.getLogger("afterSales.telemetry").info("domain-final-marker");
            String shared = Files.readString(root.resolve("gaia_saas/all.log"));
            String domain = Files.readString(root.resolve("gaia_saas/after-sales.log"));
            check(shared.contains("shared-final-marker") && !shared.contains("domain-final-marker"), "shared log isolation");
            check(domain.contains("domain-final-marker") && domain.contains("traceId=local-log-isolation") && !domain.contains("shared-final-marker"), "domain log isolation/trace");
            for (int i = 0; i < 60 && Files.exists(expired); i++) Thread.sleep(50);
            check(!Files.exists(expired), "expired archive not cleaned at startup");
        } finally {
            logging.stop();
            MDC.clear();
            System.setOut(output);
        }
        for (String channel : new String[]{"all", "error", "after-sales"}) {
            try (var files = Files.list(root.resolve("gaia_saas"))) {
                check(files.anyMatch(p -> p.getFileName().toString().endsWith("." + channel + ".log.gz")), "10MB rollover missing: " + channel);
            }
            check(Files.size(root.resolve("gaia_saas/" + channel + ".log")) < 11 * 1024 * 1024, "active file oversized");
        }
        System.out.println("PASS: real Logback configuration, 3-channel rollover, startup expiry, domain isolation and trace");
    }
}
