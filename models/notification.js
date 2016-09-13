/**
 * Created by Chun on 2016-09-09.
 */
var isAuthenticated = require('./common').isAuthenticated;
var logger = require('../common/logger');
var fcm = require('node-gcm');
var dbPool = require('../models/common').dbPool;

function selectRegistrationToken(param, callback) {
    var sql_selectRegistrationToken =
        'select registration_token ' +
        'from user ' +
        'where id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_selectRegistrationToken, [param.receiver], function(err, results) {
            if (err) {
                return callback(err);
            }
            callback(null, results[0].registration_token);
        })
    });
}

// param에 필요한 정보
// param_sender_id = req.user.id
// param_sender_registration_token = req.user.registration_token
// param.receiver_id = 해당 게시물에 대한 singer or customer id
// param.message = type에 따라 내가 만들어 줘야 하는 message
// param.data_pk = 해당 게시물에 대한 id
// paraa.type = 게시물에 대한 type
function notify(input, callback) {
    var sql_insert_notification = 'INSERT INTO notification(sender_id, receiver_id, message, data_pk, type) ' +
                                   'VALUES (?, ?, ?, ?, ?)';

    var param = input;

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        selectRegistrationToken(param.receiver, function(err, result) {
            if (err) {
                return callback(err);
            }
            param.receiver_registration_token = result;
        });

        dbConn.query(sql_insert_notification, [param.sender_id, param.receiver_id, param.message, param.data_pk, param.type], function(err) {
            dbConn.release();
            if (err) {
                return callback(err);
            }

            var msg = fcm.Message({
                data: {
                    key1: value
                },
                notification: {
                    title: 'Wedding Singers',
                    icon: 'ic_launcher',
                    body: ''
                }
            });

            var sender = new fcm.Sender(process.env.FCM_SERVEER_KEY);
            sender.send(msg, {registrationToken: [param.receiver_registration_token]}, function(err, response) {
                if (err) {
                    return callback(err);
                }
            });
        });
    });


}

function selectNotification(uid, callback) {
    var sql_select_notification = 'SELECT sender_id, receiver_id, message, data_pk, type, date_format(write_dtime, \'%Y-%m-%d %T\') write_dtime ' +
                                   'FROM notification ' +
                                   'WHERE sender_id = ? OR receiver_id = ?';

    dbPool.getConnection(function(err, dbConn){
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_notification, [uid], function(err, results) {
            return callback(results);
        });
    });
}

module.exports.notify = notify;
module.exports.selectRegistrationToken = selectRegistrationToken;
module.exports.selectNotification = selectNotification;