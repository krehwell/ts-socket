import type { Socket } from "socket.io"

export interface ISocket extends Socket {
    username?: string
}

