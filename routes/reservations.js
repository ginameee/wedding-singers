var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;

// --------------------------------------------------
// HTTP POST /reservations : 예약 신청하기
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {

  res.send({
    message: '예약 신청이 정상적으로 처리되었습니다.'
  });

});


// --------------------------------------------------
// HTTP PUT /reservations : 예약 상태 수정하기
// --------------------------------------------------
router.put('/', isAuthenticated, function(req, res, next) {

  res.send({
    message: '예약 상태 수정이 정상적으로 처리되었습니다.'
  });

});

// --------------------------------------------------
// HTTP GET /reservations : 예약 목록 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {

  // if (req.url.match(/\?pageNo=\d+&rowCnt=\d+/i)) { // 주문 목록 조회 req.url: /?pageNo=1&rowCount=10
  if (req.query.pageNo || req.query.rowCnt ) {
    var pageNo = parseInt(req.query.pageNo, 10) || 1;
    var rowCnt = parseInt(req.query.rowCnt, 10) || 1;
  }

  res.send({
    message: '예약 목록 조회가 정상적으로 처리되었습니다.',
    pageNo: pageNo,
    rowCnt: rowCnt,
    result: [
      {
        idx: 1,
        place: '인천',
        reservation_dtime: '2015-05-31',
        song: 'love song'
      },
      {
        idx: 2,
        place: '대전',
        reservation_dtime: '2015-02-31',
        song: '다행이다'
      }
    ]
  });

});

// --------------------------------------------------
// HTTP GET /reservations/:id : 예약 상세 보기
// --------------------------------------------------
router.get('/:id', isAuthenticated, function(req, res, next) {

  res.send({
    message: '예약 상세 보기가 정상적으로 처리되었습니다.',
    result: {
      singer_name: '이장춘',
      place: '인천 춘 예식장',
      reservation_dtime: '2015-05-31 09:00:00',
      song: '나 항상 그대를',
      demand: '춤도 춰주세요!',
      price: 300000
    }
  });

});
module.exports = router;
