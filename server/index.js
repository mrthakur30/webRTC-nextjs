const { Server } = require("socket.io");
var randomString = require('random-string');
const PORT = process.env.PORT || 8000 ;
const io = new Server(PORT, { cors: true});

const rooms = new Map();


io.on('connection', (socket) => {
    
    console.log('Socket Connected', socket.id);
    
    socket.on('room:create', () => {
        var roomId = randomString({length:8}).toLowerCase();
        socket.join(roomId);
        rooms.set(roomId, [socket.id]);
        socket.emit('room:created', { roomId });
        console.log(`Room created: ${roomId}`); 
    });

    socket.on('room:join', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room) {
          socket.join(roomId);
          room.push(socket.id);
          socket.emit('room:joined', { roomId });
    
          console.log(`Client ${socket.id} joined room: ${roomId}`);
    
          socket.to(roomId).emit('user:joined', { participantId: socket.id });
        } else {
          socket.emit('room not found');
        }
      });
    
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    
        rooms.forEach((participants, roomId) => {
          const index = participants.indexOf(socket.id);
          if (index !== -1) {
            participants.splice(index, 1);
            socket.to(roomId).emit('participant left', { participantId: socket.id });
            if (participants.length === 0) {
              rooms.delete(roomId);
              console.log(`Room deleted: ${roomId}`);
            }
          }
        });
      });

    socket.on('call:user', ({ to, offer }) => { 
        io.to(to).emit('incoming:call', { from: socket.id,offer });
    });
    
    socket.on('call:accepted', ({to , ans})=>{ 
        io.to(to).emit('call:accepted', {  from: socket.id, ans });
    });

    socket.on('peer:nego:needed',({to,offer})=>{
        io.to(to).emit('peer:nego:needed',{from : socket.id ,offer });
    });
   
    socket.on('peer:nego:done',({to , ans })=>{
        io.to(to).emit('peer:nego:final',{ from : socket.id , ans });
    });

});
