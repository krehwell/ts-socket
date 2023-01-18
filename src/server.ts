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

    public setUserIsTypingById(id: string, isTyping: boolean) {
        this.users = this.users.map((u) => {
            if (u.id === id) {
                u.isTyping = isTyping;
            }
            return u;
        });
    }

    public getListOfUsernamesTyping() {
        return this.users.filter((u) => u.isTyping).map((u) => u.username);
    }
}

const users = new Users();

io.on("connection", (socket: ISocket) => {
    const emitUpdateNewUsers = () => {
        io.emit("update-new-users", users.getUsers());
    };

    const emitTyping = (msg: string = "") => {
        io.emit("typing", msg);
    };

    const writeListOfUsernamesTyping = () => {
        const listOfUsernamesTyping = users.getListOfUsernamesTyping();
        const isOrAre = listOfUsernamesTyping.length > 1 ? "are" : "is";

        return listOfUsernamesTyping.join(", ") + ` ${isOrAre} typing...`;
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

        socket.emit("assign-id-to-self", socket.id);

        setTimeout(() => {
            emitUpdateNewUsers();
        }, 1000);
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
        io.emit("new-message", msg);
        // console.log(users.getUsers());
    });

    socket.on("send-private-message", ({ msg, to }) => {
        socket
            .to(to)
            .emit("new-message", msg + ` (private: ${socket.username})`);
    });

    socket.on("typing", () => {
        users.setUserIsTypingById(socket.id, true);
        emitTyping(writeListOfUsernamesTyping());
    });

    socket.on("not-typing", () => {
        users.setUserIsTypingById(socket.id, false);

        if (users.getListOfUsernamesTyping().length) {
            emitTyping(writeListOfUsernamesTyping());
        } else {
            emitTyping("");
        }
    });
});

server.listen(3000, () => {
    console.log("listening on http://localhost:3000");
});
