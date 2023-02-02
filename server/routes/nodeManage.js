'use strict'

import NodeManage from '../controller/nodeManage/nodeManage'
import express from 'express'

const router = express.Router()

// 通用post请求
// router.post('/postRequest', NodeManage.postRequest)

// 通用get请求
// router.get('/getRequest', NodeManage.getRequest)

// 删除节点
// router.post('/delete', NodeManage.deleteNode)

// 手动下线节点
router.post('/offlineNode', NodeManage.offlineNode)

// 手动上线节点
router.post('/onlineNode', NodeManage.onlineNode)

// 查询在线节点
router.get('/queryOnlineNode', NodeManage.queryOnlineNode)

export default router
