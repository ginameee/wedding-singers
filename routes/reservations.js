var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Reservation = require('../models/reservation');
var CronJob = require('cron').CronJob;
var moment = require('moment-timezone');
var Notification = require('../models/notification');

// 로깅용 모듈
var logger = require('../common/logger');

// --------------------------------------------------
// HTTP POST /reservations : 예약 신청하기
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {

  var reservation = {};
  reservation.cid = req.user.id;
  reservation.place = req.body.place || '전국';
  reservation.demand = req.body.demand || '';
  reservation.r_dtime = req.body.reservation_date + " " + req.body.reservation_time + ":00";
  reservation.w_dtime = req.body.write_dtime;
  reservation.sid = req.body.singer_id;
  reservation.type = req.body.type || 1;
  reservation.song = req.body.song || ' ';

  var noti_param = {};
  noti_param.sender_id = req.user.id;
  noti_param.sender_name = req.user.name;
  noti_param.data_pk = 0;
  noti_param.type = 10;
  noti_param.receiver_id = req.body.singer_id;

  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'input: %j', reservation, {});

  if (req.user.type === 1) {
    return res.send({
      code: 2,
      result: 'Customer로 로그인 하세요!'
    })
  }

  Reservation.registerReservation(reservation, function(err, result) {
    if (err) {
      return next(err);
    }

      Notification.notify(noti_param, function(err, result) {
        if (err) {
          return next(err);
        }
        res.send({
          code: 1,
          result: result
        });
      });
    //
    //
    // res.send({
    //   code: 1,
    //   result: '성공'
    // });

      var param = {};
      param.rid = result;
      param.type = 11;

      var timeZone = "Asia/Seoul";
      var day = 2;
      var future = moment().tz(timeZone).add(day, 's');
      var crontime = future.second() + " " +
          future.minute() + " " +
          future.hour() + " " +
          future.date() + " " +
          future.month() + " ";
      // crontime = '05 * * * * *';

      var job = new CronJob(crontime, function () {
        logger.log('debug', 'CronJob Started');
        Reservation.updateReservation(param, function (err) {
          if (err) {
            logger.log('debug', err);
          }
          logger.log('debug', 'Reservation data has changed!!! By CronJob');
        });
        job.stop();
      }, function () {
        logger.log('debug', 'CronJob Completed');
      }, true, timeZone);
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
  param.user_id = req.user.id;
  param.rid = req.params.rid;
  param.type = parseInt(req.body.type);

  var noti_param = {};
  noti_param.sender_id = req.user.id;
  noti_param.data_pk = param.rid;
  noti_param.type = param.type;
  noti_param.receiver_id = req.body.sid;

  console.log(param.type);

  Reservation.updateReservation(param, function(err) {
    if (err) {
      return next(err);
    }
    
    res.send({
      code: 1,
      result: '성공'
    });

    if ((param.type % 2 )== 1) {
      var timeZone = "Asia/Seoul";
      var day = 1;
      var future = moment().tz(timeZone).add(day, 'd');
      var crontime = future.second() + " " +
          future.minute() + " " +
          future.hour() + " " +
          future.date() + " " +
          future.month() + " ";
      // crontime = '05 * * * * *';

      var job = new CronJob(crontime, function () {
        logger.log('debug', 'CronJob Started');
        Reservation.deleteReservation(param.rid, function (err, result) {
          if (err) {
            logger.log('debug', err)
          }
          logger.log('debug', result);
        });
        job.stop();
      }, function () {
        logger.log('debug', 'CronJob Completed');
      }, true, timeZone);
    }
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
  console.log(user.type);
  user.date = req.query.date || 0;

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
      result: {
        reservations: results
      }
    })
  })
});


// --------------------------------------------------
// HTTP GET /reservations/:rid : 예약 상세 보기
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

    if (!result) {
      return res.send({
        code: 2,
        result : '해당하는 예약 정보가 없습니다'
      });
    }

    res.send({
      code: 1,
      result: result
    });
  });

});
module.exports = router;
