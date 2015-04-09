var http = require('http');
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var logging = require('./logger.js').logging();

var server = http.createServer(function(request, response) {
    console.log('Connection');
    var path = url.parse(request.url).pathname;

    switch (path) {
        case '/':
            response.writeHead(200, {
                'Content-Type': 'text/html'
            });
            response.write('Hello, World.');
            response.end();
            break;
        default:
            response.writeHead(404);
            response.write("opps this doesn't exist - 404");
            response.end();
            break;
    }
});

server.listen(8000);

var serv_io = io.listen(server);
var cookie_reader = require('cookie');
var SESSION_PREFIX = 'session:';
var user_id = null;
var SUBSCRIBE_PREFIX = 'notifications.';
var port = 6379;
var host = '127.0.0.1';

serv_io.set('authorization', function(data, accept){
    if(data.headers.cookie){
        data.cookie = cookie_reader.parse(data.headers.cookie);
        if (data.cookie.hasOwnProperty('sessionid')) {
            var redisClientUtil = require('./redisClientUtil.js');
            var redisUtil = new redisClientUtil();
            redisUtil.connect(port, host);
            redisUtil.select(1, function(){
                redisUtil.get(SESSION_PREFIX + data.cookie.sessionid, function(err, res){
                    if (!err) {
                        var sessionData = new Buffer(res, 'base64').toString();
                        var sessionObjString = sessionData.substring(sessionData.indexOf(":") + 1);
                        var sessionObjJSON = JSON.parse(sessionObjString);
                        user_id = sessionObjJSON._auth_user_id;
                        logging.info('user: ' + user_id);
                    }
                    redisUtil.close();
                });
            });
        }
        return accept(null, true);
    }
    return accept('error', false);
});

serv_io.sockets.on('connection', function(socket) {
    console.log('socket.id: ' + socket.id);
    if (user_id) {
        var redis = require('redis');
        var client = redis.createClient(port, host);
        client.subscribe(SUBSCRIBE_PREFIX + user_id.toString());
        client.on('message', function(channel, message){
            logging.info('MESSAGE: ' + message);
        });
    }

    setInterval(function() {
        socket.emit('date', {
            'date': new Date()
        });
    }, 1000);

    socket.on('disconnect', function() {
        console.log('Got disconnect! id: ' + socket.id);
        client.end();
    });
});