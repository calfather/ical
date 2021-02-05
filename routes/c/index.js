'use strict'
// const _ = require('lodash')
// const got = require('got')

// const binomURI = process.env.BINOM_URL
const collectionName = 'clicks'

module.exports = async function (fastify, opts) {
  const handler = handleCalendar(fastify)
  fastify.get('/:creativeid/:userid', handler)
  fastify.get('/:creativeid/:userid/', handler)
}

const handleCalendar = fastify => {
  return async (request, reply) => {
    const calendar = fastify.calendar()
    const links = calendar.links

    const data = request.query
    data.ipcountry = request.headers['cf-ipcountry']
    data.ip = request.headers['cf-connecting-ip']
    data.host = request.headers.host

    const userid = request.params.userid
    let creativeid = request.params.creativeid
    try {
      const isValidID = parseInt(creativeid) < links.length
      if (!isValidID) {
        console.log('invalid creativeid', userid, creativeid)
        creativeid = '0'
      }
    } catch (e) {
      console.log('invalid creativeid', userid, creativeid)
      creativeid = '0'
    }
    const link = links[creativeid]

    const fullLink = link.replace(
      '{click_id}',
      `${userid}&creativeid=${creativeid}`
    )

    data.userid = userid
    data.creativeid = creativeid
    data.link = fullLink

    console.log('redirect', userid, creativeid, fullLink)

    track(data, fastify)
    // reply
    return reply.redirect(fullLink)
  }
}

async function track (data, fastify) {
  const now = Date.now()
  const doc = { data, now }

  const db = fastify.mongo.db
  const collection = db.collection(collectionName)

  const write = collection.insertOne(doc)
  write.catch(error => {
    console.error('insertOne failed', error)
    // TODO? retry write doc
  })

  return null
}
