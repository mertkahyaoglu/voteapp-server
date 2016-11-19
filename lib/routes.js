import express from 'express'
import db from './db'
import fs from 'fs'
import md5 from 'md5'
import jwt from 'jsonwebtoken'
import FacebookTokenStrategy from 'passport-facebook-token'
import passport from 'passport'
import { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } from '../config.json'

const routes = (app) => {

  app.get('/', (req,res) => {
    res.json({ message: 'Welcome to index' })
  })

  passport.use(new FacebookTokenStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET
    }, (accessToken, refreshToken, profile, done) => {
      const user = {
        'email': profile.emails[0].value,
        'name' : profile.name.givenName + ' ' + profile.name.familyName,
        'id'   : profile.id,
        'token': accessToken
      }
      return done(null, user)
    }
  ))
  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))

  app.post('/authenticate', passport.authenticate('facebook-token'), (req,res) => {
    const { name, email, fb_id } = req.body

    if (!req.user){
      console.log("No face auth")
      return res.json({ error: 'No face auth' })
    }

    if (!email) {
      console.log("no e-mail")
      return res.json({ error: 'No e-mail' })
    }

    const token = jwt.sign(email, app.get('superSecret'))

    db('users')
      .where({ email })
      .first()
      .then(user => {
        if (user) {
          console.log(user)
          return res.json({
            ...user,
            token,
            message: 'user exists',
          })
        }

        db('users')
        .returning(['id', 'fb_id', 'name'])
          .insert({email, name, votes_count: 0, fb_id})
          .then(insertedUser => {
            console.log(insertedUser)
            return res.json({
              ...insertedUser,
              token,
              message: 'user inserted',
            })
          })
          .catch(error => {
            console.log("Could not insert the user")
            return res.json({ error })
          })
      })
  })

  const api = express.Router()

  api.use((req, res, next) => {
    const token = req.body.token || req.param('token') || req.headers['startup-access-token']

    if (!token) {
      console.log("no token provided")
      return res.json({ error: 'No token provided.' })
    }

    jwt.verify(token, app.get('superSecret'), (err, decoded) => {
      if (err) {
        console.log("failed to authenticate")
        return res.json({ error: 'Failed to authenticate token.' })
      }
      req.decoded = decoded
      next()
    })
  })

  api.get('/check', (req, res) => {
  	res.json(req.decoded)
  })

  api.get('/', (req,res) => {
    res.json({ message: 'Welcome to the Startup API!' })
  })

  api.post('/new_vote', (req,res) => {
    const { sender_id, friends, description, email } = req.body
    const friends_ids = friends.split(',')

    const [ source1, source2 ] = req.files.image

    const source1_name = md5(Date.now()) + '.' + source1.name.split('.').pop()
    const source2_name = md5(Date.now()) + '.' + source2.name.split('.').pop()

    fs.rename(source1.path, __dirname + '/../uploads/'+ source1_name)
    fs.rename(source2.path, __dirname + '/../uploads/'+ source2_name)

    let vote_id
    db('votes')
      .returning('id')
      .insert({
        user_id: sender_id,
        description,
        source1_path: source1_name,
        source2_path: source2_name,
        source1_votes: 0,
        source2_votes: 0
      })
      .then(insertId => {
        console.log("vote inserted", insertId)
        res.json({ id: insertId[0], message: 'vote inserted' })

        for(let friend in friends_ids) {
          db('notifications')
            .returning('id')
            .insert({
              type: 'share',
              user_id: friend,
              vote_id: insertId[0],
              sender_id,
            })
            .then(insertedNotif => {
              console.log("notifications inserted", insertedNotif)
              return insertedNotif
            })
            .catch(error => {
              console.log(error)
            })
        }
      })
      .catch(error => {
        console.log("Could not insert the vote")
        return res.json({ error })
      })
  })

  api.get('/votes/:user_id', (req,res) => {
    db('votes')
      .where('user_id', req.params.user_id)
      .then(votes => {
        console.log("returned votes of user ", req.params.user_id, ":", votes)
        res.json(votes)
      })
      .catch(error => {
        console.log("Could not fetch user's votes")
        return res.json({ error, message: "error returning user's votes" })
      })
  })

  api.get('/vote/:id', (req,res) => {
    db('votes')
      .where('id', req.params.id)
      .first()
      .then(vote => {
        console.log("returned vote ", req.params.id, ":", votes)
        res.json(vote)
      })
      .catch(error => {
        console.log("Could not fetch the vote")
        return res.json({ error, message: "error returning the vote" })
      })
  })

  api.get('/notifications/:user_id', (req,res) => {
    let notifications = [];
    db('notifications')
      .where('user_id', req.params.user_id)
      .then(notifs => {
        console.log("notifs",notifs);
        for (let n in notifs) {
          console.log("n", n);
          const sender = db('users').where('id', n.sender_id).first()
          notifications.push({...n, sender})
        }
        console.log("returned notifications of user ", req.params.user_id, ":", notifs)
        res.json(notifications)
      })
      .catch(error => {
        console.log("Could not fetch user's notifications")
        return res.json({ error, message: "error returning user's notifications" })
      })
  })

  app.use('/api', api)

  app.get('/*', (req, res) => {
    res.json({ message: 'Not Found' })
  })

}

export default routes
