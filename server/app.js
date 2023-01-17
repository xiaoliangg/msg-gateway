const http = require('http');
const url = require('url');
const mm = require('http-proxy/lib/http-proxy/passes/test22');

// 只需创建一个 app.js 即可运行
// 参考:https://nodejs.org/en/docs/guides/getting-started-guide/
const hostname = '127.0.0.1';
// const port = 3000;
const port = process.env.PORT | 3000
const environment = process.env.NODE_ENV

const server2 = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});

server2.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    // 当启用test 和 start时,输出的环境不一样，测试通过
    console.log(`Server running environment: ${environment}/`);
});


// 模拟消息发送服务的http短链接
var servers_send = [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
];

// 模拟消息发送服务的websocket连接
var servers_send_ws = [
    'http://localhost:15041',
    'http://localhost:15042',
    // 'http://localhost:15043',
];

// 模拟消息分发服务的http短连接
var servers_dispatch = [
    'http://localhost:7081',
    'http://localhost:7082',
    'http://localhost:7083',
];


var httpProxy = require('http-proxy');
var options = {
    // ws: true
}
var proxy = httpProxy.createProxyServer(options);
var server = http.createServer(function(req, res) {
    // 普通http请求会走此逻辑
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    console.log(req);
    console.log(req.method);
    // 可以打出参数来。 todo:解析url的第一位来确定当前服务
    console.log(req.url);
    var parseObj = url.parse(req.url,true);
    console.log(parseObj);
    // 解析参数成功 todo:根据用户id查找或注册消息发送服务节点
    console.log(parseObj.query.a1);

    console.log(req.headers);
    console.log(req.headers.host);


    // if(req.url.indexOf("msgSend") > -1){
    // todo: 注意忽略大小写
    if(req.headers.host.indexOf("oms.msgdispatch.com") > -1){
        console.log("msgdispatch!!!!!")
        //获取第一个server
        var target = servers_dispatch.shift();
        //将HTTP请求传递给目标node进程
        proxy.web(req,res,{target: target });
        //将第一个server放在末尾，以实现循环地指向不同进程
        servers_dispatch.push(target);
    }else if(req.headers.host.indexOf("oms.msgsend.com") > -1){
        console.log("msgsend!!!!!")
        //获取第一个server
        var target = servers_send.shift();
        //将HTTP请求传递给目标node进程
        proxy.web(req,res,{target: target });
        //将第一个server放在末尾，以实现循环地指向不同进程
        servers_send.push(target);
    }else{
        console.error("wrong http host!!!!!")
        proxy.web(req, res, { target: 'http://127.0.0.1:3000' });
    }
});

server.on('upgrade', function (req, socket, head) {
    // ws请求会走此逻辑
    if(req.headers.host.indexOf("oms.msglongconnect.com") > -1){
        // 通过域名区分是否长连接，此域名是websocket代理
        console.log("msglongconnect2!!!!!")
        var parseObj = url.parse(req.url,true);
        console.log(parseObj);
        // 解析参数成功 todo:根据用户id查找或注册消息发送服务节点
        console.log(parseObj.query.a1);
        //获取第一个server
        var target = servers_send_ws.shift();
        //将第一个server放在末尾，以实现循环地指向不同进程
        servers_send_ws.push(target);
        //将HTTP请求传递给目标node进程
        proxy.ws(req, socket, head,{target: target,switchProtocols:true });
    }else{
        console.error("wrong ws host!!!!!")
    }
});
// 重点: 1、客户端断开重连。   2、某节点崩溃的场景。       技术点:客户端断开的监听，目标服务断开的监听。
// 报警机制；  代理服务的平滑下线；    目标服务的主动平滑下线(重点)。 1.标记某个服务下线(页面配置) 2.代理服务将下线服务的长连接进行迁移。 技术点:代理服务迁移目标服务的长连接
// 重点: nginx reload机制：目标服务加减节点，更新代理服务的配置文件，无需重启。
// 代理服务的集群无需实现!。

// 上线接口:1、将新节点写入外部存储 2.从外部存储刷新nodejs缓存
// 下线接口:1、更新外部存储节点状态为下线中，并刷新nodejs缓存 2.将该节点的所有目标服务的长连接，迁移到其他节点 3.更新外部存储节点状态为下线完成，并刷新nodejs缓存

/*******************************事件测试***************************/
//
// Listen for the `error` event on `proxy`.
// 貌似对应服务器断开
proxy.on('error', function (err, req, res) {
    // if(res.functions.indexOf("writeHead" > -1)){
    //     res.writeHead(500, {
    //         'Content-Type': 'text/plain'
    //     });
    // }

    // res.end('Something went wrong. And we are reporting a custom error message.');
    console.log('11111111');

});

proxy.on('proxyReqWs', function(proxyReq, req, socket, options, head) {
    console.log('RAW proxyReqWs from the target', JSON.stringify(proxyReq.headers, true, 2));
});

//
// Listen for the `open` event on `proxy`.
//
proxy.on('open', function (proxySocket) {
    // listen for messages coming FROM the target here
    // proxySocket.on('data', hybiParseAndLogMessage);
    console.log("proxy.on(open)")
});

proxy.on('connectOtherNode', function(proxyReq, req, socket, options, head) {
    //获取第一个server
    var target = servers_send_ws.shift();
    //将第一个server放在末尾，以实现循环地指向不同进程
    servers_send_ws.push(target);
    //将HTTP请求传递给目标node进程
    proxy.ws(req, socket, head,{target: target,switchProtocols:options.switchProtocols });

    console.log('111connectOtherNode11111111');
});

// Listen for the `close` event on `proxy`.
// 貌似对应客户端断开
proxy.on('close', function (res, socket, head) {
    // view disconnected websocket connections
    console.log('Client disconnected');
});

//
// Listen for the `proxyRes` event on `proxy`.
//
proxy.on('proxyRes', function (proxyRes, req, res) {
    console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
});
console.log("listening on port 5051")
server.listen(5051);

