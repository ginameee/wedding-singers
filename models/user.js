/**
 * Created by Tacademy on 2016-08-24.
 */
var testObj = {
    id: 'ginameee@naver.com',
    password: 'didimdol',
    name: '이장춘',
    phone: '010-1234-1234'
};

function findUserById(id, callback) {
    if (testObj.id !== id) return callback(null, null);
    callback(null, testObj);
}

function verifyPassword(password, user_password, callback) {
    if (password !== user_password) return callback(null, null);
    callback(null, true);
}

function findOrCreate(facebookId, callback) {

}

function registerUser(user, callback) {
    callback(null, true);
}

function deleteUser() {

}

module.exports.findUserById = findUserById;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;
module.exports.registerUser = registerUser;
module.exports.deleteUser = deleteUser;