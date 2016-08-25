/**
 * Created by Tacademy on 2016-08-24.
 */
var testObj = {
    user_id : 3,
    email: 'ginameee@naver.com',
    comment: '가왕 출신입니다.',
    description: '안녕하세요! 복면가왕에 출연했던 웨딩싱어 입니다. '+
    '저는 발라드전문이구요 장난이니니까 믿어주세요',
    standard_price: 300000,
    special_price: 600000,
    composition: '발라드',
    theme: '솔로',
    penalty: 3,
    songs: ['다행이다', '감사']
};


function updateSinger(userId, callback) {

}

function findSingerById(userId, callback) {
    if (testObj.user_id === userId ) callback(null, testObj);
}

function findSingerHolidaies(userId, callback) {
    callback(null, true);
}

function updateSingerHolidaies(userId, callback) {
    callback(null, true);
}

module.exports.updateSinger = updateSinger;
module.exports.findSingerById = findSingerById;
module.exports.findSingerHolidaies =  findSingerHolidaies;
module.exports.updateSingerHolidaies = updateSingerHolidaies;