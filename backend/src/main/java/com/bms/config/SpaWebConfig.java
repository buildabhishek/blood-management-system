package com.bms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

        // Forward single-level routes (e.g. /login, /dashboard)
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");

        registry.setOrder(Ordered.LOWEST_PRECEDENCE);
    }
}
