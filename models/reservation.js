/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('../models/common').dbPool;


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
function findReservationByUser(user, callback) {
    var reservation = {};
    var sql_select_customer_reservation = 'SELECT * FROM reservation WHERE customer_user_id = ?';
    var sql_select_singer_reservation = 'SELECT * FROM reservation WHERE singer_user_id = ?';
    var sql_user_info = 'SELECT name, photoURL FROM user WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        if (user.type === 1) {
            reservation.singer_id = user.id;
            reservation.singer_name = user.name;
            reservation.singer_photoURL = user.photoURL;

            dbConn.query(sql_select_singer_reservation, [user.id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return callback(err);
                }

                reservation.id = results[0].id;
                reservation.place = results[0].place;
                reservation.song = results[0].song;
                reservation.customer_id = results[0].customer_user_id;

                dbConn.query(sql_user_info, [reservation.customer_id], function(err, results) {
                    if (err) {
                        dbConn.release();
                        return callback(err);
                    }

                    reservation.customer_name = results[0].name;
                    reservation.customer_photoURL = results[0].photoURL;
                    dbConn.release();
                    callback(null, reservation);
                });

            });
        } else {
            reservation.customer_id = user.id;
            reservation.customer_name = user.name;
            reservation.customer_photoURL = user.photoURL;

            dbConn.query(sql_select_customer_reservation, [user.id], function(err, results) {
                if (err) {
                    dbConn.release();
                    return callback(err);
                }

                reservation.id = results[0].id;
                console.log(reservation.id);
                reservation.place = results[0].place;
                console.log(reservation.place);
                reservation.song = results[0].song;
                reservation.singer_id = results[0].singer_user_id;

                dbConn.query(sql_user_info, [reservation.singer_id], function(err, results) {
                    if (err) {
                        dbConn.release();
                        return callback(err);
                    }

                    reservation.singer_name = results[0].name;
                    reservation.singer_photoURL = results[0].photoURL;
                    dbConn.release();
                    callback(null, reservation);
                });
            });
        }
    });
}
module.exports.registerReservation = registerReservation;
module.exports.findReservationByUser = findReservationByUser;
