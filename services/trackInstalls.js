const _ = require('lodash')
const got = require('got')

const binomURI = process.env.BINOM_URL
const weekms = 14 * 24 * 60 * 60 * 1000

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

  try {
    await checkSubs(doc, fastify)
  } catch (error) {
    console.error('checkSubs failed', error)
  }
}

async function checkSubs (doc, fastify) {
  const { data, now } = doc
  const db = fastify.mongo.db
  const trackCollection = db.collection('track')

  const query = {
    'data.id': data.id,
    now: { $gt: now - weekms }
  }
  const cursor = await trackCollection.find(query, {
    projection: { _id: 0, data: 1 }
  })
  const calendarRequests = await cursor.count()
  console.log('checkSubs', data.id, calendarRequests)
  if (calendarRequests > 1) {
    // subscribed
    await updateSubscription(doc, fastify)
  }
}

async function updateSubscription (doc, fastify) {
  const subscribedId = await isSubscribed(doc.data.id, fastify)
  console.log('updateSubscription', doc.data.id, 'subscribeId', subscribedId)
  if (!subscribedId) {
    await addToSubs(doc, fastify)
    subPostback(doc.data.id, doc.now, fastify)
  } else {
    await updateSubs(subscribedId, doc, fastify)
  }
}

async function addToSubs (doc, fastify) {
  const db = fastify.mongo.db
  const subsCollection = db.collection('subs')
  console.log('updateSubs', doc.data.id)
  doc.created = doc.now
  const write = subsCollection.insertOne(doc)
  write.catch(error => {
    console.log('insertOne failed', error)
    // TODO? retry write doc
  })
}

async function updateSubs (subscribedId, doc, fastify) {
  const db = fastify.mongo.db
  const subsCollection = db.collection('subs')
  subsCollection.updateOne(
    { _id: subscribedId },
    {
      $set: { now: doc.now }
    }
  )
}

async function isSubscribed (id, fastify) {
  const db = fastify.mongo.db
  const subsCollection = db.collection('subs')
  const doc = await subsCollection.findOne(
    { $query: { 'data.id': id } },
    { projection: { _id: 1, data: 1 } }
  )
  if (doc) return doc._id
  return false
}

async function subPostback (id, time, fastify) {
  const params = {
    cnv_id: id,
    event1: 1
  }
  console.log('user subscribed postback', id, time, binomURI, params)
  try {
    const response = await got(binomURI, { searchParams: params })
    console.log('postback success', binomURI, response.statusCode, response.body)
  } catch (error) {
    console.log('postback failed', error)
    return null
  }
}

module.exports = track
