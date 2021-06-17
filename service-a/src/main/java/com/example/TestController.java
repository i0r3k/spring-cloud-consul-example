package com.example;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    ServiceBClient serviceBClient;

    @RequestMapping("/test")
    public String test() {
        return "Service A get response: " + serviceBClient.hello();
    }
}
