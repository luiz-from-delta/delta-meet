const http = require("http");

const server = http.createServer(({ request, response }) => {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  });
  response.end("Hey there!");
});

const socketIo = require("socket.io");

const io = socketIo(server, {
  cors: {
    origin: "*",
    credentials: false,
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    console.info(`usuário conectado id ${userId}`);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
      console.error("usuário desconectado");
    });
  });
});

const startServer = () => {
  const { address, port } = server.address();
  console.info(`Server running at ${address}:${port}.`);
};

const port = process.env.PORT || 3000;

server.listen(port, startServer);
