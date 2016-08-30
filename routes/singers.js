var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Singer = require('../models/singer');

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
    singer.theme = parseInt(req.body.theme || 1);
    singer.songs = req.body.songs || [''];

    Singer.updateSinger(singer, function(err, result) {
        if (err) return next(err);
        res.send({
            message: 'Singer 프로필 수정이 정상적으로 처리되었습니다.'
        });
    });
});


// --------------------------------------------------
// HTTPS GET /singers/me : Singer가 자신의 마이페이지 조회
// --------------------------------------------------
router.get('/me', isSecure, isAuthenticated, function(req, res, next) {
    var sid = req.user.id;

    Singer.findSingerById(sid, function(err, results) {
        if (err) return next(err);

        res.send({
            message: '마이페이지 조회가 정상적으로 처리되었습니다.',
            result: results
        });
    });
});


// --------------------------------------------------
// HTTP GET /singers/me/holidaies : Singer 휴일 조회
// --------------------------------------------------
router.get('/me/holidaies', isAuthenticated, function(req, res, next) {
    var userId = req.user.id;
    console.log(userId);
    var holidaies = [];

    Singer.findSingerHolidaies(userId, function(err, results) {
        if (err) {
            return next(err);
        }

        holidaies = results;

        res.send({
            message: 'Singer 휴일 조회가 정상적으로 처리되었습니다.',
            result: {
                holidaies: holidaies
            }
        });
    });
});


// --------------------------------------------------
// HTTP PUT /singers/me/holidaies : Singer 휴일 변경
// --------------------------------------------------
router.put('/me/holidaies', isAuthenticated, function(req, res, next) {
    var singer = {};
    singer.user_id = req.user.id;
    singer.update_dates = req.body.update_dates;

    Singer.updateSingerHolidaies(singer, function(err, results) {
        if (err) return next(err);
        res.send({
            message: 'Singer 휴일 변경이 정상적으로 처리되었습니다.'
        });
    });

});


// --------------------------------------------------
// HTTP GET /singers/:sid : Singer 프로필 조회
// --------------------------------------------------
router.get('/:sid', function(req, res, next) {
    var singer = {};
    singer.user_id = req.params.sid;

    Singer.findSingerById(singer, function(err, results) {
        if (err) return next(err);

        res.send({
            message: '마이페이지 조회가 정상적으로 처리되었습니다.',
            result: results
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
