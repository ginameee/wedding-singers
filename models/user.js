var dbPool = require('../models/common').dbPool;
var async = require('async');
// passport.deserializeUser에서 세션을 통해 user객체를 생성할때 사용
function findUser(id, callback) {
    console.log("findUser: " + id);
    var sql_select_user = 'SELECT * FROM user WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_user, [id], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }

            var user = {
                id : id,
                email : results[0].email,
                name : results[0].name,
                phone : results[0].phone,
                type : parseInt(results[0].type),
                photoURL : results[0].photoURL,
                registration_token : results[0].registration_token
            };

            callback (null, user);
        });
    });
}

function findUserById(id, callback) {
    var sql_select_user_id = 'SELECT * FROM user WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_user_id, [id], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }

            if (results.length === 0) {
                return callback(null, null);
            }
            console.log({
                result: results[0]
            });
            callback(null, results[0]);
        });
    })
}

// POST users/local 에서 회원가입시 회원의 존재유무를 파악하기 위해서 사용되는 함수
// POST auth/local/login 에서 로그인시 사용되는 함수
function findUserByEmail(email, callback) {
    var sql_select_user_email = 'SELECT * FROM user WHERE email = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_select_user_email, [email], function(err, results) {
            dbConn.release();

            if (err) {
                return callback(err);
            }

            if (results.length === 0) {
                return callback(null, null);
            }
            console.log({
                result: results[0]
            });
            callback(null, results[0]);
        });
    })
}


// POST auth/local/login 에서 비밀번호 확인을 위해서 사용되는 함수
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


// POST auth/facebook/token 에서 사용되는 함수
function findOrCreate(profile, callback) {
    var user = {};
    user.facebookId = profile.id;
    console.log(user.facebookId);

    var sql_select_user = 'SELECT * FROM user WHERE facebookId = ?';
    var sql_insert_user = 'INSERT INTO user(facebookId) VALUES (?)';

    dbPool.getConnection(function(err, dbConn) {
       if (err) {
           return callback(err);
       }

        dbConn.beginTransaction(function (err) {
           if (err) {
               return callback(err);
           }
            dbConn.query(sql_select_user, [user.facebookId], function(err, results) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        return callback(err);
                    });
                }

                if(results.length === 0) {
                    dbConn.query(sql_insert_user, [user.facebookId], function(err, result) {
                        dbConn.release();
                        if (err) {
                            return dbConn.rollback(function () {
                                dbConn.release();
                                return callback(err);
                            });
                        }
                        dbConn.commit(function() {
                            user.id = result.insertId;
                            return callback(null, user);
                        });
                    });
                }

                else {
                    dbConn.commit(function() {
                        dbConn.release();
                        user.id = results[0].id;
                        user.name = results[0].name;
                        user.email = results[0].email;
                        user.phone = results[0].phone;
                        user.waytoserach = results[0].waytosearch;
                        return callback(null, user);
                    });
                }
            });
        });
    });
}


// POST users/local 에서 회원을 등록할 때 사용되는 함수
function registerUser(user, callback) {
    var sql_insert_user = 'INSERT INTO user(email, password, name, phone, waytosearch, type) '+
                          'VALUES(?, SHA2(?, 512), ?, ?, ?, ?)';
    var sql_insert_singer = 'INSERT INTO singer(user_id) VALUES (?)';
    var sql_insert_customer= 'INSERT INTO customer(user_id) VALUES (?)';


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (user.type === 1) {
                async.series([insertUser, registerSinger], function(err) {
                    if (err) {
                        return dbConn.rollback(function () {
                            dbConn.release();
                            callback(err);
                        });
                    }
                    dbConn.commit(function () {
                        dbConn.release();
                        callback(null);
                    })
                });
            } else {
                async.series([insertUser, registerCustomer], function(err) {
                    if (err) {
                        return dbConn.rollback(function () {
                            dbConn.release();
                            callback(err);
                        });
                    }
                    dbConn.commit(function () {
                        dbConn.release();
                        callback(null);
                    })
                });
            }
        });

        function insertUser(cb) {
            dbConn.query(sql_insert_user, [user.email, user.password, user.name, user.phone, user.waytosearch, user.type], function(err, result) {
                if (err) {
                    return cb(err);
                }
                user.id = result.insertId;
                cb(null, user);
            });
        }

        function registerCustomer(cb) {
            dbConn.query(sql_insert_customer, [user.id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, true);
            });
        }

        function registerSinger(cb) {
            dbConn.query(sql_insert_singer, [user.id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, result);
            });
        }
    });
}


// POST users/facebook/token 에서 회원가입을 할 때 호출되는 함수
function registerUserFB(user, callback) {
    var sql_update_user = 'UPDATE user ' +
                          'SET email = ?, name = ?, phone = ?, waytosearch = ?, type = ?  '+
                          'WHERE id = ?';
    var sql_insert_singer = 'INSERT INTO singer(user_id) VALUES (?)';
    var sql_insert_customer= 'INSERT INTO customer(user_id) VALUES (?)';


    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }

            if (user.type === 1) {
                async.series([updateUser, registerSinger], function(err) {
                    if (err) {
                        return dbConn.rollback(function () {
                            dbConn.release();
                            callback(err);
                        });
                    }
                    dbConn.commit(function () {
                        dbConn.release();
                        callback(null);
                    })
                });
            } else {
                async.series([updateUser, registerCustomer], function(err) {
                    if (err) {
                        return dbConn.rollback(function () {
                            dbConn.release();
                            callback(err);
                        });
                    }
                    dbConn.commit(function () {
                        dbConn.release();
                        callback(null);
                    })
                });
            }
        });

        function updateUser(cb) {
                dbConn.query(sql_update_user, [user.email, user.name, user.phone, user.waytosearch, user.type, user.id], function(err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, true);
                });
        }

        function registerCustomer(cb) {
                dbConn.query(sql_insert_customer, [user.id], function(err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, true);
                });
        }

        function registerSinger(cb) {
                dbConn.query(sql_insert_singer, [user.id], function(err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, result);
                });
        }
    });
}


function deleteUser(userId, callback) {
    var sql_delete_user = 'DELETE FROM user WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_delete_user, [userId], function(err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            return callback(null, result);
        });
    });
}


function updateUser(user, callback) {
    var sql_update_user = 'UPDATE user ' +
        'SET email = ?, name = ?, phone = ?, waytosearch = ?, type = ?  photoURL = ?'+
        'WHERE id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql_update_user, [user.email, user.name, user.phone, user.waytosearch, user.type, user.id], function(err, result) {
            dbConn.release();

            if (err) {
                return callback(err);
            }
            callback(null);
        });
    });
}

module.exports.findUser = findUser;
module.exports.findUserByEmail = findUserByEmail;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;
module.exports.registerUser = registerUser;
module.exports.deleteUser = deleteUser;
module.exports.updateUser = updateUser;
module.exports.registerUserFB = registerUserFB;
module.exports.findUserById = findUserById;