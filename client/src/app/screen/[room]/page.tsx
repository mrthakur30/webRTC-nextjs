'use client'
import { useSocket } from '@/context/SocketProvider'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';
import { Snippet } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

type MySocketType = {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};


export default function Screen(props: any) {
  const socket: MySocketType = useSocket() as MySocketType;
  const roomId = props.params.room;
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audio, setAudio] = useState<boolean>(true);
  const [video, setVideo] = useState<boolean>(true);
  const router = useRouter();
  const [isPhone, setIsPhone] = useState(false);

  const updateScreenSize = () => {
    const screenWidth = window.innerWidth;

    console.log(`Screen Width: ${screenWidth}`);

    if (screenWidth <= 768) {
      setIsPhone(true);
    } else {
      setIsPhone(false);
    }
  };

  useEffect(() => {
    updateScreenSize();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateScreenSize);
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []); 



  // useEffect(()=>{},[audio,video])

  const isConnected = useMemo(() => {
    return (myStream && remoteStream)
  }, [remoteStream, myStream])

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    const offer = await peer.getOffer();
    socket.emit('call:user', { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);


  const handleUserJoined = useCallback(async (props: any) => {
    console.log(props);
    const { participantId } = props
    setRemoteSocketId(participantId);
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


  const endCall = async () => {

    if (myStream) {
      for (const track of myStream.getTracks()) {
        track.stop();
      }
      setMyStream(null);
    }

    if (remoteStream) {
      for (const track of remoteStream.getTracks()) {
        track.stop();
      }
      setRemoteStream(null);
    }
    window.location.href = '/'
  }

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
    <div className=" min-h-screen  min-w-screen  polka flex flex-col gap-6 items-center pt-10">

      <h1 className="text-xl text-green-500">{remoteSocketId ? 'Connected' : 'No one in room'}</h1>

      {!isConnected && <Snippet variant="solid" color="primary">{roomId}</Snippet>}

      {<div className='flex  flex-row-reverse gap-8'>
        {remoteSocketId &&
          <button className='px-6 py-2 bg-opacity-80 border-gray-300 border-2 rounded-3xl text-slate-950 transition-colors bg-white  hover:bg-slate-900 hover:text-white' onClick={handleCallUser}>CALL </button>
        }
      </div>}

      <div className='relative overflow-clip md:w-screen w-full h-full  '>
        {
          (myStream && remoteStream) &&
          <>
            <div className='flex flex-col justify-center items-center absolute  rounded-sm  md:right-20 right-0 bottom-6 '>
              <ReactPlayer playing muted height={isPhone ?70: 150 } width={isPhone ?120 : 220 }  url={myStream} />
            </div>

            <div className='flex flex-col justify-center items-center  md:border-slate-200 rounded-sm  md:border-4'>
              <ReactPlayer playing height={isPhone ?400: 500 } width={isPhone ?500 : 800 } url={remoteStream} />
            </div>
          </>
        }
      </div>

      {isConnected &&
        <div className='flex  gap-4'>
          <button className='px-6 py-2 my-2 bg-opacity-80 border-gray-300 border-2 rounded-3xl text-slate-100 transition-colors bg-red-500 hover:bg-red-600 hover:text-white' onClick={endCall}>End</button>
          <button onClick={() => setAudio(!audio)}>{audio ? <Mic  size={30} /> : <MicOff  size={30} />}</button>
          <button onClick={() => setVideo(!video)}>{video ? <Video  size={30} /> : <VideoOff  size={30} />}</button>
        </div>}
    </div>
  );
}