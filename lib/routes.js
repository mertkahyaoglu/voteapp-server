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
      return done(null, user);
    }
  ));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.post('/register', passport.authenticate('facebook-token'), (req,res) => {
    const name = req.body.name
    const email = req.body.email
    if (req.user){
      if (email) {
        db.query('SELECT * FROM users where `email` = ?',[email], (err, rows, fields) => {
          if (err) return res.json({ error: err })

          const token = jwt.sign(email, app.get('superSecret'));
          console.log("token", token);

          if (!rows.length) {
            db.query('INSERT INTO users SET ?', {email, name}, (err, result) => {
              if (err) throw err
              return res.json({
                id: result.insertId,
                message: 'user inserted',
                token: token
              })
            })
          } else {
            return res.json({
              id: rows[0].id,
              message: 'user exists',
              token: token
            })
          }
        })
      } else {
        return res.json({ error: 'No e-mail' })
      }
    }
  })

  app.post('/login', passport.authenticate('facebook-token'), (req,res) => {
    const email = req.body.email

    if (req.user){
      if (email) {
        db.query('SELECT * FROM users where `email` = ?',[email], (err, rows, fields) => {
          if (err) res.json({ error: err })

          const token = jwt.sign(email, app.get('superSecret'));

          if (rows && rows.length) {
            return res.json({
              id: rows[0].id,
              message: 'logged in',
              token: token
            })
          } else {
            return res.json({ error: 'There is no authenticated user with the provided email.' })
          }
        })
      } else {
        return res.json({ error: 'No e-mail' })
      }
    }
  })

  const api = express.Router();

  api.use((req, res, next) => {
    const token = req.body.token || req.param('token') || req.headers['startup-access-token'];
    if (token) {
      jwt.verify(token, app.get('superSecret'), (err, decoded) => {
        if (err) {
          return res.json({ error: 'Failed to authenticate token.' });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.json({
        error: 'No token provided.'
      });
    }
  });

  api.get('/check', function(req, res) {
  	res.json(req.decoded);
  });

  api.get('/', (req,res) => {
    res.json({ message: 'Welcome to the Startup API!' })
  })

  api.post('/new_vote', (req,res) => {
    const user_id = req.body.user_id;
    const description = req.body.description;
    const email = req.body.email;
    const source1 = req.files.image[0];
    const source2 = req.files.image[1];
    const source1_name = md5(Date.now()) + '.' + source1.name.split('.').pop();
    const source2_name = md5(Date.now()) + '.' + source2.name.split('.').pop();
    fs.rename(source1.path, __dirname + '/../uploads/'+ source1_name);
    fs.rename(source2.path, __dirname + '/../uploads/'+ source2_name);
    console.log(user_id);
    db.query('INSERT INTO votes SET ?', {
      user_id,
      description,
      source1_path: source1_name,
      source2_path: source2_name,
      source1_votes: 0,
      source2_votes: 0
    }, (err, result) => {
      if (err) return res.json({ error: err })
      res.json({ id: result.insertId, message: 'vote inserted' })
    })
  })

  api.get('/votes/:user_id', (req,res) => {
    const user_id = req.params.user_id
    db.query('SELECT * FROM votes WHERE `user_id` = ?', [user_id], (err, rows) => {
      if (err) return res.json({ error: err })
      res.json(rows)
    })
  })

  api.get('/vote/:id', (req,res) => {
    const id = req.params.id
    db.query('SELECT * FROM votes WHERE `id` = ?', [id], (err, rows) => {
      if (err) return res.json({ error: err })
      res.json(rows[0])
    })
  })

  api.get('/notifications/:user_id', (req,res) => {
    const user_id = req.params.user_id
    db.query('SELECT * FROM notifications WHERE `user_id` = ?', [user_id], (err, rows) => {
      if (err) return res.json({ error: err })
      res.json(rows)
    })
  })

  app.use('/api', api);

  app.get('/*', (req, res) => {
    res.json({ message: 'Not Found' })
  })

}

export default routes
