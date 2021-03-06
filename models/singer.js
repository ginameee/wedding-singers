/**
 * Created by Tacademy on 2016-08-24.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');
var path = require('path');
var async = require('async');

// HTTPS PUT /singers/me 요청에서 Singer 프로필 수정 시 수행되는 함수
function updateSinger(singer, callback) {
    var sql_update_singer = 'UPDATE singer ' +
                            'SET comment = ?, description = ?, standard_price = ?, special_price = ?, location = ?, composition = ?, theme = ? ' +
                            'WHERE user_id = ?';
    var sql_select_singer_song = 'SELECT id, song FROM singer_song WHERE singer_user_id = ?';
    var sql_insert_singer_song = 'INSERT INTO singer_song(song, singer_user_id) VALUES(?, ?)';
    var sql_delete_singer_song = 'DELETE FROM singer_song WHERE singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            async.series([registerSingerInfo, registerSingerSong], function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null);
                })
            });
        });

        function registerSingerInfo(cb) {
            dbConn.query(sql_update_singer, [singer.comment, singer.description, singer.standard_price, singer.special_price, singer.location, singer.composition, singer.theme, singer.user_id], function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }

        function registerSingerSong(cb) {
            dbConn.query(sql_select_singer_song, [singer.user_id], function(err, results) {
                if (err) {
                    return cb(err);
                }

                if (results.length !== 0 ) {
                    dbConn.query(sql_delete_singer_song, [singer.user_id], function(err) {
                        if (err) {
                            return cb(err);
                        }
                    });
                }

                async.each(singer.songs, function (item, done) {
                    dbConn.query(sql_insert_singer_song, [item, singer.user_id], function(err) {
                        if (err) {
                            return done(err);
                        }
                        done(null);
                    })
                }, function(err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null);
                });
            });
        }
    });
}


// HTTPS GET /singers/me 요청에서 Singer가 자신의 마이페이지 조회 시 수행되는 함수
// HTTP GET /singers/:sid : Singer 프로필 조회
function findSingerById(id, callback) {
    var sql_select_singer = 'SELECT * FROM user u JOIN singer s ON (s.user_id = u.id) WHERE u.id = ?';
    var sql_select_songs = 'SELECT song title FROM singer_song WHERE singer_user_id = ?';

    var singer = {};

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        async.parallel([selectSinger, selectSingerSongs], function(err) {
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

                singer.user_id = results[0].user_id;
                singer.email = results[0].email || '';
                singer.name = results[0].name;
                singer.comment = results[0].comment || '';
                singer.description = results[0].description || '';
                singer.standard_price = parseInt(results[0].standard_price || 0 );
                singer.special_price = parseInt(results[0].special_price || 0);
                singer.composition = parseInt(results[0].composition || 0);
                singer.location = parseInt(results[0].location || 0);
                singer.theme = parseInt(results[0].theme || 0);
                singer.penalty = parseInt(results[0].penalty);
                // singer.photoURL = path.join('http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com','images/',path.basename(results[0].photoURL));
                singer.photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/' + path.basename(results[0].photoURL);

                cb(null);
            });
        }

        function selectSingerSongs(cb) {
            var songs = [];
            dbConn.query(sql_select_songs, [id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }
                async.each(results, function(item, done) {
                    songs.push(item.title);
                    done(null);
                }, function(err) {
                    if (err) {
                        dbConn.release();
                        return cb(err);
                    }
                    singer.songs = songs;
                    cb(null);
                });
            });
        }
    });
}


// HTTP GET /singers/me/holidaies 요청에서 Singer 휴일 조회 시 수행되는 함수
function findSingerHolidays(userId, callback) {
    var holidays = [];

    var sql_select_holiday = 'SELECT date_format(CONVERT_TZ(holiday, \'+00:00\', \'+09:00\'), \'%Y-%m-%d\') holiday ' +
                              'FROM singer_holiday ' +
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
            async.each(results, function(item, done) {
                holidays.push(item.holiday);
                done(null);
            }, function(err) {
                if (err) {
                    return callback(err);
                }
                callback(null, holidays);
            });
        });
    });
}


// HTTP PUT /singers/me/holidaies 요청에서 Singer 휴일 변경 시 수행되는 함수
function registerSingerHolidays(singer, callback) {
    var sql_insert_holiday = 'INSERT INTO singer_holiday(holiday, singer_user_id) ' +
                              'VALUES (str_to_date(?, \'%Y-%m-%d\'), ?)';
    var sql_select_holiday = 'SELECT * FROM singer_holiday ' +
                              'WHERE holiday = str_to_date(?, \'%Y-%m-%d\') AND singer_user_id = ?';
    var sql_delete_holiday = 'DELETE FROM singer_holiday ' +
                              'WHERE holiday = str_to_date(?, \'%Y-%m-%d\') AND singer_user_id = ?';

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
                    dbConn.query(sql_delete_holiday,[item, singer.user_id], function(err, result) {
                        if (err) {
                            dbConn.release();
                            return cb(err);
                        }
                        return cb(null, result);
                   });
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
        callback(null);
    });
}


module.exports.updateSinger = updateSinger;
module.exports.findSingerById = findSingerById;
module.exports.findSingerHolidays =  findSingerHolidays;
module.exports.registerSingerHolidays = registerSingerHolidays;