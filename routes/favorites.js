var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Favorite = require('../models/favorite');


// --------------------------------------------------
// HTTP GET /favorites?pageNo=&rowCount= : 찜 목록 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {

  var info = {};
  info.uid = req.user.id;

  Favorite.findFavoriteByUser(info, function(err, results) {
    if (err) {
      return next(err);
    }
    res.send({
      code: 1,
      result: results
    });
  });
});


// --------------------------------------------------
// HTTP POST /favorites : 찜 하기
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {
  var favorite = {};
  favorite.uid = req.user.id;
  favorite.vid = req.body.vid;

  Favorite.insertFavorite(favorite, function(err) {
    if (err) {
      return next(err);
    }

    res.send({
      code: 1,
      result: '성공'
    });
  });
});


// --------------------------------------------------
// HTTP DELETE /favorites : 찜 목록 삭제
// --------------------------------------------------
router.delete('/', isAuthenticated, function(req, res, next) {

  var info = {};
  info.uid = req.user.id;
  info.vid = req.body.vid;

  Favorite.deleteFavorite(info, function(err) {
    if (err) {
      return next(err);
    }
    res.send({
      code: 1,
      result: '성공'
    });
  });

});


module.exports = router;
