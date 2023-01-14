import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import type { ISocket } from "./types/common";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(__dirname + "/index.html");
});

// const users: string[] = []
class Users {
    private users: string[];

    constructor() {
        this.users = [];
    }

    public addUser(username: string) {
        this.users.push(username);
    }

    public removeUser(username: string) {
        this.users = this.users.filter((user) => user !== username);
    }

    public getUsers() {
        return this.users;
    }
}

const users = new Users();

io.on("connection", (socket: ISocket) => {
    socket.on("add-username", (username) => {
        socket.username = username;

        socket.broadcast.emit(
            "connected",
            `${socket.username} a user has joined a conversation`,
        );

        users.addUser(username);

        io.emit("update-new-users", users.getUsers());
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("typing", "");

        socket.broadcast.emit(
            "disconnected",
            `${socket.username} has been disconnected`,
        );

        users.removeUser(socket.username as string);

        io.emit("update-new-users", users.getUsers());
    });

    socket.on("send-message", (msg) => {
        socket.emit("send-message", msg);
        // console.log(users.getUsers());
    });

    socket.on("typing", () => {
        socket.broadcast.emit("typing", `${socket.username} is typing...`);
    });

    socket.on("not-typing", () => {
        socket.broadcast.emit("typing", "");
    })
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
