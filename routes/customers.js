var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;

// 로깅용 모듈
var logger = require('../common/logger');

// --------------------------------------------------
// HTTPS GET /customers/me : Customer 마이페이지
// --------------------------------------------------
router.get('/me', isSecure, isAuthenticated, function(req, res, next) {

  res.send({
    message: 'customer 마이페이지 조회가 정상적으로 처리되었습니다.',
    result: {
      id: 'ginameee@naver.com',
      name: '홍길동',
      email: 'ginameee@naver.com',
      phone: '010-1234-1234',
      point: 35
    }
  });

});


// --------------------------------------------------
// HTTPSS PUT /customers/me : Customer 프로필수정
// --------------------------------------------------
router.put('/me', isSecure, isAuthenticated, function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'email: %s', req.body.email);
  logger.log('debug', 'comment: %s', req.body.comment);
  logger.log('debug', 'description: %s', req.body.description);
  logger.log('debug', 'standard_price: %s', req.body.standard_price);
  logger.log('debug', 'special_price: %s', req.body.special_price);
  logger.log('debug', 'composition: %s', req.body.composition);
  logger.log('debug', 'theme: %s', req.body.theme);
  logger.log('debug', 'theme: %s', req.body.songs);

  res.send({
    message: 'customer 프로필 변경이 정상적으로 처리되었습니다.'
  });

});


// --------------------------------------------------
// HTTP GET /customers/mypoint : Customer 마이포인트 조회
// --------------------------------------------------
// router.get('/mypoint', isAuthenticated, function(req, res, next) {
//
//   var pageNo = parseInt(req.query.pageNo, 10);
//   var rowCnt = parseInt(req.query.rowCnt, 10);
//
//   res.send({
//     message: '마이포인트 조회가 정상적으로 처리되었습니다.',
//     rowCnt: rowCnt,
//     pageNo: pageNo,
//     result: [
//       {
//         idx: 1,
//         customer_id: 'ginameee@naver.com',
//         point: 3,
//         content: '공유하기',
//         write_dtime: '2016-05-31'
//       },
//       {
//         idx: 2,
//         customer_id: 'ginameee@naver.com',
//         point: 6,
//         content: '리뷰작성',
//         write_dtime: '2016-05-32'
//       }
//     ]
//   });
//
// });
//

// --------------------------------------------------
// HTTPS GET /customers/:cid : Customer 프로필조회
// --------------------------------------------------
// router.get('/:cid', isSecure, isAuthenticated, function(req, res, next) {
//   logger.log('debug', 'content-type: %s', req.headers['content-type']);
//   logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
//   logger.log('debug', 'cid: %d', req.params.cid);
//
//   res.send({
//     message: 'customer 프로필 조회가 정상적으로 처리되었습니다.'
//   });
//
// });

module.exports = router;
