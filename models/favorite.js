/**
 * Created by Tacademy on 2016-08-25.
 */
var dbPool = require('./common').dbPool;

function insertFavorite(cuid, callback) {
    var sql = '';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
    });
}