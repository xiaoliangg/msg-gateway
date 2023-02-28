/**
 * 发送服务在线节点有序集合 <k="server_send",value=nid,score=0>
 */
export const SERVER_SEND = 'server_send'

/**
 * 分发服务在线节点集合 <k="server_dispatch",set<服务地址>>
 */
export const SERVER_DISPATCH = 'server_dispatch'

/**
 * 分发服务下线节点集合 map<k="server_dispatch_down",set<服务地址>>
 */
export const SERVER_DISPATCH_DOWN = 'server_dispatch_down'

/**
 * 发送服务正在下线的节点集合(自动) map<k="server_send_ws_auto_downing",set<nid>>
 */
export const SERVER_SEND_WS_AUTO_DOWNING = 'server_send_ws_auto_downing'
/**
 * 发送服务正在下线的节点集合(手动) map<k="server_send_ws_manual_downing",set<nid>>
 */
export const SERVER_SEND_WS_MANUAL_DOWNING = 'server_send_ws_manual_downing'
/**
 * 发送服务已经下线的节点集合(自动) map<k="server_send_ws_auto_down",set<服务地址>>
 */
export const SERVER_SEND_WS_AUTO_DOWN = 'server_send_ws_auto_down'
/**
 * 发送服务已经下线的节点集合(手动) map<k="server_send_ws_manual_downing",set<服务地址>>
 */
export const SERVER_SEND_WS_MANUAL_DOWN = 'server_send_ws_manual_down'

/**
 * 节点的连续失败次数 map<k="node_fail_times",times>
 */
export const SERVER_NODE_FAIL_TIMES = (nid)=> `server_node_fail_times:${nid}`

/**
 * 发送服务长连接地址 <k=server_send:nid:ws,value=服务地址如http://localhost:15041>
 */
export const SERVER_SEND_WS = (nid)=> `server_send:${nid}:ws`

/**
 * 发送服务http地址 <k=server_send:nid:http,value=服务地址如http://localhost:8081>
 */
export const SERVER_SEND_HTTP = (nid) => `server_send:${nid}:http`

/**
 * 发送服务历史失败node集合 <k=failed_nodes:uid,value=set<nids>>
 */
export const SERVER_FAILED_NODES = (uid) => `server_failed_nodes:${uid}`

/**
 * 节点保存的所有用户
 */
// 节点的在线用户集合<online:nid,set<uid>>
export const SERVER_ONLINE_UIDS = (nid) => `server_online_uids:${nid}`
// 节点的在线用户集合<online:uid,nid>
export const SERVER_ONLINE_BELONG_NID = (uid)=> `server_online_belong_nid:${uid}`







