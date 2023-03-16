//redis封装
var redis = require('redis');
import config from '../config/default'

var urlCheck = require("../util/urlCheck");

const redisUrl = process.env.NODE_ENV === 'production' ? config.prod.redisUrl : config.dev.redisUrl

var client = redis.createClient({
    // redis[s]://[[username][:password]@][host][:port][/db-number]:
    // url: 'redis://alice:foobared@awesome.redis.server:6380'
    url: redisUrl
});
// client.on('error',function(err){
//     console.log('Redis Error:'+err);
// });
// client.on('ready',function(err){
//     console.log("redis is ready ok");
// })
// client.on('connect',function(){
//     console.log('redis connect ok');
// })
client.on('connect', () => console.log('Connected to Redis') )
client.connect();

// var url2 = "http://localhost:9095";
// var url2 = "http://127.0.0.1:9095";
// var url2 = "https://www.baidu.com/";
// var url2 = "http://oms.msglongconnect.com:5051";
var url2 = "http://localhost:10080";
// var url2 = "http://localhost:15041";
// var url2 = "ws://localhost:15041";


var result = urlCheck.checkUrl(url2);
result.then(r=>{
    console.log(`${url2} result:${r}`)
})
// var r = client.incr('node_fail_times');
//
// client.set('server_send_test','http://localhost:8081');
// // client.mSet([{'serversmset1':'v1'},{'serversmset2':'v2'}]);
// client.multi().mSet(['serversmset1','v1','serversmset2','v2']).exec();
// var mResult = client.mGet(['serversmset1','serversmset3','serversmset2']);
// mResult.then(r =>{
//     console.log("r:" + r)
// })
// client.set('server_send_test','http://localhost:8081');
// client.get('server_send_test').then(aa =>{
//     var getResult = aa;
//     console.log(getResult)
// });
//
// client.hSet('server_send_hSet', 'field1', 'value1');
// client.rPush('server_send_push','http://localhost:8081');
// client.rPush('server_send_push','http://localhost:8082');
// client.del("server_send_test",function(){
//     console.log('delete success');
// })
//
// // 集合-set
// client.sAdd('server_send_sAdd',"t1");
// client.sAdd('server_send_sAdd',"t2");
// var r3 = client.sMembers('server_send_sAdd');
// r3.then(aa =>{
//     console.log("set-members:"+aa)
// })
// client.sRem('server_send_sAdd',"t2");
//
// client.zAdd('server_send', { score: 1, value: 'http://localhost:8081' })
// client.zAdd('server_send', { score: 1, value: 'http://localhost:8082' })
// client.zAdd('server_send', { score: 1, value: 'http://localhost:8083' })
//
// // 有序集合-新增
// client.zAdd('server_send_ws', { score: 1, value: 'http://localhost:15041' })
// client.zAdd('server_send_ws', { score: 2, value: 'http://localhost:15042' })
// // client.zAdd('server_send_ws', { score: 0, value: 'http://localhost:15043' })
// // 有序集合-score++
// client.zIncrBy('server_send_zAdd', 15, 'http://localhost:8081')
// client.zIncrBy('server_send_zAdd', -15, 'http://localhost:8082')
// // 有序集合-查询最小score
// var ss = client.zRange('server_send_zAdd', 0,0)
//
// ss.then(aa =>{
//     console.log("aa:"+aa)
// })
// // 有序集合-删除
// client.zRem("server_send_zAdd","http://localhost:8083");
// client.expire('server_send',30) //设置过期时间

exports.client = client;
exports.redis = redis;