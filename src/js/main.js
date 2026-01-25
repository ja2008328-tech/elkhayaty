import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { globals } from './globals.js';
import { createMassiveArtisticIsland, createDeepLake, createAtmosphericClouds, createDustSystem, createAdvancedEnvironment, updateEnvironmentAnim, createJasminFountain } from './environment.js';
import { createPlayer, setupInputs, updatePlayerMovement } from './player.js';
import { updatePhysicsLoop } from './physics.js';
import { toggleShop, buyItem } from './ui.js';

// ربط دوال المتجر بالنافذة (Window) لأن HTML يحتاج إليها
window.toggleShop = toggleShop;
window.buyItem = buyItem;

init();
animate();

function init() {
    globals.scene = new THREE.Scene();
    const pinkSky = 0xffe4e1; 
    globals.scene.background = new THREE.Color(pinkSky); 
    
    globals.scene.fog = new THREE.Fog(pinkSky, 2000, 15000); 

    const aspect = window.innerWidth / window.innerHeight;
    
    const d = 2600; 
    globals.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -15000, 30000); 
    globals.camera.position.set(2000, 1500, 2000); 

    globals.renderer = new THREE.WebGLRenderer({ antialias: true });
    globals.renderer.setSize(window.innerWidth, window.innerHeight);
    globals.renderer.shadowMap.enabled = true;
    globals.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    document.body.appendChild(globals.renderer.domElement);

    globals.scene.add(new THREE.AmbientLight(0xffffff, 0.8)); 
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe4e1, 0.6);
    globals.scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(4000, 3000, 2000); 
    sun.castShadow = true;
    sun.shadow.camera.left = -12000;
    sun.shadow.camera.right = 12000;
    sun.shadow.camera.top = 12000;
    sun.shadow.camera.bottom = -12000;
    sun.shadow.camera.far = 25000;
    sun.shadow.mapSize.set(4096, 4096); 
    sun.shadow.bias = -0.0005;
    globals.scene.add(sun);

    createMassiveArtisticIsland();
    createDeepLake();
    createAtmosphericClouds();
    createDustSystem();
    createJasminFountain();
    createAdvancedEnvironment(); 
    createPlayer();
    setupInputs();

    globals.controls = new OrbitControls(globals.camera, globals.renderer.domElement);
    globals.controls.enableRotate = false;
    globals.controls.enablePan = false;
}

function animate() {
    requestAnimationFrame(animate);

    updatePlayerMovement();
    updatePhysicsLoop();
    updateEnvironmentAnim();

    globals.controls.update();
    globals.renderer.render(globals.scene, globals.camera);
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 2600; 
    globals.camera.left = -d * aspect; globals.camera.right = d * aspect;
    globals.camera.top = d; globals.camera.bottom = -d;
    globals.camera.updateProjectionMatrix();
    globals.renderer.setSize(window.innerWidth, window.innerHeight);
});