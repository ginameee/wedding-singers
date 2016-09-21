/**
 * Created by Chun on 2016-09-09.
 */
var logger = require('../common/logger');
var FCM = require('fcm').FCM;
var dbPool = require('../models/common').dbPool;
var async = require('async');

function selectRegistrationToken(receiver_id, callback) {
    var sql_selectRegistrationToken = 'SELECT * FROM user WHERE id = ?';


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_selectRegistrationToken, [receiver_id], function(err, results) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, results[0].registration_token);
        })
    });
}

function insertNotification(param, callback) {
    var sql_insert_notification = 'INSERT INTO notification(sender_id, receiver_id, message, data_pk, type) ' +
                                   'VALUES (?, ?, ?, ?, ?)';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        console.log('------------------isnertNoti로 들어옴');
        console.log(param);
        dbConn.query(sql_insert_notification, [param.sender_id, param.receiver_id, param.message, param.data_pk, param.type], function (err) {
            dbConn.release();
            if (err) {
                return callback(err);
            }

            console.log(param.message);

            var fcm = new FCM(process.env.FCM_API_KEY);
            console.log(process.env.FCM_API_KEY);
            console.log(param.receiver_registration_token);

            var type = '\'' + param.type + '\'';
            var message = {
                registration_id: param.receiver_registration_token, // required
                'data.type': param.type.toString()
            };
            console.log('message 생성 완료');
            console.log('\'' + param.type + '\'');
            console.log(type);

            fcm.send(message, function(err, messageId) {
                if (err) {
                    return callback(err);
                }
                console.log(messageId);
                callback(null, messageId);
            });
        });
    });
}

// param에 필요한 정보
// param_sender_id = req.user.id
// param_sender_registration_token = req.user.registration_token -- 필요없음
// param.receiver_id = 해당 게시물에 대한 singer or customer id
// param.message = type에 따라 내가 만들어 줘야 하는 message
// param.data_pk = 해당 게시물에 대한 id
// param.type = 게시물에 대한 type
function notify(input, callback) {
    var param = input;

    console.log(param);
    console.log('-------------------------------notify 들어옴');

        selectRegistrationToken(param.receiver_id, function(err, result) {
            console.log('-------------------------------토큰 얻어옴');
            console.log(result);

            if (err) {
                return callback(err);
            }

            console.log('1');
            var text;
            if (param.type < 11) {
                text = ' 님과의 새로운 예약이 생성되었습니다.';
            } else if (param.type < 50) {
                text = ' 님과의 예약정보가 변경되었습니다.';
            } else if (param.type === 50) {
                text = ' 님이 회원님의 동영상을 찜했습니다.';
            } else {
                text = ' 님이 회원님의 리뷰를 작성했습니다.';
            }
            console.log('2');

            param.receiver_registration_token = result;
            param.message = param.sender_name + text;
            console.log('3');

            console.log('-------------------------------insertNotification 호출직전');
            insertNotification(param, function(err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
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