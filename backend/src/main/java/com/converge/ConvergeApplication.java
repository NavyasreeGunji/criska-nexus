package com.converge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ConvergeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConvergeApplication.class, args);
    }
}
