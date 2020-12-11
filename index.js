require('dotenv').config()

const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
})
const app = require('./app')

const port = parseInt(process.env.PORT) || 3000
const address = process.env.FASTIFY_ADDRESS || '127.0.0.1'

app(fastify)

fastify.listen(port, address, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
