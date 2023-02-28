'use strict'

var myRedis = require("../redis/myredis");
const crypto = require('crypto');
import {initDispatchServer} from '../app'
import {startOfflineNode} from './startOfflineNode'
import * as CONST from '../service/CONST'
var urlExist = require('url-exist');

/**
 * 上线节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const saveNode = async data => {
  if(data.server === CONST.SERVER_SEND){
    // todo 校验如果上线节点在下线中，抛出异常
    // var errRes = validateDowning(data);
    // if(errRes) throw errRes;

    let map = [];
    let nid;
    if(data.data && data.data.length != 0){
      data.data.forEach(item => {
        item.score = 0;
        nid = crypto.randomUUID();
        map.push(CONST.SERVER_SEND_WS(nid));
        map.push(item.ws);
        map.push(CONST.SERVER_SEND_HTTP(nid));
        map.push(item.http);
        item.value = nid;
      })

      if(map.length){
        await myRedis.client.multi().mSet(map).exec();
        await myRedis.client.multi().zAdd(CONST.SERVER_SEND,data.data).exec();
      }
    }
  }else if(data.server === CONST.SERVER_DISPATCH){
    let arr = [];
    data.data.forEach(item => {
      arr.push(item.http);
    })
    if(arr.length != 0){
      await myRedis.client.multi().sAdd(CONST.SERVER_DISPATCH, arr).exec();
      await myRedis.client.multi().sRem(CONST.SERVER_DISPATCH_DOWN,arr).exec();
      await initDispatchServer();
    }
  }else{
    throw "不支持的服务6"
  }
}

/**
 * 心跳检测 每隔 interval 检测url是否可达，直到检测成功或超时
 * @param url
 * @param interval 时间间隔,单位s
 * @param timeout 超时时间,单位s
 * @returns {Promise<Promise<unknown> extends PromiseLike<infer U> ? U : Promise<unknown>>}
 */
async function heartCheck(url,interval,timeout) {
  var timeoutId = null;
  var intervalId = null;
  var p1 = new Promise((resolve,reject) =>{
    const check = async (url) => {
      console.log(`url心跳检测检测:${url}`)
      const exists = await urlExist(url);
      if(exists){
        if(intervalId) {
          console.log(`${url}可达,清除定时器`)
          clearInterval(intervalId);
          intervalId = null;
        }
        if(timeoutId){
          console.log(`${url}可达,清除超时`)
          clearTimeout(timeoutId);
        }
        console.log(`${url}可达,返回true`)
        resolve(true)
      }
    };
    intervalId = setInterval(check, interval*1000,url);
  })

  var p2 = new Promise((resolve,reject) =>{
    const fn2 = () => {
      if(intervalId) {
        console.log(`${url}检测超时,清除定时器并返回false`)
        clearInterval(intervalId);
        resolve(false)
      }
    };
    timeoutId = setTimeout(fn2,timeout*1000);
  })
  return Promise.race([p1,p2]);
}

// 开始下线节点
export const startDeleteNode = async data => {
  await myRedis.client.zRem(CONST.SERVER_SEND,data.nid);
  // 移入下线中的节点集合
  if(data.mode === 'auto'){
    // 心跳检测ws地址。30min  每分钟check一次，超过30min后，下线。
    var ws = await myRedis.client.get(CONST.SERVER_SEND_WS(nid))
    var success = await heartCheck(ws,60,60*30);
    if(success){
      // 如果30min内成功,重新加入在线集合
      await myRedis.client.zAdd(CONST.SERVER_SEND,data.nid);
    }else{
      // 超过30min后，下线
      await myRedis.client.sAdd(CONST.SERVER_SEND_WS_AUTO_DOWNING,data.nid);
      startOfflineNode(data.nid).then(result => {
        console.log(`自动下线成功,nid:${data.nid}`);
        deleteNodeFinish({'mode':'auto',nid:data.nid})
      }).catch(err => {
        console.error(`自动下线失败,nid:${data.nid}`);
      })
    }
  }else{
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_MANUAL_DOWNING,data.nid);
    startOfflineNode(data.nid).then(result => {
      console.log(`手动下线成功,nid:${data.nid}`);
      deleteNodeFinish({'mode':'manual',nid:data.nid})
    }).catch(err => {
      console.error(`手动下线失败,nid:${data.nid},error:${err}`);
    })
  }
}

// 下线节点完成
export const deleteNodeFinish = async data => {
  // 查询ws地址和http地址
  var ws = await myRedis.client.get(CONST.SERVER_SEND_WS(data.nid))
  var http = await myRedis.client.get(CONST.SERVER_SEND_HTTP(data.nid))
  if(data.mode === 'auto'){
    await myRedis.client.sRem(CONST.SERVER_SEND_WS_AUTO_DOWNING,data.nid);
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_AUTO_DOWN,JSON.stringify({"ws":ws,"http":http}));
  }else{
    await myRedis.client.sRem(CONST.SERVER_SEND_WS_MANUAL_DOWNING,data.nid);
    //todo json对象转字符串
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_MANUAL_DOWN,JSON.stringify({"ws":ws,"http":http}));
  }
  await myRedis.client.del(CONST.SERVER_SEND_WS(data.nid))
  await myRedis.client.del(CONST.SERVER_SEND_HTTP(data.nid))
}

/**
 * 下线分发服务的节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const deleteDispatchServer = async data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sRem(CONST.SERVER_DISPATCH,data.http);
    myRedis.client.sAdd(CONST.SERVER_DISPATCH_DOWN,data.http);
    initDispatchServer();
    resolve();
  })
}


export const queryOnlineNode = async server => {
  var finalyResult = [];
  var onlineNodes;
  var nodeWsValue;
  var nodeHttpValue;

  if(server === CONST.SERVER_SEND){
    onlineNodes = await myRedis.client.zRangeWithScores(server,0,50);
    // JavaScript 中的 forEach不支持 promise 感知，也支持 async 和await，所以不能在 forEach 使用 await
    for (let index = 0; index < onlineNodes.length; index ++) {
      const node = onlineNodes[index];
      nodeWsValue = await myRedis.client.get(CONST.SERVER_SEND_WS(node.value));
      nodeHttpValue = await myRedis.client.get(CONST.SERVER_SEND_HTTP(node.value));
      finalyResult.push({"ws":nodeWsValue,"http":nodeHttpValue,"score":node.score,"id":node.value})
    }
    return finalyResult;
  }else if(server === CONST.SERVER_DISPATCH){
    return await myRedis.client.sMembers(CONST.SERVER_DISPATCH);
  }else{
    throw "未知的server";
  }
}

/**
 * 添加用户的失败过节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const addFailNodes = async data => {
  return await myRedis.client.sAdd(CONST.SERVER_FAILED_NODES(data.uid),data.nid);

}
/**
 * 清空用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const clearFailNodes = async data => {
  return await myRedis.client.del(CONST.SERVER_FAILED_NODES(data.uid));

}

/**
 * 查询用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const queryFailNodes = async data => {
  return await myRedis.client.sMembers(CONST.SERVER_FAILED_NODES(data.uid))
}

/**
 * 节点的连续失败次数+1
 * @param data
 * @returns {Promise<unknown>}
 */
export const incrNodeFailTimes = async data => {
  return await myRedis.client.incr(CONST.SERVER_NODE_FAIL_TIMES(data.nid));
}
/**
 * 节点的连续失败次数重置为0
 * @param data
 * @returns {Promise<unknown>}
 */
export const clearNodeFailTimes = async data => {
  await myRedis.client.del(CONST.SERVER_NODE_FAIL_TIMES(data.nid));
}