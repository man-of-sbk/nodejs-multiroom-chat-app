// *** built-in http module help create http server & client functionalities
const http = require("http");

// *** built-in fs module provide filesystem-related functionality
const fs = require("fs");

// *** built-in path module provide filesystem path-related functionality
const path = require("path");

// *** add-on module handle MIME type based on filename extension
const mime = require("mime-types");

// *** store contents of cached files
const cache = {};

const chatServer = require("./lib/chat_server");

const send404 = response => {
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.write("Error 404: resource not found");
  response.end(); // *** ends the connection
};

const sendFile = (response, filePath, fileContents) => {
  response.writeHead(200, {
    // *** mime.lookup('.png') => image/png => mime.lookup automatically find the corresponding
    // ***** http 'content-type'
    "content-type": mime.contentType(
      // *** basename: vd: basename('./public/index.html') => index.html
      path.basename(filePath)
    )
  });

  response.end(fileContents);
};

const serveStatic = (response, cache, absPath) => {
  // *** Check if file is cached in memory
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]); // *** Serve file from memory
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data); // *** serve file from disk
          }
        });
      } else {
        send404(response);
      }
    });
  }
};

const server = http.createServer(function(request, response) {
  let filePath = false;

  if (request.url === "/") {
    filePath = "public/index.html";
  } else {
    filePath = "public" + request.url;
  }

  const absPath = "./" + filePath;

  serveStatic(response, cache, absPath);
});

chatServer.listen(server);

server.listen(3000, function() {
  console.log("Server is running on port 3000");
});
