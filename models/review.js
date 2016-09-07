/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');

function registerReview(review, callback) {
    var sql_select_reservation = 'SELECT * FROM reservation WHERE id = ?';
    var sql_insert_review = 'INSERT INTO review(customer_user_id, singer_user_id, point, content, write_dtime) ' +
                             ' VALUES (?, ?, ?, ?, str_to_date(?, \'%Y-%m-%d\'))';
    var sql_update_point = 'UPDATE customer ' +
                            'SET point = point + 100 ' +
                            'WHERE user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_reservation, [review.rid], function(err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (results[0].customer_user_id !== review.customer_id) {
                callback(null, 1);
            }
            dbConn.beginTransaction(function(err) {
                if (err) {
                    return callback(err);
                }

                async.parallel([insertReview, updatePoint], function(err) {
                    dbConn.release();

                    if (err) {
                        return dbConn.rollback(function() {
                            callback(err);
                        });
                    }

                    dbConn.commit(function() {
                        callback(null, true);
                    })
                });
            });


            function insertReview(cb) {
                dbConn.query(sql_insert_review, [review.customer_id, review.singer_id, review.point, review.content, review.write_dtime], function(err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null);
                });
            }

            function updatePoint(cb) {
                dbConn.query(sql_update_point, [review.customer_id], function(err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null);
                });
            }
        });
    });
}

function selectReviewBySinger(select, callback) {

    var sql_select_review_all = 'SELECT id, customer_user_id, singer_user_id, point, content, write_dtime ' +
                            'FROM review WHERE singer_user_id = ?';

    var sql_select_review_sum = 'SELECT COUNT(*) review_cnt, AVG(point) review_point FROM review WHERE singer_user_id = ?'

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        var sql_select_review = sql_select_review_all;
        if (select.rating) sql_select_review = sql_select_review_sum;

        dbConn.query(sql_select_review, [select.sid], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }

            callback(null, results);
        });
    });

}

module.exports.registerReview = registerReview;
module.exports.selectReviewBySinger = selectReviewBySinger