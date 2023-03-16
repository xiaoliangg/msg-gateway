'use strict'

import config from "../config/default";

var myRedis = require("../redis/myredis");
const crypto = require('crypto');
import {initDispatchServer,initSendServer} from '../app'
import {startOfflineNode} from './startOfflineNode'
import * as CONST from '../service/CONST'
const urlCheck = require("../util/urlCheck");

const heartCheckInterval = process.env.NODE_ENV === 'production' ? config.prod.heartCheckInterval : config.dev.heartCheckInterval
const heartCheckTimeout = process.env.NODE_ENV === 'production' ? config.prod.heartCheckTimeout : config.dev.heartCheckTimeout

/**
 * 上线节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const saveNode = async data => {
  console.log(`add new node:${data.server},${JSON.stringify(data.data)}`)
  if(data.server === CONST.SERVER_SEND){
    let map = [];
    let nid;
    if(data.data && data.data.length != 0){
      for (let index = 0; index < data.data.length; index ++) {
        let item = data.data[index];
        item.score = 0;
        nid = crypto.randomUUID();
        map.push(CONST.SERVER_SEND_WS(nid));
        map.push(item.ws);
        map.push(CONST.SERVER_SEND_HTTP(nid));
        map.push(item.http);
        item.value = nid;
        await myRedis.client.sRem(CONST.SERVER_SEND_WS_MANUAL_DOWN,JSON.stringify({"ws":item.ws,"http":item.http}));
        await myRedis.client.sRem(CONST.SERVER_SEND_WS_AUTO_DOWN,JSON.stringify({"ws":item.ws,"http":item.http}));
      }

      if(map.length){
        await myRedis.client.multi().mSet(map).exec();
        await myRedis.client.multi().zAdd(CONST.SERVER_SEND,data.data).exec();
        console.log(`msgSend domain ${JSON.stringify(map)} online success,init cache.`)
        await initSendServer()
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
      console.log(`msgDispatch domain ${JSON.stringify(arr)} online success,init cache.`)
      await initDispatchServer();
    }
  }else{
    console.error("unsupported domain name!")
    throw "unsupported domain name!"
  }
}

/**
 * 心跳检测 每隔 interval 检测url是否可达，直到检测成功或超时
 * @param url
 * @param interval 重试时间间隔,单位s
 * @param timeout 超时时间,重试总时间,单位s
 * @returns {Promise<Promise<unknown> extends PromiseLike<infer U> ? U : Promise<unknown>>}
 */
async function heartCheck(url,interval,timeout) {
  console.log(`url heart check:url:${url},interval:${interval},timeout:${timeout}`)
  let timeoutId = null;
  let intervalId = null;
  let p1 = new Promise((resolve,reject) =>{
    const check = async (url) => {
      console.log(`url heart check:${url}`)
      const exists = await urlCheck.checkUrl(url);
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

  let p2 = new Promise((resolve,reject) =>{
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
  let mode,nid;
  mode = data.mode
  nid = data.nid
  console.log(`startDeleteNode:${JSON.stringify(data)}`)
  await myRedis.client.zRem(CONST.SERVER_SEND,nid);
  await initDispatchServer();
  // 移入下线中的节点集合
  if(mode === 'auto'){
    // 心跳检测ws地址:每heartCheckInterval check一次，超过heartCheckTimeout后，下线
    var ws = await myRedis.client.get(CONST.SERVER_SEND_WS(nid))
    var success = await heartCheck(ws,heartCheckInterval,heartCheckTimeout);
    if(success){
      // 如果成功,重新加入在线集合
      console.log(`heartCheck success:${ws}`)
      await myRedis.client.zAdd(CONST.SERVER_SEND,nid);
    }else{
      // 超过30min后，下线
      // 自动下线无需操作长连接，node侧长连接失败后，会自动匹配其他节点
      // await myRedis.client.sAdd(CONST.SERVER_SEND_WS_AUTO_DOWNING,nid);
      console.log(`heartCheck fail:${ws}`)
      await deleteNodeFinish({'mode':'auto',nid:nid})
    }
  }else{
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_MANUAL_DOWNING,nid);
    startOfflineNode(nid).then(result => {
      console.log(`manual offline success,nid:${nid}`);
      deleteNodeFinish({'mode':'manual',nid:nid})
    }).catch(err => {
      console.error(`manual offline fail,nid:${nid},error:${err}`);
    })
  }
}

// 下线节点完成
export const deleteNodeFinish = async data => {
  console.log(`deleteNodeFinish:${JSON.stringify(data)}`)
  // 查询ws地址和http地址
  var ws = await myRedis.client.get(CONST.SERVER_SEND_WS(data.nid))
  var http = await myRedis.client.get(CONST.SERVER_SEND_HTTP(data.nid))
  if(data.mode === 'auto'){
    // await myRedis.client.sRem(CONST.SERVER_SEND_WS_AUTO_DOWNING,data.nid);
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_AUTO_DOWN,JSON.stringify({"ws":ws,"http":http}));
  }else{
    await myRedis.client.sRem(CONST.SERVER_SEND_WS_MANUAL_DOWNING,data.nid);
    await myRedis.client.sAdd(CONST.SERVER_SEND_WS_MANUAL_DOWN,JSON.stringify({"ws":ws,"http":http}));
  }
  await myRedis.client.del(CONST.SERVER_SEND_WS(data.nid))
  await myRedis.client.del(CONST.SERVER_SEND_HTTP(data.nid))
  await clearNodeFailTimes({"nid":data.nid});
  await initDispatchServer();
}

/**
 * 下线分发服务的节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const deleteDispatchServer = async data => {
  await myRedis.client.sRem(CONST.SERVER_DISPATCH,data.http);
  await myRedis.client.sAdd(CONST.SERVER_DISPATCH_DOWN,data.http);
  await initDispatchServer();
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
    throw "unknown server error!";
  }
}

/**
 * 添加用户的失败过节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const addFailNodes = async data => {
  await myRedis.client.sAdd(CONST.SERVER_FAILED_NODES(data.uid),data.nid);
}
/**
 * 清空用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const clearFailNodes = async data => {
  await myRedis.client.del(CONST.SERVER_FAILED_NODES(data.uid));
}

/**
 * 查询用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const queryFailNodes = async data => {
  let result = await myRedis.client.sMembers(CONST.SERVER_FAILED_NODES(data.uid))
  return result;
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