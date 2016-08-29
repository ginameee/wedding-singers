/**
 * Created by Tacademy on 2016-08-24.
 */
function isAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).send({
            message: 'login required'
        });
    }
    next();

}

function isSecure(req, res, next) {
    if (!req.secure) {
        return res.status(426).send({
            message: 'https로!!'
        });
    }
    next();
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.isSecure = isSecure;