/**
 * Created by Tacademy on 2016-08-24.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');


function updateSinger(singer, callback) {
    var sql_update_singer = 'UPDATE singer ' +
                            'SET comment = ?, description = ?, standard_price = ?, special_price = ?, ' +
                            'composition = ?, theme = ? ' +
                            'WHERE user_id = ?';
    var sql_update_singer_songs = 'INSERT INTO singer_song(song, singer_user_id) VALUES(?, ?)';
    var sql_delete_singer_songs = 'DELETE FROM singer_song WHERE singer_user_id = ?';


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function (err) {
            if (err) {
                return callback(err);
            }

            async.series([deleteSingerSong, insertSingerSongs, updateSingerInfo], function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null);
                });
            });
        });

        function insertSingerSongs(callback) {
            async.each(singer.songs, function(item, cb) {
                dbConn.query(sql_update_singer_songs, [item, singer.user_id], function(err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, true);
                });
            });
            callback(null);
        }

        function updateSingerInfo(cb) {
            dbConn.query(sql_update_singer, [singer.comment, singer.description, singer.standard_price, singer.special_price, singer.composition, singer.theme, singer.user_id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, result);
            });
        }

        function deleteSingerSong(cb) {
            dbConn.query(sql_delete_singer_songs, singer.user_id, function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }
    });
}


function findSingerById(singer, callback) {
    var sql_select_singer = 'SELECT * FROM user u JOIN singer s WHERE u.id = ?';
    var sql_select_songs = 'SELECT * FROM singer_song WHERE singer_user_id = ?';

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
            dbConn.query(sql_select_singer, [singer.user_id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }
                singer.email = results[0].email || '';
                singer.comment = results[0].comment || '';
                singer.description = results[0].description || '';
                singer.standard_price = parseInt(results[0].standard_price || 0 );
                singer.special_price = parseInt(results[0].special_price || 0);
                singer.composition = parseInt(results[0].theme || 0);
                singer.penalty = parseInt(results[0].penalty);
                cb(null, true);
            });
        }

        function selectSingerSongs(cb) {
            dbConn.query(sql_select_songs, [singer.user_id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return cb(err);
                }
                singer.songs = results;
                cb(null, true);
            });
        }
    });
}

function findSingerHolidaies(userId, callback) {
    callback(null, true);
}

function updateSingerHolidaies(userId, callback) {
    callback(null, true);
}


module.exports.updateSinger = updateSinger;
module.exports.findSingerById = findSingerById;
module.exports.findSingerHolidaies =  findSingerHolidaies;
module.exports.updateSingerHolidaies = updateSingerHolidaies;