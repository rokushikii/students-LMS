class RippleTank {
    constructor() {
        this.canvas = document.getElementById('ripple-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.time = 0;
        this.lastTime = performance.now();
        this.isPlaying = true;
        
        // Parameters
        this.scenario = 'reflection';
        this.baseSpeed = 100; // px per second
        this.frequency = 5;   // Hz
        
        // Scenario specific
        this.barrierAngle = 45; // degrees
        this.boundaryAngle = 30; // degrees
        this.depthRatio = 0.5; // v2 / v1
        this.gapSize = 20; // px
        
        // Bindings
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        
        // Initialization
        window.addEventListener('resize', this.resize);
        this.resize();
        this.setupControls();
        
        requestAnimationFrame(this.loop);
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    setupControls() {
        // UI Elements
        const scenarioInputs = document.querySelectorAll('input[name="scenario"]');
        const freqInput = document.getElementById('frequency');
        const barrierInput = document.getElementById('barrier-angle');
        const boundaryInput = document.getElementById('boundary-angle');
        const depthInput = document.getElementById('depth-ratio');
        const gapInput = document.getElementById('gap-size');

        // Sidebar toggles
        const scenarioControls = document.querySelectorAll('.scenario-controls');

        const updateScenario = (val) => {
            this.scenario = val;
            scenarioControls.forEach(el => el.classList.remove('active'));
            const activeControl = document.getElementById(`controls-${val}`);
            if (activeControl) activeControl.classList.add('active');
            // Reset time to avoid visual jumps when switching
            this.time = 0;
            this.updateEquation();
        };

        scenarioInputs.forEach(input => {
            input.addEventListener('change', (e) => updateScenario(e.target.value));
        });

        freqInput.addEventListener('input', (e) => {
            this.frequency = parseFloat(e.target.value);
            document.getElementById('frequency-val').textContent = `${this.frequency.toFixed(1)} Hz`;
            this.updateEquation();
        });

        barrierInput.addEventListener('input', (e) => {
            this.barrierAngle = parseFloat(e.target.value);
            document.getElementById('barrier-angle-val').textContent = `${this.barrierAngle}°`;
        });

        boundaryInput.addEventListener('input', (e) => {
            this.boundaryAngle = parseFloat(e.target.value);
            document.getElementById('boundary-angle-val').textContent = `${this.boundaryAngle}°`;
        });

        depthInput.addEventListener('input', (e) => {
            this.depthRatio = parseFloat(e.target.value);
            document.getElementById('depth-ratio-val').textContent = `${this.depthRatio.toFixed(1)}x`;
            this.updateEquation();
        });

        gapInput.addEventListener('input', (e) => {
            this.gapSize = parseFloat(e.target.value);
            document.getElementById('gap-size-val').textContent = `${this.gapSize} px`;
        });

        // Mobile Menu
        const menuBtn = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        this.updateEquation();
    }

    updateEquation() {
        let v = this.baseSpeed;
        let l = v / this.frequency;
        
        document.getElementById('eq-v').textContent = `${v.toFixed(0)} px/s`;
        document.getElementById('eq-f').textContent = `${this.frequency.toFixed(1)} Hz`;
        document.getElementById('eq-l').textContent = `${l.toFixed(1)} px`;

        const note = document.getElementById('eq-note');
        if (this.scenario === 'refraction') {
            let v2 = v * this.depthRatio;
            let l2 = v2 / this.frequency;
            note.innerHTML = `Shallow water:<br>v = ${v2.toFixed(0)} px/s, &lambda; = ${l2.toFixed(1)} px`;
        } else {
            note.textContent = "In constant depth, speed (v) is constant.";
        }
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        if (this.isPlaying) {
            this.time += dt;
        }

        this.draw();
        requestAnimationFrame(this.loop);
    }

    drawWaveLine(ctx, x1, y1, x2, y2, opacity) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawWaveArc(ctx, cx, cy, r, startAngle, endAngle, opacity) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    getWaveDistances(v) {
        const period = 1 / this.frequency;
        const distances = [];
        // Max distance we care about is roughly canvas width * 1.5
        const maxDist = this.canvas.width * 2;
        
        let t_k = this.time % period;
        while (true) {
            let d = t_k * v;
            if (d > maxDist) break;
            distances.push(d);
            t_k += period;
        }
        return distances;
    }

    draw() {
        const { ctx, canvas } = this;
        const W = canvas.width;
        const H = canvas.height;

        // Clear
        ctx.clearRect(0, 0, W, H);

        const v = this.baseSpeed;
        const distances = this.getWaveDistances(v);
        const cx = W / 2;
        const cy = H / 2;

        if (this.scenario === 'reflection') {
            const angleRad = this.barrierAngle * Math.PI / 180;
            
            // Define barrier points
            // Barrier passes through (cx, cy) with angle `angleRad` from vertical
            const dirX = Math.sin(angleRad);
            const dirY = Math.cos(angleRad);
            const bLen = Math.max(W, H) * 2;
            
            const bx1 = cx - dirX * bLen;
            const by1 = cy - dirY * bLen;
            const bx2 = cx + dirX * bLen;
            const by2 = cy + dirY * bLen;

            // Draw Incident Waves (Clipped to left of barrier)
            ctx.save();
            ctx.beginPath();
            // Create a polygon for the left side of the barrier
            // We know incident waves come from x=0
            if (this.barrierAngle === 0) {
                ctx.rect(0, 0, cx, H);
            } else {
                ctx.moveTo(0, 0);
                // Top intersection
                let topX = cx + (0 - cy) * Math.tan(angleRad);
                ctx.lineTo(topX, 0);
                // Bottom intersection
                let botX = cx + (H - cy) * Math.tan(angleRad);
                ctx.lineTo(botX, H);
                ctx.lineTo(0, H);
            }
            ctx.clip();

            distances.forEach(d => {
                this.drawWaveLine(ctx, d, 0, d, H, 0.8);
            });
            ctx.restore();

            // Draw Reflected Waves
            // Reflected waves are incident waves mirrored across the barrier
            ctx.save();
            
            // Clip to same region (we only see reflected waves after they hit)
            ctx.beginPath();
            if (this.barrierAngle === 0) {
                ctx.rect(0, 0, cx, H);
            } else {
                ctx.moveTo(0, 0);
                let topX = cx + (0 - cy) * Math.tan(angleRad);
                ctx.lineTo(topX, 0);
                let botX = cx + (H - cy) * Math.tan(angleRad);
                ctx.lineTo(botX, H);
                ctx.lineTo(0, H);
            }
            ctx.clip();

            // Transform: mirror across barrier line
            ctx.translate(cx, cy);
            // Rotate so barrier is on x-axis
            ctx.rotate(-angleRad + Math.PI/2);
            // Mirror Y
            ctx.scale(1, -1);
            // Rotate back
            ctx.rotate(angleRad - Math.PI/2);
            ctx.translate(-cx, -cy);

            distances.forEach(d => {
                // The reflected waves naturally spread, so we draw them slightly dimmer
                this.drawWaveLine(ctx, d, 0, d, H, 0.6);
            });
            ctx.restore();

            // Draw Barrier
            ctx.beginPath();
            ctx.moveTo(bx1, by1);
            ctx.lineTo(bx2, by2);
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();

        } else if (this.scenario === 'refraction') {
            const angleRad = this.boundaryAngle * Math.PI / 180;
            const v2 = v * this.depthRatio;
            
            // Boundary passes through (cx, cy)
            // x_b(y) = cx + (y - cy) * tan(angleRad)
            const getXb = (y) => cx + (y - cy) * Math.tan(angleRad);

            // Calculate refraction direction
            // Normal points left: n = (-cos(theta), sin(theta))
            const nx = -Math.cos(angleRad);
            const ny = Math.sin(angleRad);
            
            // Incident vector
            const ix = 1, iy = 0;
            
            // cos(i) = - (i . n)
            const cos_i = -(ix * nx + iy * ny);
            const sin_i = Math.sqrt(Math.max(0, 1 - cos_i * cos_i));
            
            const ratio = v2 / v;
            const sin_r = ratio * sin_i;
            const cos_r = Math.sqrt(Math.max(0, 1 - sin_r * sin_r));
            
            // Refracted direction
            const rx = ratio * ix + (ratio * cos_i - cos_r) * nx;
            const ry = ratio * iy + (ratio * cos_i - cos_r) * ny;

            distances.forEach(d => {
                // For each distance (wavefront), trace points along y
                ctx.beginPath();
                let started = false;
                
                for (let y = 0; y <= H; y += 10) {
                    const xb = getXb(y);
                    // Time wave reaches this boundary point
                    // d is the distance the wave WOULD have traveled in v1.
                    // So time since emission is d / v1.
                    // Time to reach boundary is xb / v1.
                    
                    let px, py;
                    if (d < xb) {
                        // Has not crossed boundary
                        px = d;
                        py = y;
                    } else {
                        // Has crossed boundary
                        // Extra distance to travel in region 2: (d - xb) * (v2 / v1)
                        const d2 = (d - xb) * ratio;
                        px = xb + d2 * rx;
                        py = y + d2 * ry;
                    }
                    
                    if (!started) {
                        ctx.moveTo(px, py);
                        started = true;
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                
                ctx.strokeStyle = `rgba(56, 189, 248, 0.8)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Draw Deep / Shallow regions background
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(W, 0);
            ctx.lineTo(getXb(0), 0);
            ctx.lineTo(getXb(H), H);
            ctx.lineTo(W, H);
            ctx.fillStyle = 'rgba(14, 165, 233, 0.1)'; // Shallow color
            ctx.fill();
            ctx.restore();

            // Draw Boundary line
            ctx.beginPath();
            ctx.moveTo(getXb(0), 0);
            ctx.lineTo(getXb(H), H);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);

        } else if (this.scenario === 'diffraction-gap') {
            const gap = this.gapSize;
            const y1 = cy - gap / 2;
            const y2 = cy + gap / 2;

            distances.forEach(d => {
                if (d <= cx) {
                    // Before barrier
                    this.drawWaveLine(ctx, d, 0, d, H, 0.8);
                } else {
                    // After barrier
                    const R = d - cx;
                    
                    // Arc top
                    this.drawWaveArc(ctx, cx, y1, R, -Math.PI/2, 0, 0.8);
                    
                    // Straight middle
                    if (gap > 0) {
                        this.drawWaveLine(ctx, cx + R, y1, cx + R, y2, 0.8);
                    }
                    
                    // Arc bottom
                    this.drawWaveArc(ctx, cx, y2, R, 0, Math.PI/2, 0.8);
                }
            });

            // Draw Barriers
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, y1);
            ctx.moveTo(cx, y2);
            ctx.lineTo(cx, H);
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();

        } else if (this.scenario === 'diffraction-edge') {
            distances.forEach(d => {
                if (d <= cx) {
                    // Before barrier
                    this.drawWaveLine(ctx, d, 0, d, H, 0.8);
                } else {
                    // After barrier
                    const R = d - cx;
                    
                    // Curve behind barrier (top half is barrier)
                    // Let's make barrier from y=0 to y=cy
                    this.drawWaveArc(ctx, cx, cy, R, -Math.PI/2, 0, 0.8);
                    
                    // Straight in unobstructed area (bottom half)
                    this.drawWaveLine(ctx, cx + R, cy, cx + R, H, 0.8);
                }
            });

            // Draw Barrier
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, cy);
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RippleTank();
});
