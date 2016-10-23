import { NotFound } from './utils'
import db from './db'
import fs from 'fs'
import md5 from 'md5'

const routes = (app) => {

  app.get('/', (req,res) => {
    res.json({ message: 'Welcome' })
  })

  app.post('/register', (req,res) => {
    const name = req.body.name
    const email = req.body.email
    if (email) {
      db.query('SELECT * FROM users where `email` = ?', [email], (err, rows, fields) => {
        if (err) {
          console.log(err);
          res.json({ error: err })
        }
        if (!rows.length) {
          db.query('INSERT INTO users SET ?', {email, name}, (err, result) => {
            if (err) throw err
            res.json({ id: result.insertId, response: 200, message: 'user inserted' })
          })
        } else {
          res.json({ user: rows[0], response: 200, message: 'user exists' })
        }
      })
    } else {
      res.json({ message: 'E-mail is required' })
    }
  })

  app.post('/new_vote', (req,res) => {
    const description = req.body.description;
    const email = req.body.email;
    const source1 = req.files.image[0];
    const source2 = req.files.image[1];
    const source1_name = md5(Date.now()) + '.' + source1.name.split('.').pop();
    const source2_name = md5(Date.now()) + '.' + source2.name.split('.').pop();
    fs.rename(source1.path, __dirname + '/../uploads/'+ source1_name);
    fs.rename(source2.path, __dirname + '/../uploads/'+ source2_name);

    db.query('INSERT INTO votes SET ?', {
      user_id: 1,
      description,
      source1_path: source1_name,
      source2_path: source2_name,
      source1_votes: 0,
      source2_votes: 0
    }, (err, result) => {
      if (err) {
        console.log(err);
        res.json({ error: err })
      }
      console.log(result);
      res.json({ id: result.insertId, response: 200, message: 'vote inserted' })
    })

  })

  app.get('/votes/:user_id', (req,res) => {
    var user_id = req.params.user_id
    db.query('SELECT * FROM votes WHERE `user_id` = ?', [user_id], (err, rows) => {
      if (err) {
        console.log(err);
        res.json({ error: err })
      }
      res.json(rows)
    })
  })

  app.get('/vote/:id', (req,res) => {
    var id = req.params.id
    console.log(id);
    db.query('SELECT * FROM votes WHERE `id` = ?', [id], (err, rows) => {
      if (err) {
        console.log(err);
        res.json({ error: err })
      }
      console.log(rows[0]);
      res.json(rows[0])
    })
  })

  app.get('/notifications/:user_id', (req,res) => {

  })



  app.get('/500', (req, res) => {
      throw new Error('This is a 500 Error')
  })

  app.get('/*', (req, res) => {
      throw new NotFound
  })

}

export default routes
