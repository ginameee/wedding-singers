var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Reservation = require('../models/reservation');
var CronJob = require('cron').CronJob;
var moment = require('moment-timezone');

// 로깅용 모듈
var logger = require('../common/logger');

// --------------------------------------------------
// HTTP POST /reservations : 예약 신청하기
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {

  var reservation = {};
  reservation.cid = req.user.id;
  reservation.place = req.body.place;
  reservation.demand = req.body.demand || '';
  reservation.r_dtime = req.body.reservation_date + " " + req.body.reservation_time + ":00";
  reservation.w_dtime = req.body.write_dtime;
  reservation.sid = req.body.singer_id;
  reservation.type = req.body.type;
  reservation.song = req.body.song;

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'input: %j', reservation, {});

  Reservation.registerReservation(reservation, function(err) {
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
// HTTP PUT /reservations/:rid : 예약 상태 수정하기
// --------------------------------------------------
router.put('/:rid', isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'rid: %d', req.params.rid);
  logger.log('debug', 'type: %d', req.body.type);

  var param = {};
  param.rid = req.params.rid;
  param.type = req.body.type;

  console.log(param.type);

  Reservation.updateReservation(param, function(err) {
    if (err) {
      return next(err);
    }
    res.send({
      code: 1,
      result: '성공'
    });

    var timeZone = "Asia/Seoul";
    var day = 7;
    if (param.type === 10) {
      day = 1
    }

    var future = moment().tz(timeZone).add(1, 's');
    var crontime = future.second() + " " +
                   future.minute() + " " +
                   future.hour() + " " +
                   future.date() + " " +
                   future.month() + " ";
    // crontime = '* * * * * *';
    var job = new CronJob(crontime, function() {
      Reservation.deleteAfterTime(param, function(err, result) {
        console.log(result);
      });
      job.stop();
    }, function() {

    }, true, timeZone);
  });
});


// --------------------------------------------------
// HTTP GET /reservations/me : 예약 목록 조회
// --------------------------------------------------
router.get('/me', isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'tab: %d', req.query.tab);
  logger.log('debug', 'year: %d', req.query.year);
  logger.log('debug', 'month: %d', req.query.month);

  // if (req.url.match(/\?pageNo=\d+&rowCnt=\d+/i)) { // 주문 목록 조회 req.url: /?pageNo=1&rowCount=10
  // if (req.query.pageNo || req.query.rowCnt ) {
  //   var pageNo = parseInt(req.query.pageNo, 10) || 1;
  //   var rowCnt = parseInt(req.query.rowCnt, 10) || 1;
  // }

  var user = req.user;
  user.tab = parseInt(req.query.tab || 1);
  user.year = req.query.year || 0;
  user.month = req.query.month || 0;
  // user.date = req.query.date || 0;

  Reservation.findReservationListOfUser(user, function(err, results) {
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
// HTTP GET /reservations?sid=1 : 싱어들의 예약 일 조회
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'sid: %d', req.query.sid);

  var user = {};
  user.date = 1;
  user.id = req.query.sid;

  Reservation.findReservationListOfUser(user, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send({
      code: 1,
      result: results
    })
  })
});


// --------------------------------------------------
// HTTP GET /reservations/:id : 예약 상세 보기
// --------------------------------------------------
router.get('/:rid', isAuthenticated, function(req, res, next) {

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'rid: %d', req.params.rid);

  var user = req.user;
  user.reservation_id = req.params.rid;
  
  Reservation.findReservationById(user, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send({
      code: 1,
      result: result
    });
  });

});
module.exports = router;
