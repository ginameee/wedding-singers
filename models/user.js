var dbPool = require('../models/common').dbPool;

function findUser(id, callback) {
    console.log("findUser: " + id);
    if (id === 1) {
        callback(null, {
            id: 1,
            email: "gildong.hong@example.com",
            name: "홍길동",
            phone: "010-1111-1111"
        });
    } else {
        callback(null, {
            id: 2,
            email: "ginameee@naver.com",
            name: "이장춘",
            facebookid: "1041582872625382"
        });
    }
}

function findUserByEmail(email, callback) {
    var sql_select_user_email = 'SELECT * FROM user WHERE email = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) return callback(err);

        dbConn.query(sql_select_user_email, [email], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }

            if (results.length === 0) {
                return callback(null, null);
            }

            callback(null, results[0]);
        });
    })

}

function verifyPassword(password, db_password, callback) {
    var sql_select_user_password = 'SELECT * FROM user WHERE password = SHA2(?,512)';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_select_user_password, [password], function(err, results) {
            dbConn.release();
            console.log(results);
            if (err) {
                return callback(err);
            }

            if (results[0].password !== db_password) {
                return callback(null, null);
            }

            return callback(null, true);
        });


    });
}

function findOrCreate(profile, callback) {
    console.log("findOrCreate: " + profile.id);
    return callback(null, {
        id: 2,
        name: profile.displayName,
        email: profile.emails[0].value,
        facebookid: profile.id
    });
}

function registerUser(user, callback) {
    var sql_insert_user = 'INSERT INTO user(email, password, name, phone, waytosearch, type) '+
                          'VALUES(?, SHA2(?, 512), ?, ?, ?, ?);';

    dbPool.getConnection(function(err, dbConn) {
       if (err) {
           return callback(err);
       }

       dbConn.query(sql_insert_user, [user.email, user.password, user.name, user.phone, user.waytosearch, user.type], function(err, result) {
           dbConn.release();

           if (err) {
               return callback(err);
           }

           console.log(result);
           callback(null, result);
       })

    });
}

function deleteUser() {
    callback(null, true);
}

module.exports.findUser = findUser;
module.exports.findUserByEmail = findUserByEmail;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;
module.exports.registerUser = registerUser;
module.exports.deleteUser = deleteUser;