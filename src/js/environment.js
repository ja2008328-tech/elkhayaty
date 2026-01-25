import * as THREE from 'three';
import { globals } from './globals.js';

export function createMassiveArtisticIsland() {
    const islandShape = new THREE.Shape();
    islandShape.absarc(0, 0, globals.ISLAND_RADIUS, 0, Math.PI * 2, false);
    
    const lakeHole = new THREE.Path();
    lakeHole.absarc(0, 0, globals.LAKE_RADIUS, 0, Math.PI * 2, true);
    islandShape.holes.push(lakeHole);

    const extrudeSettings = { depth: 40, bevelEnabled: true, bevelSize: 10, bevelThickness: 20 };
    const geometry = new THREE.ExtrudeGeometry(islandShape, extrudeSettings);

    const material = new THREE.MeshStandardMaterial({ 
        color: 0x95cc95, 
        flatShading: true,
        metalness: 0.1, 
        roughness: 0.9,
        emissive: 0x223322,
        emissiveIntensity: 0.02
    });
    
    globals.terrain = new THREE.Mesh(geometry, material);
    globals.terrain.rotation.x = -Math.PI / 2; 
    globals.terrain.position.y = 40;
    globals.terrain.receiveShadow = true;
    globals.terrain.castShadow = true;
    globals.scene.add(globals.terrain);

    const baseGeo = new THREE.CylinderGeometry(globals.ISLAND_RADIUS, 500, 4000, 64);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x7b6d66, flatShading: true, roughness: 1.0 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -2000;
    globals.scene.add(base);
}

export function createDeepLake() {
    const wallGeo = new THREE.TorusGeometry(globals.LAKE_RADIUS + 10, 15, 16, 100);
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.1 });
    const lakeWall = new THREE.Mesh(wallGeo, marbleMat);
    lakeWall.rotation.x = Math.PI / 2;
    lakeWall.position.y = 85; 
    lakeWall.castShadow = true;
    globals.scene.add(lakeWall);

    const goldGeo = new THREE.TorusGeometry(globals.LAKE_RADIUS + 10, 5, 16, 100);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const goldRim = new THREE.Mesh(goldGeo, goldMat);
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 95;
    globals.scene.add(goldRim);

    const ornamentGeo = new THREE.TorusGeometry(20, 5, 16, 32);
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const ornament = new THREE.Mesh(ornamentGeo, goldMat);
        ornament.position.set(Math.cos(angle) * (globals.LAKE_RADIUS + 10), 110, Math.sin(angle) * (globals.LAKE_RADIUS + 10));
        ornament.rotation.y = angle;
        ornament.castShadow = true;
        globals.scene.add(ornament);
    }

    const waterGeo = new THREE.CylinderGeometry(globals.LAKE_RADIUS, globals.LAKE_RADIUS, 20, 64);
    const waterMat = new THREE.MeshPhongMaterial({ 
        color: 0x00d4ff, 
        transparent: true, 
        opacity: 0.8,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        shininess: 120
    });
    globals.water = new THREE.Mesh(waterGeo, waterMat);
    globals.water.position.y = 60; 
    globals.scene.add(globals.water);

    const floorGeo = new THREE.CircleGeometry(globals.LAKE_RADIUS, 64);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x00838f });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -10;
    globals.scene.add(floor);
}

export function createDustSystem() {
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
        const r = Math.sqrt(Math.random()) * globals.ISLAND_RADIUS * 1.2;
        const theta = Math.random() * Math.PI * 2;
        pos[i] = Math.cos(theta) * r;
        pos[i+1] = Math.random() * 800;
        pos[i+2] = Math.sin(theta) * r;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 4, transparent: true, opacity: 0.3 });
    globals.dustParticles = new THREE.Points(geo, mat);
    globals.scene.add(globals.dustParticles);
}

export function createAtmosphericClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 80; i++) {
        const geo = new THREE.IcosahedronGeometry(200 + Math.random() * 400, 0);
        const cloud = new THREE.Mesh(geo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 25000, 
            -3000 + (Math.random() * 1500), 
            (Math.random() - 0.5) * 25000
        );
        globals.scene.add(cloud);
        globals.clouds.push(cloud);
    }
}

export function createAdvancedEnvironment() {
    const totalAssets = 450; 
    const types = ['A', 'B', 'C', 'D', 'S1', 'S2', 'S3'];

    for (let i = 0; i < totalAssets; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = globals.LAKE_RADIUS + 600 + Math.sqrt(Math.random()) * (globals.ISLAND_RADIUS - globals.LAKE_RADIUS - 1000);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        const type = types[Math.floor(Math.random() * types.length)];
        createAdvancedAsset(type, x, z);
    }
    globals.scene.add(globals.forestGroup);
}

