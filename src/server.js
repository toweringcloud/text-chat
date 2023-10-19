import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
	cors: {
		origin: ["https://admin.socket.io"],
		credentials: true,
	},
});

instrument(wsServer, {
	auth: false,
});

// Put all your backend code here.
function getPublicRooms() {
	const {
		sockets: {
			adapter: { sids, rooms },
		},
	} = wsServer;

	const publicRooms = [];
	rooms.forEach((_, key) => {
		if (sids.get(key) === undefined) {
			publicRooms.push(key);
		}
	});
	return publicRooms;
}

function getRoomCount(roomName) {
	return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
	socket.onAny((event) => {
		console.log(`Socket Event: ${event}`);
	});
	socket.on("enter_room", (room, done) => {
		socket.join(room);
		done(room);
		wsServer.sockets.emit("room_change", getPublicRooms());
	});
	socket.on("disconnecting", () => {
		socket.rooms.forEach((room) =>
			socket.to(room).emit("bye", socket.nickname, getRoomCount(room) - 1)
		);
	});
	socket.on("disconnect", () => {
		wsServer.sockets.emit("room_change", getPublicRooms());
	});
	socket.on("new_message", (msg, room, done) => {
		socket
			.to(room)
			.emit(
				"new_message",
				`${socket.nickname}: ${msg}`,
				getRoomCount(room)
			);
		done();
	});
	socket.on("nickname", (nick, room) => {
		socket["nickname"] = nick;
		socket.to(room).emit("welcome", socket.nickname, getRoomCount(room));
		wsServer.sockets.emit("room_change", getPublicRooms());
	});
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
