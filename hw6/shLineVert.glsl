#version 300 es

in vec3 aPos;
in vec3 aColor;

uniform mat4 uView;
uniform mat4 uProj;

out vec3 vColor;

void main() {
    vColor      = aColor;
    gl_Position = uProj * uView * vec4(aPos, 1.0);
}
