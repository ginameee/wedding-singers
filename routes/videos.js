var express = require('express');
var router = express.Router();
var isAuthenticated = require('./common').isAuthenticated;
var isSecure = require('./common').isSecure;
var Video = require('../models/video.js');

// 로깅용 모듈
var logger = require('../common/logger');


// --------------------------------------------------
// HTTP GET /videos/me : 내 동영상 보기
// --------------------------------------------------
router.get('/me', isAuthenticated, function(req, res, next) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

    var uid = req.user.id;

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
// HTTP GET /videos?theme=3&location=2'&price=0&composition=0&keyword=0: 동영상 검색
// HTTP GET /videos?sid=2 다른 싱어의 동영상 검색
// --------------------------------------------------
router.get('/', isAuthenticated, function(req, res, next) {

    if (req.query.sid) {
        logger.log('debug', 'content-type: %s', req.headers['content-type']);
        logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
        logger.log('debug', 'singer_id: %d', req.query.sid);

        var uid = req.query.sid;

        Video.findVideoByUserId(uid, function (err, results) {
            if (err) {
                return next(err);
            }
            res.send({
                code: 1,
                result: results
            });
        });

    } else if (req.query.theme || req.query.location || req.query.composition || req.query.keyword) {
        logger.log('debug', 'content-type: %s', req.headers['content-type']);
        logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
        logger.log('debug', 'theme: %d', req.query.theme);
        logger.log('debug', 'location: %d', req.query.location);
        logger.log('debug', 'composition: %d', req.query.composition);
        logger.log('debug', 'vh.tag: %s', req.query.keyword);


        // var rowCnt = req.query.rowCnt || 0;
        // var pageNo = req.query.pageNo || 1;

        var search = [];
        search.push({ 'theme': parseInt(req.query.theme) || 0 });
        search.push({ 'location': parseInt(req.query.location) || 0 });
        search.push({ 'composition': parseInt(req.query.composition) || 0});
        search.push({ 'vh.tag':  req.query.keyword || 0 });
        search.price = parseInt(req.query.price) || 0;

        // 필터 적용해서 검색 가능하게 수정
        // 사용자가 입력한 조건들을 모아놓은 객체를 이용해서 조건검색을 실시할 것임.
        Video.findVideoByFilter(search, function(err, results) {
            if (err) {
                return next(err);
            }
            res.send({
                code:1,
                // rowCnt: rowCnt,
                // pageNo: pageNo,
                result: results
            });
        });
    }
});

// --------------------------------------------------
// HTTP GET /videos/main?type=2: 메인페이지 동영상 목록
// --------------------------------------------------
router.get('/main', function(req, res, next) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'type: %d', req.query.type);

    // 동영상을 검색할 때,
    // 1 - 인기싱어영상,  2 - 신규싱어영상
    var type = parseInt(req.query.type) || 1;
    // var rowCnt = parseInt(req.query.rowCnt) || 1;
    // var pageNo = parseInt(req.query.pageNo) || 1;

    Video.listVideo(type ,function(err, videos) {
        if (err) {
            return next(err);
        }
        res.send({
            code: 1,
            type: type,
            // rowCnt: rowCnt,
            // pageNo: pageNo,
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

    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'input: %j', video, {});

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

    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'input: %j', video, {});


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
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'vid: %d', req.params.vid);

    var input = {};
    input.vid = parseInt(req.params.vid);
    input.uid = parseInt(req.user.id || 0);

    Video.findVideoById(input, function(err, result) {
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
router.delete('/', isAuthenticated, function(req, res, next) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'vid: %d', req.body.vid);

    var vids = [];
    if (!(req.body.vid instanceof Array)){
        vids.push(req.body.vid);
    } else {
        vids = req.body.vid;
    }
    console.log(vids);

    Video.deleteVideo(vids, function(err) {
        if (err) {
            return next(err);
        }

        res.send({
            code: 1,
            result: '성공'
        });

    });
});