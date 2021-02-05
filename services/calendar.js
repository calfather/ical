const ics = require('ics')
const { DateTime } = require('luxon')
const later = require('later')
const crypto = require('crypto')

later.date.localTime()
const domain = process.env.DOMAIN
const redirectDomain = process.env.REDIRECT_URL

const calName = 'Нажмите ОК'
const alarms = [
  { action: 'display', trigger: { hours: 0, minutes: 30, before: true } },
  { action: 'display', trigger: { hours: 0, minutes: 20, before: true } }
  // { action: 'display', trigger: { hours: 0, minutes: 1, before: true } }
]
// { action: 'display', trigger: [2000, 1, 4, 18, 30] }
const refreshMinutes = 360
const everyMinutes = 15
const eventSeed = {
  calName,
  alarms: alarms,
  duration: { hours: 0, minutes: everyMinutes },
  status: 'CONFIRMED'
  // recurrenceRule: 'FREQ=DAILY;INTERVAL=1'
}

const refreshReplace = refreshMinutes => {
  return `BEGIN:VCALENDAR
REFRESH-INTERVAL;VALUE=DURATION:P${refreshMinutes}M`
}

const emptyRefreshed = `BEGIN:VCALENDAR
REFRESH-INTERVAL;VALUE=DURATION:P360M
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:adamgibbons/ics
METHOD:PUBLISH
X-WR-CALNAME:Events
X-PUBLISHED-TTL:PT1H
END:VCALENDAR`

const scheduleRules = [
  '0 0 9 * * *',
  '0 0 12 * * *',
  '0 20 12 * * *',
  '0 0 13 * * *',
  '0 20 13 * * *',
  '0 20 13 * * *',
  '0 0 14 * * *',
  '0 20 14 * * *',
  '0 0 16 * * *',
  '0 0 18 * * *',
  '0 0 19 * * *',
  '0 0 20 * * *',
  '0 20 20 * * *',
  '0 0 21 * * *',
  '0 20 21 * * *',
  '0 0 22 * * *',
  '0 20 22 * * *',
  '0 0 23 * * *',
  '0 20 23 * * *'
]

// ********************************************************

const scheduleLater = scheduleRules.map(rule => {
  return later.parse.cron(rule, true)
})

async function getCalendar (calendar, userid, tz) {
  const now = Date.now()
  const calEvents = calendar.events

  later.date.build = (Y, M, D, h, m, s) => {
    const date = new Date(Y, M, D, h, m, s)
    const dt = DateTime.fromJSDate(date)
    if (tz) dt.setZone(tz).toUTC()
    const dt2 = dt.plus({ days: 1 })
    return new Date(dt2.ts)
  }

  const occurrencesNumber = Math.ceil(calEvents.length / scheduleRules.length)
  const eventTimes = []
  scheduleLater.forEach(rule => {
    const next = later.schedule(rule).next(occurrencesNumber)
    next.forEach(occurrence => {
      const dt = DateTime.fromJSDate(occurrence)
        .toUTC()
        .setZone(tz)
      eventTimes.push(dt)
    })
  })

  eventTimes.sort((a, b) => a.ts - b.ts)

  const nextTimes = []
  const endTime = now + refreshMinutes * 60 * 1000 + 24*60*60*1000
  for (const time of eventTimes) {
    if (time <= endTime) {
      nextTimes.push(time)
    } else break
  }

  const formattedTimes = nextTimes.map(dt => {
    return [dt.year, dt.month, dt.day, dt.hour, dt.minute]
  })

  const randEvents = calEvents.slice(0)
  shuffle(randEvents)

  const fullEvents = formattedTimes.map((time, index) => {
    const start = time
    const ev = randEvents[index]
    const { title, desc, creativeid } = ev
    const fullLink = `${redirectDomain}${creativeid}/${userid}`
    const timeid = `${start[0]}${start[1]}${start[2]}${start[3]}${start[4]}`
    const uidStr = `${userid}-${creativeid}-${timeid}@${domain}`
    const hash = crypto.createHash('sha256')
    hash.update(uidStr)
    const uid = hash.digest('hex')
    const fullDesc = `${desc} ${fullLink}`
    // dt = dt.plus({ minutes: everyMinutes })
    // const start = [dt.year, dt.month, dt.day, dt.hour, dt.minute]
    return {
      ...eventSeed,
      uid,
      start,
      title,
      description: fullDesc,
      url: fullLink
    }
  })

  // console.log('fullEvents', fullEvents)

  const { error, value } = ics.createEvents(fullEvents)
  if (error || !fullEvents.length) {
    console.log('error', error)
    return emptyRefreshed
  }
  const refresh = value.replace(
    'BEGIN:VCALENDAR',
    refreshReplace(refreshMinutes)
  )

  return refresh
}

function shuffle (array) {
  let currentIndex = array.length
  let temporaryValue
  let randomIndex
  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

module.exports = getCalendar
