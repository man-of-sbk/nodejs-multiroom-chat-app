const socketio = require("socket.io");

let io;
let guestNumber = 1;

const nickNames = {};
const namesUsed = [];
const currentRoom = {};

exports.listen = server => {
  io = socketio.listen(server);

  io.set("log level", 1);

  // *** Define how each user connection will be handled
  io.sockets.on("connection", function() {
    // *** assign user a guest name when they connect
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    // *** Place user in Lobby room when they connect
    joinRoom(socket, "Lobby");

    // *** Handle user messages, namechange attempts, and room creation/changes
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on("rooms", function() {
      socket.emit("rooms", io.sockets.manager.rooms);
    });

    // *** Define cleanup logic when user disconnects
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};
