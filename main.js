import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(30, 25, 60);
camera.lookAt(0, 6, 0);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const rotateLeftBtn = document.getElementById('rotate-left');
const rotateRightBtn = document.getElementById('rotate-right');

let arrowRotateDir = 0;
const arrowRotateSpeed = 0.04;

let isDragging = false;
let previousMouseX = 0;
let rotationSpeed = 0.01;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});


scene.add(new THREE.AmbientLight(0xffcfa0, 0.5));
scene.add(new THREE.HemisphereLight(0xffe6b3, 0x442200, 0.9));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(5, 25, 5);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.radius = 3;
sun.shadow.bias = -0.0005;
scene.add(sun);

const loader = new THREE.TextureLoader();

function createPixelTexture(src) {
  const tex = loader.load(src, t => t.needsUpdate = true);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipMapNearestFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 0;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const skinMat = new THREE.MeshStandardMaterial({
  map: createPixelTexture("assets/skins/bob.png"),
  flatShading: false,
  roughness: 0.6,
  metalness: 0.0
});

function setSkin(src) {
  const tex = createPixelTexture(src);
  skinMat.map = tex;
  skinMat.needsUpdate = true;
}

document.querySelectorAll('.skin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setSkin(btn.dataset.skin);
    
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function setUVs(g, f, w = 64, h = 64) {
  const u = g.attributes.uv.array;
  f.forEach((r, i) => {
    const x1 = r.x / w, x2 = (r.x + r.w) / w;
    const y1 = 1 - (r.y + r.h) / h, y2 = 1 - r.y / h;
    const o = i * 8;
    u[o+0]=x1; u[o+1]=y2;
    u[o+2]=x2; u[o+3]=y2;
    u[o+4]=x1; u[o+5]=y1;
    u[o+6]=x2; u[o+7]=y1;
  });
  g.attributes.uv.needsUpdate = true;
}


const bloxdman = new THREE.Group();
scene.add(bloxdman);

const torsoGeom = new THREE.BoxGeometry(8, 12, 4);
setUVs(torsoGeom, [
  {x:28,y:20,w:4,h:12},
  {x:16,y:20,w:4,h:12},
  {x:20,y:16,w:8,h:4},
  {x:28,y:16,w:8,h:4},
  {x:20,y:20,w:8,h:12},
  {x:32,y:20,w:8,h:12}
]);
const torso = new THREE.Mesh(torsoGeom, skinMat);
bloxdman.add(torso);

const headGeom = new THREE.BoxGeometry(8, 8, 8);
setUVs(headGeom, [
  {x:16,y:8,w:8,h:8},
  {x:0,y:8,w:8,h:8},
  {x:8,y:0,w:8,h:8},
  {x:16,y:0,w:8,h:8},
  {x:8,y:8,w:8,h:8},
  {x:24,y:8,w:8,h:8}
]);
const head = new THREE.Mesh(headGeom, skinMat);
head.position.y = 10;
torso.add(head);

function makeArm(x) {
  const g = new THREE.BoxGeometry(4, 12, 4);
  setUVs(g, [
    {x:48,y:20,w:4,h:12},
    {x:40,y:20,w:4,h:12},
    {x:44,y:16,w:4,h:4},
    {x:48,y:16,w:4,h:4},
    {x:44,y:20,w:4,h:12},
    {x:52,y:20,w:4,h:12}
  ]);
  const arm = new THREE.Mesh(g, skinMat);
  const pivot = new THREE.Group();
  pivot.position.set(x, 6, 0);
  arm.position.y = -6;
  pivot.add(arm);
  torso.add(pivot);
}

makeArm(-6);
makeArm(6);

function makeLeg(x) {
  const g = new THREE.BoxGeometry(4, 12, 4);
  setUVs(g, [
    {x:8,y:20,w:4,h:12},
    {x:0,y:20,w:4,h:12},
    {x:4,y:16,w:4,h:4},
    {x:8,y:16,w:4,h:4},
    {x:4,y:20,w:4,h:12},
    {x:12,y:20,w:4,h:12}
  ]);
  const leg = new THREE.Mesh(g, skinMat);
  const pivot = new THREE.Group();
  pivot.position.set(x, -6, 0);
  leg.position.y = -6;
  pivot.add(leg);
  torso.add(pivot);
}

makeLeg(-2);
makeLeg(2);


    let selectedPart = null;

    const partsMap = {
      head: head,
      leftArm: torso.children.find(c => c.position.x < 0 && c.position.y > 0),
      rightArm: torso.children.find(c => c.position.x > 0 && c.position.y > 0),
      leftLeg: torso.children.find(c => c.position.x < 0 && c.position.y < 0),
      rightLeg: torso.children.find(c => c.position.x > 0 && c.position.y < 0)
    };

    document.querySelectorAll('.part-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPart = partsMap[btn.dataset.part];

        if (selectedPart) {
          document.getElementById('rotationX').value = THREE.MathUtils.radToDeg(selectedPart.rotation.x);
          document.getElementById('rotationY').value = THREE.MathUtils.radToDeg(selectedPart.rotation.y);
          document.getElementById('rotationZ').value = THREE.MathUtils.radToDeg(selectedPart.rotation.z);
        }
      });
    });

    ['X', 'Y', 'Z'].forEach(axis => {
      document.getElementById(`rotation${axis}`).addEventListener('input', e => {
        if (!selectedPart) return;
        selectedPart.rotation[axis.toLowerCase()] = THREE.MathUtils.degToRad(e.target.value);
      });
    });



