import express from "express";
import SocketIO from "socket.io";

let app = express();
let server = require("http").Server(app);
let io = SocketIO(server);

server.listen(8000);

app.use(express.static('public'));

app.get("/", function(_req, res) {
  res.sendFile(__dirname + "/public/index.html")
});

io.on('connection', function (socket) {
  console.log("connected!");
  socket.on('cardCreated', function (data) {
    console.log(data);
    socket.broadcast.emit("card-created", data);
  });

  socket.on("card:created", function(data) {
    console.log("card created");
    console.log(data);
    socket.broadcast.emit(`card:created:${data.columnId}`, {
      id: data.id
    });
  });

  socket.on("card:updated", function (data) {
    console.log("card updated");
    console.log(data);
    socket.broadcast.emit(`card:updated:${data.id}`, {
      text: data.text,
    });
  });

  socket.on("card:deleted", function (data) {
    console.log("card deleted");
    console.log(data);
    socket.broadcast.emit(`card:deleted:${data.columnId}`, {
      id: data.id
    });
  });
});
