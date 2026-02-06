class Player {
    constructor({ x, y, radius, color, username }) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.username = username;
    }

    draw() {
        ctx.font = "12px sans-serif";
        ctx.fillText(this.username, this.x - this.radius, this.y - this.radius - 10);
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
