'use strict'

import nodeManage from './nodeManage'

export default app => {
  app.use('/nodeManage', nodeManage)
}
