'use strict';

/* ──────────────────────────────────────────────────
   Shader source loader (fetch → string)
────────────────────────────────────────────────── */
async function loadText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Cannot load: ${url}`);
    return res.text();
}

/* ──────────────────────────────────────────────────
   WebGL helpers
────────────────────────────────────────────────── */
function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createProgram(gl, vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, vsSrc, gl.VERTEX_SHADER));
    gl.attachShader(p, compileShader(gl, fsSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Link error:', gl.getProgramInfoLog(p));
        return null;
    }
    return p;
}

async function main() {
    const canvas = document.getElementById('c');
    const gl     = canvas.getContext('webgl2');
    const hud    = document.getElementById('hud');
    if (!gl) { alert('WebGL2를 지원하지 않는 브라우저입니다.'); return; }

    const [cubeVS, cubeFS, lineVS, lineFS] = await Promise.all([
        loadText('shVert.glsl'),
        loadText('shFrag.glsl'),
        loadText('shLineVert.glsl'),
        loadText('shLineFrag.glsl'),
    ]);

    const cubeProg = createProgram(gl, cubeVS, cubeFS);
    const lineProg = createProgram(gl, lineVS, lineFS);

    const cubeVerts = new Float32Array([
        // +Z front
        -0.5,-0.5, 0.5,  0, 0, 1,    0.5,-0.5, 0.5,  0, 0, 1,    0.5, 0.5, 0.5,  0, 0, 1,
        -0.5,-0.5, 0.5,  0, 0, 1,    0.5, 0.5, 0.5,  0, 0, 1,   -0.5, 0.5, 0.5,  0, 0, 1,
        // -Z back
         0.5,-0.5,-0.5,  0, 0,-1,   -0.5,-0.5,-0.5,  0, 0,-1,   -0.5, 0.5,-0.5,  0, 0,-1,
         0.5,-0.5,-0.5,  0, 0,-1,   -0.5, 0.5,-0.5,  0, 0,-1,    0.5, 0.5,-0.5,  0, 0,-1,
        // +Y top
        -0.5, 0.5, 0.5,  0, 1, 0,    0.5, 0.5, 0.5,  0, 1, 0,    0.5, 0.5,-0.5,  0, 1, 0,
        -0.5, 0.5, 0.5,  0, 1, 0,    0.5, 0.5,-0.5,  0, 1, 0,   -0.5, 0.5,-0.5,  0, 1, 0,
        // -Y bottom
        -0.5,-0.5,-0.5,  0,-1, 0,    0.5,-0.5,-0.5,  0,-1, 0,    0.5,-0.5, 0.5,  0,-1, 0,
        -0.5,-0.5,-0.5,  0,-1, 0,    0.5,-0.5, 0.5,  0,-1, 0,   -0.5,-0.5, 0.5,  0,-1, 0,
        // +X right
         0.5,-0.5, 0.5,  1, 0, 0,    0.5,-0.5,-0.5,  1, 0, 0,    0.5, 0.5,-0.5,  1, 0, 0,
         0.5,-0.5, 0.5,  1, 0, 0,    0.5, 0.5,-0.5,  1, 0, 0,    0.5, 0.5, 0.5,  1, 0, 0,
        // -X left
        -0.5,-0.5,-0.5, -1, 0, 0,   -0.5,-0.5, 0.5, -1, 0, 0,   -0.5, 0.5, 0.5, -1, 0, 0,
        -0.5,-0.5,-0.5, -1, 0, 0,   -0.5, 0.5, 0.5, -1, 0, 0,   -0.5, 0.5,-0.5, -1, 0, 0,
    ]);

    const cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);
        const cubeVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
        gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
        const STRIDE      = 6 * 4;
        const aPosCube    = gl.getAttribLocation(cubeProg, 'aPos');
        const aNormalCube = gl.getAttribLocation(cubeProg, 'aNormal');
        gl.enableVertexAttribArray(aPosCube);
        gl.vertexAttribPointer(aPosCube,    3, gl.FLOAT, false, STRIDE, 0);
        gl.enableVertexAttribArray(aNormalCube);
        gl.vertexAttribPointer(aNormalCube, 3, gl.FLOAT, false, STRIDE, 12);
    gl.bindVertexArray(null);


    const axisVerts = new Float32Array([
        -10, 0,  0,  1,0,0,   10, 0,  0,  1,0,0,   // X
          0, 0,  0,  0,1,0,    0,10,  0,  0,1,0,   // Y
          0, 0,-10,  0,0,1,    0, 0, 10,  0,0,1,   // Z
    ]);

    const axisVAO = gl.createVertexArray();
    gl.bindVertexArray(axisVAO);
        const axisVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axisVBO);
        gl.bufferData(gl.ARRAY_BUFFER, axisVerts, gl.STATIC_DRAW);
        const ASTRIDE    = 6 * 4;
        const aPosLine   = gl.getAttribLocation(lineProg, 'aPos');
        const aColorLine = gl.getAttribLocation(lineProg, 'aColor');
        gl.enableVertexAttribArray(aPosLine);
        gl.vertexAttribPointer(aPosLine,   3, gl.FLOAT, false, ASTRIDE, 0);
        gl.enableVertexAttribArray(aColorLine);
        gl.vertexAttribPointer(aColorLine, 3, gl.FLOAT, false, ASTRIDE, 12);
    gl.bindVertexArray(null);


    const cubePositions = [
        [ 0.0,  0.0,  0.0],
        [ 2.0,  0.5, -3.0],
        [-1.5, -0.5, -2.5],
        [ 3.0,  0.0, -4.0],
        [-3.0,  0.0,  1.0],
    ];
    const cubeColors = [
        [1.0,  0.25, 0.25],   // red
        [0.25, 1.0,  0.25],   // green
        [0.25, 0.5,  1.0 ],   // blue
        [1.0,  0.85, 0.2 ],   // yellow
        [0.85, 0.25, 1.0 ],   // purple
    ];

    const cam = {
        pos:   vec3.fromValues(0, 0, 5),
        yaw:   -90.0,
        pitch:   0.0,
        speed:   5.0,
        sens:    0.1,
    };
    const keys = {};
    let pointerLocked = false;

    canvas.addEventListener('click', () => {
        if (!pointerLocked) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', e => {
        if (!pointerLocked) return;
        cam.yaw   +=  e.movementX * cam.sens;
        cam.pitch -= e.movementY * cam.sens;
        cam.pitch = Math.max(-89, Math.min(89, cam.pitch));
    });
    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'Escape') document.exitPointerLock();
    });
    document.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;
    });

    function getCamFront() {
        const yr = cam.yaw   * Math.PI / 180;
        const pr = cam.pitch * Math.PI / 180;
        return vec3.fromValues(
            Math.cos(pr) * Math.cos(yr),
            Math.sin(pr),
            Math.cos(pr) * Math.sin(yr)
        );
    }

    const projLeft = mat4.create();
    mat4.perspective(projLeft, 60 * Math.PI / 180, 1.0, 0.1, 100.0);

    const projRight = mat4.create();
    mat4.ortho(projRight, -10, 10, -10, 10, 0.1, 100.0);

    const viewRight = mat4.create();
    mat4.lookAt(viewRight, [0, 15, 0], [0, 0, 0], [0, 0, -1]);

    const CU = {
        model:    gl.getUniformLocation(cubeProg, 'uModel'),
        view:     gl.getUniformLocation(cubeProg, 'uView'),
        proj:     gl.getUniformLocation(cubeProg, 'uProj'),
        color:    gl.getUniformLocation(cubeProg, 'uColor'),
        lightPos: gl.getUniformLocation(cubeProg, 'uLightPos'),
    };
    const LU = {
        view: gl.getUniformLocation(lineProg, 'uView'),
        proj: gl.getUniformLocation(lineProg, 'uProj'),
    };

    function drawScene(view, proj) {
        // Cubes
        gl.useProgram(cubeProg);
        gl.uniformMatrix4fv(CU.view, false, view);
        gl.uniformMatrix4fv(CU.proj, false, proj);
        gl.uniform3f(CU.lightPos, 5.0, 10.0, 5.0);
        gl.bindVertexArray(cubeVAO);
        for (let i = 0; i < cubePositions.length; i++) {
            const m = mat4.create();
            mat4.translate(m, m, cubePositions[i]);
            gl.uniformMatrix4fv(CU.model, false, m);
            gl.uniform3fv(CU.color, cubeColors[i]);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        gl.bindVertexArray(null);

        // Axis lines
        gl.useProgram(lineProg);
        gl.uniformMatrix4fv(LU.view, false, view);
        gl.uniformMatrix4fv(LU.proj, false, proj);
        gl.bindVertexArray(axisVAO);
        gl.drawArrays(gl.LINES, 0, 6);
        gl.bindVertexArray(null);
    }

    function setupText() { }

    function updateText(pos, yaw, pitch) {
        const f = (v, d = 1) => v.toFixed(d);
        hud.textContent =
            `Camera pos: (${f(pos[0])}, ${f(pos[1])}, ${f(pos[2])}) | Yaw: ${f(yaw, 1)}° | Pitch: ${f(pitch, 1)}°\n` +
            `WASD: move camera | Mouse: look (click to lock) | ESC: unlock\n` +
            `Left: Perspective (FP) Right: Orthographic (Top-Down)`;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);
    setupText();
    let lastTime = 0;

    function render(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        const front   = getCamFront();
        const right   = vec3.create();
        const worldUp = vec3.fromValues(0, 1, 0);
        vec3.cross(right, front, worldUp);
        vec3.normalize(right, right);
        const spd = cam.speed * dt;
        if (keys['w']) vec3.scaleAndAdd(cam.pos, cam.pos, front,  spd);
        if (keys['s']) vec3.scaleAndAdd(cam.pos, cam.pos, front, -spd);
        if (keys['a']) vec3.scaleAndAdd(cam.pos, cam.pos, right, -spd);
        if (keys['d']) vec3.scaleAndAdd(cam.pos, cam.pos, right,  spd);

        const target  = vec3.create();
        vec3.add(target, cam.pos, front);
        const viewLeft = mat4.create();
        mat4.lookAt(viewLeft, cam.pos, target, [0, 1, 0]);

        gl.viewport(0, 0, 700, 700);
        gl.scissor( 0, 0, 700, 700);
        gl.clearColor(0.1, 0.2, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawScene(viewLeft, projLeft);

        gl.viewport(700, 0, 700, 700);
        gl.scissor( 700, 0, 700, 700);
        gl.clearColor(0.05, 0.15, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawScene(viewRight, projRight);

        updateText(cam.pos, cam.yaw, cam.pitch);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main().catch(err => console.error('Init failed:', err));
