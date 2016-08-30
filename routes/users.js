var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var User = require('../models/user');
var Singer = require('../models/singer');
var Customer = require('../models/customer');
var async = require('async');

// --------------------------------------------------
// HTTPS POST /users/local : 회원가입(로컬)
// --------------------------------------------------
router.post('/local', isSecure, function(req, res, next) {
  
  var user = {};
  user.email = req.body.email;
  user.password = req.body.password;
  user.name = req.body.name;
  user.phone = req.body.phone;
  user.waytosearch = req.body.waytosearch;
  user.type = parseInt(req.body.type);
  
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
          message: '회원가입(로컬)이 정상적으로 처리되었습니다.'
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
  user.waytosearch = req.body.waytosearch;
  user.type = parseInt(req.body.type);
  console.log(user.email);

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
          message: '회원가입(연동)이 정상적으로 처리되었습니다.'
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

    console.log(result);
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
  var user = {};
  var userId = req.user.id;

  User.findUserById(userId, function(err, result) {
    if (err) {
      return next(err);
    }

    user.name = result.name;
    user.email = result.email;
    user.point = result.point;

    res.send({
      message:'user mypage 조회가 정상적으로 처리되었습니다',
      result: user
    });
  });
});

module.exports = router;
