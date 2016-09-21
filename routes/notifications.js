/**
 * Created by Chun on 2016-09-13.
 */
var express = require('express');
var router = express.Router();
var logger = require('../common/logger');
var Notification = require('../models/notification');
var isAuthenticated = require('./common').isAuthenticated;



// --------------------------------------------------
// HTTPS GET /notifications : 알람 수신
// --------------------------------------------------
router.get('/', isAuthenticated, function (req, res, next) {
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

    Notification.selectNotification(req.user.id, function(err, results) {
        if (err) {
            return next(err);
        }
        res.send({
            code: 1,
            result: results
        });
    });
});


router.post('/', isAuthenticated, function (req, res, next) {
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

    var input = {};
    input.sender_id = req.user.id;
    input.sender_name = req.user.name;
    input.receiver_id = 134;
    input.data_pk = 0;
    input.type = 10;

    Notification.notify(input, function(err, result) {
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
