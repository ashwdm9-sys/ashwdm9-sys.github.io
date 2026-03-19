/*-------------------------------------------------------------------------
06_FlipTriangle.js

1) Change the color of the triangle by keyboard input
   : 'r' for red, 'g' for green, 'b' for blue
2) Flip the triangle vertically by keyboard input 'f'
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object

let offsetX = 0.0, offsetY = 0.0;
const STEP = 0.01;
const keysDown = {}; // 현재 눌려 있는 키를 저장

const half = 0.1;            // 변 0.2 → 반변
const LIMIT = 1.0 - half;    // 오프셋의 최대 절대값

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }


function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}


window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    keysDown[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    keysDown[event.key] = false;
    event.preventDefault();
  }
});


function setupBuffers() {

  const vertices = new Float32Array([
    -half, -half, 0.0,  // bottomleft
     half, -half, 0.0,  // bottomright
     half,  half, 0.0,  // topright
    -half,  half, 0.0,  // topleft
  ]);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}


function render() {

  if (keysDown['ArrowUp'])    offsetY += STEP;
  if (keysDown['ArrowDown'])  offsetY -= STEP;
  if (keysDown['ArrowLeft'])  offsetX -= STEP;
  if (keysDown['ArrowRight']) offsetX += STEP;

  offsetX = clamp(offsetX, -LIMIT, LIMIT);
  offsetY = clamp(offsetY, -LIMIT, LIMIT);

  updateText(textOverlay0, `offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})`);

  gl.clear(gl.COLOR_BUFFER_BIT);

  shader.setVec4("uColor", [1, 0, 0, 1]);
  shader.setVec2("uOffset", [offsetX, offsetY]);
  shader.setFloat("verticalFlip", 1.0);

  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(render);
}

let textOverlay0;

async function main() {
    try {

        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        await initShader();

        textOverlay0 = setupText(canvas, "Use arrow keys to move the rectangle", 1);

        setupBuffers(shader);
        shader.use();

        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
