'use strict'

import {
  queryOnlineNode,
  saveNode,
  startDeleteNode,
  deleteDispatchServer
} from '../../service/nodeManage'
import * as CONST from '../../service/CONST'

// 校验请求数据
function validateOnlineNodeReq(data) {
  if(data && data.server){
    if(data.server === CONST.SERVER_SEND  && data.data[0].ws && data.data[0].http){
      return null;
    }else if(data.server === CONST.SERVER_DISPATCH && data.data[0].http){
      return null;
    }
  }
  let errData = {
    code: 10015,
    message: '请求参数错误',
    result: err
  }
  return errData;
}

class Admin {

  /**
   *上线节点
   * 示例报文: {"server":"server_send_ws","data":[{"value":"http://localhost:15041"},{"value":"http://localhost:15044"}]}
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async onlineNode (req, res, next) {
    const data = req.body
    const params = req.query
    var errData = validateOnlineNodeReq(data);
    if (errData) {
      res.send(errData);
    } else {
      // 查询有序集合 对请求去重，已存在的服务不再重新添加
      // uuid表示服务唯一标识
      queryOnlineNode(data.server).then(result => {
        // 根据查询result对请求data去重
        console.log("queryOnlineNode:" + result)
        let nodeValues = [];
        result.forEach(obj =>{
          if(typeof(obj) == 'string'){
            nodeValues.push(obj)
          }else{
            if(obj.http) nodeValues.push(obj.http);
            if(obj.ws) nodeValues.push(obj.ws);
          }
        })
        data.data = data.data.filter(function (x) {
          return nodeValues.indexOf(x.http) < 0 && nodeValues.indexOf(x.ws) < 0;
        });
        return data;
      }).then(saveNode)
          .then(result => {
            let successData = {
              code: 10000,
              message: 'success',
            }
            res.send(successData)
          }).catch(err => {
            console.error(err)
        let errData = {
          code: 10014,
          message: '服务器异常，请重新操作1',
          result: err
        }
        res.send(errData)
      })
    }
  }

  /**
   *下线节点
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async offlineNode (req, res, next) {
    const data = req.body
    const params = req.query
    if(data.server === CONST.SERVER_SEND){
      startDeleteNode({nid:data.nid,mode:'manual'}).then(result => {
        let successData = {
          code: 10000,
          message: 'success',
          result: result
        }
        res.send(successData)
      }).catch(err => {
        let errData = {
          code: 10014,
          message: '服务器异常，请重新操作',
          result: err
        }
        res.send(errData)
      })
    }else if(data.server === CONST.SERVER_DISPATCH){
      deleteDispatchServer(data).then(result => {
        let successData = {
          code: 10000,
          message: 'success',
          result: result
        }
        res.send(successData)
      }).catch(err => {
        let errData = {
          code: 10014,
          message: '服务器异常，请重新操作',
          result: err
        }
        res.send(errData)
      })
    }else{
      throw "未知的server";
    }

  }

  /**
   *查询节点
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async queryOnlineNode (req, res, next) {
    const data = req.body
    const params = req.query
    queryOnlineNode(params.server).then(result => {
      let successData = {
        code: 10000,
        message: 'success',
        result: result
      }
      // 根据查询result对请求data过滤
      console.log(result)
      res.send(successData)
    }).catch(err => {
      let errData = {
        code: 10014,
        message: '服务器异常，请重新操作',
        result: err
      }
      res.send(errData)
    })
  }
}

export default new Admin()
