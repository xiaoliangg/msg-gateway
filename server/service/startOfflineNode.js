import {deleteLongConnect} from "./LongConnectManage";

var myRedis = require("../redis/myredis");
const crypto = require('crypto');
const mm = require('http-proxy/lib/http-proxy/passes/test22');

// yltodo
export const startOfflineNode = data => {
  return new Promise((resolve, reject) => {
    // todo 待测试
    var ss;
    var nid;
    while (true) {
      nid = null;
      // 从正在下线的节点集合中取出一个
      ss = myRedis.client.lPop(servers_send_ws_manual_downing) || myRedis.client.lPop(servers_send_ws_auto_downing);
      ss.then(aa => {
        nid = aa;
      })
      if (nid) {
        // yltodo 移除该节点上的所有连接、redis信息、内存信息等
        var allUids = LongConnectManage.queryAllUid(nid);
        allUids.forEach(uid =>{
          var conInfo = mm.get(uid);
          // 断开原有的代理长连接
          conInfo.proxySocket.end();
          // todo 创建新的代理长连接。发送connectOtherNode，或新建一个其他事件
          conInfo.proxySocket.end();
          LongConnectManage.deleteLongConnect(nid,uid);
        })
      } else {
        // 跳出while循环
      }
    }

    myRedis.client.del(node_fail_times + ":" + data.uid);
    resolve();
  })
}