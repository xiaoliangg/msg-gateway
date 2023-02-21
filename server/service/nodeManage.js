var myRedis = require("../redis/myredis");
const crypto = require('crypto');

export const queryOnlineNode = data => {
  let arr = [];
  var finalyResult = [];
  var onlineNodes;
  var nodeValues;
  return new Promise((resolve, reject) => {
    // 不带score的结果
    // onlineNodes = myRedis.client.zRange(data.server, 0,50)
    // 带score的结果
    onlineNodes = myRedis.client.zRangeWithScores(data.server,0,50)
    onlineNodes.then(onlineNodeResult =>{
      onlineNodeResult.forEach(e =>{
        arr.push(e.value);
      })
      if(!arr.length) {
        resolve(finalyResult);
        return;
      }
      nodeValues = myRedis.client.mGet(arr);
      nodeValues.then(nodeValueResult =>{
        nodeValueResult.forEach(function (element, index, array) {
          // element: 指向当前元素的值
          // index: 指向当前索引
          if(element){
            finalyResult.push({"value":element,"score":onlineNodeResult[index].score,"id":onlineNodeResult[index].value})
          }
        });
        resolve(finalyResult)
      })
    }).catch (err =>{
      reject(err)
    })

    // 卡死
    // myRedis.client.zRange("servers_ws",0,0,function(err,result){
    //   console.log(err);
    //   console.log(result);
    //   if(err) reject(err)
    //   resolve(result)
    // })
  })
}

/**
 * 上线节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const saveNode = data => {
  var map = [];
  var nid;
  data.data.forEach(item => {
    item.score = 0;
    nid = data.server + "_" + crypto.randomUUID();
    map.push(nid);
    map.push(item.value);
    item.value = nid;
  })

  return new Promise((resolve, reject) => {
    if(!map.length){
      return resolve();
    }
    myRedis.client.multi().mSet(map).exec();
    myRedis.client.multi().zAdd(data.server,data.data).exec();
    resolve();
  })
}
var servers_send_ws_auto_downing = 'servers_send_ws_auto_downing'
var servers_send_ws_manual_downing = 'servers_send_ws_manual_downing'
// 开始下线节点
export const startDeleteNode = data => {
  return new Promise((resolve, reject) => {
    // todo 下线节点不删除，删除节点时再进行删除
    // myRedis.client.del(data.nid);
    myRedis.client.zRem(data.server,data.nid);
    // 移入下线中的节点集合
    if(data.mode === 'auto'){
      myRedis.client.rPush(servers_send_ws_auto_downing,data.nid);
    }else{
      myRedis.client.rPush(servers_send_ws_manual_downing,data.nid);
    }
    // todo 开启下线流程
    startOfflineNode().then(result => {
      console.log("下线成功");
      // deleteNodeFinish({nid:result.nid})
    }).catch(err => {
      console.error("下线失败")
    })
    resolve();
  })
}

var servers_send_ws_auto_down = 'servers_send_ws_auto_down'
var servers_send_ws_manual_down = 'servers_send_ws_manual_down'
// 下线节点完成
export const deleteNodeFinish = data => {
  return new Promise((resolve, reject) => {
    // todo 移出下线中的节点集合；移入已下线节点集合；
    if(data.mode === 'auto'){
      //todo 可能不成功
      // myRedis.client.lPop(servers_send_ws_auto_downing);
      myRedis.client.sAdd(servers_send_ws_auto_down,data.uid);

    }else{
      // myRedis.client.lPop(servers_send_ws_manual_downing);
      myRedis.client.sAdd(servers_send_ws_manual_down,data.uid);
    }
    // 如果是自动下线，移入自动下线集合
    resolve();
  })
}


var failed_nodes = "failed_nids"
/**
 * 添加用户的失败过节点
 * @param data
 * @returns {Promise<unknown>}
 */
export const addFailNodes = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.sAdd(failed_nodes + ":" + data.uid,data.nid);
    resolve();
  })
}
/**
 * 清空用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const clearFailNodes = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.del(failed_nodes + ":" + data.uid);
    resolve();
  })
}

/**
 * 查询用户的失败节点集合
 * @param data
 * @returns {Promise<unknown>}
 */
export const queryFailNodes = data => {
  var failNodes;
  return new Promise((resolve, reject) => {
    failNodes = myRedis.client.sMembers(failed_nodes + ":" + data.uid)
    failNodes.then(aa =>{
      resolve(aa);
    }).catch (err =>{
      reject(err)
    })
  })
}

var node_fail_times = 'node_fail_times'
/**
 * 节点的连续失败次数+1
 * @param data
 * @returns {Promise<unknown>}
 */
export const incrNodeFailTimes = data => {
  return new Promise((resolve, reject) => {
    var r = myRedis.client.incr(node_fail_times + ":" + data.nid);
    resolve(r);
  })
}
/**
 * 节点的连续失败次数重置为0
 * @param data
 * @returns {Promise<unknown>}
 */
export const clearNodeFailTimes = data => {
  return new Promise((resolve, reject) => {
    myRedis.client.del(node_fail_times + ":" + data.uid);
    resolve();
  })
}