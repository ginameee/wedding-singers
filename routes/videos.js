var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;

var Video = require('../models/video.js');


// --------------------------------------------------
// HTTP GET /videos?theme=3&location=2&s_workday='2016-05-32'&e_workday='2016-05-32'&price=””&composition=””&hash=””&pageNo=””&rowCnt=”” : 동영상 검색
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {
    var rowCnt = req.query.rowCnt || 0;
    var pageNo = req.query.pageNo || 1;

    var search = {};
        search.theme =  req.query.theme;
        search.location = req.query.location;
        search.s_workday = req.query.s_workday;
        search.e_workday = req.query.e_workday;
        search.price = req.query.price;
        search.composition = req.query.composition;
        search.hash = req.query.hash;

    // 사용자가 입력한 조건들을 모아놓은 객체를 이용해서 조건검색을 실시할 것임.
    Video.findVideoByFilter(search);

    res.send({
        message: '동영상 검색이 정상적으로 처리되었습니다.',
        rowCnt: rowCnt,
        pageNo: pageNo,
        search: search,
        result: [
            {
                singer_name: '김동률',
                title: '감사',
                hit: 353,
                favorite: 20
            },
            {
                singer_name: '홍길동',
                title: '다행이다',
                hit: 352,
                favorite: 20
            }
        ]
    });
});


// --------------------------------------------------
// HTTP GET /videos/main?type=2&pageNo=3&rowCnt=2 : 메인페이지 동영상 목록
// --------------------------------------------------
router.get('/main', isAuthenticated, function(req, res, next) {
    // 동영상을 검색할 때,
    var type = parseInt(req.query.type) || 1;
    var rowCnt = parseInt(req.query.rowCnt) || 1;
    var pageNo = parseInt(req.query.pageNo) || 1;

    Video.listVideo(pageNo, rowCnt, function(err, videos) {
        if (err) {
            return next(err);
        }
        res.send({
            message: '동영상 목록 조회가 정상적으로 처리되었습니다.',
            type: type,
            rowCnt: rowCnt,
            pageNo: pageNo,
            result: videos
        });
    });
});


// --------------------------------------------------
// HTTP POST /videos : 동영상 게시
// --------------------------------------------------
router.post('/', isAuthenticated, function(req, res, next) {
    var userId = req.user.id;

    Video.insertVideo(userId, function(err, result) {
        res.send({
            message: '동영상 게시가 정상적으로 처리되었습니다.'
        });
    });
});


// --------------------------------------------------
// HTTP PUT /videos/:vid : 동영상 수정
// --------------------------------------------------
router.put('/:vid', isAuthenticated, function(req, res, next) {
    Video.updateVideo(req.params.vid, function(err, result) {
        res.send({
            message: '동영상 수정이 정상적으로 처리되었습니다.'
        });
    });
});


// --------------------------------------------------
// HTTP GET /videos/:vid : 동영상 보기
// --------------------------------------------------
router.get('/:vid', isAuthenticated, function(req, res, next) {
    console.log(req.params.vid);
    Video.findVideoById(req.params.vid, function(err, results) {
        res.send({
            message: '동영상 조회가 정상적으로 처리되었습니다.',
            result: results
        });
    });

});
module.exports = router;
