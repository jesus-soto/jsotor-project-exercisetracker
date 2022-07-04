require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')


const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

var MONGO_URI = process.env.MONGOLAB_URI;
mongoose.connect(MONGO_URI);

var UserModel = new mongoose.Schema({
  username: String
});
var ExcerciseModel = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  //user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', UserModel)
const Exercise = mongoose.model("Exercise", ExcerciseModel);

app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  User.find({}, function (err, user){
    res.json(user)
  })
});

app.get('/api/users/:_id/exercises', async (req, res) => {
  User.find({}, function (err, user){
    res.json(user)
  })
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  console.log(req.query);
  let { from, to, limit } = req.query;

  User.findById({_id}, function (err, user){
    if (err || user == null) {
      res.send('Usuario no existente.')
    } else {
      Exercise.find({username: user.username},function (err, excercises){      
        if (!err && user) {
          let logs = excercises.filter((exercise) => {
            var exerciseDate = new Date(exercise.date);
            if (from && exerciseDate < new Date(from)) {
              return false;
            }
            if (to && exerciseDate > new Date(to)) {
              return false;
            }
            return true;
          }).map((exercise) => {
            return {
              description: exercise.description,
              duration: exercise.duration,
              date: new Date(exercise.date).toDateString(),
            };
          });
          console.log(logs);
          res.json({
            username: user.username,
            count: logs.length,
            _id: user._id,
            log: logs,
          });
        }
      });
    }
  })
});

app.post('/api/users', async (req, res) => {
  console.log('post');
  console.log(JSON.stringify(req.body.username));
  var username = req.body.username;
  User.findOne({ username: username }, function (err, user) {
    if (err || user == null) {
      var newUser = new User({ username: username })
        newUser.save(function (err, user) {
          if (err) return console.error(err)
          res.json(user)
        });
    } else {
        res.send('Nombre de usuario existente.')
    }
  });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  console.log(JSON.stringify(req.body));
  console.log(JSON.stringify(req.params));
  console.log(JSON.stringify(req.query));
  var _id = req.params._id;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;
  User.findById({_id}, function (err, user){
    if (err || user == null) {
      res.send('Usuario no existe.')
    } else {
        console.log(user);
        var exercise = new Exercise({
            username: user.username,
            description: description,
            duration: duration,
            date: date            
        });
        exercise.save(function (err, exerciseResult) {
          if (err) return console.error(err)
          res.json({
            _id: user._id,
            username: user.username,
            description: exerciseResult.description,
            duration: exerciseResult.duration,
            date: exerciseResult.date.toDateString(),
            user: exerciseResult.user
            //exercise: exerciseResult
          })
        });
    }
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
