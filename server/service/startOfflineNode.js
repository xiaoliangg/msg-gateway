'use strict'

const myRedis = require("../redis/myredis");
const conInfo = require('http-proxy/lib/http-proxy/passes/con-info');
import {queryAllUidsByNid} from './LongConnectManage'
import * as CONST from '../service/CONST'

export const startOfflineNode = async nid => {
  if (nid) {
    // 移除该节点上的所有连接、redis信息、内存信息等
    // test
    let allUids = await queryAllUidsByNid(nid);
    console.log(`start remove all long connects,nid:${nid},uid size:${allUids.length}`)
    for (let index = 0; index < allUids.length; index ++) {
      const uid = allUids[index];
      console.log(`start remove long connect,nid:${nid},uid:${uid}`)
      let wsInfo = conInfo.conInfo.get(uid);
      // 断开原有的代理长连接
      // wsInfo.proxySocket.error(); // 报错: wsInfo.proxySocket.error is not a function
      wsInfo.proxySocket.emit("error",new Error("manual disconnect"))
    }
    await myRedis.client.del(CONST.SERVER_NODE_FAIL_TIMES(nid));
  }
}