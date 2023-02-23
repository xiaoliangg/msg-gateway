var myRedis = require("../redis/myredis");
const crypto = require('crypto');
import * as CONST from '../service/CONST'

var online_uids = 'online_uids:';
var online_nid = 'online_nid:';

/**
 * 节点新增长连接
 * @param data
 * @returns {Promise<unknown>}
 */
export const addLongConnect = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sAdd(CONST.ONLINE_UIDS(data.nid),data.uid);
    myRedis.client.set(CONST.ONLINE_BELONG_NID(data.uid),data.nid);
    myRedis.client.zIncrBy(CONST.SERVERS_SEND, 1, nid)
    resolve();
  })
}

// 节点释放长连接
export const deleteLongConnect = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sRem(CONST.ONLINE_UIDS(data.nid),data.uid);
    myRedis.client.del(CONST.ONLINE_BELONG_NID(data.uid));
    myRedis.client.zIncrBy(CONST.SERVERS_SEND, -1, data.nid)
    resolve();
  })
}

// 查询节点上所有长连接
export const queryAllUidsByNid = async data => {
  return await myRedis.client.sMembers(CONST.ONLINE_UIDS(data.nid));
}

// 查询长连接所属节点
export const queryNidByUid = async data => {
  return await myRedis.client.get(CONST.ONLINE_BELONG_NID(data.uid));
}