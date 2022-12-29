const http = require('http');

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



var httpProxy = require('http-proxy');
var options = {
}
var proxy = httpProxy.createProxyServer(options);
var server = http.createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    const data = req.body
    const params = req.query

    console.log(`data: ${data}/params: ${params}/`);
    console.log(req);

    proxy.web(req, res, { target: 'http://127.0.0.1:3000' });
});
console.log("listening on port 5050")
server.listen(5051);