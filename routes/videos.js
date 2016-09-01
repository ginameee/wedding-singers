var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;

var Video = require('../models/video.js');


// --------------------------------------------------
// HTTP GET /videos/me : 내 동영상 보기
// --------------------------------------------------
router.get('/me', isAuthenticated, function(req, res, next) {
    console.log('내 동영상 보기');
    var uid = req.user.id;
    console.log(uid);

    Video.findVideoByUserId(uid, function(err, results) {
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
// HTTP GET /videos?theme=3&location=2&s_workday='2016-05-32'&e_workday='2016-05-32'&price=””&composition=””&hash=””&pageNo=””&rowCnt=”” : 동영상 검색
// --------------------------------------------------
router.get('/', function(req, res, next) {
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

    // 필터 적용해서 검색 가능하게 수정
    // 사용자가 입력한 조건들을 모아놓은 객체를 이용해서 조건검색을 실시할 것임.
    Video.findVideoByFilter(search);
    

    res.send({
        code:1,
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
router.get('/main', function(req, res, next) {
    // 동영상을 검색할 때,
    var type = parseInt(req.query.type) || 1;
    var rowCnt = parseInt(req.query.rowCnt) || 1;
    var pageNo = parseInt(req.query.pageNo) || 1;

    Video.listVideo(pageNo, rowCnt, function(err, videos) {
        if (err) {
            return next(err);
        }
        res.send({
            code: 1,
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
    // 매개변수를 저장할 객체 생성 (제목, 해시태그, URL(배열임), 작성날짜)
    var video = {};
    video.singer_user_id = req.user.id;
    video.title = req.body.title;
    video.url = req.body.url;
    video.write_dtime = req.body.write_dtime;
    video.hash = req.body.hash || [ '' ];

    // InsertVideo 정의
    Video.insertVideo(video, function(err, result) {
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
// HTTP PUT /videos/:vid : 동영상 수정
// --------------------------------------------------
router.put('/:vid', isAuthenticated, function(req, res, next) {
    // 매개변수 받아올 객체 선언
    var video = {};
    video.id = req.params.vid;
    video.title = req.body.title;
    video.url = req.body.url;
    video.hash = req.body.hash || [''];

    Video.updateVideo(video, function(err, result) {
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
// HTTP GET /videos/:vid : customer가 동영상 보기
// --------------------------------------------------
router.get('/:vid', function(req, res, next) {
    console.log(req.params.vid);
    Video.findVideoById(req.params.vid, function(err, result) {
        res.send({
            code: 1,
            result: result
        });
    });

});
module.exports = router;


// --------------------------------------------------
// HTTP DELETE /videos/:vid : 동영상 삭제
// --------------------------------------------------
router.delete('/:vid', isAuthenticated, function(req, res, next) {
    var vid = req.params.vid;

    Video.deleteVideo(vid, function(err, result) {
        if (err) {
            return next(err);
        }

        res.send({
            code: 1,
            result: '성공'
        });

    });
});