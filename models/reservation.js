/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');
var path = require('path');



// 예약을 등록할 때 사용하는 함수
function registerReservation(reservation, callback) {
    var sql_insert_reservation = 'INSERT INTO reservation(place, demand, reservation_dtime, write_dtime, singer_user_id, customer_user_id, type, song) ' +
                                  'VALUES(?, ?,  str_to_date(?, \'%Y-%m-%d %T\'), str_to_date(?, \'%Y-%m-%d\'), ?, ?, ?, ?)';


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_insert_reservation, [reservation.place, reservation.demand, reservation.r_dtime, reservation.w_dtime, reservation.sid, reservation.cid, reservation.type, reservation.song], function(err, result) {
            if (err) {
                return callback(err);
            }
            callback(null, result.insertId);
        });
    });
}


// 자신의 예약목록을 확인하고자 할때 사용하는 함수
function findReservationListOfUser(user, callback) {
    var reservation = {};
    var sql_select_all_reservation = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song  ' +
                                      'FROM reservation WHERE (customer_user_id = ? or singer_user_id = ?) AND status != 30';
    // var sql_select_wait_reservation = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song  ' +
    //                                   'FROM reservation WHERE singer_user_id = ? AND status = 10';
    var sql_select_completed_reservation = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song FROM reservation WHERE (customer_user_id = ? or singer_user_id = ?) AND status = 30';
    var sql_user_info = 'SELECT name, photoURL FROM user WHERE id = ?';
    var sql_select_reservation_by_date = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song  FROM reservation WHERE (customer_user_id = ? OR singer_user_id = ?) AND (year(reservation_dtime) = ? AND month(reservation_dtime) = ?) AND status = 30';
    var sql_select_reservation_date = 'SELECT date_format(reservation_dtime, \'%Y-%m-%d\') reservations FROM reservation WHERE singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        var sql_select_reservation;

        // 전체목록의 경우
        if (user.tab === 1) {
            // if (user.type === 1) {
            //     sql_select_reservation = sql_select_wait_reservation;
            // } else {
                sql_select_reservation = sql_select_all_reservation;
            // }
        } else { // 완료된 예약목록 검색의 경우
            sql_select_reservation = sql_select_completed_reservation;
        }

        // 싱어의 일정관리 일 경우
        if (user.month) {
            sql_select_reservation = sql_select_reservation_by_date;
        }

        // 고객의 특정 싱어의 예약현황을 열람하고 싶을 때,
        if (user.date) {
            var reservations = [];
            sql_select_reservation = sql_select_reservation_date;

            dbConn.query(sql_select_reservation, [user.id], function(err, results) {
                dbConn.release();
                if (err) {
                   return callback(err);
               }

                async.each(results, function(item, done) {
                    reservations.push(item.reservations);
                    done(null);
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, reservations);
                });
            });
        } else {
            dbConn.query(sql_select_reservation, [user.id, user.id, user.year, user.month], function(err, results) {
                if (err) {
                    dbConn.release();
                    return callback(err);
                }
                
                async.map(results, addUserInfo, function(err, results) {
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, results);
                });
            });
        }


        function addUserInfo(item, cb) {
            var param1 = 'customer';
            var param2 = 'singer';
            // 싱어일 때
            if (user.type === 1) {
                param1 = 'singer';
                param2 = 'customer';
            }

            item[param1+'_name'] = user.name;
            item[param1+'_photoURL'] = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(user.photoURL);

            dbConn.query(sql_user_info, [item[param2+'_user_id']], function(err, results) {
                if (err) {
                    return cb(err);
                }
                item[param2+'_name'] = results[0].name;
                item[param2+'_photoURL'] = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(results[0].photoURL);

                cb(null, item);
            });
        }
    });
}


function findReservationById(user, callback) {
    var sql_select_reservation = 'SELECT r.id id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d %h:%m\') reservation_dtime, date_format(write_dtime, \'%Y-%m-%d %h:%m\') write_dtime, date_format(payment_dtime, \'%Y-%m-%d %h:%m\')  payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song, special_price, standard_price ' +
                                  'FROM reservation r JOIN singer s ON (r.singer_user_id = s.user_id) ' +
                                  'WHERE id = ?';
    var sql_user_info = 'SELECT name, photoURL FROM user WHERE id = ?';

    var reservation = {};

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_reservation, [user.reservation_id], function(err, results) {

            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (results.length == 0) {
                dbConn.release();
                return callback(null, null);
            }

            reservation.singer_id = results[0].singer_user_id;
            reservation.customer_id = results[0].customer_user_id;
            reservation.place = results[0].place;
            reservation.demand = results[0].demand;
            reservation.song = results[0].song;
            reservation.type = results[0].type;
            reservation.reservation_dtime = results[0].reservation_dtime;


            if (user.type === 1) {
                reservation.singer_name = user.name;
                reservation.singer_photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(user.photoURL);

                dbConn.query(sql_user_info, [reservation.customer_id], function(err, results) {
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }

                    reservation.customer_name = results[0].name;
                    reservation.customer_photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(results[0].photoURL);
                    return callback(null, reservation);

                });
            } else {
                reservation.customer_name = user.name;
                reservation.customer_photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(user.photoURL);

                dbConn.query(sql_user_info, [reservation.singer_id], function(err, results) {
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }
                    
                    reservation.singer_name = results[0].name;
                    reservation.singer_photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(results[0].photoURL);
                    return callback(null, reservation);
                });
            }
        });
    });
}


function updateReservation(param, callback) {


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err)
        }

        var task = [];
        task.push(updateReservation);
        if (param.type === 31) {
            task.push(updatePenalty);
        }
        console.log(task);

        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            async.series(task, function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function() {
                    dbConn.release();
                    callback(null);
                });
            })
        });

        function updateReservation(cb) {
            var sql_update_resevation = 'UPDATE reservation ' +
                                         'SET status = ? ' +
                                         'WHERE id = ?';
            dbConn.query(sql_update_resevation, [param.type, param.rid], function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }

        function updatePenalty(cb) {
            var sql_update_penalty = 'UPDATE singer ' +
                                     'SET penalty = penalty + 100 ' +
                                     'WHERE user_id = ?';

            dbConn.query(sql_update_penalty, [param.user_id], function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }
    });
}


function deleteReservation(rid, callback) {
    var sql_delete_reservation = 'DELETE FROM reservation WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_delete_reservation, [rid], function(err) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, rid + ' Reservation data has removed!!! By CronJob');
        });
    });
}
module.exports.registerReservation = registerReservation;
module.exports.findReservationListOfUser = findReservationListOfUser;
module.exports.findReservationById = findReservationById;
module.exports.updateReservation = updateReservation;
module.exports.deleteReservation = deleteReservation;