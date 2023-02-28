'use strict'

module.exports = {
    dev: {
        redisUrl: 'redis://10.129.18.143:6379'
    },
    prod: {
        // conn = redis.Redis(host='10.51.12.89',port=6379,password='udredis-lt4zg0sh')
        // redis[s]://[[username][:password]@][host][:port][/db-number]:
        // url: 'redis://alice:foobared@awesome.redis.server:6380'
        redisUrl: 'redis://:udredis-lt4zg0sh@10.51.12.89:6379'
    }
}
