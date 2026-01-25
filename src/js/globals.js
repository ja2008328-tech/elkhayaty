import * as THREE from 'three';

export const globals = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    player: null,
    water: null,
    terrain: null,
    clouds: [],
    dustParticles: null,
    ISLAND_RADIUS: 10000,
    LAKE_RADIUS: 1000,
    input: { w: false, s: false, a: false, d: false, e: false },
    smoothTarget: new THREE.Vector3(),
    forestGroup: new THREE.Group(),
    obstacleData: [],
    inventory: { wood: 0, stone: 0 },
    particles: [],
    fadingObjects: [],
    currentVelocity: new THREE.Vector3(0, 0, 0),
    isShopOpen: false,
    sharedMaterials: {
        trunk: new THREE.MeshStandardMaterial({ color: 0x8d6e63, flatShading: true, roughness: 0.9 }),
        stoneGrey: new THREE.MeshStandardMaterial({ color: 0x90a4ae, flatShading: true, roughness: 1.0 }),
        leavesTeal: new THREE.MeshStandardMaterial({ color: 0xb2dfdb, flatShading: true, roughness: 0.8 }),
        leavesPink: new THREE.MeshStandardMaterial({ color: 0xf8bbd0, flatShading: true, roughness: 0.8 }),
        leavesYellow: new THREE.MeshStandardMaterial({ color: 0xfff9c4, flatShading: true, roughness: 0.8 }),
        shrubGreen: new THREE.MeshStandardMaterial({ color: 0xa5d6a7, flatShading: true, roughness: 0.9 }),
        crystalBlue: new THREE.MeshStandardMaterial({ color: 0xe1f5fe, flatShading: true, transparent: true, opacity: 0.9, roughness: 0.2 })
    }
};