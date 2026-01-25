import * as THREE from 'three';
import { globals } from './globals.js';
import { checkCollision, harvestObstacle } from './physics.js';

export function createPlayer() {
    globals.player = new THREE.Group(); 
    const bodyGeo = new THREE.ConeGeometry(20, 50, 6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 25;
    globals.player.add(body);

    const headGeo = new THREE.SphereGeometry(10, 6, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true }); 
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 55;
    globals.player.add(head);

    const hatGeo = new THREE.ConeGeometry(12, 30, 6);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.name = "hat"; 
    hat.position.y = 75;
    globals.player.add(hat);

    globals.player.traverse(c => { if(c.isMesh) c.castShadow = true; });
    globals.player.position.set(globals.LAKE_RADIUS + 500, 150, 0); 
    globals.scene.add(globals.player);
}

export function setupInputs() {
    window.addEventListener('keydown', (e) => { 
        const key = e.key.toLowerCase();
        if (key in globals.input) globals.input[key] = true;
        if (key === 'b') window.toggleShop();
    });
    window.addEventListener('keyup', (e) => { 
        const key = e.key.toLowerCase();
        if (key in globals.input) globals.input[key] = false; 
    });
}

function spawnWalkParticle(pos) {
    const pGeo = new THREE.CircleGeometry(10, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(pos.x, 85, pos.z);
    p.rotation.x = -Math.PI / 2;
    globals.scene.add(p);
    globals.particles.push({ mesh: p, vel: new THREE.Vector3(0, 0, 0), life: 0.5 });
}

export function updatePlayerMovement() {
    if (globals.player) {
        globals.player.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

        const floatingY = 130 + Math.sin(Date.now() * 0.003) * 15;
        globals.player.position.y = THREE.MathUtils.lerp(globals.player.position.y, floatingY, 0.1);

        if (globals.isShopOpen) {
            globals.currentVelocity.set(0, 0, 0);
        } else {
            let targetDir = new THREE.Vector3(0, 0, 0);
            if (globals.input.w) targetDir.z -= 1;
            if (globals.input.s) targetDir.z += 1;
            if (globals.input.a) targetDir.x -= 1;
            if (globals.input.d) targetDir.x += 1;
            if (targetDir.length() > 0) targetDir.normalize();

            const targetSpeed = 25;       
            const acceleration = 0.07;  
            globals.currentVelocity.lerp(targetDir.multiplyScalar(targetSpeed), acceleration);

            let nextX = globals.player.position.x + globals.currentVelocity.x;
            let nextZ = globals.player.position.z + globals.currentVelocity.z;

            // --- 1. انزلاق البحيرة المركزية (Central Lake Sliding) ---
            const distToCenter = Math.sqrt(nextX * nextX + nextZ * nextZ);
            const minLakeDist = globals.LAKE_RADIUS + 45; // نصف قطر البحيرة + حجم اللاعب

            if (distToCenter < minLakeDist) {
                // حساب زاوية اللاعب بالنسبة لمركز البحيرة
                const angle = Math.atan2(nextZ, nextX);
                // وضعه على الحافة تماماً لمنع الالتصاق أو الدخول للماء
                nextX = Math.cos(angle) * minLakeDist;
                nextZ = Math.sin(angle) * minLakeDist;
                // إبطاء بسيط جداً للحفاظ على السلاسة
                globals.currentVelocity.multiplyScalar(0.95);
            }

            // --- 2. انزلاق الأجسام الأخرى (Trees/Rocks Sliding) ---
            for (const obs of globals.obstacleData) {
                if (obs.isFading) continue;
                const dx = nextX - obs.x;
                const dz = nextZ - obs.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                const minDist = (obs.radius || 30) + 30;

                if (distance < minDist) {
                    const angle = Math.atan2(dz, dx);
                    nextX = obs.x + Math.cos(angle) * minDist;
                    nextZ = obs.z + Math.sin(angle) * minDist;
                    globals.currentVelocity.multiplyScalar(0.9);
                }
            }

            // تطبيق الحركة النهائية
            if (!checkCollision(nextX, globals.player.position.z)) {
                globals.player.position.x = nextX;
            }
            if (!checkCollision(globals.player.position.x, nextZ)) {
                globals.player.position.z = nextZ;
            }

            // --- تكملة الكود الأصلي ---
            if (globals.currentVelocity.length() > 0.1) {
                const targetRotation = Math.atan2(globals.currentVelocity.x, globals.currentVelocity.z);
                let diff = targetRotation - globals.player.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                globals.player.rotation.y += diff * 0.1;

                const hat = globals.player.getObjectByName("hat");
                if(hat) hat.rotation.x = THREE.MathUtils.lerp(hat.rotation.x, 0.2, 0.1);

                if (Math.random() > 0.8) spawnWalkParticle(globals.player.position);
            } else {
                const hat = globals.player.getObjectByName("hat");
                if(hat) hat.rotation.x = THREE.MathUtils.lerp(hat.rotation.x, 0, 0.05);
            }

            const dist = Math.sqrt(globals.player.position.x**2 + globals.player.position.z**2);
            const safeBoundary = globals.ISLAND_RADIUS - 200;
            if (dist > safeBoundary) {
                const angle = Math.atan2(globals.player.position.z, globals.player.position.x);
                globals.player.position.x = Math.cos(angle) * safeBoundary;
                globals.player.position.z = Math.sin(angle) * safeBoundary;
            }
        }

        globals.smoothTarget.lerp(globals.player.position, 0.1);
        globals.camera.position.set(globals.smoothTarget.x + 1500, globals.smoothTarget.y + 1200, globals.smoothTarget.z + 1500);
        globals.controls.target.copy(globals.smoothTarget);
        
        let nearestObs = null;
        let minDistInteraction = 150;
        let nearestIdx = -1;

        for (let i = 0; i < globals.obstacleData.length; i++) {
            const obs = globals.obstacleData[i];
            if (obs.isFading) continue;
            const dx = globals.player.position.x - obs.x;
            const dz = globals.player.position.z - obs.z;
            const d = Math.sqrt(dx*dx + dz*dz);
            if (d < (obs.radius || 30) + 100 && d < minDistInteraction) {
                minDistInteraction = d;
                nearestObs = obs;
                nearestIdx = i;
            }
        }

        const hint = document.getElementById('interaction-hint');
        if (nearestObs) {
            hint.style.display = 'block';
            if (globals.input.e) {
                harvestObstacle(nearestObs, nearestIdx);
                globals.input.e = false; 
            }
        } else {
            hint.style.display = 'none';
        }
    }
}