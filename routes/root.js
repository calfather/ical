'use strict'

const maxmind = require('maxmind')
const path = require('path')

const getCalendar = require('../services/calendar')
const track = require('../services/trackInstalls')

// *****************************

module.exports = async function (fastify, opts) {
  const lookup = await maxmind.open(
    path.join(__dirname, '../GeoLite2-City.mmdb')
  )
  const handler = handleCalendar(fastify, lookup)
  fastify.get('/:id/', handler)
  fastify.get('/:id/cal.ics', handler)
}

const handleCalendar = (fastify, lookup) => {
  return async (request, reply) => {
    const data = request.query
    data.ipcountry = request.headers['cf-ipcountry']
    data.ip = request.headers['cf-connecting-ip']
    data.host = request.headers.host
    data.id = request.params.id

    let tz = null
    try {
      const ipinfo = lookup.get(data.ip)
      // console.log('lookup', ipinfo)
      if (ipinfo && ipinfo.location && ipinfo.location.time_zone) {
        tz = ipinfo.location.time_zone
      }
    } catch (error) {
      console.log('lookup failed', data.ip)
    }

    track(data, fastify)

    const calendar = fastify.calendar()
    const customCalendar = getCalendar(calendar, data.id, tz)

    reply.type('text/calendar; charset=utf-8').code(200)
    return customCalendar
  }
}
