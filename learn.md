# Web Socket

I'm using socket.io here

Start server with `yarn dev` and navigate to `localhost:3000`

Features but not limited:
    - Broadcast a message to connected users when someone connects or disconnects
    - Add support for nicknames
    - Don’t send the same message to the user that sent it. Instead, append the message directly as soon as he/she presses enter
    - Add “{user} is typing” functionality
    - Support multiple typing tracker
    - Show who’s online
    - Add private messaging


## socket.io

We first listen to the connection using `io.on("connection", socket => {})`. Then from the connection, we can get each socket that is currently connecting with the server.

The client (front-end) can simply connect it by initializing the `io()` in the web page to trigger the connection


## Create my own event

Each socket that is currently connected from front-end can send anything through any event by simply creating the event name through `emit`.

Then server should listen to this event and catch and data sent form it through `on`.

```typescript
// frontend
socket.emit("chat message", "hello from client")

// backend
socket.on("chat message", msg => console.log(msg))
```


## Broadcast the emitted message

when a socket client has emit the message. The io from server that receive it could send the message to all of the client back

```typescript
// backend
socket.on("chat message", msg => {
    io.emit("chat message", msg)
})

// frontend
socket.on("chat message", msg => {
    // write to DOM
})
```

We can also broadcast message except to the socket-self that send it
```typescript
// backend
socket.on("disconnect", () => {
    socket.broadcast.emit("disconnected", "a user has been disconnected")
})

// frontend
socket.on("disconnected", (msg) => {
    // write to dom the `msg`
})
```

## Identifying the user

We identified it manually by keeping the `username` (example) in a bucket. Then whenever someone leaves or disconnected, we just filter the array 
to exclude him


## User is typing indicator

Trigger by `socket.emit("typing")` on client and server broadcast it. On client, we make sure to not call typing event over and over
by setting a timeout on when user finished typing for 5 second. If after 5 seconds user not typing anything, the timeout will then emit
`socket.emit("not-typing")` event. 

The indicator is held by the message broadcasted by server from `.on("typing")`, and client render it to DOM. When `not-typing` is emitted,
the server broadcast to typing but send empty string (`""`) as the message (`socket.broadcast.emit("typing", "")`)

## Show who's online

On server, we emit the event anytime new user has been connected or disconnected. On client we listen to this event to render the new users currently online
```typescript
// backend
io.on("connection", (socket: ISocket) => {
    socket.on("add-username", (username) => {
        io.emit("update-new-users", users.getUsers())
    })
})

// frontend
socket.on("update-new-users", function (users) {
    renderUsers(users)
})
```

## Send private message

Private message can be sent from server using `.to(id)` before emit. Then, client (the `.to(id)`) just need to listen and render the message since 
the emitted only received to him

```typescript
// client
socket.emit("send-private-message", {
    msg: input.value,
    to: sendTo.id,
})

// server
socket.on("send-private-message", ({ msg, to }) => {
    socket
        .to(to)
        .emit("new-message", msg + ` (private: ${socket.username})`)
})
```

## Check who are typings

Each user object on server should have `isTyping` property. Typing event now should send list of all users who are typing instead of the message.
Then the client should handle on how it should show this "who are typing" text on indicator. Client can filter to exclude himself from this list so that 
it should not show if himself is currently typing on his own indicator
