precision mediump float;

varying vec4 vColor;
varying float vDistanceToMouse;

void main() {
  if (vDistanceToMouse > 0.1) {
    discard;
  }
  gl_FragColor = vColor;
}