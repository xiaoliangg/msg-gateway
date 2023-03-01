import {raw} from "express";

var myRedis = require("../redis/myredis");
const crypto = require('crypto');
import * as CONST from '../service/CONST'

/**
 * 节点新增长连接
 * @param data
 * @returns {Promise<unknown>}
 */
export const addLongConnect = async data => {
  await myRedis.client.sAdd(CONST.SERVER_ONLINE_UIDS(data.nid),data.uid);
  await myRedis.client.set(CONST.SERVER_ONLINE_BELONG_NID(data.uid),data.nid);
  await myRedis.client.zIncrBy(CONST.SERVER_SEND, 1, data.nid)
}

// 节点释放长连接
export const deleteLongConnect = async data => {
  await myRedis.client.sRem(CONST.SERVER_ONLINE_UIDS(data.nid),data.uid);
  await myRedis.client.del(CONST.SERVER_ONLINE_BELONG_NID(data.uid));
  var zRank = await myRedis.client.zRank(CONST.SERVER_SEND,data.nid);
  if(zRank){ // 如果不存在,zRank会返回null
    await myRedis.client.zIncrBy(CONST.SERVER_SEND, -1, data.nid)
  }else{
    console.log(`${data.nid}为空,无需--1`)
  }
}

// 查询节点上所有长连接
export const queryAllUidsByNid = async nid => {
  return await myRedis.client.sMembers(CONST.SERVER_ONLINE_UIDS(nid));
}

// 查询长连接所属节点
export const queryNidByUid = async uid => {
  return await myRedis.client.get(CONST.SERVER_ONLINE_BELONG_NID(uid));
}