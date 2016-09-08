var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');
var path = require('path');
var moment = require('moment-timezone');
var timeZone = "Asia/Seoul";

// logging 다 프레임워크를 사용한다.
//
var logger = new winston.Logger({
  transports: [
    // 어떤 행위가 일어났을때 IO를 catch를 해서 console로 내보내거나 file에 내보내거나 db에 기록하거나 여러가지 행위를 할 수 있는데 그때 내용을 전달해주는 전달자
    // console로 내보내는 transport, 디폴트임
    new winston.transports.Console({
      level: 'info', // 찍고자 하는 레벨
      silent: false, // 출력할건지 말건지, true면 콘솔로 내보내지 않겠다. false면 내보내겠다.
      colorize: true, // 컬러를 쓸건지 말건지, 리눅스 or 유닉스에서만 사용 가능
      prettyPrint: true, // util에 format에 맞춰서 출력할건지 말건지
      // timestamp: function() { // 우리의 시간대에 맞춰서 커스터마이징 해야한다.
      //   return moment().tz(timeZone).format();
      // }
      timestamp: false
    }),

      // 날자가 바뀌거나 지정한 format이 바뀌면 파일을 새롭게 만들어내는 작업을 한다.
    new winston.transports.DailyRotateFile({
      level: 'debug',
      silent: false,
      colorize: false, // file에다가 컬러를 기록할 일이 없으므로 false로 한다.
      prettyPrint: true,
      timestamp: function() {
        return moment().tz(timeZone).format();
      },
      // console과 다른 추가적인 옵션
      dirname: path.join(__dirname, '../logs'), // 만들어놓은 위치에
      filename: 'debug_logs_', // 이러한 이름의 파일에
      datePattern: 'yyyy-MM-ddTHH.log', // 시간대 별로 로그를 만들어서
      maxsize: 1024, // 하나의 파일의 최대 사이즈를 의미한다 지금은 1KB, 커스터마이징이 가능하다. 파일의 최대크기를 넘어가면 파일에 넘버링이 들어간다.
      json: false // 포맷은 일반포맷 결과를 JSON으로 보고싶다면 true로 한다.
    })
  ],

  // 예외사항이 발견됬을때 이러한 내용을 기록하고 처리하는 로테이터, 예외사항이 없다면 생성되지 않는다.
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      level: "debug", // 레벨을 주지 않으면 디폴트로 info가 들어간다. 개발을 할 때에는 debug로 설정해 두는 것 이좋다.
      silent: false,
      colorize: false,
      prettyPrint: true,
      timestamp: function() {
        return moment().tz(timeZone).format();
      },
      dirname: path.join(__dirname, '../logs'),
      filename: 'exception_logs_',
      datePattern: 'yyyy-MM-ddTHH-mm.log',
      maxsize: 1024,
      json: false,
      handleExceptions: true,
      humanReadableUnhandledException: true // Exception을 찍을 때 한줄로 찍기 때문에, 읽기가힘들다. true면 라인브레이크를 수행
    })
  ],
  exitOnError: false // 에러가 발생했을때 프로그램을 죽일것이냐 말것이냐, false면 안죽임
});

module.exports = logger;