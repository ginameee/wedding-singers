/**
 * Created by Chun on 2016-09-09.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');

/* 레지스트레이션 토큰 가져오기 */
// function selectRegistrationToken(param, callback) {
//     var sql_selectRegistrationToken =
//         'select registration_token ' +
//         'from user ' +
//         'where id = ?';
//
//     dbPool.getConnection(function(err, dbConn) {
//         if (err) {
//             return callback(err);
//         }
//         dbConn.query(sql_selectRegistrationToken, [param.receiver], function(err, results) {
//             if (err) {
//                 return callback(err);
//             }
//             callback(null, results[0]);
//         })
//     });
// }

/* 채팅 메시지 저장 */
function insertChattingLog(param, callback) {
    var sql_insertChattingLog = 'INSERT INTO chatting (message, sender, receiver)' +
                                'VALUES (?, ?, ?)';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_insertChattingLog, [param.message, param.sender, param.receiver], function(err, results) {
            if (err) {
                return callback(err);
            }
            callback(null);
        })
    });
}
/* 채팅 메시지 수신 */
function getChattingLog(data, callback) {
    var sql_selectChattingLog =
        'select id, sender, receiver, message, write_dtime ' +
        'from chatting ' +
        'where write_dtime < CURRENT_TIMESTAMP and receiver = ? and receipt = 0';
    var sql_updateChattingLog =
        'update chatting ' +
        'set receipt = 1 ' +
        'where id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            var log = [];
            dbConn.query(sql_selectChattingLog, [data.receiver], function(err, results) {
                if (err) {
                    dbConn.release();
                    return callback(err);
                }
                async.each(results, function(item, done) {
                    log.push({
                        message: item.message,
                        date: item.date
                    });
                    dbConn.query(sql_updateChattingLog, [item.id], function(err, result) {
                        if (err) {
                            dbConn.release();
                            return callback(err);
                        }
                        done(null);
                    });
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                });
                dbConn.commit(function() {
                    callback(null, log);
                });
            });
        });
    });
}

// module.exports.selectRegistarionToken = selectRegistrationToken;
module.exports.insertChattingLog = insertChattingLog;
module.exports.getChattingLog = getChattingLog;