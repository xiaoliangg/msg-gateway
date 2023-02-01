'use strict'

// import { postRequest, getRequest} from '../../service/admin'

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
   *暂停电台
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
    res.send({
      code: 10000,
      message: 'success',
      result: result
    })
  }

  /**
   *启用电台
   *method post
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Admin
   */
  async onlineNode (req, res, next) {
    const data = req.body
    const params = req.query
    let result = null
    try {
      result = await onlineRadio(data, params)
      if (result.code === 10000 || result.code === 200) {
        res.send(result)
      } else {
        res.send(aiRadioRes)
      }
    } catch (err) {
      res.send({
        code: 11005,
        success: false,
        message: err.message,
        result: result
      })
    }
  }
}

export default new Admin()
