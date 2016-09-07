/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('./common').dbPool;
var async = require('async');

//POST /favorites 에서 호출할 찜 생성 함수
function insertFavorite(favorite, callback) {
    // 찜 삽입, 해당 동영상 좋아요 수 증가

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function(err) {
            if (err) {
                return callback(err);
            }

            async.parallel([insertFavoriteInfo, updateFavoriteCnt], function (err) {
                if (err) {
                    return dbConn.rollback(function() {
                        callback(err);
                        dbConn.release();
                    });
                }

                dbConn.commit(function() {
                    callback(null);
                    dbConn.release();
                });
            });

        });

        function insertFavoriteInfo(cb) {
            var sql_insert_favorite = 'INSERT INTO favorite(video_id, customer_user_id) VALUES(?, ?)';
            dbConn.query(sql_insert_favorite, [favorite.vid, favorite.uid], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, true);
            });
        }

        function updateFavoriteCnt(cb) {
            var sql_update_video = 'UPDATE video SET favorite_cnt = favorite_cnt + 1 WHERE id = ?';
            dbConn.query(sql_update_video, [favorite.vid], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, true);
            })
        }

    });
}


// DELETE /favorites에서 호출할 찜 삭제 함수
function deleteFavorite(info, callback) {
    var sql_delete_favorite = 'DELETE FROM favorite ' +
                              'WHERE video_id = ? AND customer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_delete_favorite, [info.vid, info.uid], function(err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, true);
        });
    });
}


//GET /favorites에서 호출할 찜 조회 함수
function findFavoriteByUser(info, callback) {
    var sql_select_favorite = 'SELECT v.id id, u.name singer_name, u.id singer_id, title, hit, favorite_cnt, url, v.write_dtime write_dtime ' +
                              'FROM favorite f JOIN video v ON (f.video_id = v.id) ' +
                                              'JOIN user u ON (v.singer_user_id = u.id) ' +
                              'WHERE f.customer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        dbConn.release();
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_select_favorite, [info.uid], function(err, results) {
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    });
}

module.exports.insertFavorite = insertFavorite;
module.exports.findFavoriteByUser = findFavoriteByUser;
module.exports.deleteFavorite = deleteFavorite;
