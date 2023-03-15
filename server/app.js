import router from './routes/index'
import timeout from 'connect-timeout'
import {
    addLongConnect,
    deleteLongConnect,
    queryNidByUid
} from './service/LongConnectManage'
import {
    addFailNodes,
    clearFailNodes,
    queryFailNodes,
    incrNodeFailTimes,
    clearNodeFailTimes, startDeleteNode
} from './service/nodeManage'
import {
    BreakError
} from './error/error'
import bodyParser from 'body-parser'
import * as CONST from "./service/CONST";
import config from "./config/default";

const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
var myRedis = require("./redis/myredis");
var httpProxy = require('http-proxy');

// 业务配置的环境变量
const managePort = process.env.NODE_ENV === 'production' ? config.prod.managePort : config.dev.managePort
const routePort = process.env.NODE_ENV === 'production' ? config.prod.routePort : config.dev.routePort

const msgDispatchDomain = process.env.NODE_ENV === 'production' ? config.prod.msgDispatchDomain : config.dev.msgDispatchDomain
const msgSendDomain = process.env.NODE_ENV === 'production' ? config.prod.msgSendDomain : config.dev.msgSendDomain
const msgSendLongConnectDomain = process.env.NODE_ENV === 'production' ? config.prod.msgSendLongConnectDomain : config.dev.msgSendLongConnectDomain
const nodeFailTimesLimit = process.env.NODE_ENV === 'production' ? config.prod.nodeFailTimesLimit : config.dev.nodeFailTimesLimit

/***************************节点管理服务****************************************/
const app = express()
// 超时时间
const TIME_OUT = 300 * 1e3
// 设置超时 返回超时响应
app.use(timeout(TIME_OUT))
app.use((req, res, next) => {
    if (!req.timedout) next()
})

app.all('*', async (req, res, next) => {
    // 响应开始时间
    const start = new Date()
    // 响应间隔时间
    var ms
    ms = new Date() - start
    try {
        // 开始进入到下一个中间件
        await next()
        // 记录响应日志
        if (process.env.NODE_ENV === 'production') {
            log.i(req, ms)
        }
    } catch (error) {
        // 记录异常日志
        if (process.env.NODE_ENV === 'production') {
            log.e(req, error, ms)
        }
    }
    console.log(`${req.method} ${req.url} - ${ms}ms-${res.statusCode}`)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// 设置浏览器可以直接访问的静态文件目录
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'statics')))

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

router(app)

