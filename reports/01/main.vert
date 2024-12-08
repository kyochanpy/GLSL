attribute vec3 position;
attribute vec4 color;
attribute float size;

uniform float pointScale;
uniform vec2 mouse;
uniform vec2 mousePositions[20];
uniform int mousePositionsCount;

varying vec4 vColor;
varying float vDistanceToMouse;

void main() {
  vColor = color;
  gl_Position = vec4(position, 1.0);

  // 現在のマウス位置と全ての過去の位置との最小距離を計算
  float minDistance = length(mouse - position.xy);
  for(int i = 0; i < 20; i++) {
    if(i >= mousePositionsCount)
      break;
    float dist = length(mousePositions[i] - position.xy);
    minDistance = min(minDistance, dist);
  }

  vDistanceToMouse = minDistance;

  float invertedDistance = 0.3 / (minDistance + 0.0001);
  float maxPointSize = 5.0;
  gl_PointSize = min(size * pointScale * invertedDistance, maxPointSize);
}
