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
        this.isLightMode = false;
        
        // Scenario specific
        this.barrierAngle = 45; // degrees
        this.boundaryAngle = 30; // degrees
        this.depthRatio = 0.5; // v2 / v1
        this.gapSize = 20; // px
        this.sourceDistance = 100; // px
        
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

        const sourceDistanceInput = document.getElementById('source-distance');
        if (sourceDistanceInput) {
            sourceDistanceInput.addEventListener('input', (e) => {
                this.sourceDistance = parseFloat(e.target.value);
                document.getElementById('source-distance-val').textContent = `${this.sourceDistance} px`;
            });
        }

        // Motor Toggle
        const motorToggle = document.getElementById('motor-toggle');
        const tankGraphic = document.querySelector('.tank-graphic');
        tankGraphic.classList.add('vibrating'); // Initially on
        motorToggle.addEventListener('change', (e) => {
            this.isPlaying = e.target.checked;
            if (this.isPlaying) {
                tankGraphic.classList.add('vibrating');
            } else {
                tankGraphic.classList.remove('vibrating');
            }
        });

        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        themeToggle.addEventListener('click', () => {
            this.isLightMode = !this.isLightMode;
            document.body.classList.toggle('light-mode', this.isLightMode);
            sunIcon.style.display = this.isLightMode ? 'none' : 'block';
            moonIcon.style.display = this.isLightMode ? 'block' : 'none';
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
        
        document.documentElement.style.setProperty('--setup-wave-width', `${l}px`);
        document.documentElement.style.setProperty('--setup-anim-speed', `${1 / this.frequency}s`);
        
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
        const color = this.isLightMode ? `rgba(15, 23, 42, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawWaveArc(ctx, cx, cy, r, startAngle, endAngle, opacity) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        const color = this.isLightMode ? `rgba(15, 23, 42, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawArrow(ctx, x1, y1, x2, y2, color, isDashed = false) {
        const headlen = 10;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        if (!isDashed) {
            ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (isDashed) ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
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

            // Directional Arrows
            const nx = -Math.cos(angleRad);
            const ny = Math.sin(angleRad);
            
            // Normal (Green dashed)
            this.drawArrow(ctx, cx - nx * 80, cy - ny * 80, cx + nx * 80, cy + ny * 80, '#22c55e', true);
            
            // Incident (Red)
            this.drawArrow(ctx, cx - 100, cy, cx, cy, '#ef4444');
            
            // Reflected (Red)
            const rx = -Math.cos(2 * angleRad);
            const ry = Math.sin(2 * angleRad);
            this.drawArrow(ctx, cx, cy, cx + rx * 100, cy + ry * 100, '#ef4444');

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

            // Directional Arrows
            // Normal (Green dashed)
            this.drawArrow(ctx, cx - nx * 80, cy - ny * 80, cx + nx * 80, cy + ny * 80, '#22c55e', true);
            
            // Incident (Red)
            this.drawArrow(ctx, cx - 100, cy, cx, cy, '#ef4444');
            
            // Refracted (Red)
            this.drawArrow(ctx, cx, cy, cx + rx * 100, cy + ry * 100, '#ef4444');

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
            ctx.strokeStyle = this.isLightMode ? '#334155' : '#f1f5f9';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Directional Arrows
            // Incident
            this.drawArrow(ctx, cx - 100, cy, cx, cy, '#ef4444');
            
            // Diffracted (3 arrows)
            const lambda = v / this.frequency;
            let diffAngle = 0;
            if (gap > 0) {
                const ratio = Math.min(1, lambda / gap);
                diffAngle = Math.asin(ratio);
            }
            
            // Straight
            this.drawArrow(ctx, cx, cy, cx + 100, cy, '#ef4444');
            if (diffAngle > 0.05) {
                // Up
                this.drawArrow(ctx, cx, cy, cx + 100 * Math.cos(diffAngle), cy - 100 * Math.sin(diffAngle), '#ef4444');
                // Down
                this.drawArrow(ctx, cx, cy, cx + 100 * Math.cos(diffAngle), cy + 100 * Math.sin(diffAngle), '#ef4444');
            }

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
            ctx.strokeStyle = this.isLightMode ? '#334155' : '#f1f5f9';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();

        } else if (this.scenario === 'interference') {
            const planH = H * 0.75;
            const graphH = H * 0.25;
            const graphY = H - graphH;
            
            // Draw Plan View (Top 75%)
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, W, planH);
            ctx.clip();

            const s1x = cx;
            const s1y = planH / 2 - this.sourceDistance / 2;
            const s2x = cx;
            const s2y = planH / 2 + this.sourceDistance / 2;

            // Draw sources
            ctx.fillStyle = this.isLightMode ? '#ef4444' : '#fca5a5';
            ctx.beginPath(); ctx.arc(s1x, s1y, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(s2x, s2y, 4, 0, Math.PI*2); ctx.fill();

            // Draw circular waves
            distances.forEach(d => {
                this.drawWaveArc(ctx, s1x, s1y, d, 0, Math.PI*2, 0.6);
                this.drawWaveArc(ctx, s2x, s2y, d, 0, Math.PI*2, 0.6);
            });
            ctx.restore();

            // Draw Cut-line
            const cutLineY = planH * 0.8;
            ctx.beginPath();
            ctx.moveTo(0, cutLineY);
            ctx.lineTo(W, cutLineY);
            ctx.strokeStyle = this.isLightMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Side View Graph (Bottom 25%)
            ctx.save();
            ctx.translate(0, graphY);
            
            // Background for graph area
            ctx.fillStyle = this.isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
            ctx.fillRect(0, 0, W, graphH);
            
            // Graph axis
            ctx.beginPath();
            ctx.moveTo(0, graphH / 2);
            ctx.lineTo(W, graphH / 2);
            ctx.strokeStyle = this.isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            ctx.stroke();

            // Calculate exact wave amplitude along cut-line
            const lambda = v / this.frequency;
            ctx.beginPath();
            let started = false;
            
            for (let x = 0; x < W; x += 2) {
                // Distance from sources to (x, cutLineY)
                const r1 = Math.hypot(x - s1x, cutLineY - s1y);
                const r2 = Math.hypot(x - s2x, cutLineY - s2y);
                
                // Amplitude A = sin(wt - kr)
                // w = 2*pi*f, k = 2*pi/lambda
                const phase1 = 2 * Math.PI * (this.frequency * this.time - r1 / lambda);
                const phase2 = 2 * Math.PI * (this.frequency * this.time - r2 / lambda);
                
                const A = Math.sin(phase1) + Math.sin(phase2); // Range [-2, 2]
                
                // Map A to graph height
                const gy = graphH / 2 - (A / 2.5) * (graphH / 2 * 0.8);
                
                if (!started) {
                    ctx.moveTo(x, gy);
                    started = true;
                } else {
                    ctx.lineTo(x, gy);
                }
            }
            
            ctx.strokeStyle = this.isLightMode ? '#0284c7' : '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            
            // Labels
            ctx.fillStyle = this.isLightMode ? '#475569' : '#94a3b8';
            ctx.font = '12px Inter';
            ctx.fillText("Plan View", 10, 20);
            ctx.fillText("Side View (Amplitude along dotted line)", 10, graphY + 20);

        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RippleTank();
});
