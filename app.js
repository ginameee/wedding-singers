var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var redis = require('redis');
var redisClient = redis.createClient();
var redisStore = require('connect-redis')(session);


var customer = require('./routes/customers');
var favorite = require('./routes/favorites');
var reservation = require('./routes/reservations');
var review = require('./routes/reviews');
var singer = require('./routes/singers');
var user = require('./routes/users');
var video = require('./routes/videos');
var auth = require('./routes/auth');
var chatting = require('./routes/chatting');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new redisStore({
    host: "127.0.0.1",
    port: 6379,
    client: redisClient
  }),
  resave: true,
  saveUninitialized: false,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false, // true면 http에선 쿠키를 보내지 않는다, 따라서 default값은 false다.
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));

app.use(passport.initialize());
app.use(passport.session());


// 마운트포인트 매핑
app.use('/images', express.static(path.join(__dirname, 'uploads/images/profiles')));
app.use('/users', user);
app.use('/customers', customer);
app.use('/favorites', favorite);
app.use('/reservations', reservation);
app.use('/reviews', review);
app.use('/singers', singer);
app.use('/videos', video);
app.use('/auth', auth);
app.use('/chatting', chatting);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      code: 2,
      result: {
        message: err.message,
        error: {
        }}
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    code: 2,
    result: {
      message: err.message,
      error: {
    }}
  });
});


module.exports = app;
