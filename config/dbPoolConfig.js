/**
 * Created by Tacademy on 2016-08-26.
 */
var dbPoolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
    debug: false
};

module.exports = dbPoolConfig;