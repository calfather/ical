'use strict'

const fp = require('fastify-plugin')
const crypto = require('crypto')
const got = require('got')

const uidRegexp = /^UID:(.*google\.com)$/gm
const calURL = process.env.CAL_URL
const alarm = `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:P0D
END:VALARM
END:VEVENT`

let cache = null

// ****************************************

const updateCalendar = async () => {
  try {
    const response = await got(calURL)
    const cal = response.body

    const result = cal.replace(uidRegexp, (match, p1) => {
      const hash = crypto.createHash('sha256')
      hash.update(p1)
      const hashString = hash.digest('hex')
      return `UID:${hashString}`
    })

    const pieces = result.split('END:VEVENT')
    const calAlarm = pieces.join(alarm)
    cache = calAlarm
    // console.log('calAlerts', calAlarm)
  } catch (error) {
    console.error('get cal error', error)
  }
  check()
}

const check = (collection) => {
  setTimeout(async () => {
    try {
      await updateCalendar(collection)
    } catch (error) {
      console.error('updateCalendar error', error)
    }
  }, 5 * 60 * 1000)
}

module.exports = fp(async function (fastify, opts) {
  await updateCalendar()
  // console.log('fp settings call')

  fastify.decorate('calendar', function () {
    // console.log('decorate settings call')
    return cache
  })
})
