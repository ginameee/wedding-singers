var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Singer = require('../models/singer');
var path = require('path');

// 로깅용 모듈
var logger = require('../common/logger');

// --------------------------------------------------
// HTTPS PUT /singers/me : Singer 프로필 수정
// --------------------------------------------------
router.put('/me', isSecure, isAuthenticated, function(req, res, next) {

    var singer = {};
    singer.user_id = req.user.id;
    singer.comment = req.body.comment || '';
    singer.description = req.body.description || '';
    singer.standard_price = parseInt(req.body.standard_price || 0);
    singer.special_price = parseInt(req.body.special_price || 0);
    singer.composition = parseInt(req.body.composition || 1);
    singer.location = parseInt(req.body.location || 1);
    singer.theme = parseInt(req.body.theme || 1);
    singer.songs = req.body.songs || [''];

    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'rid: %d', req.params.rid);
    logger.log('debug', 'param: %s', singer);

    Singer.updateSinger(singer, function(err, result) {
        if (err) return next(err);
        res.send({
            code: 1,
            result: '성공'
        });
    });
});


// --------------------------------------------------
// HTTP GET /singers/me/holidaies : Singer 휴일 조회
// --------------------------------------------------
router.get('/:sid/holidaies', isAuthenticated, function(req, res, next) {
    var userId;

     if (req.params.sid == 'me') {
         userId = req.user.id;
     } else {
        userId = req.params.sid;
     }

    console.log(userId);
    var holidays = [];

    Singer.findSingerHolidays(userId, function(err, results) {
        if (err) {
            return next(err);
        }

        holidays = results;

        res.send({
            code: 1,
            result: {
                holidays: holidays
            }
        });
    });
});


// --------------------------------------------------
// HTTP PUT /singers/me/holidaies : Singer 휴일 변경
// --------------------------------------------------
router.put('/me/holidaies', isAuthenticated, function(req, res, next) {

    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'update_dates: %s', req.body.update_dates);

    var singer = {};
    singer.user_id = req.user.id;
    singer.update_dates = req.body.update_dates;

    Singer.registerSingerHolidays(singer, function(err, results) {
        if (err) return next(err);
        res.send({
            code: 1,
            result: '성공'
        });
    });

});


// --------------------------------------------------
// HTTP GET /singers/:sid : Singer 프로필 조회
// --------------------------------------------------
router.get('/:sid', function(req, res, next) {
    var singer = {};

    if (req.params.sid == 'me') {
        singer.user_id = req.user.id
    } else {
        singer.user_id = parseInt(req.params.sid);
    }

    singer.simple = parseInt(req.query.simple || 0);


    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'singer.user_id: %d ', singer.user_id);
    logger.log('debug', 'simple: %d', singer.simple);


    Singer.findSingerById(singer.user_id, function(err, result) {
        if (err) return next(err);

        if (!singer.simple) {
            singer = result
        } else {
            singer.name = result.name;
            singer.comment = result.comment;
            singer.photoURL = result.photoURL;
            singer.standard_price = result.standard_price;
            singer.special_price = result.special_price;
        }

        res.send({
            code: 1,
            result: singer
        });
    });

    // Singer.findSingerById(sid, function(err, results) {
    //     if (err) return next(err);
    //
    //     res.send({
    //         code: 1,
    //         result: results
    //     });
    // });
});


// --------------------------------------------------
// HTTPS GET /singers/me : Singer가 자신의 마이페이지 조회
// --------------------------------------------------
router.get('/me', isSecure, isAuthenticated, function(req, res, next) {

    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

    var singer = {};
    console.log('유저객체보기');
    console.log(req.user);
    singer.user_id = req.user.id;
    singer.email = req.user.email;
    singer.name = req.user.name;
    singer.type = req.user.type;
    singer.photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com' + '\/images\/'  + path.basename(req.user.photoURL);
    singer.simple = parseInt(req.query.simple || 0);

    if (singer.type === 2) {
        return res.send({
            code: 2,
            result: '올바르지 않은 접근입니다. (customer가 singer의 마이페이지를 요청)'
        });
    }

    Singer.findSingerById(singer.user_id, function(err, result) {
        if (err) return next(err);

        if (!singer.simple) {
            singer = result
        } else {
            singer.name = result.name;
            singer.comment = result.comment;
            singer.photoURL = result.photoURL;
        }

        res.send({
            code: 1,
            result: singer
        });
    });
});

// --------------------------------------------------
// HTTP GET /singers/me/penalties?rowCnt=?&pageNo=3 : Singer 패널티포인트 조회
// --------------------------------------------------
// router.get('/me/penalties', isSecure, function(req, res, next) {
//
//     if (req.query.pageNo || req.query.rowCnt) {
//         var pageNo = parseInt(req.query.pageNo, 10);
//         var rowCnt = parseInt(req.query.rowCnt, 10);
//     }
//
//     res.send({
//         message: '패널티 포인트 조회가 정상적으로 처리되었습니다.',
//         rowCnt: rowCnt,
//         pageNo: pageNo,
//         result: [
//             {
//                 id: 1,
//                 penalty: 30,
//                 content: '불만접수',
//                 write_date: '2016-05-31'
//             },
//             {
//                 id:2,
//                 penalty: 22,
//                 content: '계약파기',
//                 write_date: '2016-05-17'
//             }
//         ]
//     });
// });

module.exports = router;