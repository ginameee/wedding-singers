/**
 * Created by Chun on 2016-09-09.
 */
var logger = require('../common/logger');
var FCM = require('fcm').FCM;
var dbPool = require('../models/common').dbPool;
var async = require('async');
var path = require('path');

function selectRegistrationToken(receiver_id, callback) {
    console.log('---------------------selectRegistrationToken');
    var sql_selectRegistrationToken = 'SELECT * FROM user WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_selectRegistrationToken, [receiver_id], function(err, results) {
            dbConn.release();
            if (err) {
                return callback(err);
            } else if (results.length == 0) {
                console.log('토큰못찾음');
                return callback(new Error('Can\'t get a registration token of receiver'));
            }
            console.log('토큰찾음');
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
        dbConn.query(sql_insert_notification, [param.sender_id, param.receiver_id, param.message, param.data_pk, param.type], function (err) {
            console.log('db 삽입완료');
            dbConn.release();
            if (err) {
                return callback(err);
            }


            var fcm = new FCM(process.env.FCM_API_KEY);
            console.log(process.env.FCM_API_KEY);
            console.log(param.receiver_registration_token);

            var message = {
                registration_id: param.receiver_registration_token, // required
                'data.type': param.type.toString()
            };

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

        selectRegistrationToken(param.receiver_id, function(err, result) {

            if (err) {
                return callback(err);
            }

            console.log('1');
            var text;
            if (param.type < 11) {
                text = ' 님과의 새로운 예약이 생성되었습니다.';
                param.message = param.sender_name + text;
            } else if (param.type < 50) {
                text = ' 님과의 예약정보가 변경되었습니다.';
                param.message = param.sender_name + text;
            } else if (param.type === 50) {
                text = ' 님이 회원님의 동영상을 찜했습니다.';
                param.message = param.sender_name + text;
            } else if (param.type === 60) {
                text = ' 님이 회원님의 리뷰를 작성했습니다.';
                param.message = param.sender_name + text;
            } else {
                param.message = param.message;
            }
            console.log('2');

            param.receiver_registration_token = result;

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

function selectNotification(param, callback) {
    var sql_select_notification_all = 'SELECT sender_id, s_u.photoURL sender_photoURL, ' +
                                              'receiver_id, r_u.photoURL receiver_photoURL, ' +
                                              'message, data_pk, n.type type, flag, date_format(write_dtime, \'%Y-%m-%d %T\') write_dtime ' +
                                       'FROM notification n JOIN user r_u ON (n.receiver_id = r_u.id) ' +
                                                       'JOIN user s_u ON (n.sender_id = s_u.id) ' +
                                       'WHERE receiver_id = ?';
    var sql_select_notification_flag = 'SELECT sender_id, s_u.photoURL sender_photoURL, receiver_id, ' +
                                               'r_u.photoURL receiver_photoURL, message, data_pk, n.type type, flag, date_format(write_dtime, \'%Y-%m-%d %T\') write_dtime ' +
                                        'FROM notification n JOIN user r_u ON (n.receiver_id = r_u.id) ' +
                                                            'JOIN user s_u ON (n.sender_id = s_u.id) ' +
                                        'WHERE receiver_id = ? AND flag = 0';

    var sql_update_notification = 'UPDATE notification ' +
                                   'SET flag = 1 ' +
                                   'WHERE receiver_id = ? AND flag = 0';

    var sql_select_notification = sql_select_notification_all;

    if (param.flag) {
        sql_select_notification = sql_select_notification_flag;
    }

    dbPool.getConnection(function(err, dbConn){
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_notification, [param.uid], function(err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (param.flag) {
                dbConn.query(sql_update_notification, [param.uid], function(err) {
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, results);
                });
            } else {
                dbConn.release();
                callback(null, results);
            }
        });
    });
}

function getChattingLog(receiver_id, callback) {
    var sql_select_chatting = 'SELECT sender_id, name sender_name, email sender_email, photoURL sender_photoURL, message, date_format(convert_tz(write_dtime, \'+00:00\', \'+09:00\'), \'%Y-%m-%d %T\') write_dtime ' +
                              'FROM notification n JOIN user u ON (n.sender_id = u.id) ' +
                              'WHERE n.type = 70 AND receiver_id = ? AND flag = 0';

    var sql_update_chatting = 'UPDATE notification ' +
                               'SET flag = 1 ' +
                               'WHERE receiver_id = ? AND flag = 0 AND type = 70';

    console.log('dbConn 받아오기 전');
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_chatting, [receiver_id], function(err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            dbConn.query(sql_update_chatting, [receiver_id], function(err) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }
                
                async.map(results, function(item, cb) {
                    var result = {};
                    result.sender = {};
                    result.sender.id = item.sender_id;
                    result.sender.userName = item.sender_name;
                    result.sender.email = item.sender_email;
                    result.sender.photoURL =  'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(item.sender_photoURL);
                    result.message = item.message;
                    result.date = item.write_dtime;

                    cb(null, result);

                }, function(err, results) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, results);
                });
            });
        });
    });
}

module.exports.notify = notify;
module.exports.selectRegistrationToken = selectRegistrationToken;
module.exports.selectNotification = selectNotification;
module.exports.getChattingLog = getChattingLog;