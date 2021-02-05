'use strict'

const fp = require('fastify-plugin')
const got = require('got')
const csv = require('csvtojson')

const calCsvURL = process.env.CAL_CSV_URL
const updateInterval = parseInt(process.env.CAL_UPDATE_INTERVAL_MS) || 5 * 60 * 1000

let cache = null
// ****************************************

const updateCalendar = async () => {
  try {
    const response = await got(calCsvURL)
    const cal = response.body

    const csvRows = await csv({
      noheader: true,
      output: 'csv'
    }).fromString(cal)

    const links = []
    const jsonEvents = csvRows.map((row, index) => {
      const link = row[3]
      links[index] = link
      return {
        creativeid: index,
        tag: row[0],
        title: row[1],
        desc: row[2],
        link: link
      }
    })

    cache = {
      events: jsonEvents,
      links
    }
  } catch (error) {
    console.error('get cal error', error)
  }
  check()
}

const check = collection => {
  setTimeout(async () => {
    try {
      await updateCalendar(collection)
    } catch (error) {
      console.error('updateCalEvents error', error)
    }
  }, updateInterval)
}

module.exports = fp(async function (fastify, opts) {
  await updateCalendar()

  fastify.decorate('calendar', function () {
    return cache
  })
})
