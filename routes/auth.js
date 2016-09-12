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
var isAuthenticated = require('./common').isAuthenticated;

// 로깅용 모듈
var logger = require('../common/logger');

passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET
}, function(accessToken, refreshToken, profile, done) {
    User.findOrCreate(profile, function (err, user) {
        if (err) {
            return done(err);
        }
        return done(null, user);
    });
}));

passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function(email, password, done) {
    // 1. 해당하는 아이디가 존재하는지 확인
    console.log('email : '+ email + ' / password : ' + password);
    User.findUserByEmail(email, function(err, user) {
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
    User.findUser(id, function(err, user) {
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
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'email: %s', req.body.email);
    logger.log('debug', 'password: %s', req.body.password);


    if (!req.user) {
        console.log('login failed');
    }

    var user = {};
    user.id = req.user.id;
    user.email = req.user.email;
    user.name = req.user.name;
    user.type = req.user.type;

    res.send({
        code: 1,
        result: user
    });
});


// --------------------------------------------------
// HTTPS post /auth/facebook/token : 로그인(연동)
// --------------------------------------------------
router.post('/facebook/token', isSecure, passport.authenticate('facebook-token'), function(req, res, next) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'access_token: %s', req.body.access_token);


    if (!req.user) {
        res.send('로그인실패!');
    }
    else {
        var user = {};
        user.id = req.user.id;
        user.type = req.user.type || '최초 로그인(회원가입) 입니다';
        user.email = req.user.email || '최초 로그인(회원가입) 입니다';
        user.name = req.user.name || '최초 로그인(회원가입) 입니다';

        if (!req.user.email) {
            user.flag = 0;
            res.send({
                code: 3,
                result: user
            });
        } else {
            user.flag = 1;
            res.send({
                code: 1,
                result: user
            });
        }
    }
});


// --------------------------------------------------
// HTTPS GET /auth/logout : 로그아웃(연동)
// --------------------------------------------------
router.get('/logout', isSecure, isAuthenticated, function(req, res, next) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);


    req.logout();
    res.send({
        code: 1,
        result: "성공"
    });
});

module.exports = router;
