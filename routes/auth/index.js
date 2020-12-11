'use strict'
const collectionName = 'land_evt'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const data = {}
    data.ipcountry = request.headers['cf-ipcountry']
    data.ip = request.headers['cf-connecting-ip']
    data.host = request.headers.host
    data.url = request.headers['x-original-uri']
    // 'x-original-uri': '/land/1/?clickid=foo&landingid=0',
    try {
      const t = data.url.split('?')
      const reqPath = t[0].split('/')
      data.land = reqPath[2]
      const urlfix = decodeURI(t[1]).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"')
      data.info = JSON.parse('{"' + urlfix + '"}')
      // console.log('land track', data)
      track(data, fastify)
    } catch (error) {
      // console.error('land track failed', data)
    }
    return ''
  })
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