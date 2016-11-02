import socketio from 'socket.io'

const socket = (server) => {
  const io = socketio.listen(server)

  io.sockets.on('connection', (socket) => {

    console.log('Client Connected')
    socket.on('message', (data) => {
      console.log(data);
    })

    socket.on('disconnect', () => {
      console.log('Client Disconnected.')
    })

  })

  return io
}

export default socket
