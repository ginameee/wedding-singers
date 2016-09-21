/**
 * Created by Tacademy on 2016-08-26.
 */
//
// --------------------------------------------------
// DB pool 사용부분
// --------------------------------------------------
var mysql = require('mysql');
var dbPoolConfig = require('../config/dbPoolConfig');
var dbPool = mysql.createPool(dbPoolConfig);

module.exports.dbPool = dbPool;
