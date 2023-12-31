const express = require('express');
const app = express();
//const server = require('http').Server(app);
const io = require('socket.io')(server);


var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();

var cors = require('cors');
var http = require('http');
var https = require('https');
var fs = require('fs');

// 加入線上人數計數
let onlineCount = 0;

app.get('/', (req, res) => {
    res.sendFile( __dirname + '/views/index.html');
});

io.on('connection', (socket) => {
    // 有連線發生時增加人數
    onlineCount++;
    // 發送人數給網頁
    io.emit("online", onlineCount);

    socket.on("greetnod", () => {
        socket.emit("greet", onlineCount);
    });

    socket.on("send", (msg) => {
        // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
        // 因此我們直接 return ，終止函式執行。
        if (Object.keys(msg).length < 2) return;

        // 廣播訊息到聊天室
        io.emit("msg", msg);
    });

    socket.on('disconnect', () => {
        // 有人離線了，扣人
        onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
        io.emit("online", onlineCount);
    });
});

/* server.listen(3000, () => {
    console.log("Server Started. http://localhost:3000");
}); */

// 監聽 port
/* var port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server Started. http://localhost:3000");
});  */

var sslCreds = null;
sslCreds = {
//     // uncomment the following code and replace the following paths if you have SSL certificates.
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem')
};
if (sslCreds) {
    var server = https.createServer(sslCreds, app);
    port = 443;
    http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'].replace('80', '443') + req.url });
        console.log("http request, will go to >> ");
        console.log("https://" + req.headers['host'].replace('80', '443') + req.url );
        res.end();
    }).listen(3000);
} else {
    var server = http.createServer(app);
    port = 3000;
}
server.listen(port, '0.0.0.0',function(){
    console.log(`Server listening on port `+port);
});