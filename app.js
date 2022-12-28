const http = require('http');

// 只需创建一个 app.js 即可运行
// 参考:https://nodejs.org/en/docs/guides/getting-started-guide/
const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});