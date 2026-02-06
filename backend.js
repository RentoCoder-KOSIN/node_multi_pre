const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app); // ← これが Socket.IO 用
const { Server } = require("socket.io");
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 }); // ← server に紐づける
const port = 3000;

app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

const backEndPlayers = {};
const backEndProjectiles = {};
const SPEED = 10;
const RADIUS = 10;
const PROJECTILE_RADIUS = 5;
let projectileId = 0;
// Socket.IO 接続処理
io.on("connection", (socket) => {
    //console.log("a user connected");


    io.emit("updatePlayers", backEndPlayers);



    socket.on("keydown", ({ keycode, sequenceNumber }) => {
        const player = backEndPlayers[socket.id];
        if (!player) return;


        player.sequenceNumber = sequenceNumber;

        switch (keycode) {
            case "up":
                player.y -= SPEED;
                break;
            case "left":
                player.x -= SPEED;
                break;
            case "down":
                player.y += SPEED;
                break;
            case "right":
                player.x += SPEED;
                break;
        }

        const playerSides = {
            left: player.x - player.radius,
            right: player.x + player.radius,
            top: player.y - player.radius,
            bottom: player.y + player.radius,
        }
        if (playerSides.left < 0) player.x = player.radius;
        if (playerSides.right > player.canvas.width) player.x = player.canvas.width - player.radius;
        if (playerSides.top < 0) player.y = player.radius;
        if (playerSides.bottom > player.canvas.height) player.y = player.canvas.height - player.radius;
    });

    socket.on("shoot", ({ x, y, angle }) => {
        projectileId++;
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }
        backEndProjectiles[projectileId] = {
            x, y, velocity, playerId: socket.id
        }
    });

    socket.on("initGame", ({ username, width, height, devicePixelRatio }) => {
        backEndPlayers[socket.id] = {
            x: Math.random() * 1024,
            y: Math.random() * 576,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            sequenceNumber: 0,
            score: 0,
            username
        }

        // Convert received sizes (which may be device pixels) to logical CSS pixels
        const dpr = devicePixelRatio || 1;
        backEndPlayers[socket.id].canvas = {
            width: Math.round((width || 1024) / dpr),
            height: Math.round((height || 576) / dpr),
            rawWidth: width,
            rawHeight: height,
            devicePixelRatio: dpr
        }
        backEndPlayers[socket.id].radius = RADIUS;


        io.emit("updatePlayers", backEndPlayers);
    })


    socket.on("disconnect", (reason) => {
        //console.log(`user disconnected: ${socket.id} ${reason}`);

        delete backEndPlayers[socket.id];
        io.emit("updatePlayers", backEndPlayers);
    });

    //console.log(backEndPlayers);
});


setInterval(() => {
    for (const id in backEndProjectiles) {
        backEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
        backEndProjectiles[id].y += backEndProjectiles[id].velocity.y;

        const PROJECTILE_RADIUS = 5;
        if (backEndProjectiles[id].x - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width
            || backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0
            || backEndProjectiles[id].y - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height
            || backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
        ) {
            delete backEndProjectiles[id];
            continue;
        }

        for (const playerId in backEndPlayers) {
            const backEndPlayer = backEndPlayers[playerId];

            const DISTANCE = Math.hypot(
                backEndProjectiles[id].x - backEndPlayer.x,
                backEndProjectiles[id].y - backEndPlayer.y
            );
            if (DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius && backEndProjectiles[id].playerId !== playerId) {
                backEndPlayers[backEndProjectiles[id].playerId].score += 1;
                delete backEndProjectiles[id];
                delete backEndPlayers[playerId];
                break;
            }
        }
    }
    io.emit("updateProjectiles", backEndProjectiles);
    io.emit("updatePlayers", backEndPlayers);
}, 15)

server.listen(port, () => {
    //console.log("Server listening on port 3000");
});



//console.log("server load");
