import express, { Request, Response } from "express"
import http from "http"
import { Server, Socket } from "socket.io"

interface ISocket extends Socket {
    username?: string
}

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(__dirname + "/index.html")
})

const users: string[] = []

io.on("connection", (socket: ISocket) => {
    socket.on("disconnect", () => {
        socket.broadcast.emit("disconnected", `${socket.username} has been disconnected`)
    })

    socket.on("send-message", (msg) => {
        io.emit("send-message", msg)
    })

    socket.on("add-username", username => {
        socket.username = username
        socket.broadcast.emit("connected", `${socket.username} a user has joined a conversation`)
    })
})

server.listen(3000, () => {
    console.log("listening on *:3000")
})
