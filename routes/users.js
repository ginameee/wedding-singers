var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var User = require('../models/user');
var Singer = require('../models/singer');
var Customer = require('../models/customer');
var async = require('async');
var formidable = require('formidable');
var path = require('path');

// 로깅용 모듈
var logger = require('../common/logger');

// --------------------------------------------------
// HTTPS POST /users/local : 회원가입(로컬)
// --------------------------------------------------
router.post('/local', isSecure, function(req, res, next) {
  
  var user = {};
  user.email = req.body.email;
  user.password = req.body.password;
  user.name = req.body.name;
  user.phone = req.body.phone;
  user.type = parseInt(req.body.type);
  user.registration_token = req.body.registration_token;
  user.photoURL = 'noname.jpg';

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'input: %j', user, {});

  console.log(user);

  User.findUserByEmail(user.email, function(err, result) {
    if (err) {
      return next(err);
    }

    if (result) {
      return next(new Error('이미 존재하는 email 입니다!'));
    }

    else {
      User.registerUser(user, function(err, result) {
        if (err) {
          return next(err);
        }
        res.send({
          code: 1,
          result: {
            id: result,
            email: user.email,
            name: user.name
          }
        });
      });
    }
  });
});


// --------------------------------------------------
// HTTPS POST /users/facebook/token : 회원가입(연동),
// facebook으로 로그인 버튼을 누른뒤에 정보를 입력하고 가입버튼을 눌렀을 시!
// --------------------------------------------------
router.post('/facebook/token', isSecure, isAuthenticated, function(req, res, next) {
  var user = {};
  user.id = parseInt(req.user.id);
  user.email = req.body.email || '';
  user.phone = req.body.phone;
  user.name = req.body.name;
  user.type = parseInt(req.body.type);
  user.registration_token = req.body.registration_token;
  user.photoURL = 'noname.jpg';

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'input: %j', user, {});

  User.findUserByEmail(user.email, function(err, result) {
    if (err) {
      return next(err);
    }

    if (result) {
      return next(new Error('이미 사용중인 email 입니다!'));
    }

    else {
      User.registerUserFB(user, function(err, result) {
        if (err) {
          return next(err);
        }
        res.send({
          code: 1,
          result: {
            id: user.id,
            email: req.body.email,
            name: req.body.name
          }
        });
      });
    }
  });
});


// --------------------------------------------------
// HTTPS DELETE /users/me : 회원탈퇴
// --------------------------------------------------
router.delete('/me', isSecure, isAuthenticated, function(req, res, next) {
  var userId = req.user.id;
  req.logout();
  console.log('userId : ' + userId);
  User.deleteUser(userId, function(err, result) {
    if (err) {
      return next(err);
    }

    if (result.affectedRows > 0) {
      res.send({
        message:'회원탈퇴가 정상적으로 처리되었습니다'
      });
    } else {
      return next(new Error('회원탈퇴가 처리되지 않았습니다.'))
    }
  });
});


// --------------------------------------------------
// HTTPS GET /users/me : 마이페이지 조회 첫번째 화면
// --------------------------------------------------
router.get('/me', isSecure, isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

  var user = {};
  user.id = req.user.id;
  user.name = req.user.name;
  user.email = req.user.email;
  var filename = path.basename(req.user.photoURL);
  // console.log(req.user.photoURL.split(path.delimiter).split(path.sep));

  user.photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com:' + process.env.HTTP_PORT + '/images/'  + filename;
  user.type = req.user.type;
  user.phone = req.user.phone;

  User.findUserById(user, function(err, result) {
    if (err) {
      return next(err);
    }
    user.point = result;
    // user.photoURL = 'http://localhost:' + process.env.HTTP_PORT + '/images/'  + path.basename(result.photoURL);
    res.send({
      code: 1,
      result: user
    });
  });
});


// --------------------------------------------------
// HTTPS PUT /users/me : 유저 정보 수정
// --------------------------------------------------
router.put('/me', isSecure, isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'password: %s', req.body.password);

  var user = {};
  user.id = req.user.id;
console.log('포미더블 실행 전');
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images/profiles');
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
    if (err) {
      return next(err);
    }

    user.password = fields.password || 0;
    if (files.photo){
      user.file = files.photo.path;
    }


    console.log(user.password);
    console.log(user.file);


    User.updateUser(user, function(err) {
      if (err) {
        return next(err);
      }
      res.send({
        code: 1,
        result: '성공'
      });
    });
  });
});

module.exports = router;
