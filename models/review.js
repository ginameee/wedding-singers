/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');
var path = require('path');

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

            if (!results[0]) {
                return callback(null, 1)
            }
            else if (results[0].customer_user_id !== review.customer_id) {
                return callback(null, 1);
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
                dbConn.query(sql_insert_review, [review.customer_id, results[0].singer_user_id, review.point, review.content, review.write_dtime], function(err) {
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

function selectReviewByUser(select, callback) {

    var sql_select_review_all = 'SELECT id, customer_user_id, singer_user_id, point, content, date_format(write_dtime, \'%Y-%m-%d\') write_dtime ' +
                                 'FROM review WHERE ?';
    var sql_select_review_sum = 'SELECT COUNT(*) review_cnt, ROUND(AVG(point), 1) review_point FROM review WHERE ?';
    var sql_select_user_info = 'SELECT * FROM user WHERE id = ?';


    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }

        var sql_select_review = sql_select_review_all;
        if (select.rating) sql_select_review = sql_select_review_sum;
        dbConn.query(sql_select_review, [select[0]], function (err, results_review) {

            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (select.rating) {
                dbConn.release();
                return callback(null, results_review[0]);
            }

            async.map(results_review, function (item, done) {
                var user_info = {};

                if (select.type == 1) {
                    user_info.id = item.customer_user_id;
                    user_info.param = 'customer_';
                } else {
                    user_info.id = item.singer_user_id;
                    user_info.param = 'singer_';
                }

                dbConn.query(sql_select_user_info, [user_info.id], function (err, results_user) {
                    if (err) {
                        return done(err);
                    }

                    item[user_info.param + 'name'] = results_user[0].name;
                    item[user_info.param + 'photoURL'] = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com' + '\/images\/'  + path.basename(results_user[0].photoURL);
                    done(null, item);
                });
            }, function(err, results) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }
                callback(null, results);
            });
        });
    });
}

module.exports.registerReview = registerReview;
module.exports.selectReviewByUser = selectReviewByUser;