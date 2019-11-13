import express from "express";
import SocketIO from "socket.io";

let app = express();
let server = require("http").Server(app);
let io = SocketIO(server);

server.listen(8000);

app.use(express.static('public'));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html")
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
