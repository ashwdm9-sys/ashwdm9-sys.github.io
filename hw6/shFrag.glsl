#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vFragPos;

uniform vec3 uColor;
uniform vec3 uLightPos;

out vec4 fragColor;

void main() {
    vec3 n    = normalize(vNormal);
    vec3 l    = normalize(uLightPos - vFragPos);
    float d   = max(dot(n, l), 0.0);
    vec3 col  = (0.3 + 0.7 * d) * uColor;
    fragColor = vec4(col, 1.0);
}
