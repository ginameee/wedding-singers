/**
 * Created by Tacademy on 2016-08-24.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');

// HTTP GET /videos/me 에서 싱어가 자신이 게시한 동영상을 찾을 때 사용되는 함수
function findVideoByUserId(uid, callback) {
    var sql_select_video = 'SELECT * FROM video WHERE singer_user_id = ?';
    var sql_select_video_hash = 'SELECT tag FROM video_hash WHERE video_id = ?';
    console.log('findVideoByUserId 호출');

    var videos = [];

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_video, [uid], function(err, results) {
            console.log('쿼리문 수행');
            if (err) {
                dbConn.release();
                return callback(err);
            }

            async.each(results, function(item, done) {
                console.log('이치쿼리문수행');
                dbConn.query(sql_select_video_hash, [item.id],function(err, results) {
                    if (err) {
                        dbConn.release();
                        return done(err);
                    }
                    item.hash = results;
                    videos.push(item);
                    done(null);
                });
            }, function(err) {
                console.log('done 콜백 수행');
                if (err) {
                    dbConn.release();
                    return callback(err);
                }
                console.log({ videos: videos});
                callback(null, videos);
                dbConn.release();
            });
        });
    });
}


function findVideoById(id, callback) {
    var sql_select_video = 'SELECT * FROM video v JOIN user u ON (v.singer_user_id = u.id) WHERE v.id = ?';
    var video = {};

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_video, [id], function(err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            video.title = results[0].title;
            video.hit = results[0].hit;
            video.favorite_cnt = results[0].favorite_cnt;
            video.url = results[0].url;
            video.write_dtime = results[0].write_dtime;
            video.singer_name = results[0].name;
            video.singer_id = results[0].singer_user_id;

            callback(null, video);
        });
    });
}


function findVideoByFilter(search, callback) {
    var sql = [];
    sql.push('SELECT * ' +
             'FROM video v JOIN singer s ON (v.singer_user_id = s.user_id) ' +
                           'RIGHT JOIN video_hash vh ON (v.id = vh.video_id) '+
             'WHERE standard_price > ? AND ? ');
    sql.push('SELECT * ' +
             'FROM video v JOIN singer s ON (v.singer_user_id = s.user_id) ' +
                          'RIGHT JOIN video_hash vh ON (v.id = vh.video_id) '+
             'WHERE standard_price > ? AND ? AND ? ');
    sql.push('SELECT * ' +
             'FROM video v JOIN singer s ON (v.singer_user_id = s.user_id) ' +
                          'RIGHT JOIN video_hash vh ON (v.id = vh.video_id) '+
             'WHERE standard_price > ? AND ? AND ? AND ?');
    sql.push('SELECT * ' +
             'FROM video v JOIN singer s ON (v.singer_user_id = s.user_id) ' +
                          'RIGHT JOIN video_hash vh ON (v.id = vh.video_id) '+
             'WHERE standard_price > ? AND ? AND ? AND ? AND ?');

    var filter = [];
    filter.push(search.price);

    async.each(search, function(item, done) {
        if (item[Object.keys(item).toString()] !== 0) {
            filter.push(item);
            done(null);
        } else {
            done(null);
        }
    }, function(err) {
        if (err) {
            return callback(err);
        }
        console.log(filter);
        console.log(filter.length);
        console.log(sql[(filter.length)-3]);
        dbPool.getConnection(function(err, dbConn) {
            if (err) {
                return callback(err);
            }
            dbConn.query(sql[(filter.length)-2], filter, function(err, results) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }
                callback(null, results);
            });
        });
    });
}


function updateVideo(video, callback) {

    // DB풀에서 객체 얻어오기
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        // 쿼리문 수행
        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            async.series([updateVideoInfo, deleteVideoHash, insertVideoHash], function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null, true);
                });
            });
        });

        function updateVideoInfo(cb) {
            var sql_update_video = 'UPDATE video SET title = ?, url = ? WHERE id = ?';

            dbConn.query(sql_update_video, [video.title, video.url, video.id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                return cb(null, true);
            });
        }

        function deleteVideoHash(cb) {
            var sql_delete_video_hash = 'DELETE FROM video_hash WHERE video_id = ?';

            dbConn.query(sql_delete_video_hash, [video.id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                return cb(null, true);
            });
        }

        function insertVideoHash(cb) {
            var sql_insert_video_hash = 'INSERT INTO video_hash(video_id, tag) VALUES(?, ?)';

            async.each(video.hash, function(item, callback) {
                dbConn.query(sql_insert_video_hash, [video.id, item], function(err, result) {
                    if (err) {
                        return cb(err);
                    }
                    callback(null, true);
                })
            });
            cb(null, true);
        }
    });
}


function insertVideo(video, callback) {
    //query 작성 ( video에 삽입, video_hash테이블에 삽입, 2개의 쿼리필요)
    var sql_insert_video = 'INSERT INTO video(singer_user_id, title, url, write_dtime) ' +
                            'VALUES (?, ?, ?, str_to_date(?, \'%Y-%m-%d\'))';
    var sql_insert_video_hash = 'INSERT INTO video_hash(video_id, tag) ' +
                                 'VALUES (?, ?)';

    // DB풀에서 객체 얻어오기
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        //하나의 트랜잭션으로 묶기
        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            // 하나의 series로 묶어서 병렬로 처리하기
            async.series([insertVideoInfo, insertVideoHash], function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null, true);
                });
            });
        });

        // video테이블 데이터넣기
        function insertVideoInfo(cb) {
            dbConn.query(sql_insert_video, [video.singer_user_id, video.title, video.url, video.write_dtime], function(err, result) {
                if (err) {
                    return cb(err);
                }
                video.id = result.insertId;
                cb(null, true);
            });
        }


        // async.each를 이용해서 hash의 수만큼 반복해서 video_hash테이블에 데이터 넣을 것
        function insertVideoHash(cb) {
            async.each(video.hash, function(item, callback) {
                dbConn.query(sql_insert_video_hash, [video.id, item], function(err, result) {
                    if (err) {
                        dbConn.release();
                        return callback(err);
                    }
                    callback(null, true);
                });
            });
            cb(null, true);
        }
    });
}


function listVideo(type, callback) {
    var sql_select_new_videos = 'SELECT v.id id, u.name singer_name, title, hit, favorite_cnt, url, write_dtime ' +
                                'FROM video v JOIN user u ON (v.singer_user_id = u.id) ' +
                                'ORDER BY write_dtime DESC';
    var sql_select_popular_videos = 'SELECT v.id id, u.name singer_name, title, hit, favorite_cnt, url, write_dtime ' +
                                     'FROM video v JOIN user u ON (v.singer_user_id = u.id) ' +
                                     'ORDER BY favorite_cnt DESC';
    var sql_select_videos;
    if (type === 1) {
        sql_select_videos = sql_select_popular_videos;
    } else {
        sql_select_videos = sql_select_new_videos;
    }

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            callback(err);
        }

        dbConn.query(sql_select_videos, [], function(err, results) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    });
}

// HTTP DELETE /videos/:vid 에서 호출할 동영상을 지우는 함수
function deleteVideo(vid, callback) {

    // dbConn 객체 얻어오기
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function(err) {
            if (err) {
                return callback(err);
            }

            async.series([deleteVideoHash, deleteVideoInfo], function (err) {
                if (err) {
                    return dbConn.rollback(function () {
                        callback(err);
                        dbConn.release();
                    });
                }
                dbConn.commit(function () {
                    callback(null);
                    dbConn.release();
                });
            });
        });

        function deleteVideoHash(cb) {
            var sql_delete_video_hash = 'DELETE FROM video_hash WHERE video_id = ?';

            dbConn.query(sql_delete_video_hash, [vid], function(err, result) {
                if (err) {
                    return cb(err);
                }
                return cb(null, true);
            });
        }

        function deleteVideoInfo(cb) {
            var sql_delete_video = 'DELETE FROM video WHERE id = ?';

            dbConn.query(sql_delete_video, [vid], function(err, result) {
                if (err) {
                    return cb(err);
                }
                return cb(null, true);
            });
        }
    });

}


module.exports.findVideoById = findVideoById;
module.exports.findVideoByFilter = findVideoByFilter;
module.exports.updateVideo = updateVideo;
module.exports.insertVideo = insertVideo;
module.exports.listVideo = listVideo;
module.exports.findVideoByUserId = findVideoByUserId;
module.exports.deleteVideo = deleteVideo;