function createAdvancedAsset(type, x, z) {
    const asset = new THREE.Group();
    let collisionRadius = 40;
    const scale = 0.8 + Math.random() * 0.7;
    let mainColor = 0xffffff;
    let isTree = ['A', 'B', 'C', 'D'].includes(type);

    if (isTree) {
        const trunkMat = globals.sharedMaterials.trunk;
        switch (type) {
            case 'A': 
                const tA = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 80, 6), trunkMat);
                tA.position.y = 40;
                mainColor = 0xb2dfdb;
                const topA = new THREE.Mesh(new THREE.ConeGeometry(25, 100, 6), globals.sharedMaterials.leavesTeal);
                topA.position.y = 110;
                asset.add(tA, topA);
                collisionRadius = 30;
                break;
            case 'B':
                const tB = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 40, 6), trunkMat);
                tB.position.y = 20;
                mainColor = 0xf8bbd0;
                for(let i=0; i<3; i++) {
                    const s = new THREE.Mesh(new THREE.SphereGeometry(30 - i*7, 6, 6), globals.sharedMaterials.leavesPink);
                    s.position.y = 50 + i*30;
                    asset.add(s);
                }
                asset.add(tB);
                collisionRadius = 40;
                break;
            case 'C':
                const tC = new THREE.Mesh(new THREE.BoxGeometry(25, 30, 25), trunkMat);
                tC.position.y = 15;
                mainColor = 0xfff9c4;
                const topC = new THREE.Mesh(new THREE.OctahedronGeometry(35, 0), globals.sharedMaterials.leavesYellow);
                topC.position.y = 70;
                asset.add(tC, topC);
                collisionRadius = 35;
                break;
            case 'D':
                mainColor = 0xa5d6a7;
                const shrubMat = globals.sharedMaterials.shrubGreen;
                for(let i=0; i<4; i++) {
                    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 0), shrubMat);
                    s.position.set(Math.random()*20-10, 10, Math.random()*20-10);
                    asset.add(s);
                }
                collisionRadius = 25;
                break;
        }
    } else {
        const stoneMat = globals.sharedMaterials.stoneGrey;
        mainColor = 0x90a4ae;
        switch (type) {
            case 'S1': 
                const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(40, 0), stoneMat);
                b1.position.y = 30;
                b1.rotation.set(Math.random(), Math.random(), Math.random());
                asset.add(b1);
                collisionRadius = 45;
                break;
            case 'S2': 
                for(let i=0; i<3; i++) {
                    const r = new THREE.Mesh(new THREE.BoxGeometry(60 - i*15, 15, 50 - i*10), stoneMat);
                    r.position.y = 7.5 + i*15;
                    r.rotation.y = (Math.random()-0.5) * 0.5;
                    asset.add(r);
                }
                collisionRadius = 40;
                break;
            case 'S3': 
                mainColor = 0xe1f5fe;
                const p1 = new THREE.Mesh(new THREE.CylinderGeometry(5, 15, 70, 4), globals.sharedMaterials.crystalBlue);
                p1.position.y = 35;
                asset.add(p1);
                collisionRadius = 20;
                break;
        }
    }

    asset.scale.set(scale, scale, scale);
    asset.position.set(x, 80, z); 
    asset.rotation.y = Math.random() * Math.PI * 2;
    asset.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
    
    globals.forestGroup.add(asset);
    globals.obstacleData.push({ 
        mesh: asset, 
        x, z, 
        radius: collisionRadius * scale, 
        health: 3, 
        type: isTree ? 'wood' : 'stone',
        color: mainColor,
        originalScale: scale,
        isFading: false
    });
}

export function updateEnvironmentAnim() {
    globals.clouds.forEach(c => {
        c.position.x += 1.5;
        if (c.position.x > 15000) c.position.x = -15000;
    });
    if (globals.dustParticles) {
        globals.dustParticles.rotation.y += 0.0005;
        globals.dustParticles.position.y = Math.sin(Date.now() * 0.0005) * 20;
    }

    if (globals.water) {
        globals.water.position.y = 60 + Math.sin(Date.now() * 0.002) * 4;
        globals.water.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.15;
    }
}

export function createJasminFountain() {
    // 1. تعريف المواقع أولاً لتجنب خطأ posX is not defined
    const posX = 1200;
    const posZ = 1200;
    const fountainScale = 2;

    const fountainGroup = new THREE.Group();

    // Materials
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
    const matWater = new THREE.MeshPhongMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7, shininess: 100 });
    const matIron = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.8, roughness: 0.2 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.7, roughness: 0.3 });
    const matJasmin = new THREE.MeshStandardMaterial({ color: 0xfff9c4 });

    // بناء الأجزاء (القاعدة، العمود، إلخ)
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(80, 8, 25), matWhite);
    const base2 = new THREE.Mesh(new THREE.BoxGeometry(25, 8, 80), matWhite);
    base1.receiveShadow = true;
    base2.receiveShadow = true;
    fountainGroup.add(base1, base2);

    const pillar = new THREE.Mesh(new THREE.BoxGeometry(12, 35, 12), matWhite);
    pillar.position.y = 17.5;
    fountainGroup.add(pillar);

    const basin = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 30), matWhite);
    basin.position.y = 35;
    fountainGroup.add(basin);

    const upperWater = new THREE.Mesh(new THREE.BoxGeometry(26, 1, 26), matWater);
    upperWater.position.y = 38.5;
    fountainGroup.add(upperWater);

    // إضافة الياسمين
    function createJasmin(x, z, s) {
        const flower = new THREE.Group();
        const petalGeo = new THREE.BoxGeometry(4, 1, 8);
        for(let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeo, matJasmin);
            petal.rotation.y = (Math.PI * 2 / 5) * i;
            flower.add(petal);
        }
        const center = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), matGold);
        center.position.y = 1;
        flower.add(center);
        flower.position.set(x, 5.5, z);
        flower.scale.set(s, s, s);
        return flower;
    }
    fountainGroup.add(createJasmin(15, 15, 0.9));
    fountainGroup.add(createJasmin(-15, -15, 0.8));

    // العملة
    const coinGeo = new THREE.CylinderGeometry(7, 7, 2, 32);
    globals.fountainCoin = new THREE.Mesh(coinGeo, matIron);
    globals.fountainCoin.position.y = 70;
    globals.fountainCoin.rotation.x = Math.PI / 2;
    fountainGroup.add(globals.fountainCoin);

    // تطبيق الموقع والحجم المحددين في الأعلى
    fountainGroup.position.set(posX, 80, posZ); 
    fountainGroup.scale.set(fountainScale, fountainScale, fountainScale);
    
    globals.fountain = fountainGroup;
    globals.scene.add(fountainGroup);

    // تسجيل العائق للتصادم
    
}