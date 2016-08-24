var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;

// --------------------------------------------------
// HTTP GET /reviews : 리뷰 목록 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next){
  if ( req.query.pageNo || req.query.rowCnt ) {
    var pageNo = parseInt(req.query.pageNo, 10);
    var rowCnt = parseInt(req.query.rowCnt, 10);
  }

  res.send({
    message: '리뷰 목록 조회가 정상적으로 처리되었습니다.',
    pageNo: pageNo,
    rowCnt: rowCnt,
    result: [
      {
        customer_name: '이장춘',
        point: '3.5',
        content: 'blah blah blah',
        write_dtime: '2015-05-31'
      },
      {
        customer_name: '홍길동',
        point: '4.3',
        content: 'blah blah blah',
        write_dtime: '2015-04-21'
      }
    ]
  });

});


// --------------------------------------------------
// HTTP POST /reviews : 리뷰 작성
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {

  res.send({
    message: '리뷰 작성이 정상적으로 처리되었습니다.'
  });

});


// --------------------------------------------------
// HTTP PUT /reviews/:rid : 리뷰 수정
// --------------------------------------------------
router.put('/:rid', isAuthenticated, function(req, res, next) {

  res.send({
    message: '리뷰 변경이 정상적으로 처리되었습니다.'
  });

});


// --------------------------------------------------
// HTTP DELETE /reviews/:rid : 리뷰 삭제
// --------------------------------------------------
router.delete('/:rid', isAuthenticated, function(req, res, next) {

  res.send({
    message: '리뷰 삭제가 정상적으로 처리되었습니다.'
  });

});

module.exports = router;
