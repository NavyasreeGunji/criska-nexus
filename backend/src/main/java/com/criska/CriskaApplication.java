package com.criska;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CriskaApplication {
    public static void main(String[] args) {
        SpringApplication.run(CriskaApplication.class, args);
    }
}
