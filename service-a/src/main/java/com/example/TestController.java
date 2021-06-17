package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.discovery.DiscoveryClient;
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
    ServiceB serviceB;

    @RequestMapping("/test")
    public String test() {
        return serviceB.hello();
    }
}
