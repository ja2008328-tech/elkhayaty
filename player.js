import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createPlayer(scene, LAKE_RADIUS) {
    const playerGroup = new THREE.Group();

    // جسم اللاعب (Body)
    const bodyGeo = new THREE.ConeGeometry(20, 50, 6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 25;
    playerGroup.add(body);

    // الرأس (Head)
    const headGeo = new THREE.SphereGeometry(10, 6, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 55;
    playerGroup.add(head);

    playerGroup.position.set(LAKE_RADIUS + 500, 150, 0);
    scene.add(playerGroup);
    return playerGroup;
}