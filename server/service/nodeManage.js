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

export const saveData = data => {
  var map = [];
  var id;
  data.data.forEach(item => {
    item.score = 0;
    id = data.server + "_" + crypto.randomUUID();
    map.push(id);
    map.push(item.value);
    item.value = id;
  })

  return new Promise((resolve, reject) => {
    myRedis.client.multi().mSet(map).exec();
    myRedis.client.multi().zAdd(data.server,data.data,function(err,result){
      console.log(err);
      console.log(result);
      if(err) reject(err)
    }).exec();
  })
}