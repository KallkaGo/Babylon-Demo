precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uT;
uniform highp vec2 uS;
uniform bool uY;
uniform int uO;

int Intmod(int i, int u) {
  return i - (i / u) * u;
}
int min2(int a, int b) {
  return a < b ? a : b;
}
int max2(int a, int b) {
  return a > b ? a : b;
}

int triangleSum(int y, int t, int f) {
  int x = min2(y, t), n = max2(y, t);
  if(f < x)
    return f * (f + 1) / 2;
  if(f < n)
    return x * (x + 1) / 2 + x * (f - x);
  int r = f - n;
  return x * (x + 1) / 2 + x * (n - x) + (x - 1) * r - (r - 1) * r / 2;
}

int coordToIndex(int y, int t, ivec2 x) {
  int r = min2(y, t), n = max2(y, t), v = x.x + x.y;
  bool h = Intmod(v, 2) == 0;
  if(v < r) {
    if(h)
      return triangleSum(y, t, v) + v - x.y;
    return triangleSum(y, t, v) + x.y;
  }
  if(v < n) {
    int s = t - x.y - 1;
    if(y < t)
      s = r - (y - x.x);
    if(h)
      return triangleSum(y, t, v) + s;
    return triangleSum(y, t, v) + r - s - 1;
  }
  int s = t - x.y - 1, e = r + n - v - 1;
  if(h)
    return triangleSum(y, t, v) + s;
  return triangleSum(y, t, v) + e - s - 1;
}

ivec2 indexToCoord(int y, int t, int x) {
  int v = min2(y, t), r = max2(y, t);
  if(x < v * (v + 1) / 2) {
    int n = (-1 + int(1e-6 + sqrt(float(8 * x + 1)))) / 2;
    int h = x - triangleSum(y, t, n);
    bool s = Intmod(n, 2) == 0;
    if(s)
      return ivec2(h, n - h);
    return ivec2(n - h, h);
  }
  if(x < v * (v + 1) / 2 + v * (r - v)) {
    x = x - v * (v + 1) / 2;
    int n = v + x / v;
    int s = Intmod(x, v);
    bool h = Intmod(n, 2) == 0;
    int g = n - v + s + 1, e = v - s - 1, S = n - s, T = s;
    if(y > t) {
      if(h)
        return ivec2(g, e);
      return ivec2(S, T);
    }
    if(h)
      return ivec2(T, S);
    return ivec2(e, g);
  }
  int n = v * (v - 1) / 2 - (x - (v * (v + 1) / 2 + v * (r - v))) - 1;
  int s = (-1 + int(sqrt(float(8 * n + 1)))) / 2;
  n = r + v - s - 2;
  int h = x - triangleSum(y, t, n);
  bool g = Intmod(n, 2) == 0;
  int e = v + r - n - 1;
  if(g)
    h = e - h - 1;
  int S = n + h - y + 1;
  return ivec2(n - S, S);
}

void main() {
  ivec2 y = ivec2(gl_FragCoord.xy);
  ivec2 iS = ivec2(4096, 4096);
  if(uY)
    y.y = iS.y - y.y - 1;
  int idx = coordToIndex(iS.x, iS.y, y) + uO;
  int v = iS.x * iS.y;
  if(idx >= v)
    idx -= v;
  if(idx < 0)
    idx += v;
  y = indexToCoord(iS.x, iS.y, idx);
  vec4 color = texture2D(uT, (vec2(y) + 0.5) / vec2(iS));
  color.rgb = pow(color.rgb, vec3(1. / 2.2));
  gl_FragColor = color;
}