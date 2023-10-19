const socket = io();

const welcome = document.querySelector("#welcome");
const formRoom = welcome.querySelector("form");
const openRooms = document.querySelector("#rooms");
const room = document.querySelector("#room");
const formNick = room.querySelector("form#name");
const formMessage = room.querySelector("form#msg");

let roomName;
room.hidden = true;
formMessage.hidden = true;

function addMessage(msg) {
	const ul = room.querySelector("ul");
	const li = document.createElement("li");
	li.innerText = msg;
	ul.append(li);
}

function showRoom(name) {
	welcome.hidden = true;
	room.hidden = false;
	const h3 = room.querySelector("h3");
	h3.innerText = `Room ${name}`;
	roomName = name;
}

function handleRoomSubmit(event) {
	event.preventDefault();
	const input = formRoom.querySelector("input");
	socket.emit("enter_room", input.value, showRoom);
	input.value = "";
}
formRoom.addEventListener("submit", handleRoomSubmit);

function handleNicknameSubmit(event) {
	event.preventDefault();
	const input = formNick.querySelector("#name input");
	socket.emit("nickname", input.value, roomName);
	formNick.hidden = true;
	formMessage.hidden = false;
}
formNick.addEventListener("submit", handleNicknameSubmit);

function handleMessageSubmit(event) {
	event.preventDefault();
	const input = formMessage.querySelector("#msg input");
	const value = input.value;
	socket.emit("new_message", input.value, roomName, () => {
		addMessage(`You: ${value}`);
	});
	input.value = "";
}
formMessage.addEventListener("submit", handleMessageSubmit);

socket.on("welcome", (user, newCount) => {
	const h3 = room.querySelector("h3");
	h3.innerText = `Room ${roomName} (${newCount})`;
	addMessage(`${user || "Anon"} joined!`);
});

socket.on("bye", (user, newCount) => {
	const h3 = room.querySelector("h3");
	h3.innerText = `Room ${roomName} (${newCount})`;
	addMessage(`${user} left!`);
});

socket.on("new_message", (msg, newCount) => {
	const h3 = room.querySelector("h3");
	h3.innerText = `Room ${roomName} (${newCount})`;
	addMessage(msg);
});

socket.on("room_change", (rooms) => {
	const roomList = openRooms.querySelector("ul");
	if (!roomList) return;
	roomList.innerHTML = "";
	if (rooms.length === 0) {
		return;
	}
	rooms.forEach((room) => {
		const li = document.createElement("li");
		li.innerText = room;
		roomList.append(li);
	});
});
