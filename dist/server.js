'use strict';

var _connect = require('connect');

var _connect2 = _interopRequireDefault(_connect);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _socket = require('./lib/socket');

var _socket2 = _interopRequireDefault(_socket);

var _routes = require('./lib/routes');

var _routes2 = _interopRequireDefault(_routes);

var _utils = require('./lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var port = process.env.PORT || 8081;

//Setup Express
//setup Dependencies
var server = _express2.default.createServer();

server.configure(function () {
  server.set('views', __dirname + '/views');
  server.set('view options', { layout: false });
  server.use(_connect2.default.bodyParser());
  server.use(_express2.default.cookieParser());
  server.use(_express2.default.session({ secret: "shhhhhhhhh!" }));
  server.use(_connect2.default.static(__dirname + '/static'));
  server.use(server.router);
});

//setup the errors
server.error(function (err, req, res, next) {
  if (err instanceof _utils.NotFound) {
    res.render('404.jade', {
      locals: {
        title: '404 - Not Found',
        description: '',
        author: '',
        analyticssiteid: 'XXXXXXX'
      },
      status: 404
    });
  } else {
    res.render('500.jade', {
      locals: {
        title: 'The Server Encountered an Error',
        description: '',
        author: '',
        analyticssiteid: 'XXXXXXX',
        error: err
      },
      status: 500
    });
  }
});

server.listen(port);

//Socket.IO
(0, _socket2.default)(server);

// ROUTES
(0, _routes2.default)(server);

console.log('Listening on http://0.0.0.0:' + port);
//# sourceMappingURL=server.js.map