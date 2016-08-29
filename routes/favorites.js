var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Favorite = require('../models/favorite');


// --------------------------------------------------
// HTTP GET /favorites?pageNo=&rowCount= : 찜 목록 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {

    var pageNo = parseInt(req.query.pageNo, 10) || 1;
    var rowCnt = parseInt(req.query.rowCnt, 10) || 10;
  
  Favorite.insertFavorite();

  res.send({
    message: '찜 목록 조회가 정상적으로 처리되었습니다,',
    pageNo: pageNo,
    rowCnt: rowCnt,
    result: [
      {
        video_id: 1,
        video_title: 'blah blah',
        write_dtime: '2015-06-31'
      },
      {
        video_id: 2,
        video_title: 'blah blah2',
        write_dtime: '2015-05-31'
      }
    ]
  });
});


// --------------------------------------------------
// HTTP POST /favorites : 찜 하기
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {

 res.send({
   message: '찜 추가가 정상적으로 처리되었습니다.'
 });

});


// --------------------------------------------------
// HTTP DELETE /favorites : 찜 목록 삭제
// --------------------------------------------------
router.delete('/', isAuthenticated, function(req, res, next) {

  res.send({
    message: '찜 삭제가 정상적으로 처리되었습니다.'
  });

});


module.exports = router;
