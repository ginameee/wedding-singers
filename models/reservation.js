/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('../models/common').dbPool;
var async = require('async');

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
    var sql_select_all_reservation = 'SELECT * FROM reservation WHERE customer_user_id = ? or singer_user_id = ?';
    var sql_select_completed_reservation = 'SELECT * FROM reservation WHERE (customer_user_id = ? or singer_user_id = ?) AND status = 30';
    var sql_user_info = 'SELECT name, photoURL FROM user WHERE id = ?';
    var sql_select_reservation_date = 'SELECT * FROM reservation WHERE (customer_user_id = ? OR singer_user_id = ?) AND (year(reservation_dtime) = ? AND month(reservation_dtime) = ?) AND status = 30';
    // var sql_select_reservation_date = 'SELECT date_format(reservation_dtime, \'%Y-%m-%d\') reservations FROM reservation WHERE singer_user_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        var sql_select_reservation;
        if (user.tab === 1) {
            sql_select_reservation = sql_select_all_reservation;
        } else {
            sql_select_reservation = sql_select_completed_reservation;
        }

        if (user.month) {
            sql_select_reservation = sql_select_reservation_date;
        }

            dbConn.query(sql_select_reservation, [user.id, user.id, user.year, user.month], function(err, results) {
                console.log('예약 select 쿼리문 수행');
                if (err) {
                    dbConn.release();
                    return callback(err);
                }

                console.log('map 수행 바로 직전');
                async.map(results, addUserInfo, function(err, results) {
                    console.log('map 수행완료');
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, results);
                });
            });


        function addUserInfo(item, cb) {
            console.log('map 수행 중');
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
                console.log(item);

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
                console.log('싱어일때');
                reservation.singer_name = user.name;
                reservation.singer_photoURL = user.photoURL;

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
                console.log('유저일때');
                reservation.customer_name = user.name;
                reservation.customer_photoURL = user.photoURL;

                dbConn.query(sql_user_info, [reservation.singer_id], function(err, results) {
                    console.log('sql_user_info');
                    console.log(reservation.singer_id);
                    dbConn.release();
                    if (err) {
                        return callback(err);
                    }

                    console.log(results[0]);
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
module.exports.registerReservation = registerReservation;
module.exports.findReservationListOfUser = findReservationListOfUser;
module.exports.findReservationById = findReservationById;
module.exports.updateReservation = updateReservation;