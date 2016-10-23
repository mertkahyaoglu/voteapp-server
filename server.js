//setup Dependencies
import connect from 'connect'
import express from 'express'
import socket from './lib/socket'
import routes from './lib/routes'
import config from './config.json'
import { NotFound } from './lib/utils'

const port = (process.env.PORT || config.port)

//Setup Express
const server = express.createServer()

server.configure(() => {
    server.set('views', __dirname + '/views')
    server.set('view options', { layout: false })
    server.use(connect.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/uploads' }))
    server.use(express.cookieParser())
    server.use(express.session({ secret: "shhhhhhhhh!"}))
    server.use(connect.static(__dirname + '/static'))
    server.use(connect.static(__dirname + '/uploads'))
    server.use(server.router)
})

//setup the errors
server.error((err, req, res, next) => {
  if (err instanceof NotFound) {
    res.render('404.jade', {
      locals: {
        title : '404 - Not Found',
      },
      status: 404
    })
  } else {
    res.render('500.jade', {
      locals: {
        title : 'The Server Encountered an Error',
        error: err,
      },
      status: 500
    })
  }
})

server.listen(port)

//Socket.IO
socket(server)

// ROUTES
routes(server)

console.log('Listening on http://localhost:' + port )
