'use client'
import { useSocket } from '@/context/SocketProvider'
import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';

export default function page() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    const offer = await peer.getOffer();
    socket.emit('call:user', { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleUserJoined = useCallback((props: any) => {
    console.log(props);
    setRemoteSocketId(props.id);
  }, []);

  const handleIncomingCall = useCallback( async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit('call:accepted', { to: from, ans });

  }, [socket]);
  
  
  const  sendStream = useCallback(() =>{
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  },[myStream])

  const handleCallAccepted = useCallback(({  ans }) => {
    peer.setLocalDescription(ans);
    console.log("call accepted");
    sendStream();
  }, [sendStream]);

  const handleNegotiationIncoming = useCallback( async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer:nego:done', { to: from, ans })
  }, [socket]);

  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegotiationFinal = useCallback(async ({ans}) => {
     await peer.setLocalDescription(ans);
  }, []);

useEffect(() => {
    peer.peer.addEventListener("track", async (ev : any) => {
      const remoteStream =  ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded)
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
    }
  }, [handleNegotiationNeeded])


  useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed', handleNegotiationIncoming);
    socket.on('peer:nego:final', handleNegotiationFinal);

    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('peer:nego:needed', handleNegotiationIncoming);
      socket.off('peer:nego:final', handleNegotiationFinal);
    }
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegotiationIncoming, handleNegotiationFinal]);

  return (
    <div className="min-h-screen flex flex-col gap-6 items-center pt-10">
      <h1 className="text-5xl">Your Screen</h1>
      <h1 className="text-xl">{remoteSocketId ? 'Connected' : 'No one in room'}</h1>
      {myStream && <button onClick={sendStream}>Send Stream</button>}
      {remoteSocketId &&
        <button onClick={handleCallUser}>CALL </button>
      }

      <div className='flex gap-5'> 
      { 
        myStream && 
        <div className='flex flex-col'>
         <h1 className="text-5xl">Your Stream</h1>
        <ReactPlayer playing muted height='400px' weight='600' url={myStream} />
        </div>
      }

      {
        remoteStream && 
        <div className='flex gap-5'> 
        <h1 className="text-5xl">Remote Stream</h1>
        <ReactPlayer playing muted height='=400px' weight='600' url={remoteStream} />
        </div>
      }
      </div>
    
    </div>
  );
}