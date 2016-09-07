var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Review = require('../models/review');

// --------------------------------------------------
// HTTP GET /reviews?sid : 리뷰 목록 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next){
  // if ( req.query.pageNo || req.query.rowCnt ) {
  //   var pageNo = parseInt(req.query.pageNo, 10);
  //   var rowCnt = parseInt(req.query.rowCnt, 10);
  // }

  var select = {};
  select.sid = req.query.sid;
  select.simple = parseInt(req.query.rating || 0);

  Review.selectReviewBySinger(select, function(err, results) {
    if (err) {
      return next(err);
    }
    res.send({
      code: 1,
      // pageNo: pageNo,
      // rowCnt: rowCnt,
      result: results
    });
  });
});


// --------------------------------------------------
// HTTP POST /reviews : 리뷰 작성
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {
  var review = {};
  review.rid = req.body.rid;
  review.singer_id = req.body.sid;
  review.customer_id = req.user.id;
  review.point = parseInt(req.body.point);
  review.content = req.body.content;
  review.write_dtime = req.body.write_dtime;

  Review.registerReview(review, function(err, result) {
    if (err) {
      return next(err);
    }

    if (result === 1) {
      res.send({
        code: 3,
        result: '권한이 없습니다'
      });
    } else {
      res.send({
        code: 1,
        result: '성공'
      });
    }
  });
});


// --------------------------------------------------
// HTTP POST /reviews/me 자신이 쓴 리뷰 조회
// --------------------------------------------------
router.get('/me', isAuthenticated, function(req, res, next) {

});

// // --------------------------------------------------
// // HTTP PUT /reviews/:rid : 리뷰 수정
// // --------------------------------------------------
// router.put('/:rid', isAuthenticated, function(req, res, next) {
//
//   res.send({
//     message: '리뷰 변경이 정상적으로 처리되었습니다.'
//   });
//
// });
//
//
// // --------------------------------------------------
// // HTTP DELETE /reviews/:rid : 리뷰 삭제
// // --------------------------------------------------
// router.delete('/:rid', isAuthenticated, function(req, res, next) {
//
//   res.send({
//     message: '리뷰 삭제가 정상적으로 처리되었습니다.'
//   });
//
// });

module.exports = router;
