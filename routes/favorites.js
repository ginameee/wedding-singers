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
  info.pageNo = parseInt(req.query.pageNo, 10) || 1;
  info.rowCnt = parseInt(req.query.rowCnt, 10) || 100;
  info.uid = req.user.id;
  
  console.log(info.pageNo + '//' + info.rowCnt + '//' + info.uid);

  Favorite.findFavoriteByUser(info, function(err, results) {
    if (err) {
      return next(err);
    }
    res.send({
      message: '찜 목록 조회가 정상적으로 처리되었습니다,',
      pageNo: info.pageNo,
      rowCnt: info.rowCnt,
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
      message: '찜 추가가 정상적으로 처리되었습니다.'
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
      message: '찜 삭제가 정상적으로 처리되었습니다.'
    });
  });

});


module.exports = router;
