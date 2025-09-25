import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
    alert('WebGL 2 is not supported by your browser.');
}

const keycurr = Object.create(null);
let shader;           // Shader program wrapper
let vao;              // Vertex Array Object
let vbo;              // Vertex Buffer Object
let textOverlay;

let coorx = 0.0, coory = 0.0; 
let verticalFlip = 1.0;      

// sq 0.2)
const baseQuad = new Float32Array([
    -0.1, -0.1, 0.0,  // bl
     0.1, -0.1, 0.0,  // br
     0.1,  0.1, 0.0,  // tr
    -0.1,  0.1, 0.0   // tl
]);

function initWebGL() {
    // size
    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

async function initShader() {
    const vs = await readShaderFile('shVert.glsl');
    const fs = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vs, fs);
}

// while press
function setupKeyboard() {
    const keys = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    window.addEventListener('keydown', (e) => {
        if (keys.has(e.key)) {
            keycurr[e.key] = true;
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (keys.has(e.key)) {
            keycurr[e.key] = false;
            e.preventDefault();
        }
    });
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // update
    gl.bufferData(gl.ARRAY_BUFFER, baseQuad, gl.DYNAMIC_DRAW);

    // mappin
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * 4, 0);

    gl.bindVertexArray(null);
}

function render() {
    // update
    if (keycurr['ArrowUp'])    coory += 0.01;
    if (keycurr['ArrowDown'])  coory -= 0.01;
    if (keycurr['ArrowLeft'])  coorx -= 0.01;
    if (keycurr['ArrowRight']) coorx += 0.01;

    // clampi
    coorx = Math.max(-0.9, Math.min(0.9, coorx));
    coory = Math.max(-0.9, Math.min(0.9, coory));

    // update
    const moved = new Float32Array(baseQuad.length);
    for (let i = 0; i < baseQuad.length; i += 3) {
        moved[i]   = baseQuad[i]   + coorx;
        moved[i+1] = baseQuad[i+1] + coory;
        moved[i+2] = baseQuad[i+2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, moved);

    // draw
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();
    // fragment shader
    shader.setVec4('uColor', [1.0, 0.0, 0.0, 1.0]);
    // vertex shader
    shader.setFloat('verticalFlip', verticalFlip);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}

async function main() {
    try {
    initWebGL();
        await initShader();
        setupKeyboard();
        setupBuffers();

    textOverlay = setupText(canvas, 'Use arrow keys to move the rectangle', 1);

    render();
    return true;

    }
    catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
