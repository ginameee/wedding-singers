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
function findReservationByUser(user_id, callback) {
    var sql_select_reservation = '';
}
module.exports.registerReservation = registerReservation;