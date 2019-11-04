const Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
  const message = {
    room, // *** => room name
    text
  };

  this.socket.emit("message", message);
};

Chat.prototype.changeRoom = function(room) {
  this.socket.emit("join", {
    newRoom: room
  });
};

Chat.prototype.processCommand = function(command) {
  const words = command.split(" ");

  // *** Parse command from first word
  var command = words[0].substring(1, words[0].length).toLowerCase();

  let message = false;

  switch (command) {
    case "join":
      words.shift(); // *** remove first ele from an array

      const room = words.join(" ");
      this.changeRoom(room);

      break;
    case "nick":
      words.shift();

      const name = words.join(" ");
      this.socket.emit("nameAttempt", name);

      break;
    default:
      message = "Unrecognized command.";
      break;
  }

  return message;
};
