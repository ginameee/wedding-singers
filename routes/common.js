/**
 * Created by Tacademy on 2016-08-24.
 */
function isAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).send({
            code: 2,
            result: '로그인이 필요합니다'
        });
    }
    next();
}

function isSecure(req, res, next) {
    if (!req.secure) {
        return res.status(426).send({
            code: 2,
            result: 'HTTPS 통신이 필요합니다.'
        });
    }
    next();
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.isSecure = isSecure;