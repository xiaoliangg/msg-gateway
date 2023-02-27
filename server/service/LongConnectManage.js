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
  await myRedis.client.sAdd(CONST.ONLINE_UIDS(data.nid),data.uid);
  await myRedis.client.set(CONST.ONLINE_BELONG_NID(data.uid),data.nid);
  await myRedis.client.zIncrBy(CONST.SERVERS_SEND, 1, nid)
}

// 节点释放长连接
export const deleteLongConnect = async data => {
  await myRedis.client.sRem(CONST.ONLINE_UIDS(data.nid),data.uid);
  await myRedis.client.del(CONST.ONLINE_BELONG_NID(data.uid));
  await myRedis.client.zIncrBy(CONST.SERVERS_SEND, -1, data.nid)
}

// 查询节点上所有长连接
export const queryAllUidsByNid = async data => {
  return await myRedis.client.sMembers(CONST.ONLINE_UIDS(data.nid));
}

// 查询长连接所属节点
export const queryNidByUid = async data => {
  return await myRedis.client.get(CONST.ONLINE_BELONG_NID(data.uid));
}