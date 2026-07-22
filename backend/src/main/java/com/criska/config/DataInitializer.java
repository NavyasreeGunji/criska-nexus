package com.criska.config;

import com.criska.entity.Developer;
import com.criska.repository.DeveloperRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DeveloperRepository developerRepository;
    private final JdbcTemplate jdbc;

    public DataInitializer(DeveloperRepository developerRepository, JdbcTemplate jdbc) {
        this.developerRepository = developerRepository;
        this.jdbc = jdbc;
    }

    // username → projectTypes string for migration of existing records
    private static final Map<String, String> PROJECT_TYPES_BY_USERNAME = Map.ofEntries(
        Map.entry("praneeth",              "Client,Internal"),
        Map.entry("anil.yerupala",         "Client,Internal"),
        Map.entry("navya.gunji",           "Client"),
        Map.entry("nagaraju.gunji",        "Client"),
        Map.entry("wahid.syed",            "Client"),
        Map.entry("adnan.yousof",          "Client"),
        Map.entry("shahid.syed",           "Client"),
        Map.entry("navya.gujjeti",         "Client"),
        Map.entry("raghavendra.aadesh",    "Client"),
        Map.entry("manideep.vennam",       "Client"),
        Map.entry("aadil.shaik",           "Internal"),
        Map.entry("aakhil.shaik",          "Internal"),
        Map.entry("mohan.meesala",         "Client"),
        Map.entry("nithin.pillalamari",    "Client"),
        Map.entry("anil.meesala",          "Client")
    );

    @Override
    public void run(String... args) {
        alterColumnToText("sprint", "goal");
        alterColumnToText("team", "description");
        alterColumnToText("team", "member_ids");
        alterColumnToText("bug", "title");
        alterColumnToText("story", "title");
        alterColumnToText("daily_status", "task_name");
        alterColumnToText("daily_status", "work_description");
        addColumnIfNotExists("story", "story_number", "VARCHAR(100)");
        addUniqueConstraintIfNotExists("story", "story_number", "uq_story_story_number");
        addColumnIfNotExists("story", "created_by", "VARCHAR(255)");
        addColumnIfNotExists("bug",   "created_by", "VARCHAR(255)");
        migrateEmailDomain("criskasecurity.com");
        migrateProjectTypes();
        migratePasswordsIfBlank("criska@123");
        migrateRole("navya.gunji", "HR");

        if (developerRepository.count() > 0) return;

        List<Developer> developers = List.of(
            dev("Praneeth",           "praneeth@criskasecurity.com",    "Manager",     "1,2", "praneeth",           "Client,Internal"),
            dev("Anil Yerupala",      "anil.y@criskasecurity.com",      "Tech Lead",   "1,2", "anil.yerupala",      "Client,Internal"),
            dev("Navya Sree Gunji",   "navya.sree@criskasecurity.com",  "HR",          "1",   "navya.gunji",        "Client"),
            dev("Nagaraju Gunji",     "nagaraju@criskasecurity.com",    "Developer",   "1",   "nagaraju.gunji",     "Client"),
            dev("Abdul Wahid Syed",   "wahid@criskasecurity.com",       "Developer",   "1",   "wahid.syed",         "Client"),
            dev("Adnan Yousof",       "adnan@criskasecurity.com",       "Developer",   "1",   "adnan.yousof",       "Client"),
            dev("Abdul Shahid Syed",  "shahid@criskasecurity.com",      "Developer",   "1",   "shahid.syed",        "Client"),
            dev("Navya Gujjeti",      "navya.g@criskasecurity.com",     "Developer",   "2",   "navya.gujjeti",      "Client"),
            dev("Raghavendra Aadesh", "raghavendra@criskasecurity.com", "Developer",   "2",   "raghavendra.aadesh", "Client"),
            dev("Manideep Vennam",    "manideep@criskasecurity.com",    "Developer",   "2",   "manideep.vennam",    "Client"),
            dev("Aadil Shaik",        "aadil@criskasecurity.com",       "Developer",   "1",   "aadil.shaik",        "Internal"),
            dev("Aakhil Shaik",       "aakhil@criskasecurity.com",      "Developer",   "2",   "aakhil.shaik",       "Internal"),
            dev("Mohan Meesala",      "mohan@criskasecurity.com",       "Developer",   "2",   "mohan.meesala",      "Client"),
            dev("Nithin Pillalamari", "nithin@criskasecurity.com",      "Developer",   "2",   "nithin.pillalamari", "Client"),
            dev("Anil Meesala",       "anil.m@criskasecurity.com",      "Developer",   "2",   "anil.meesala",       "Client")
        );

        developerRepository.saveAll(developers);
        System.out.println("✓ Seeded " + developers.size() + " developers");
    }

    private void addColumnIfNotExists(String table, String column, String type) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                Integer.class, table, column);
            if (count == null || count == 0) {
                jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + type);
                System.out.println("✓ Added column " + table + "." + column);
            }
        } catch (Exception e) {
            System.out.println("⚠ Could not add column " + table + "." + column + ": " + e.getMessage());
        }
    }

    private void addUniqueConstraintIfNotExists(String table, String column, String constraintName) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = ? AND constraint_name = ?",
                Integer.class, table, constraintName);
            if (count == null || count == 0) {
                jdbc.execute("ALTER TABLE " + table + " ADD CONSTRAINT " + constraintName + " UNIQUE (" + column + ")");
                System.out.println("✓ Added unique constraint " + constraintName);
            }
        } catch (Exception e) {
            System.out.println("⚠ Could not add constraint " + constraintName + ": " + e.getMessage());
        }
    }

    private void alterColumnToText(String table, String column) {
        try {
            String dataType = jdbc.queryForObject(
                "SELECT data_type FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                String.class, table, column);
            if (!"text".equalsIgnoreCase(dataType)) {
                jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT");
                System.out.println("✓ Altered " + table + "." + column + " to TEXT");
            }
        } catch (Exception e) {
            System.out.println("⚠ Could not alter " + table + "." + column + ": " + e.getMessage());
        }
    }

    private void migrateProjectTypes() {
        List<Developer> all = developerRepository.findAll();
        List<Developer> toUpdate = new ArrayList<>();
        for (Developer d : all) {
            if (d.getProjectTypes() == null || d.getProjectTypes().isBlank()) {
                String pts = PROJECT_TYPES_BY_USERNAME.get(d.getUsername());
                if (pts != null) {
                    d.setProjectTypes(pts);
                    toUpdate.add(d);
                }
            }
        }
        if (!toUpdate.isEmpty()) {
            developerRepository.saveAll(toUpdate);
            System.out.println("✓ Set project types for " + toUpdate.size() + " developer(s)");
        }
    }

    private void migrateEmailDomain(String newDomain) {
        List<Developer> all = developerRepository.findAll();
        List<Developer> toUpdate = new ArrayList<>();
        for (Developer d : all) {
            String email = d.getEmail();
            // Only fill in missing emails — never overwrite an email the user has set
            if (email == null || email.isBlank()) {
                if (d.getUsername() != null && !d.getUsername().isBlank()) {
                    d.setEmail(d.getUsername() + "@" + newDomain);
                    toUpdate.add(d);
                }
            }
        }
        if (!toUpdate.isEmpty()) {
            developerRepository.saveAll(toUpdate);
            System.out.println("✓ Set missing email(s) for " + toUpdate.size() + " developer(s)");
        }
    }

    private void migrateRole(String username, String newRole) {
        developerRepository.findByUsername(username).ifPresent(d -> {
            if (!newRole.equals(d.getRole())) {
                d.setRole(newRole);
                developerRepository.save(d);
                System.out.println("✓ Updated role for " + username + " to " + newRole);
            }
        });
    }

    // special overrides where first.last would produce a duplicate (both Abduls share Abdul + Syed)
    private static final Map<String, String> USERNAME_OVERRIDES = Map.of(
        "Abdul Wahid Syed",  "wahid.syed",
        "Abdul Shahid Syed", "shahid.syed"
    );

    private String deriveUsername(String name) {
        String[] parts = name.trim().toLowerCase().split("\\s+");
        if (parts.length == 1) return parts[0];
        return parts[0] + "." + parts[parts.length - 1];
    }

    private void migrateUsernames() {
        List<Developer> all = developerRepository.findAll();
        List<Developer> toUpdate = new ArrayList<>();
        for (Developer d : all) {
            if (d.getName() == null || d.getName().isBlank()) continue;
            // skip if already in firstname.lastname format — set by migration or manually
            if (d.getUsername() != null && d.getUsername().contains(".")) continue;
            String trimmed = d.getName().trim();
            String newUsername = USERNAME_OVERRIDES.getOrDefault(trimmed, deriveUsername(trimmed));
            if (!newUsername.equals(d.getUsername())) {
                d.setUsername(newUsername);
                toUpdate.add(d);
            }
        }
        if (!toUpdate.isEmpty()) {
            developerRepository.saveAll(toUpdate);
            System.out.println("✓ Updated usernames for " + toUpdate.size() + " developer(s)");
        }
    }

    private void migratePasswordsIfBlank(String defaultPassword) {
        List<Developer> all = developerRepository.findAll();
        List<Developer> toUpdate = new ArrayList<>();
        for (Developer d : all) {
            if (d.getPassword() == null || d.getPassword().isBlank()) {
                d.setPassword(defaultPassword);
                toUpdate.add(d);
            }
        }
        if (!toUpdate.isEmpty()) {
            developerRepository.saveAll(toUpdate);
            System.out.println("✓ Set default password for " + toUpdate.size() + " developer(s) with no password");
        }
    }

    private Developer dev(String name, String email, String role, String teamIds, String username, String projectTypes) {
        Developer d = new Developer();
        d.setName(name);
        d.setEmail(email);
        d.setRole(role);
        d.setTeamIds(teamIds);
        d.setUsername(username);
        d.setPassword("criska@123");
        d.setProjectTypes(projectTypes);
        return d;
    }
}
