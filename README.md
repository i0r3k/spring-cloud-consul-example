# README

## 所需软件
在运行前，确保机器上已经安装了以下软件：
1. JDK 8
2. Maven 3.5+
3. Docker 19.03+
4. Docker Compose，与Docker版本匹配即可
5. ClickHouse，最新版即可

## 使用端口
- consul server: 9500
- consul agent: 9510
- pipy proxy: 8500
- service A: 8080
- service B: 8090

## 前置步骤
1. 在ClickHouse的default schema中，使用下面的语句创建日志表：
  ```shell
  CREATE TABLE default.log
  (
    `startTime` Int64 DEFAULT JSONExtractInt(message, 'startTime'),
    `endTime` Int64 DEFAULT JSONExtractInt(message, 'endTime'),
    `latency` Int64 DEFAULT JSONExtractInt(message, 'latency'),
    `status` Int16 DEFAULT JSONExtractInt(response, 'status'),
    `statusText` String DEFAULT JSONExtractString(response, 'statusText'),
    `protocol` String DEFAULT JSONExtractString(message, 'protocol'),
    `method` String DEFAULT JSONExtractString(message, 'method'),
    `path` String DEFAULT JSONExtractString(message, 'path'),
    `headers` String DEFAULT JSONExtractRaw(message, 'headers'),
    `body` String DEFAULT JSONExtractString(message, 'body'),
    `response` String DEFAULT JSONExtractRaw(message, 'response'),
    `response.protocol` String DEFAULT JSONExtractString(response, 'protocol'),
    `message` String
  )
  ENGINE = MergeTree
  PARTITION BY (toYYYYMM(toDateTime(startTime / 1000)))
  ORDER BY (status, startTime)
  SETTINGS index_granularity = 8192;
  ```

2. 记录下ClickHouse的机器IP
3. 修改根目录下的pipy.js第94行`connect('10.0.0.60:8123')`中的IP为上面所记录的IP
  ```javascript
  .pipeline('mux')
    .encodeHttpRequest({
      method: 'POST',
      path: '/?query=insert%20into%20log(message)%20format%20JSONAsString',
      //headers: {Authorization: 'Basic ZGVmYXVsdDpmbG9tZXNo'}
    })
    .connect('10.0.0.60:8123')
    .decodeHttpResponse()
  ```


## 运行步骤
1. 在项目根目录下，执行：
  ```shell
  docker-compose up -d
  ```
  这样将会启动consul server，consul agent以及pipy proxy
  ```shell
  ▶ docker-compose up -d 
  Docker Compose is now in the Docker CLI, try `docker compose up`

  Creating network "test_consul" with driver "bridge"
  Creating consul-server ... done
  Creating pipy-proxy    ... done
  Creating consul-agent  ... done
  ```
2. 访问consul server的UI，如果能狗看到consul控制台，则已经启动成功：http://localhost:9500/ui/

3. 运行service B，进入项目根目录下的service-b目录，执行：
```shell
mvn spring-boot:run
```
4. 测试service B是否已经运行成功：
```shell
▶ curl -i  http://127.0.0.1:8090/hello
HTTP/1.1 200 
Content-Type: text/plain;charset=UTF-8
Content-Length: 45
Date: Thu, 17 Jun 2021 05:08:49 GMT

Hello from service B, timestamp=1623906529019
```

5. 运行service A，进入项目根目录下的service-a目录，执行：
```shell
mvn spring-boot:run
```
6. 测试service A是否已经运行成功：
```shell
▶ curl -i  http://127.0.0.1:8080/test 
HTTP/1.1 200 
Content-Type: text/plain;charset=UTF-8
Content-Length: 45
Date: Thu, 17 Jun 2021 05:08:58 GMT

Hello from service B, timestamp=1623906538444
```

7. 检查ClickHouse中是否已经有访问日志（略）。
