import * as THREE from 'three';
import { globals } from './globals.js';

export function checkCollision(x, z) {
    // 1. تصادم البحيرة (الدائرة المركزية)
    const distToCenter = Math.sqrt(x * x + z * z);
    // إذا كانت المسافة من مركز الخريطة أقل من نصف قطر البحيرة + حجم اللاعب
    if (distToCenter < globals.LAKE_RADIUS + 40) return true;

    // 2. تصادم النافورة (دائرة في إحداثيات محددة)
    if (globals.fountain) {
        const dx = x - 1200; 
        const dz = z - 1200;
        const distToFountain = Math.sqrt(dx * dx + dz * dz);
        // نصف قطر منطقة تصادم النافورة هو 110
        if (distToFountain < 110) return true; 
    }

    // 3. تصادم الأشجار والصخور (تصادم دائري ديناميكي)
    for (const obs of globals.obstacleData) {
        // حساب فرق الإحداثيات بين اللاعب والعنصر
        const dx = x - obs.x;
        const dz = z - obs.z;
        
        // حساب المسافة الحقيقية بينهما (نظرية فيثاغورس)
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // التصادم يحدث إذا كانت المسافة أقل من (نصف قطر العنصر + نصف قطر اللاعب)
        // أضفنا 15 كـ "Buffer" لضمان عدم تداخل المجسمات
        if (distance < (obs.radius || 30) + 15) {
            return true;
        }
    }

    return false; // لا يوجد تصادم
}

export function harvestObstacle(obs, index) {
    if (obs.isFading) return;
    obs.health--;
    
    globals.player.scale.set(1.2, 0.8, 1.2);
    
    const mesh = obs.mesh;
    const jitter = 0.15;
    mesh.position.x += (Math.random() - 0.5) * jitter * 100;
    mesh.position.z += (Math.random() - 0.5) * jitter * 100;
    
    const impactScale = obs.originalScale * 1.15;
    mesh.scale.set(impactScale, obs.originalScale * 0.85, impactScale);
    
    setTimeout(() => {
        if (mesh.parent && !obs.isFading) {
            mesh.scale.set(obs.originalScale, obs.originalScale, obs.originalScale);
            mesh.position.x = obs.x;
            mesh.position.z = obs.z;
        }
    }, 80);

    if (obs.health <= 0) {
        obs.isFading = true;
        
        globals.fadingObjects.push({
            obs: obs,
            progress: 0,
            duration: 0.6 
        });
        
        globals.inventory[obs.type] += Math.floor(Math.random() * 3) + 2;
        document.getElementById(obs.type + '-count').innerText = globals.inventory[obs.type];
        
        globals.obstacleData.splice(index, 1);
    }
}

export function updatePhysicsLoop() {
    // Fading Objects Logic
    for (let i = globals.fadingObjects.length - 1; i >= 0; i--) {
        const item = globals.fadingObjects[i];
        item.progress += 0.025; 
        const factor = 1.0 - item.progress;
        if (item.progress >= 1.0) {
            // Note: spawnParticles imported via main or passed logic needed here, kept simple for structure
            spawnParticles(item.obs.mesh.position, item.obs.color); 
            globals.forestGroup.remove(item.obs.mesh);
            globals.fadingObjects.splice(i, 1);
        } else {
            const s = item.obs.originalScale * Math.max(0.1, factor);
            item.obs.mesh.scale.set(s, s, s);
            item.obs.mesh.traverse(child => { if (child.isMesh) { child.material.opacity = factor; child.material.transparent = true; }});
        }
    }

    // Particles Logic
    for (let i = globals.particles.length - 1; i >= 0; i--) {
        const p = globals.particles[i];
        p.mesh.position.add(p.vel);
        if(p.vel.length() > 0) p.vel.y -= 0.6; 
        p.life -= 0.02;
        if (p.mesh.geometry.type === 'BoxGeometry') p.mesh.scale.setScalar(p.life);
        if (p.mesh.material) p.mesh.material.opacity = p.life;
        if (p.life <= 0) {
            globals.scene.remove(p.mesh);
            globals.particles.splice(i, 1);
        }
    }
}

function spawnParticles(pos, color) {
    const count = 15;
    for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(8, 8, 8);
        const pMat = new THREE.MeshStandardMaterial({ color: color, flatShading: true, transparent: true });
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.copy(pos);
        p.position.y += 30;
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            Math.random() * 18,
            (Math.random() - 0.5) * 12
        );
        globals.particles.push({ mesh: p, vel: vel, life: 1.0 });
        globals.scene.add(p);
    }
}