app.get('/', function (req, res) {
    // 首页推送静态页面
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

// 监听服务
app.listen(managePort, function () {
    console.log(`node manager listening on port ${managePort}!`)
})

/***************************路由服务****************************************/
// 消息分发服务的http短连接
// var server_dispatch = await myRedis.client.sMembers(CONST.SERVER_DISPATCH);
var server_dispatch = [];
export const initDispatchServer = async () =>{
    myRedis.client.sMembers(CONST.SERVER_DISPATCH).then(a => server_dispatch = a);
}
initDispatchServer()

var server_send = [];
export const initSendServer = async () =>{
    server_send = [];
    var onlineNodes = await myRedis.client.zRangeWithScores(CONST.SERVER_SEND,0,50);
    var nodeHttpValue = null;
    for (let index = 0; index < onlineNodes.length; index ++) {
        const node = onlineNodes[index];
        nodeHttpValue = await myRedis.client.get(CONST.SERVER_SEND_HTTP(node.value));
        server_send.push(nodeHttpValue)
    }
}
initSendServer()

var options = {
    // ws: true
    proxyTimeout:20000, // timeout (in millis) when proxy receives no response from target
    timeout:30000 // timeout (in millis) for incoming requests
}
var proxy = httpProxy.createProxyServer(options);
export var server = http.createServer(async function(req, res) {
    await routeHttp(req,res);
});

server.on('upgrade', async function (req, socket, head) {
    let sourceHost,parseObj,uid,nid,nids,target;
    sourceHost = req.headers.host;
    // ws请求会走此逻辑
    if(req.headers.host.toLowerCase().indexOf(msgSendLongConnectDomain) > -1){
        // 通过域名区分是否长连接，此域名是websocket代理
        console.log(`request:${req.method},${sourceHost},${req.url}`)
        parseObj = url.parse(req.url,true);
        uid = parseObj.query.deviceid;
        console.log(parseObj);
        // 获取节点
        nids = await myRedis.client.zRange(CONST.SERVER_SEND, 0,0);
        nid = nids[0];
        console.log(`start query ws host:${nid}`)
        target = await myRedis.client.get(CONST.SERVER_SEND_WS(nid));
        console.log(`${nid} ws host is ${target}`)
        // 新增长连接
        if(target){
            //将HTTP请求传递给目标node进程
            await proxy.ws(req, socket, head,{target: target,switchProtocols:true,nid:nid });
        }else{
            console.error("没有可用的长连接服务!!!!!")
        }
    }else{
        console.error("wrong ws host!!!!!")
    }
});

proxy.on('connectOtherNode', async function(proxyReq, req, socket, options, head) {
    let oldNid,parseObj,uid,nid,target,failNodes,nodeFailTimes,zScore,allNodes;
    parseObj = url.parse(req.url,true);
    uid = parseObj.query.deviceid;
    oldNid = options.nid;
    console.log(`connectOtherNode,uid:${uid},oldNid:${oldNid}`);
    if(oldNid){
        // 删除失败nid与uid的关联
        console.log(`delete old nid long connect,uid:${uid},oldNid:${oldNid}`);
        await deleteLongConnect({"server":CONST.SERVER_SEND,"nid":oldNid,"uid":uid})
        // 加入该用户的失败服务集合，并返回最新失败服务集合
        // 如果nid在在线集合，进行处理；如果不在在线集合，说明已经是下线或下线中的节点，则无需进行处理
        zScore = await myRedis.client.zScore(CONST.SERVER_SEND,oldNid);
        if(zScore != null){
            console.log(`失败节点的状态是在线,增加节点的失败次数和用户的失败节点集合,uid:${uid},oldNid:${oldNid}`);
            await addFailNodes({uid:uid,nid:oldNid})
            // 旧的nid连续失败次数+1.判断旧的nid失败超限，开启自动下线流程.
            nodeFailTimes = await incrNodeFailTimes({nid:oldNid})
            if(nodeFailTimes > nodeFailTimesLimit){
                // 开启自动下线流程
                await startDeleteNode({nid:oldNid,mode:'auto'});
            }else{
                console.log(`失败节点的当前失败次数,uid:${uid},nodeFailTimes:${nodeFailTimes}`);
            }
        }else{
            console.log(`失败节点的状态是下线,oldNid:${oldNid}`);
        }
    }

    // 不再使用刚刚失败的节点。轮询其他节点，而不是使用最小连接数的节点。
    failNodes = await queryFailNodes({uid:uid})

    allNodes = await myRedis.client.zRange(CONST.SERVER_SEND, 0, 10);
    for (let i = 0; i < allNodes.length; i++) {
        let node = allNodes[i];
        if (!(failNodes && failNodes.includes(node)) && !nid) {
            nid = node;
        }
    }
    if(nid){
        target = await myRedis.client.get(CONST.SERVER_SEND_WS(nid))
        if(target){
            //将HTTP请求传递给目标node进程
            await proxy.ws(req, socket, head,{target: target,switchProtocols:options.switchProtocols,nid:nid});
        }else{
            console.error(`No available Service! uid:${uid}`)
        }
    }else{
        console.error("没有可用的长连接服务节点!!")
    }
});

// http请求的失败计数,用于请求重试
var httpFailsMap = new Map();
//
// Listen for the `error` event on `proxy`.
// 对应服务器断开
proxy.on('error', async function (err, req, res) {
    console.log(`server disconnect error:${err}`);
    let sourceHost = req.headers.host;
    let key = sourceHost + req.url;
    let retryTimes = 3;
    // 根据服务修改重试次数
    if(sourceHost.toLowerCase().indexOf(msgDispatchDomain) > -1){
        retryTimes = server_dispatch.length
    }else if(sourceHost.toLowerCase().indexOf(msgSendDomain) > -1){
        retryTimes = server_send.length;
    }
    // 初始化服务重试次数为0
    let tmp = httpFailsMap.get(key)?httpFailsMap.get(key):0;
    tmp = tmp + 1;
    httpFailsMap.set(key,tmp);
    if(httpFailsMap.get(key) >= retryTimes){
        console.error("retry times out!!")
        res.end('des server error')
    }else{
        await routeHttp(req,res)
    }
});

//
// Listen for the `open` event on `proxy`.
// 长连接建立成功
//
proxy.on('open', async function (proxySocket,uid,nid) {
    // listen for messages coming FROM the target here
    // proxySocket.on('data', hybiParseAndLogMessage);
    console.log(`long connect success,nid:${nid},uid:${uid}`)
    // 为新的nid与uid建立关联
    await addLongConnect({"server":CONST.SERVER_SEND,"nid":nid,"uid":uid})
    await clearFailNodes({"uid":uid});
    await clearNodeFailTimes({"nid":nid});
});

// Listen for the `close` event on `proxy`.
// 客户端主动断开
proxy.on('close', async function (res, socket, head,uid,nid) {
    // view disconnected websocket connections
    console.log('Client disconnected');
    await deleteLongConnect({"server":CONST.SERVER_SEND,"nid":nid,"uid":uid})
});

proxy.on('proxyReqWs', async function(proxyReq, req, socket, options, head) {
    console.log('RAW proxyReqWs from the target', JSON.stringify(proxyReq.headers, true, 2));
});

//
// Listen for the `proxyRes` event on `proxy`.
// http代理成功
//
proxy.on('proxyRes', async function (proxyRes, req, res) {
    console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
    // 清除重试次数记录
    let sourceHost = req.headers.host;
    let key = sourceHost + req.url;
    httpFailsMap.delete(key);
});
console.log(`route service listening on port ${routePort}`)
server.listen(routePort);

async function routeHttp(req,res){
    let sourceHost,parseObj,uid,nid,target;

    sourceHost = req.headers.host;
    console.log(`request:${req.method},${sourceHost},${req.url}`)
    if(sourceHost.toLowerCase().indexOf(msgDispatchDomain) > -1){
        console.log(`to msgDispatch req:${req.method},${req.url}`)
        target = server_dispatch.shift();
        server_dispatch.push(target);
        //将HTTP请求传递给目标node进程
        await proxy.web(req,res,{target: target });
    }else if(sourceHost.toLowerCase().indexOf(msgSendDomain) > -1){
        //如果有用户id,通过用户id查找nid。 否则，轮询一个
        parseObj = url.parse(req.url,true);
        uid = parseObj.query.uid;
        if(uid){
            nid = await queryNidByUid(uid);
            if(nid){
                // nid不为空说明长连接存在
                target = await myRedis.client.get(CONST.SERVER_SEND_HTTP(nid))
                console.log(`${uid} belongs node ${nid},${target}`)
            }else{
                // nid为空说明没有建立长连接
                target = server_send.shift();
                server_send.push(target);
                console.log(`${uid} belongs no node,send request to ${target}`)
            }
            if(target){
                //将HTTP请求传递给目标node进程
                await proxy.web(req,res,{target:target});
            }else{
                console.error("no available service!")
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('route fail,no available service!');
            }
        }else{
            console.error("没有可用的消息发送服务节点!!")
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('route fail error!');
        }
    }else{
        console.error("wrong http host!")
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('route fail error!');
    }
}

