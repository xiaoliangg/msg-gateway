'use strict'

import NodeManage from '../controller/nodeManage/nodeManage'
import express from 'express'

const router = express.Router()

// 手动下线节点
router.post('/offlineNode', NodeManage.offlineNode)

// 手动上线节点
router.post('/onlineNode', NodeManage.onlineNode)

// 查询在线节点
router.get('/queryOnlineNode', NodeManage.queryOnlineNode)

export default router
