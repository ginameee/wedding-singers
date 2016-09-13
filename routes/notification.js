/**
 * Created by Chun on 2016-09-13.
 */
var express = require('express');
var router = express.Router();
var logger = require('../common/logger');
var Notification = require('../models/notification');
var isAuthenticated = require('./common').isAuthenticated;



// --------------------------------------------------
// HTTPS GET /chatting : 알람 수신
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
