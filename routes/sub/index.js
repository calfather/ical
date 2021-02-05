'use strict'

// const getCalendar = require('../services/calendar')
// const track = require('../services/trackInstalls')

const weekms = 14 * 24 * 60 * 60 * 1000
const redirectUrl = process.env.REWARD_URL
// *****************************

module.exports = async function (fastify, opts) {
  const handler = fastifyHandler(fastify)
  fastify.get('/:id', handler)
  fastify.get('/:id/', handler)
}

const fastifyHandler = fastify => {
  return async (request, reply) => {
    // const data = request.query
    // data.ipcountry = request.headers['cf-ipcountry']
    // data.ip = request.headers['cf-connecting-ip']
    // data.host = request.headers.host
    const id = request.params.id
    if (id) {
      const isSubscribed = await checkSubs(id, fastify)
      if (isSubscribed) return { subscribed: true, url: redirectUrl }
      return { subscribed: false }
    }
    return { subscribed: false }
  }
}

async function checkSubs (id, fastify) {
  const now = Date.now()
  const db = fastify.mongo.db
  const trackCollection = db.collection('track')

  const query = {
    'data.id': id,
    now: { $gt: now - weekms }
  }
  const cursor = await trackCollection.find(query, {
    projection: { _id: 0, data: 1 }
  })
  const calendarRequests = await cursor.count()
  // console.log('checkSubs', id, calendarRequests)
  if (calendarRequests > 1) {
    return true
  }
  return false
}
