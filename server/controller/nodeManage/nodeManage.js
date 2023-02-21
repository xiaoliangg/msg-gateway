'use strict'

import {
  queryOnlineNode,
  saveNode,
  startDeleteNode
} from '../../service/nodeManage'

// 校验请求数据
function validateOnlineNodeReq(data) {
  if(data && data.server){
    if(data.server === "servers_send" && data.data[0].ws && data.data[0].http){
      return null;
    }else if(data.server === "servers_dispatch" && data.data[0].http){
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
  }

  /**
   *上线节点
   * 示例报文: {"server":"servers_send_ws","data":[{"value":"http://localhost:15041"},{"value":"http://localhost:15044"}]}
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async onlineNode (req, res, next) {
    const data = req.body
    const params = req.query
    var res = validateOnlineNodeReq(data);
    if(!res){
      res.send(errData);
    }else{
      // 查询有序集合 对请求去重，已存在的服务不再重新添加
      // uuid表示服务唯一标识
      queryOnlineNode(data).then(result => {
        // let successData = {
        //   code: 10000,
        //   message: 'success',
        //   result: result
        // }
        // 根据查询result对请求data去重
        console.log(result)
        let nodeValues = result.map(obj => {return obj.value})
        data.data = data.data.filter(function (x) {
          return nodeValues.indexOf(x.value)<0;
        });
        saveNode(data).then(result => {
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

        // res.send(successData)
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
    queryOnlineNode(params).then(result => {
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
