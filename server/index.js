const PORT = 8080

const WebSocket = require('ws')
const server = new WebSocket.Server({
  port: PORT
})

console.log(`running on port ${PORT}`)


let sockets = []
server.on('connection', (socket) => {
  sockets.push(socket)
  console.log(`new connection, now ${sockets.length} connections`)

  // When you receive a message, send that message to every socket.
  socket.on('message', (msg) => {
    console.log('got message')
    sockets.forEach(s => s.send(msg))
  })

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', () => {
    sockets = sockets.filter(s => s !== socket)
    console.log(`connection closed, now ${sockets.length} connections`)
  })
})
