attribute vec3 pos;
varying vec2 coord;

void main() {
  coord = pos.xy;
  gl_Position = vec4(pos, 1.0);
}
