var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var User = require('../models/user');

// --------------------------------------------------
// HTTPS POST /users/local : 회원가입(로컬)
// --------------------------------------------------
router.post('/local', isSecure, function(req, res, next) {
  var user = {};
  user.id = req.body.id;
  user.email = user.id;
  user.password = req.body.password;
  user.name = req.body.name;
  user.phone = req.body.phone;
  user.waytosearch = req.body.waytosearch;
  user.type = req.body.type;

  User.registerUser(user, function(err, result) {
    if (err) return next(err);
    res.send({
      message: '회원가입(로컬)이 정상적으로 처리되었습니다.'
    });
  });
});


// --------------------------------------------------
// HTTPS POST /users/facebook/token : 회원가입(연동)
// --------------------------------------------------
router.post('/facebook/token', isSecure, function(req, res, next) {
  res.send({
    message:'회원가입(연동)이 정상적으로 처리되었습니다'
  });

});


// --------------------------------------------------
// HTTPS DELETE /users/me : 회원탈퇴
// --------------------------------------------------
router.delete('/me', isSecure, isAuthenticated, function(req, res, next) {
  var userId = req.user.id;

  User.deleteUser(userId, function(err, result) {
    if (err) return next(err);
    res.send({
      message:'회원탈퇴가 정상적으로 처리되었습니다'
    });
  });
});

module.exports = router;
