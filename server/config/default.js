'use strict'

module.exports = {
    dev: {
        redisUrl: 'redis://10.129.18.143:6379',
        msgDispatchDomain: 'oms.msgdispatch.com',
        msgSendDomain: 'oms.msgsend.com',
        msgSendLongConnectDomain: 'oms.msglongconnect.com',
        managePort: 3000,
        routePort: 5051,
        // 心跳检测,单位s
        heartCheckInterval: 5,
        heartCheckTimeout: 200,
        nodeFailTimesLimit: 1
    },
    prod: {
        // conn = redis.Redis(host='10.51.12.89',port=6379,password='udredis-lt4zg0sh')
        // redis[s]://[[username][:password]@][host][:port][/db-number]:
        // url: 'redis://alice:foobared@awesome.redis.server:6380'
        redisUrl: 'redis://:udredis-lt4zg0sh@10.51.12.89:6379',
        msgDispatchDomain: 'oms.msgdispatch.com',
        msgSendDomain: 'oms.msgsend.com',
        msgSendLongConnectDomain: 'oms.msglongconnect.com',
        managePort: 3000,
        routePort: 5051,
        // 心跳检测,单位s
        heartCheckInterval: 60,
        heartCheckTimeout: 30*60,
        nodeFailTimesLimit: 10
    }
}
