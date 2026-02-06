const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const socket = io();
const scoreEl = document.querySelector("#scoreEl");

const devicePixelRatio = window.devicePixelRatio || 1;

// canvas.width = innerWidth * devicePixelRatio;
// canvas.height = innerHeight * devicePixelRatio;

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

ctx.scale(devicePixelRatio, devicePixelRatio);

const x = canvas.width / 2;
const y = canvas.height / 2;

const frontEndPlayers = {};
const frontEndProjectiles = {};

// socket.on("connect", () => {
//     socket.emit("initCanvas", {
//         width: canvas.width,
//         height: canvas.height,
//         devicePixelRatio
//     })
// });

socket.on("updateProjectiles", (backendProjectiles) => {
    for (const id in backendProjectiles) {
        const bp = backendProjectiles[id];

        if (!frontEndProjectiles[id]) {
            frontEndProjectiles[id] = new Projectile({
                x: bp.x,
                y: bp.y,
                radius: 5,
                color: frontEndPlayers[bp.playerId]?.color || "white",
                velocity: bp.velocity
            });
        } else {
            frontEndProjectiles[id].x = bp.x;
            frontEndProjectiles[id].y = bp.y;
        }
    }

    for (const id in frontEndProjectiles) {
        if (!backendProjectiles[id]) {
            delete frontEndProjectiles[id];
        }
    }
});



socket.on("updatePlayers", (backendPlayers) => {
    //console.log(backendPlayers);
    for (const id in backendPlayers) {
        const backendPlayer = backendPlayers[id];

        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player({
                x: backendPlayer.x,
                y: backendPlayer.y,
                radius: 10,
                color: backendPlayer.color,
                username: backendPlayer.username
            });

            document.querySelector("#playerLabels").innerHTML += `<div data-id="${id}" data-score="${backendPlayer.score}">${backendPlayer.username}: ${backendPlayer.score}</div>`;
        } else {

            const div = document.querySelector(`div[data-id="${id}"]`);
            if (div) {
                div.innerHTML = `${backendPlayer.username}: ${backendPlayer.score}`;
                div.setAttribute("data-score", backendPlayer.score);

            }

            const ParentDiv = document.querySelector("#playerLabels");
            const sortedChildren = Array.from(ParentDiv.children).sort((a, b) => {
                return b.getAttribute("data-score") - a.getAttribute("data-score");
            });

            sortedChildren.forEach(child => {
                ParentDiv.appendChild(child);
            });

            if (id == socket.id) {
                frontEndPlayers[id].x = backendPlayer.x;
                frontEndPlayers[id].y = backendPlayer.y;

                const lastBackendInputIndex = playerInputs.findIndex(input => {
                    return backendPlayer.sequenceNumber === input.sequenceNumber
                });

                playerInputs.splice(0, lastBackendInputIndex + 1);

                playerInputs.forEach(input => {
                    frontEndPlayers[id].x += input.dx;
                    frontEndPlayers[id].y += input.dy;
                });
            } else {
                frontEndPlayers[id].x = backendPlayer.x;
                frontEndPlayers[id].y = backendPlayer.y;

                gsap.to(frontEndPlayers[id], {
                    x: backendPlayer.x,
                    y: backendPlayer.y,
                    duration: 0.01,
                    ease: "linear"
                });
            }

        }
    }


    for (const id in frontEndPlayers) {
        if (!backendPlayers[id]) {
            const divToDelete = document.querySelector(`div[data-id="${id}"]`);
            divToDelete.parentNode.removeChild(divToDelete);

            if (id === socket.id) {
                document.querySelector("#usernameForm").style.display = "block";
            }

            delete frontEndPlayers[id];
        }
    }
    //console.log(frontEndPlayers);
});

let animationId
function animate() {
    animationId = requestAnimationFrame(animate);
    // Ensure we clear the entire canvas regardless of transform/scale
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (const id in frontEndPlayers) {
        const frontEndPlayer = frontEndPlayers[id];
        frontEndPlayer.draw();
    }

    for (const id in frontEndProjectiles) {
        const projectile = frontEndProjectiles[id];
        projectile.draw();
    }

}

animate();

const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
};

const SPEED = 10;
let playerInputs = [];
let sequenceNumber = 0;
setInterval(() => {
    if (keys.w.pressed) {
        sequenceNumber++;
        playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED });
        frontEndPlayers[socket.id].y -= SPEED;
        socket.emit("keydown", { keycode: "up", sequenceNumber });
    }
    if (keys.a.pressed) {
        sequenceNumber++;
        playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 });
        frontEndPlayers[socket.id].x -= SPEED;
        socket.emit("keydown", { keycode: "left", sequenceNumber });
    }
    if (keys.s.pressed) {
        sequenceNumber++;
        playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED });
        frontEndPlayers[socket.id].y += SPEED;
        socket.emit("keydown", { keycode: "down", sequenceNumber });
    }
    if (keys.d.pressed) {
        sequenceNumber++;
        playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 });
        frontEndPlayers[socket.id].x += SPEED;
        socket.emit("keydown", { keycode: "right", sequenceNumber });
    }
}, 15);


window.addEventListener("keydown", (e) => {
    if (!frontEndPlayers[socket.id]) return;
    switch (e.code) {
        case "KeyW":
        case "ArrowUp":
            keys.w.pressed = true;

            break;
        case "KeyA":
        case "ArrowLeft":
            keys.a.pressed = true;

            break;
        case "KeyS":
        case "ArrowDown":
            keys.s.pressed = true;

            break;
        case "KeyD":
        case "ArrowRight":
            keys.d.pressed = true;

            break;
    }
});

window.addEventListener("keyup", (e) => {
    if (!frontEndPlayers[socket.id]) return;
    switch (e.code) {
        case "KeyW":
        case "ArrowUp":
            keys.w.pressed = false;
            break;

        case "KeyA":
        case "ArrowLeft":
            keys.a.pressed = false;
            break;

        case "KeyS":
        case "ArrowDown":
            keys.s.pressed = false;
            break;

        case "KeyD":
        case "ArrowRight":
            keys.d.pressed = false;
            break;
    }
})


document.querySelector("#usernameForm").addEventListener("submit", (e) => {
    e.preventDefault(); // prevent page reload
    document.querySelector("#usernameContainer").style.display = "none";
    socket.emit("initGame", {
        username: document.querySelector("#usernameInput").value,
        width: canvas.width,
        height: canvas.height,
        devicePixelRatio: window.devicePixelRatio
    });

});
