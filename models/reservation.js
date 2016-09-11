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
            callback(null, result);
        });
    });
}


// 자신의 예약목록을 확인하고자 할때 사용하는 함수
function findReservationListOfUser(user, callback) {
    var reservation = {};
    var sql_select_all_reservation = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song  ' +
                                      'FROM reservation WHERE customer_user_id = ? or singer_user_id = ? AND status != 30';
    var sql_select_completed_reservation = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song FROM reservation WHERE (customer_user_id = ? or singer_user_id = ?) AND status = 30';
    var sql_user_info = 'SELECT name, photoURL FROM user WHERE id = ?';
    var sql_select_reservation_by_date = 'SELECT id, place, demand, date_format(reservation_dtime, \'%Y-%m-%d\') reservation_dtime, date_format(payment_dtime, \'%Y-%m-%d\') payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song  FROM reservation WHERE (customer_user_id = ? OR singer_user_id = ?) AND (year(reservation_dtime) = ? AND month(reservation_dtime) = ?) AND status = 30';
    var sql_select_reservation_date = 'SELECT date_format(reservation_dtime, \'%Y-%m-%d\') reservations FROM reservation WHERE singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        var sql_select_reservation;

        // 전체목록
        if (user.tab === 1) {
            sql_select_reservation = sql_select_all_reservation;
        } else {
            sql_select_reservation = sql_select_completed_reservation;
        }

        // 완료된 예약 목록
        if (user.month) {
            sql_select_reservation = sql_select_reservation_by_date;
        }

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
            item[param1+'_photoURL'] = user.photoURL;

            dbConn.query(sql_user_info, [item[param2+'_user_id']], function(err, results) {
                if (err) {
                    return cb(err);
                }
                item[param2+'_name'] = results[0].name;
                item[param2+'_photoURL'] = results[0].photoURL;

                cb(null, item);
            });
        }
    });
}


function findReservationById(user, callback) {
    var sql_select_reservation = 'SELECT r.id id, place, demand, reservation_dtime, write_dtime, payment_dtime, payment_method, status, singer_user_id, customer_user_id, type, song, special_price, standard_price ' +
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

            reservation.singer_id = results[0].singer_user_id;
            reservation.customer_id = results[0].customer_user_id;
            reservation.place = results[0].place;
            reservation.demand = results[0].demand;
            reservation.song = results[0].song;
            reservation.type = results[0].type;

            if (user.type === 1) {
                reservation.singer_name = user.name;
                reservation.singer_photoURL = 'http://ec2-52-78-132-224.ap-northeast-2.compute.amazonaws.com/images/'  + path.basename(user.photoURL);

                dbConn.query(sql_user_info, [reservation.customer_id], function(err, results) {
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }
                    reservation.customer_name = results[0].name;
                    reservation.customer_photoURL = results[0].photoURL;
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
                    reservation.singer_photoURL = results[0].photoURL;
                    return callback(null, reservation);
                });
            }
        });
    });
}


function updateReservation(param, callback) {

    var sql_update_resevation = 'UPDATE reservation ' +
                                 'SET status = ? ' +
                                 'WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err)
        }

        dbConn.query(sql_update_resevation, [param.type, param.rid], function(err) {
            dbConn.release();
            if (err) {
                return callback(err);
            }

            callback(null);
        });
    });
}

function deleteAfterTime(param, callback) {
    var sql_delete_reservation = 'DELETE FROM reservation WHERE id = ?';
    var sql_select_reservation = 'SELECT FROM resrvation WHERE id = ?';

    dbPool.getConnection();
    callback(null, 'removed!!!');
}
module.exports.registerReservation = registerReservation;
module.exports.findReservationListOfUser = findReservationListOfUser;
module.exports.findReservationById = findReservationById;
module.exports.updateReservation = updateReservation;
module.exports.deleteAfterTime = deleteAfterTime;