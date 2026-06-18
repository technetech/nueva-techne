import './style.css';

// WebGL Background Animation
function initShader() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return;

  function syncSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncSize).observe(document.body);
  } else {
    window.addEventListener('resize', syncSize);
  }
  syncSize();

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    vec3 color = vec3(0.02, 0.03, 0.04); // Deep navy background (#05070A)
    
    // Add some subtle moving gradients/nebula effects
    float slowTime = u_time * 0.2;
    float n = sin(uv.x * 3.0 + slowTime) * cos(uv.y * 2.0 - slowTime);
    
    vec3 accent = vec3(0.0, 0.83, 1.0); // Electric cyan (#00D4FF)
    color += accent * (n * 0.15 + 0.15) * 0.5;
    
    // Grid effect
    vec2 grid = fract(uv * 15.0 + sin(u_time * 0.1) * 0.1);
    float line = smoothstep(0.0, 0.02, abs(grid.x - 0.5)) * smoothstep(0.0, 0.02, abs(grid.y - 0.5));
    color += accent * (1.0 - line) * 0.03;

    gl_FragColor = vec4(color, 1.0);
}`;

  function cs(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener('mousemove', (event) => {
    const nx = event.clientX / window.innerWidth;
    const ny = 1.0 - event.clientY / window.innerHeight;
    mouse.x = nx * canvas.width;
    mouse.y = ny * canvas.height;
  });

  function render(t) {
    syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime) gl.uniform1f(uTime, t * 0.001);
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render(0);
}

document.addEventListener('DOMContentLoaded', initShader);
