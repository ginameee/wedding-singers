
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
    if (email !== 'gildong.hong@example.com') {
        callback(null, null);
    } else {
        callback(null, {
            id: 1,
            email: "gildong.hong@example.com",
            name: "홍길동",
            password: "1111",
            phone: '010-1111-1111'
        });
    }
}

function verifyPassword(password1, password2, callback) {
    if (password1 !== password2) {
        return callback(null, false)
    }
    callback(null, true);
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

module.exports.findUser = findUser;
module.exports.findUserByEmail = findUserByEmail;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;