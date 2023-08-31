'use client'
import { useSocket } from '@/context/SocketProvider'
import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';

type MySocketType = {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};


export default function Screen() {
  const socket: MySocketType = useSocket() as MySocketType;

  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

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

  const handleIncomingCall = useCallback(async ({ from, offer }: any) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit('call:accepted', { to: from, ans });

  }, [socket]);

  const sendStream = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer && peer.peer.addTrack(track, myStream);
      }
    }

  }, [myStream])

  const handleCallAccepted = useCallback(({ ans }: any) => {
    peer.setLocalDescription(ans);
    console.log("call accepted");
    sendStream();
  }, [sendStream]);

  const handleNegotiationIncoming = useCallback(async ({ from, offer }: any) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer:nego:done', { to: from, ans })
  }, [socket]);

  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegotiationFinal = useCallback(async ({ ans }: any) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    if (peer.peer) {
      peer.peer.addEventListener("track", async (ev: any) => {
        const remoteStream = ev.streams;
        console.log("GOT TRACKS!!");
        setRemoteStream(remoteStream[0]);
      });
    }

  }, []);

  useEffect(() => {
    peer.peer && peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded)
    return () => {
      peer.peer && peer.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
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
      <h1 className="text-xl text-green-500">{remoteSocketId ? 'Connected' : 'No one in room'}</h1>
      {myStream && <button className='px-6 py-2 bg-opacity-80 border-gray-300 rounded-3xl text-slate-950 transition-colors bg-white border-2 hover:bg-slate-900 hover:text-white' onClick={sendStream}>Send Stream</button>}
      {remoteSocketId &&
        <button className='px-6 py-2 bg-opacity-80 border-gray-300 border-2 rounded-3xl text-slate-950 transition-colors bg-white  hover:bg-slate-900 hover:text-white' onClick={handleCallUser}>CALL </button>
      }

      <div className=' relative'>

        <div className='flex flex-col justify-center items-center absolute  right-8 bottom-8 '>
          {/* {myStream && <h1 className="text-5xl">Your Stream</h1>} */}
          {myStream && <ReactPlayer playing muted height='120px' width='150px' url={myStream} />}
        </div>

        <div className='flex flex-col justify-center items-center border border-slate-400 rounded-sm p-6 '>
          {/* {remoteStream && <h1 className="text-5xl">Remote Stream</h1>} */}
          {remoteStream && <ReactPlayer playing height='600px' width='800px' url={remoteStream} />}
        </div>

      </div>

    </div>

  );
}