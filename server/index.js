const { Server } = require("socket.io");

const PORT = process.env.PORT || 8000 ;
const io = new Server(PORT, { cors: true});

const emailToSocketId = new Map();
const socketIdToEmail = new Map();

io.on('connection', (socket) => {
    console.log('Socket Connected', socket.id);
    socket.on('room:join', (data) => {
        const { name, email, room } = data;
        emailToSocketId.set(email, socket.id);
        socketIdToEmail.set(socket.id, email);
        io.to(room).emit('user:joined', { name, email, id: socket.id });
        socket.join(room);
        io.to(socket.id).emit('room:join', data);
    })

    socket.on('call:user', ({ to, offer }) => { 
        io.to(to).emit('incoming:call', { from: socket.id,offer });
    })
    
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
