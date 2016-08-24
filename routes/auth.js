/**
 * Created by Tacademy on 2016-08-23.
 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var isSecure = require('./common').isSecure;
var User = require('../models/user.js');


passport.use(new FacebookTokenStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET
    }, function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        done(null, profile);
    }
));


passport.use(new LocalStrategy({usernameField: 'id', passwordField: 'password'}, function(id, password, done) {
    // 1. 해당하는 아이디가 존재하는지 확인
    User.findUserById(id, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }

        // 2. 입력받은 password가 유효한 비밀번호인지 확인
        User.verifyPassword(password, user.password, function(err, result) {
            if (err) {
                return done(err);
            }
            if (!result) {
                return done(null, false);
            }
            delete user.password;
            return done(null, user);
        });
    });
}));


passport.serializeUser(function(user, done) {
    // user.id로 세션정보를 저장
    done(null, user.id);
});


passport.deserializeUser(function(id, done) {
    // 세션정보(user.id)로 user객체 만들어오기
    User.findUserById(id, function(err, user) {
       if (err) {
           return done(err);
       }
       done(null, user);
    });
});



// --------------------------------------------------
// HTTPS POST /auth/local/login : 로그인(로컬)
// --------------------------------------------------
router.post('/local/login', isSecure, passport.authenticate('local'), function(req, res, next) {
    if (!req.user) {
        console.log('login failed');
    }
    var user = {};
    user.email = req.user.email;
    user.name = req.user.name;

    res.send({
        message: 'local login',
        requestObj: req.user,
        userObj: user
    });
});

// --------------------------------------------------
// HTTPS post /auth/facebook/token : 로그인(연동)
// --------------------------------------------------
router.post('/facebook/token', passport.authenticate('facebook-token'), function(req, res, next) {

    res.send(req);
});

// --------------------------------------------------
// HTTP GET /auth/logout : 로그아웃(연동)
// --------------------------------------------------
router.get('/logout', function(req, res, next) {
    req.logout();
    res.send({
        message: 'local logout'
    });
});

module.exports = router;
