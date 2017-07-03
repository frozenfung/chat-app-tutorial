var express = require("express");
var path = require("path");
var nunjucks = require('nunjucks');
var uuidv4 = require('uuid/v4');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var events = require('events');

var messageEmitter = new events.EventEmitter();
//设置最大监听数量
messageEmitter.setMaxListeners(0)

var messageBuffer = {
    messageEmitter: messageEmitter
};

messageBuffer.newMessage = function(messages){
    this.messageEmitter.emit('newMessage', messages);
}

var app = express();
app.use('/static', express.static('static'));
nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    watch: true
});
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('view engine', 'html');

app.get('/', function(req, res){
    res.render('index.html');
});

app.post('/a/message/new', function(req, res){
    var message = {
        'id': uuidv4(),
        'body': req.body.body
    }
    message['html'] = '<div class="message" id="m'+message.id+'">'+message.body+'</div>';
    messageBuffer.newMessage([message])
    res.end();
});

app.post('/a/message/updates', function(req, res){
    var p = new Promise(function(resolve, reject){
        messageBuffer.messageEmitter.on("newMessage", function(data){
            resolve(data);
        });
    });
    p.then(function(data){
        res.set('Content-Type', 'application/json');
        res.json({'messages': data});
    });
});

var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port)
})
