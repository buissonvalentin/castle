var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


var mymodule = require('./GetListHotelModule');


app.get('/main.js', function (req, res) {
    res.sendFile(__dirname + '/main.js');
});
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/style.css', function (req, res) {
    res.sendFile(__dirname + '/style.css');
});
app.get('/image/:file', function (req, res) {
    console.log(req.params.file);
    fs.readFile('image/' + req.params.file, function (err, data) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(data, 'binary');
    });
});




io.sockets.on('connection', function (socket) {

    console.log('Un client est connecté !');
    mymodule(function(listHotel){
        socket.emit('data', listHotel);
    });

});

server.listen(8080);


