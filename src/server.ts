import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import type { ISocket, IUser } from "./types/common";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(__dirname + "/index.html");
});

class Users {
    private users: IUser[];

    constructor() {
        this.users = [];
    }

    public addUser(user: IUser) {
        this.users.push(user);
    }

    public removeUser(user: IUser) {
        this.users = this.users.filter((u) => u.id !== user.id);
    }

    public getUsers() {
        return this.users;
    }
}

const users = new Users();

io.on("connection", (socket: ISocket) => {
    const emitUpdateNewUsers = () => {
        const usernames = users.getUsers().map((u) => u.username);
        io.emit("update-new-users", usernames);
    };

    const emitTyping = (msg: string = "") => {
        socket.broadcast.emit("typing", msg);
    };

    socket.on("add-username", (username) => {
        socket.username = username;

        socket.broadcast.emit(
            "connected",
            `${socket.username} a user has joined a conversation`,
        );

        const newUser: IUser = {
            username,
            id: socket.id,
        };
        users.addUser(newUser);

        emitUpdateNewUsers();
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("typing", "");

        socket.broadcast.emit(
            "disconnected",
            `${socket.username} has been disconnected`,
        );

        const user: IUser = {
            username: socket.username as string,
            id: socket.id,
        };
        users.removeUser(user);

        emitUpdateNewUsers();
    });

    socket.on("send-message", (msg) => {
        io.emit("send-message", msg);
        // console.log(users.getUsers());
    });

    socket.on("typing", () => {
        emitTyping(`${socket.username} is typing...`);
    });

    socket.on("not-typing", () => {
        emitTyping("");
    });
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
