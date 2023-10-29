const http = require('http');
const fs = require('fs');
const path = require('path');

// Define the port to listen on
const port = 1234;

// Define the directory to serve statically
const staticDirectory = path.join(__dirname, '.');

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Get the requested file path
  const filePath = path.join(staticDirectory, req.url);

  // Check if the requested file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, respond with a 404 error
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      // File exists, serve it
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
