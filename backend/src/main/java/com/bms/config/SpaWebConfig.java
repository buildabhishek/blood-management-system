package com.bms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry r) {
        r.addViewController("/{path:[^\\.]*}").setViewName("forward:/index.html");
        r.setOrder(Ordered.LOWEST_PRECEDENCE);
    }
}
