/*-------------------------------------------------------------------------
hw_6.js - Dual Viewport: Perspective (FP) + Orthographic (Top-Down)

- 하나의 canvas를 좌/우로 분할해 동일한 3D 장면을 두 projection으로 표시
- Left  : First-Person Camera, Perspective projection
- Right : 고정 Top-Down Camera, Orthographic projection
- 5개의 cube를 지정된 위치에 배치 (각각 독립적인 model matrix)
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader;
let startTime;
let lastFrameTime;
let isInitialized = false;

// ── 행렬 ─────────────────────────────────────────────────────────────────────
let fpViewMatrix   = mat4.create();   // FP 카메라 view (매 프레임 갱신)
let fpProjMatrix   = mat4.create();   // Perspective projection (고정)
let orthoViewMatrix = mat4.create();  // Top-down view (고정)
let orthoProjMatrix = mat4.create();  // Orthographic projection (고정)

// ── 씬 오브젝트 ───────────────────────────────────────────────────────────────
const CUBE_POSITIONS = [
    [0.0,  0.0,  0.0],
    [2.0,  0.5, -3.0],
   [-1.5, -0.5, -2.5],
    [3.0,  0.0, -4.0],
   [-3.0,  0.0,  1.0],
];

const cubes = CUBE_POSITIONS.map(() => new Cube(gl));
const modelMatrices = CUBE_POSITIONS.map(pos => {
    const m = mat4.create();
    mat4.translate(m, m, pos);
    return m;
});
const axes = new Axes(gl, 5.0);

// ── FP 카메라 상태 ────────────────────────────────────────────────────────────
let camPos   = vec3.fromValues(0, 2, 7);   // 초기 카메라 위치
let camFront = vec3.fromValues(0, 0, -1);
let camUp    = vec3.fromValues(0, 1, 0);
let yaw   = -90.0;
let pitch =   0.0;

const CAM_SPEED = 4.0;        // 이동 속도 (unit/sec)
const CAM_SENS  = 0.08;       // 마우스 감도

// WASD + Q(위)/E(아래) 키 입력
const keys = { w: false, a: false, s: false, d: false, q: false, e: false };

let textLine1;

// ── 초기화 ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(ok => {
        if (!ok) { console.log('program terminated'); return; }
        isInitialized = true;
    }).catch(err => console.error('program terminated with error:', err));
});

// ── 키보드 ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
});
document.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
});

// ── Pointer Lock + 마우스 회전 ────────────────────────────────────────────────
canvas.addEventListener('click', () => canvas.requestPointerLock());

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', onMouseMove);
    } else {
        document.removeEventListener('mousemove', onMouseMove);
    }
});

function onMouseMove(e) {
    yaw   +=  e.movementX * CAM_SENS;
    pitch += -e.movementY * CAM_SENS;
    pitch = Math.max(-89.0, Math.min(89.0, pitch));

    // 구면 좌표계로 front 벡터 갱신
    const front = vec3.create();
    front[0] = Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    front[1] = Math.sin(glMatrix.toRadian(pitch));
    front[2] = Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    vec3.normalize(camFront, front);
}

// ── WebGL 초기화 ──────────────────────────────────────────────────────────────
function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }
    canvas.width  = 1400;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);
    return true;
}

async function initShader() {
    const vsSource = await readShaderFile('shVert.glsl');
    const fsSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vsSource, fsSource);
}

// ── viewport 하나 그리기 ──────────────────────────────────────────────────────
function drawViewport(x, bgColor, viewMat, projMat) {
    const half = canvas.width / 2;

    gl.viewport(x, 0, half, canvas.height);
    gl.scissor( x, 0, half, canvas.height);
    gl.clearColor(...bgColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shader.use();
    for (let i = 0; i < cubes.length; i++) {
        shader.setMat4('u_model',      modelMatrices[i]);
        shader.setMat4('u_view',       viewMat);
        shader.setMat4('u_projection', projMat);
        cubes[i].draw(shader);
    }
    axes.draw(viewMat, projMat);
}

// ── 렌더 루프 ─────────────────────────────────────────────────────────────────
function render() {
    const now       = Date.now();
    const deltaTime = (now - lastFrameTime) / 1000.0;
    lastFrameTime   = now;

    // 카메라 이동
    const dist = CAM_SPEED * deltaTime;
    const right = vec3.create();
    vec3.cross(right, camFront, camUp);
    vec3.normalize(right, right);

    if (keys['w']) vec3.scaleAndAdd(camPos, camPos, camFront,  dist);
    if (keys['s']) vec3.scaleAndAdd(camPos, camPos, camFront, -dist);
    if (keys['a']) vec3.scaleAndAdd(camPos, camPos, right,    -dist);
    if (keys['d']) vec3.scaleAndAdd(camPos, camPos, right,     dist);
    if (keys['q']) vec3.scaleAndAdd(camPos, camPos, camUp,     dist);  // 위로
    if (keys['e']) vec3.scaleAndAdd(camPos, camPos, camUp,    -dist);  // 아래로

    // FP view matrix 갱신
    const target = vec3.add(vec3.create(), camPos, camFront);
    mat4.lookAt(fpViewMatrix, camPos, target, camUp);

    // 좌: Perspective (FP)
    drawViewport(0,    [0.1, 0.2, 0.3, 1.0], fpViewMatrix,    fpProjMatrix);
    // 우: Orthographic (Top-Down)
    drawViewport(canvas.width / 2, [0.05, 0.15, 0.2, 1.0], orthoViewMatrix, orthoProjMatrix);

    // HUD 갱신
    const [px, py, pz] = [camPos[0], camPos[1], camPos[2]].map(v => v.toFixed(1));
    updateText(textLine1,
        `Camera pos: (${px}, ${py}, ${pz}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);

    requestAnimationFrame(render);
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
    try {
        if (!initWebGL()) throw new Error('Failed to initialize WebGL');

        await initShader();

        // Perspective projection (left viewport)
        mat4.perspective(fpProjMatrix,
            glMatrix.toRadian(60),
            (canvas.width / 2) / canvas.height,  // 700/700 = 1.0
            0.1, 100.0
        );

        // Top-down orthographic projection (right viewport)
        mat4.lookAt(orthoViewMatrix, [0, 15, 0], [0, 0, 0], [0, 0, -1]);
        mat4.ortho(orthoProjMatrix, -10, 10, -10, 10, 0.1, 100.0);

        startTime     = Date.now();
        lastFrameTime = startTime;

        textLine1 = setupText(canvas, '', 1);
        setupText(canvas, 'WASD: move | Mouse: rotate (click to lock) | ESC: unlock', 2);
        setupText(canvas, 'Left: Perspective | Right: Orthographic (Top-Down)', 3);

        requestAnimationFrame(render);
        return true;

    } catch (err) {
        console.error('Failed to initialize program:', err);
        alert('Failed to initialize program');
        return false;
    }
}