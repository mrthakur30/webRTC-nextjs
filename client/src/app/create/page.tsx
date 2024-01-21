'use client'

import { useSocket } from "@/context/SocketProvider";
import { useCallback, useEffect, useState } from "react"
import {useRouter} from "next/navigation"

type MySocketType = {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};

function CreateRoom() {
  return (
    <div>CreateRoom</div>
  )
}

export default CreateRoom