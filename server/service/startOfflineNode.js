var myRedis = require("../redis/myredis"),
    extend    = require('util')._extend;

const crypto = require('crypto');
const mm = require('http-proxy/lib/http-proxy/passes/test22');
import {
  deleteLongConnect,
  queryAllUidsByNid
} from './LongConnectManage'
import {
  server
} from '../app'

export const startOfflineNode = async nid => {
  if (nid) {
    // yltodo 移除该节点上的所有连接、redis信息、内存信息等
    var allUids = await queryAllUidsByNid(nid);
    allUids.forEach(uid =>{
      var conInfo = mm.get(uid);
      // 断开原有的代理长连接
      conInfo.proxySocket.end();

      // todo 创建新的代理长连接。发送connectOtherNode，或新建一个其他事件
      // mm.mm.set(parseObj.query.uid,{req, socket, options, head,proxyReq,proxySocket});
      server.emit('connectOtherNode', conInfo.proxyReq, conInfo.req, conInfo.socket, extend(conInfo.options,{switchProtocols:false}), conInfo.head);

      deleteLongConnect(nid,uid);
    })
    myRedis.client.del(node_fail_times + ":" + nid);
  }
}