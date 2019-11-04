// *** display untrusted data which all come from user data such as js codes by transforming
// ***** special characters into HTML entities in order to
// ***** prevent browser from execute those data
// ***** exp:
// ***** * <script>alert('XSS attack!');</script>
// ***** * => <div>&It;script&gt;alert('XSS attack!');&Lt:/script&gt;<div>
const divEscapedContentElement = message => {
  return $("<div></div>").text(message);
};

// *** display trusted data which come all from system message
const divSystemContentElement = message => {
  return $("<div></div>").html("<i>" + message + "</i>");
};

const processUserInput = (chatApp, socket) => {
  let message = $("#send-message").val();
  let systemMessage;

  if (message.charAt(0) === "/") {
    systemMessage = chatApp.processCommand(message);

    // *** if there's error
    if (systemMessage) {
      $("#messages").append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($("#room").text(), message);
    $("#messages").append(divEscapedContentElement(message));
    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
  }

  $("#send-message").val("");
};

const socket = io.connect();

$(document).ready(function() {
  const chatApp = new Chat(socket);

  socket.on("nameResult", function(result) {
    let message;

    if (result.success) {
      message = "You are now known as " + result.name + ".";
    } else {
      message = result.message;
    }

    $("#messages").append(divSystemContentElement(message));
  });

  socket.on("joinResult", function(result) {
    $("#room").text(result.room);
    $("#messages").append(divSystemContentElement("Room changed"));
  });

  socket.on("message", function(message) {
    const newElement = $("<div></div>").text(message.text);
    $("#messages").append(newElement);
  });

  // *** Display list of rooms available
  socket.on("rooms", function(rooms) {
    $("#room-list").empty();

    for (let room in rooms) {
      console.log(room);
      room = room.substring(1, room.length);

      if (room != "") {
        $("#room-list").append(divEscapedContentElement(room));
      }
    }

    // *** Allow click of a room name to change to that room
    $("#room-list div").click(function() {
      chatApp.processCommand("/join " + $(this).text());
      $("#send-message").focus();
    });
  });

  // *** Request list of rooms available intermittently (không liên tục)
  setInterval(function() {
    socket.emit("rooms");
  }, 1000);

  $("#send-message").focus();

  // *** Allow submitting the form to send a chat message
  $("#send-form").submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
