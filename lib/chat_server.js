const socketio = require("socket.io");

let io;
let guestNumber = 1;

const nickNames = {};
const namesUsed = [];
const currentRoom = {};

const assignGuestName = (socket, guestNumber, nickNames, namesUsed) => {
  const name = "Guest" + guestNumber;

  // *** socket.id is a unique client connection id
  nickNames[socket.id] = name;

  // *** emit an event Letting user know their guest name
  socket.emit("nameResult", {
    success: true,
    name: name
  });

  namesUsed.push(name);

  return guestNumber + 1;
};

const joinRoom = (socket, room) => {
  // *** Make user join room
  socket.join(room);

  currentRoom[socket.id] = room;

  // *** Let user know they’re now in new room
  socket.emit("joinResult", {
    room
  });

  // *** Let other users in room know that user has joined
  socket.broadcast.to(room).emit("message", {
    text: nickNames[socket.id] + " has joined" + " room."
  });

  // *** Determine what other users are in same room as user
  const usersInRoom = io.of("/").in(room).clients;

  if (usersInRoom.length > 1) {
    let usersInRoomSummary = "Users currently in " + room + ": ";

    for (const index in usersInRoom) {
      const userSocketId = usersInRoom[index].id;

      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ", ";
        }

        usersInRoomSummary += nickNames[userSocketId];
      }
    }

    usersInRoomSummary += ".";

    // *** Send summary of other users in the room to the user
    socket.emit("message", { text: usersInRoomSummary });
  }
};

const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {
  // *** Add listener for nameAttempt events
  socket.on("nameAttempt", function(name) {
    if (name.indexOf("Guest") == 0) {
      socket.emit("nameResult", {
        success: false,
        message: "Name cannot begin with *Guest*. "
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        const previousName = nickNames[socket.id];
        const previousNameIndex = namesUsed.indexOf(name);

        namesUsed.push(name);
        nickNames[socket.id] = name;

        // *** Remove previous name to make available to other clients
        delete namesUsed[previousNameIndex];

        socket.emit("nameResult", {
          success: true,
          name: name
        });

        socket.broadcast.to(currentRoom[socket.id]).emit("message", {
          text: previousName + " is now known as " + name + "."
        });
      } else {
        socket.emit("nameResult", {
          success: false,
          message: "That name is already in use"
        });
      }
    }
  });
};

const handleMessageBroadcasting = socket => {
  socket.on("message", function(message) {
    socket.broadcast.to(message.room).emit("message", {
      text: nickNames[socket.id] + ": " + message.text
    });
  });
};

const handleRoomJoining = socket => {
  socket.on("join", function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
};

const handleClientDisconnection = socket => {
  socket.on("disconnect", function() {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);

    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
};

exports.listen = server => {
  io = socketio.listen(server);

  io.set("log level", 1);

  // *** Define how each user connection will be handled
  io.on("connection", function(socket) {
    // *** assign user a guest name when they connect
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    // *** Place user in Lobby room when they connect
    joinRoom(socket, "Lobby");

    // *** Handle user messages, namechange attempts, and room creation/changes
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on("rooms", function() {
      socket.emit("rooms", io.of("/").adapter.rooms);
    });

    // *** Define cleanup logic when user disconnects
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};
