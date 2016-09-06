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

            console.log({
                result: results[0]
            });
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
    user.facebookId = profile.id;
    console.log(user.facebookId);

    var sql_select_user = 'SELECT * FROM user WHERE facebook_id = ?';
    var sql_insert_user = 'INSERT INTO user(facebook_id) VALUES (?)';

    dbPool.getConnection(function(err, dbConn) {
       if (err) {
           return callback(err);
       }

        dbConn.beginTransaction(function(err) {
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
                        return callback(null, user);
                    });
                }
            });
        });
    });
}


// POST users/local 에서 회원을 등록할 때 사용되는 함수
function registerUser(user, callback) {
    var sql_insert_user = 'INSERT INTO user(email, password, name, phone, type, registration_token) '+
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
            dbConn.query(sql_insert_user, [user.email, user.password, user.name, user.phone, user.type, user.registration_token], function(err, result) {
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
                          'SET email = ?, name = ?, phone = ?, type = ? '+
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
                dbConn.query(sql_update_user, [user.email, user.name, user.phone, user.type, user.id], function(err, result) {
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
    console.log('updateUser 실행');
    var sql_update_user = 'UPDATE user ' +
                          'SET password = sha2(?, 512), photoURL = ? WHERE id = ?';
    var sql_select_filepath = 'SELECT photoURL FROM user WHERE id = ?';

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
                    callback(null, true);
                    dbConn.release();
                })
            });

        });

        function updateUserInfo(cb){
            console.log('updateUserInfo 수행');
            // dbConn.query(sql_update_user, [user.password, user.name, user.phone, user.photoURL, user.id], function(err, result) {
            dbConn.query(sql_update_user, [user.password, user.file, user.id], function(err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, true);
            });
        }

        function deleteFile(cb) {
            console.log('deleteFIle 수행');
            if(!user.file) return cb(null, true);

            dbConn.query(sql_select_filepath, [user.id], function(err, results) {
                if (err) {
                    return cb(err);
                }

                results[0].photoURL = results[0].photoURL || '';

                fs.unlink(results[0].photoURL, function(err) {
                    if (err) {
                        return cb(null);
                    }
                    cb(null, true);
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