addEventListener("click", (event) => {
    if (!frontEndPlayers[socket.id]) return;
    // Get mouse position relative to the canvas in CSS pixels
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const playerPosition = {
        x: frontEndPlayers[socket.id].x,
        y: frontEndPlayers[socket.id].y
    };

    const angle = Math.atan2(
        mouseY - playerPosition.y,
        mouseX - playerPosition.x
    );

    // Send CSS-pixel coordinates (consistent with client drawing and server bounds)
    socket.emit("shoot", {
        x: playerPosition.x,
        y: playerPosition.y,
        angle
    });
});
