var myRedis = require("../redis/myredis");
const crypto = require('crypto');

var online_uids = 'online_uids:';
var online_nid = 'online_nid:';

/** yltodo 未完成
 * 节点新增长连接
 * @param data
 * @returns {Promise<unknown>}
 */
export const addLongConnect = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sAdd(online_uids + data.nid,data.uid);
    myRedis.client.set(online_nid + data.uid,data.nid);
    myRedis.client.zIncrBy(data.server, 1, nid)
    resolve();
  })
}

// 节点释放长连接
export const deleteLongConnect = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sRem(online_uids + data.nid,data.uid);
    myRedis.client.del(online_nid + data.uid);
    myRedis.client.zIncrBy(data.server, -1, data.nid)
    resolve();
  })
}

// 查询节点上所有长连接
export const queryAllUidsByNid = async data => {
  return await myRedis.client.sMembers(online_uids + data.nid);
}

// 查询长连接所属节点
export const queryNidByUid = async data => {
  return await myRedis.client.get(online_nid + data.uid);
}