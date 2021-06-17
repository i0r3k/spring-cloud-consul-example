package com.example;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Class ServiceB
 *
 * @author linyang
 * @date 2021/6/17
 */
@FeignClient(name = "consul-service-b")
public interface ServiceBClient {

    @RequestMapping("/hello")
    String hello();
}
