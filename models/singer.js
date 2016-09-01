/**
 * Created by Tacademy on 2016-08-24.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');
var path = require('path');

function updateSinger(singer, callback) {
    var sql_update_singer = 'UPDATE singer ' +
                            'SET comment = ?, description = ?, standard_price = ?, special_price = ?, ' +
                            'composition = ?, theme = ? ' +
                            'WHERE user_id = ?';
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_update_singer, [singer.comment, singer.description, singer.standard_price, singer.special_price, singer.composition, singer.theme, singer.user_id], function(err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    });
}


function findSingerById(id, callback) {
    var sql_select_singer = 'SELECT * FROM user u JOIN singer s ON (s.user_id = u.id) WHERE u.id = ?';
    var sql_select_songs = 'SELECT * FROM singer_song WHERE singer_user_id = ?';

    var singer = {};

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        async.parallel([selectSinger, selectSingerSongs], function(err, result) {
            if (err) {
                return callback(err);
            }
            dbConn.release();
            callback(null, singer);
        });

        function selectSinger(cb) {
            dbConn.query(sql_select_singer, [id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }

                console.log(id);
                console.log(results[0]);

                singer.user_id = results[0].user_id;
                singer.email = results[0].email || '';
                singer.name = results[0].name;
                singer.comment = results[0].comment || '';
                singer.description = results[0].description || '';
                singer.standard_price = parseInt(results[0].standard_price || 0 );
                singer.special_price = parseInt(results[0].special_price || 0);
                singer.composition = parseInt(results[0].theme || 0);
                singer.penalty = parseInt(results[0].penalty);
                singer.photoURL = 'http://ec2-52-78-147-230.ap-northeast-2.compute.amazonaws.com:' + process.env.HTTP_PORT + '/images/'  + path.basename(results[0].photoURL);

                cb(null, true);
            });
        }

        function selectSingerSongs(cb) {
            dbConn.query(sql_select_songs, [id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }
                singer.songs = results;
                cb(null, singer);
            });
        }
    });
}


function findSingerHolidaies(userId, callback) {
    var sql_select_holiday = 'SELECT LEFT(DATE(CONVERT_TZ(holiday, \'+00:00\', \'+09:00\')), 10) holiday FROM singer_holiday ' +
                              'WHERE singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_holiday, [userId], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }
            console.log(results);
            callback(null, results);
        });
    });
}


function updateSingerHolidaies(singer, callback) {
    var sql_insert_holiday = 'INSERT INTO singer_holiday(holiday, singer_user_id) ' +
                              'VALUES (str_to_date(?, \'%Y-%m-%d\'), ?)';
    var sql_select_holiday = 'SELECT * FROM singer_holiday ' +
                              'WHERE holiday = str_to_date(?, \'%Y-%m-%d\') AND singer_user_id = ?';
    // var sql_delete_holiday = 'DELETE FROM singer_holiday ' +
    //                           'WHERE holiday = str_to_date(?, \'%Y-%m-%d\') AND singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        async.each(singer.update_dates, function(item, cb) {
            dbConn.query(sql_select_holiday, [item, singer.user_id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }

                if(results.length > 0) {
                   //  dbConn.query(sql_delete_holiday,[item, singer.user_id], function(err, result) {
                   //      if (err) {
                   //          dbConn.release();
                   //          return cb(err);
                   //      }
                   //      return cb(null, result);
                   // });
                    return cb(null, true);
                } else {
                    dbConn.query(sql_insert_holiday,[item, singer.user_id], function(err, result) {
                        if (err) {
                            dbConn.release();
                            return cb(err);
                        }
                        return cb(null, result);
                    });
                }
            });
        });
        dbConn.release();
        callback(null, true);
    });
}


module.exports.updateSinger = updateSinger;
module.exports.findSingerById = findSingerById;
module.exports.findSingerHolidaies =  findSingerHolidaies;
module.exports.updateSingerHolidaies = updateSingerHolidaies;