'use strict'

import {
  queryOnlineNode,
  saveData,
  // getTotalDataTypeMonth3
} from '../../service/nodeManage'

// import { postRequest, getRequest} from '../../service/admin'
var myRedis = require("../../redis/myredis");

class Admin {
  /**
   *通用post请求
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  // async postRequest (req, res, next) {
  //   const data = req.body
  //   const params = req.query
  //   const url = params.url
  //   const result = await postRequest(url, data, params)
  //   res.send({
  //     code: 10000,
  //     message: 'success',
  //     result: result
  //   })
  // }
  //
  // /**
  //  *通用get请求
  //  *method post
  //  * @param {*} req
  //  * @param {*} res
  //  * @param {*} next
  //  * @memberof Admin
  //  */
  // async getRequest (req, res, next) {
  //   const params = req.query
  //   const url = params.url
  //   const result = await getRequest(url, params)
  //   res.send({
  //     code: 10000,
  //     message: 'success',
  //     result: result
  //   })
  // }

  /**
   *删除节点
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  // async deleteNode (req, res, next) {
  //   const data = req.body
  //   const params = req.query
  //   // const result = await deleteRadio(data, params)
  //   res.send({
  //     code: 10000,
  //     message: 'success',
  //     result: result
  //   })
  // }

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
    // const result = await offlineRadio(data, params)
    const result = "express测试testyl"
    myRedis.client.set("aamyRedis",result,function(err,result){
      console.log(err);
      console.log(result);
      res.json(result)
    })
    res.send({
      code: 10000,
      message: 'success',
      result: result
    })
  }

  /**
   *上线节点
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async onlineNode (req, res, next) {
    const data = req.body
    const params = req.query

    // todo 查询有序集合 对请求去重，已存在的服务不再重新添加
    // todo uuid表示服务唯一标识
    queryOnlineNode(data).then(result => {
      let successData = {
        code: 10000,
        message: 'success',
        result: result
      }
      // 根据查询result对请求data过滤
      console.log(result)
      let nodeValues = result.map(obj => {return obj.value})
      data.data = data.data.filter(function (x) {
        return nodeValues.indexOf(x.value)<0;
      });
      saveData(data).then(result => {
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