const innerRadius = 12;
const outerRadius = 12.8;
const ring = new THREE.Mesh(
  new THREE.RingGeometry(innerRadius, outerRadius, 64),
  new THREE.MeshBasicMaterial({ color: 0x303030, side: THREE.DoubleSide})
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -18;
scene.add(ring);

let isHoveringRing = false;

renderer.domElement.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const hit = raycaster.intersectObject(ring).length > 0;
  renderer.domElement.style.cursor = hit ? 'grab' : 'default';

  if (!isDragging) return;
  const dx = e.clientX - previousMouseX;
  previousMouseX = e.clientX;
  torso.rotation.y += dx * rotationSpeed;
});

renderer.domElement.addEventListener('mousedown', e => {
  raycaster.setFromCamera(mouse, camera);
  if (raycaster.intersectObject(ring).length) {
    isDragging = true;
    previousMouseX = e.clientX;
    renderer.domElement.style.cursor = 'grabbing';
  }
});

addEventListener('mouseup', () => isDragging = false);

const pointGeom = new THREE.SphereGeometry(0.5, 16, 16);
const pointMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const point = new THREE.Mesh(pointGeom, pointMat);
scene.add(point);

rotateLeftBtn.addEventListener('mousedown', () => arrowRotateDir = -1);
rotateRightBtn.addEventListener('mousedown', () => arrowRotateDir = 1);

addEventListener('mouseup', () => arrowRotateDir = 0);

const captureBtn = document.getElementById('capture-btn');
const preview = document.querySelector('.screenshot-preview');

captureBtn.addEventListener('click', () => {
  const prevBg = scene.background;
  const prevRingVisible = ring.visible;
  const prevPointVisible = point.visible;
  ring.visible = false;
  point.visible = false;
  scene.background = null;
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  scene.background = prevBg;
  ring.visible = prevRingVisible;
  point.visible = prevPointVisible;
  preview.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataURL;
  preview.appendChild(img);
  const link = document.createElement('a');
  link.download = 'bloxd-model.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


function animate() {
  requestAnimationFrame(animate);
  const angle = torso.rotation.y;
  const radius = (innerRadius + outerRadius) / 2;

  point.position.x = Math.sin(angle) * radius; 
  point.position.z = Math.cos(angle) * radius;
  point.position.y = -18.1;

  if (arrowRotateDir !== 0 && !isDragging) {
    torso.rotation.y += arrowRotateDir * arrowRotateSpeed;
  }

  renderer.render(scene, camera);
}

animate();
