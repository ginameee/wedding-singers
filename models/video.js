/**
 * Created by Tacademy on 2016-08-24.
 */
var testObj = [
    {
        idx: 1,
        singer_name: '홍길동',
        title: '하객 모두를 울린 다행이다',
        hit: 455,
        favorite: 34,
        url: 'http://www.youtube.com/123213'
    },
    {
        idx: 2,
        singer_name: '을지문덕',
        title: '신부 눈, 코, 입',
        hit: 1425,
        favorite: 234,
        url: 'http://www.youtube.com/123413'
    }
];

function findVideoById(id, callback) {
    var result = {};
    for (var i=0; i<testObj.length; i++) {
        if (testObj[i].idx === id) result = testObj;
    }
    callback(null, result);
}

function findVideoByFilter(search, callback) {
    callback(null, true);
}

function updateVideo(id, callback) {
    callback(null ,true);
}

function insertVideo(user_id, callback) {
    callback(null, true);
}

function listVideo(pageNo, rowCnt, callback) {
    callback(null, testObj);
}
module.exports.testObj = testObj;
module.exports.findVideoById = findVideoById;
module.exports.findVideoByFilter = findVideoByFilter;
module.exports.updateVideo = updateVideo;
module.exports.insertVideo = insertVideo;
module.exports.listVideo = listVideo;