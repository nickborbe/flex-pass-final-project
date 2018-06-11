require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const User         = require('./models/user');
const session      = require("express-session");
const bcrypt       = require("bcrypt");
const passport     = require("passport");
const axios = require("axios");
const busy_hours = require('busy-hours');
const LocalStrategy= require("passport-local").Strategy;
const flash        = require("connect-flash");
const cors         = require('cors');

mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URI, {useMongoClient: true})
  .then(() => {
    console.log('Connected to Mongo!')
  }).catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// default value for title local

app.locals.title = 'Express - Generated with IronGenerator';
app.use(flash());

// Passport

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy({ passReqToCallback: true}, (req, username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));


app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    credentials: true,                 // allow other domains to send cookies
    origin: ["http://localhost:4200", 'http://flex-pass.herokuapp.com']  // these are the domains that are allowed
  })
);




const authRoute = require('./routes/user-route');
app.use('/api', authRoute);
const searchRoute = require('./routes/search-route');
app.use('/search', searchRoute);
const index = require('./routes/index');
app.use('/', index);
const gymRoute = require('./routes/gym-route');
app.use('/', gymRoute);

app.use((req, res, next ) => {
  res.sendfile(__dirname + '/public/index.html')
})


module.exports = app;