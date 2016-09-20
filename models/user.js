var dbPool = require('../models/common').dbPool;
var async = require('async');
var fs = require('fs');

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
                registration_token : results[0].registration_token,
                facebook_id : results[0].facebook_id || ''
            };
            callback (null, user);
        });
    });
}


function findUserById(user, callback) {

    var sql_select_singer = 'SELECT * FROM singer WHERE user_id = ?';
    var sql_select_customer = 'SELECT * FROM customer WHERE user_id = ?';
    
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        if(user.type == 1) {
            dbConn.query(sql_select_singer, [user.id], function(err, results) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }

                if (results.length === 0) {
                    return callback(null, null);
                }
                callback(null, results[0].penalty)
            });
        } else {
            dbConn.query(sql_select_customer, [user.id], function(err, results) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }

                if (results.length === 0) {
                    return callback(null, null);
                }
                callback(null, results[0].point);
            });
        }
    });
}


// POST users/local 에서 회원가입시 회원의 존재유무를 파악하기 위해서 사용되는 함수
// POST auth/local/login 에서 로그인시 사용되는 함수
function findUserByEmail(email, callback) {
    var sql_select_user_email = 'SELECT * FROM user WHERE email = ?';
    var user = {};

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
            callback(null, results[0]);
        });
    })
}


function verifyPassword(password, db_password, callback) {
    var sql = 'SELECT sha2(?, 512) password';
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }

        dbConn.query(sql, [password], function(err, results) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            if (results[0].password !== db_password) {
                return callback(null, false);
            }
            callback(null, true);
        });
    });
}


// POST auth/facebook/token 에서 사용되는 함수
function findOrCreate(profile, callback) {
    var user = {};
    console.log(profile);
    user.facebookId = profile.id;
    user.name = profile.displayName;
    user.photoURL = profile.photos[0].value || '';

    console.log('---------------------입력받은 매개변수 -----------------------------');
    console.log(user.facebookId);
    console.log(user.name);
    console.log(user.photoURL);

    var sql_select_user = 'SELECT * FROM user WHERE facebook_id = ?';
    var sql_insert_user = 'INSERT INTO user(facebook_id, name, photoURL) VALUES (?, ?, ?)';

    dbPool.getConnection(function(err, dbConn) {
       if (err) {
           return callback(err);
       }

        dbConn.beginTransaction(function(err) {
           if (err) {
               return callback(err);
           }
            console.log('-------------------트랜잭션 시작----------------------');
            dbConn.query(sql_select_user, [user.facebookId], function(err, results) {
                console.log('-------------------sql_select_user 수행 ----------------------');
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        return callback(err);
                    });
                }

                if(results.length === 0) {
                    console.log('-------------------results의 길이가 0 ----------------------');
                    dbConn.query(sql_insert_user, [user.facebookId, user.name, user.photoURL], function(err, result) {
                        dbConn.release();
                        if (err) {
                            return dbConn.rollback(function() {
                                callback(err);
                            });
                        }
                        dbConn.commit(function() {
                            user.id = result.insertId;
                            return callback(null, user);
                        });
                    });
                }

                else {
                    console.log('-------------------results의 길이가 1----------------------');
                    dbConn.commit(function() {
                        dbConn.release();
                        user.id = results[0].id;
                        user.name = results[0].name;
                        user.email = results[0].email;
                        user.phone = results[0].phone;
                        user.type = results[0].type;
                        return callback(null, user);
                    });
                }
            });
        });
    });
}


// POST users/local 에서 회원을 등록할 때 사용되는 함수
function registerUser(user, callback) {
    var user_id;

    var sql_insert_user = 'INSERT INTO user(email, password, name, phone, type, registration_token, photoURL) '+
                          'VALUES(?, SHA2(?, 512), ?, ?, ?, ?, ?)';
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
                        callback(null, user_id);
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
                        callback(null, user_id);
                    })
                });
            }
        });

        function insertUser(cb) {
            dbConn.query(sql_insert_user, [user.email, user.password, user.name, user.phone, user.type, user.registration_token, user.photoURL], function(err, result) {
                if (err) {
                    return cb(err);
                }
                user_id = result.insertId;
                cb(null);
            });
        }

        function registerCustomer(cb) {
            dbConn.query(sql_insert_customer, [user_id], function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }

        function registerSinger(cb) {
            dbConn.query(sql_insert_singer, [user_id], function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }
    });
}


// POST users/facebook/token 에서 회원가입을 할 때 호출되는 함수
function registerUserFB(user, callback) {
    var sql_update_user = 'UPDATE user ' +
                          'SET email = ?, name = ?, phone = ?, type = ?, photoURL = ? '+
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
                async.series([updateUserInfo, registerSinger], function(err) {
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
                async.series([updateUserInfo, registerCustomer], function(err) {
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

        function updateUserInfo(cb) {
                dbConn.query(sql_update_user, [user.email, user.name, user.phone, user.type, user.photoURL, user.id], function(err, result) {
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


// PUT /users/me에서 회원정보를 변경할 때 호출되는 함수
function updateUser(user, callback) {
    // var sql_update_user = 'UPDATE user ' +
    //     'SET password = ?, name = ?, phone = ?, photoURL = ? '+
    //     'WHERE id = ?';
    var sql_update_user = 'UPDATE user ' +
                          'SET password = sha2(?, 512), photoURL = ? WHERE id = ?';
    var sql_update_file = 'UPDATE user ' +
                          'SET photoURL = ? WHERE id = ?';
    var sql_update_password = 'UPDATE user ' +
                              'SET password = sha2(?, 512) WHERE id = ?';
    var sql_update_registration_token = 'UPDATE user ' +
                                        'SET registration_token = ? ' +
                                        'WHERE id = ?';

    var sql_select_filepath = 'SELECT photoURL FROM user WHERE id = ?';

    var params = [user.password, user.file, user.id];

    if (!user.password) {
        sql_update_user = sql_update_file;
        params = [user.file, user.id];
    }

    if (!user.file) {
        sql_update_user = sql_update_password;
        params = [user.password, user.id];
    }

    if (user.registration_update) {
        sql_update_user = sql_update_registration_token;
        params = [user.registration_token, user.id];
    }

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function(err) {
            if (err) {
                return callback(err);
            }

            async.series([deleteFile, updateUserInfo], function(err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    callback(null);
                    dbConn.release();
                })
            });
        });

        function updateUserInfo(cb){
            // dbConn.query(sql_update_user, [user.password, user.name, user.phone, user.photoURL, user.id], function(err, result) {
            dbConn.query(sql_update_user, params, function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        }

        function deleteFile(cb) {
            if(!user.file) return cb(null);

            dbConn.query(sql_select_filepath, [user.id], function(err, results) {
                if (err) {
                    return cb(err);
                }

                results[0].photoURL = results[0].photoURL || '';

                fs.unlink(results[0].photoURL, function(err) {
                    if (err) {
                        return cb(null);
                    }
                    cb(null);
                });
            });
        }
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