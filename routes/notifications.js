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
router.get('/me', isAuthenticated, function (req, res, next) {
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);

    var param = {};
    param.flag = req.query.flag || 0;
    param.uid = req.user.id;

    Notification.selectNotification(param, function(err, results) {
        if (err) {
            return next(err);
        }
        res.send({
            code: 1,
            result: results
        });
    });
});

module.exports = router;
