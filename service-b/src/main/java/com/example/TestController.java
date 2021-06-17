package com.example;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Class TestController
 *
 * @author linyang
 * @date 2021/6/17
 */
@RestController
public class TestController {
    @RequestMapping("/hello")
    public String test() {
        return "Hello from service B, timestamp=" + System.currentTimeMillis();
    }
}
