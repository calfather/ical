'use strict'
const _ = require('lodash')

module.exports = async function (fastify, opts) {
  fastify.get('/:id/', async (request, reply) => {
    const data = request.query
    data.ipcountry = request.headers['cf-ipcountry']
    data.ip = request.headers['cf-connecting-ip']
    data.host = request.headers.host
    data.id = request.params.id

    await track(data, fastify)
    // reply
    reply.type('text/calendar; charset=utf-8').code(200)
    const calendar = fastify.calendar()
    return calendar
  })
}

async function track (data, fastify) {
  const now = Date.now()
  const doc = { data: _.cloneDeep(data), now }
  const db = fastify.mongo.db
  const collection = db.collection('track')
  const write = collection.insertOne(doc)
  write.catch(error => {
    console.log('insertOne failed', error)
    // TODO? retry write doc
  })
}
