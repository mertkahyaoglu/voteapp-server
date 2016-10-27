//setup Dependencies
import connect from 'connect'
import express from 'express'
import socket from './lib/socket'
import routes from './lib/routes'
import config from './config.json'
import passport from 'passport'

const port = (process.env.PORT || config.port)

//Setup Express
const app = express()

app.set('views', __dirname + '/views')
app.set('view options', { layout: false })
app.set('superSecret', config.secret);
app.use(connect.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/uploads' }))
app.use(connect.cookieParser())
app.use(connect.static(__dirname + '/static'))
app.use(connect.static(__dirname + '/uploads'))
app.use(passport.initialize());
app.use(passport.session());

app.listen(port, () => {
  console.log('Listening on port', port);
});

//Socket.IO
socket(app)

// ROUTES
routes(app, express)
