var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Singer = require('../models/singer');


// --------------------------------------------------
// HTTPS PUT /singers/me : Singer 프로필 수정
// --------------------------------------------------
router.put('/me', isSecure, isAuthenticated, function(req, res, next) {
    var singerId = req.user.id;

    Singer.updateSinger(singerId, function(err, result) {
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
    var singerId = req.user.id;
    var singer = {};

    Singer.findSingerById(singerId, function(err, results) {
        if (err) return next(err);

        res.send({
            message: '마이페이지 조회가 정상적으로 처리되었습니다.',
            result: {
                singer_id: 3,
                user_id: 'difje@naver.com',
                comment: '가왕 출신입니다.',
                description: '안녕하세요! 복면가왕에 출연했던 웨딩싱어 입니다. '+
                '저는 발라드전문이구요 장난이니니까 믿어주세요',
                standard_price: 300000,
                special_price: 600000,
                composition: '발라드',
                theme: '솔로',
                penalty: 3,
                songs: ['다행이다', '감사']
            }
        });
    });
});

// --------------------------------------------------
// HTTP GET /singers/me/holidaies : Singer 휴일 조회
// --------------------------------------------------
router.get('/me/holidaies', isAuthenticated, function(req, res, next) {
    res.send({
        message: 'Singer 휴일 조회가 정상적으로 처리되었습니다.',
        result: {
            holidaies: ['2016-05-31', '2016-02-13', '2016-12-12']
        }
    });
});
// --------------------------------------------------
// HTTP PUT /singers/me/holidaies : Singer 휴일 변경
// --------------------------------------------------
router.put('/me/holidaies', isAuthenticated, function(req, res, next) {
    res.send({
       message: 'Singer 휴일 변경이 정상적으로 처리되었습니다.'
    });
});

// --------------------------------------------------
// HTTP GET /singers/me/penalties?rowCnt=?&pageNo=3 : Singer 패널티포인트 조회
// --------------------------------------------------
router.get('/me/penalties', isSecure, function(req, res, next) {

    if (req.query.pageNo || req.query.rowCnt) {
        var pageNo = parseInt(req.query.pageNo, 10);
        var rowCnt = parseInt(req.query.rowCnt, 10);
    }

    res.send({
        message: '패널티 포인트 조회가 정상적으로 처리되었습니다.',
        rowCnt: rowCnt,
        pageNo: pageNo,
        result: [
            {
                id: 1,
                penalty: 30,
                content: '불만접수',
                write_date: '2016-05-31'
            },
            {
                id:2,
                penalty: 22,
                content: '계약파기',
                write_date: '2016-05-17'
            }
        ]
    });

});

// --------------------------------------------------
// HTTP GET /singers/:sid : Singer 프로필 조회
// --------------------------------------------------
router.get('/:sid', function(req, res, next) {

   res.send({
       message: 'singer 프로필 조회 완료',
       result: {
           comment: '가왕 출신입니다.',
           description: '안녕하세요! 복면가왕에 출연했던 웨딩싱어 입니다. '+
           '저는 발라드전문이구요 장난이니니까 믿어주세요',
           standard_prce: 300000,
           special_price: 600000,
           composition: '발라드',
           theme: '솔로',
           penalty: 3,
           songs: ['다행이다', '감사']
       }
   });

});
module.exports = router;
