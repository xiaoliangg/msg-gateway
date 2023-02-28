const myRedis = require("../redis/myredis"),
    extend    = require('util')._extend;

const crypto = require('crypto');
const conInfo = require('http-proxy/lib/http-proxy/passes/con-info');
import {
  deleteLongConnect,
  queryAllUidsByNid
} from './LongConnectManage'
import * as CONST from '../service/CONST'

import {
  server
} from '../app'

export const startOfflineNode = async nid => {
  if (nid) {
    // yltodo 移除该节点上的所有连接、redis信息、内存信息等
    let allUids = await queryAllUidsByNid(nid);
    for (let index = 0; index < allUids.length; index ++) {
      const uid = allUids[index];
      let wsInfo = conInfo.conInfo.get(uid);
      // 断开原有的代理长连接
      wsInfo.proxySocket.end();

      // todo 创建新的代理长连接。发送connectOtherNode，或新建一个其他事件
      // conInfo.conInfo.set(parseObj.query.uid,{req, socket, options, head,proxyReq,proxySocket});
      server.emit('connectOtherNode', wsInfo.proxyReq, wsInfo.req, wsInfo.socket, extend(wsInfo.options,{switchProtocols:false}), wsInfo.head);

      deleteLongConnect(nid,uid);
    }
    await myRedis.client.del(CONST.NODE_FAIL_TIMES(nid));
  }
}