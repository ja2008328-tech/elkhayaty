import * as THREE from "three";

// ========== الأشجار ==========
export function createTreeNormal() {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 3.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x8a7465,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.75;
  group.add(trunk);

  const treeType = Math.random() > 0.5 ? "pine" : "oak";

  if (treeType === "pine") {
    const color = 0xa7c0a0;
    for (let i = 0; i < 4; i++) {
      const radius = 1.5 - i * 0.35;
      const coneGeo = new THREE.CylinderGeometry(0, radius, 1.2, 6);
      const coneMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.0,
        flatShading: false,
        alphaTest: 0.5,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 2.2 + i * 0.9;
      group.add(cone);
    }
  } else {
    const color = 0xb8c5a6;
    const layers = [
      { y: 3.5, r: 1.2 },
      { y: 4.8, r: 0.8 },
    ];
    layers.forEach((l) => {
      const leafGeo = new THREE.IcosahedronGeometry(l.r, 0);
      const leafMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.0,
        flatShading: false,
        alphaTest: 0.5,
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = l.y;
      group.add(leaf);
    });

    for (let i = 0; i < 4; i++) {
      const sideLeafGeo = new THREE.IcosahedronGeometry(0.7, 0);
      const sideLeafMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.0,
        flatShading: false,
        alphaTest: 0.5,
      });
      const sideLeaf = new THREE.Mesh(sideLeafGeo, sideLeafMat);
      const angle = (i / 4) * Math.PI * 2;
      sideLeaf.position.set(Math.cos(angle) * 0.8, 3.8, Math.sin(angle) * 0.8);
      group.add(sideLeaf);
    }
  }

  group.scale.set(35, 35, 35);
  group.position.y = 0;

  return group;
}

export function createTreeStraw() {
  const group = new THREE.Group();

  const trunkHeight = 4;
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 16);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0xa08d70,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkHeight / 2;
  group.add(trunk);

  const strawType = Math.random() > 0.5 ? "layered" : "bundled";
  const color = strawType === "layered" ? 0xeedc82 : 0xf3e5ab;

  if (strawType === "layered") {
    for (let i = 0; i < 6; i++) {
      const radius = 1.8 - i * 0.28;
      const layerGeo = new THREE.CylinderGeometry(
        radius * 0.7,
        radius,
        0.7,
        32,
      );
      const layerMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 1,
        metalness: 0.0,
        flatShading: false,
      });
      const layer = new THREE.Mesh(layerGeo, layerMat);
      layer.position.y = trunkHeight + 0.3 + i * 0.6;
      group.add(layer);
    }
  } else {
    const topGroup = new THREE.Group();
    topGroup.position.y = trunkHeight + 0.8;

    for (let i = 0; i < 10; i++) {
      const bundle = createCustomCapsule(0.25, 1.8, color);
      const angle = (i / 10) * Math.PI * 2;
      const dist = 0.8;
      bundle.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      bundle.rotation.x = 0.3;
      bundle.rotation.z = -Math.sin(angle) * 0.3;
      topGroup.add(bundle);
    }

    const centerBundle = createCustomCapsule(0.4, 2.2, color);
    centerBundle.position.y = 0.4;
    topGroup.add(centerBundle);

    group.add(topGroup);
  }

  group.scale.set(30, 30, 30);
  group.position.y = 0;

  return group;
}

// ========== الحجارة ==========
export function createRockArkSolid() {
  const group = new THREE.Group();

  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xa3c1da,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: false,
  });

  const rock = new THREE.Mesh(geometry, material);
  rock.scale.set(6, 3, 5.5);
  rock.rotation.set(0.15, Math.PI / 6, 0.05);
  rock.position.y = 3 * 0.55;
  group.add(rock);

  group.scale.set(25, 25, 25);
  group.position.y = 0;

  return group;
}

export function createRockArkBlue() {
  const group = new THREE.Group();

  const geometry = new THREE.DodecahedronGeometry(1.5, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    roughness: 0.7,
    metalness: 0.1,
    flatShading: false,
  });

  const rock = new THREE.Mesh(geometry, material);
  rock.scale.set(3.5, 2.0, 3.0);
  rock.position.y = 1.2;
  rock.rotation.set(0.1, Math.PI / 4, 0.05);
  group.add(rock);

  group.scale.set(20, 20, 20);
  group.position.y = 0;

  return group;
}

export function createRockFlint() {
  const group = new THREE.Group();

  const geometry = new THREE.SphereGeometry(2, 128, 128);
  geometry.scale(1.6, 0.9, 1.1);

  const positions = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const noise = Math.sin(vertex.x * 1.2) * Math.cos(vertex.y * 1.2) * 0.12;
    vertex.multiplyScalar(1.0 + noise);
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x822626,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false,
  });

  const rock = new THREE.Mesh(geometry, material);
  group.add(rock);
  group.scale.set(15, 15, 15);
  group.position.y = 0;

  return group;
}

export function createRockLayered() {
  const group = new THREE.Group();

  const layersCount = 7;
  const baseSize = 3.5;
  const layerHeight = 0.6;

  const colors = [
    0x2c3e50, 0x34495e, 0x3b5998, 0x4a90e2, 0x5da2d5, 0x87ceeb, 0xa1c4fd,
  ];

  for (let i = 0; i < layersCount; i++) {
    const layerMaterial = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      roughness: 0.75,
      metalness: 0.05,
      flatShading: false,
    });

    const radius = baseSize - i * 0.45;
    const geometry = new THREE.CylinderGeometry(
      radius * 0.88,
      radius,
      layerHeight,
      40,
    );

    const position = geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let j = 0; j < position.count; j++) {
      v.fromBufferAttribute(position, j);
      if (Math.abs(v.y) > 0.1) {
        const noise = Math.sin(v.x * 1.5 + i) * 0.08;
        v.x += noise;
        v.z += noise;
      }
      position.setXYZ(j, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    const layerMesh = new THREE.Mesh(geometry, layerMaterial);
    layerMesh.position.y = i * (layerHeight - 0.02) - 1.0;
    layerMesh.rotation.y = i * 0.4;
    group.add(layerMesh);
  }

  group.scale.set(10, 10, 10);
  group.position.y = 0;

  return group;
}

// ========== النباتات ==========
export function createPlantRedBerry() {
  const plantGroup = new THREE.Group();

  const stemGeo = new THREE.CylinderGeometry(0.04, 0.12, 4, 12);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x7b8d70,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 2;
  plantGroup.add(stem);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x98b08d,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
    flatShading: false,
    alphaTest: 0.3,
  });
  const topBerryMat = new THREE.MeshStandardMaterial({
    color: 0xef9a9a,
    roughness: 0.3,
    metalness: 0.05,
    flatShading: false,
  });

  const tiers = 6;
  const leavesPerTier = 5;

  for (let t = 0; t < tiers; t++) {
    const tierHeight = 0.8 + t * 0.55;
    const scale = 1 - t * 0.12;

    for (let l = 0; l < leavesPerTier; l++) {
      const leafGroup = new THREE.Group();
      leafGroup.position.y = tierHeight;
      const angle = (l / leavesPerTier) * Math.PI * 2 + t * 0.4;
      leafGroup.rotation.y = angle;

      const leafShape = new THREE.BoxGeometry(0.7 * scale, 0.02, 1.6 * scale);
      const leaf = new THREE.Mesh(leafShape, leafMat);
      leaf.position.z = 0.8 * scale;
      leaf.rotation.x = -0.3;
      leafGroup.add(leaf);
      plantGroup.add(leafGroup);
    }
  }

  const topBerryGeo = new THREE.SphereGeometry(0.25, 32, 32);
  const topBerry = new THREE.Mesh(topBerryGeo, topBerryMat);
  topBerry.position.y = 4.15;
  topBerry.scale.set(1.2, 1.3, 1.2);
  plantGroup.add(topBerry);

  const baseLeafGeo = new THREE.IcosahedronGeometry(0.2, 0);
  const baseLeaf = new THREE.Mesh(baseLeafGeo, leafMat);
  baseLeaf.position.y = 4.0;
  baseLeaf.rotation.x = Math.PI;
  plantGroup.add(baseLeaf);

  plantGroup.scale.set(8, 8, 8);
  plantGroup.position.y = 0;

  return plantGroup;
}

export function createPlantYellowBerry() {
  const plantGroup = new THREE.Group();

  const stemGeo = new THREE.CylinderGeometry(0.05, 0.12, 4, 12);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x7b8d70,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 2;
  plantGroup.add(stem);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x98b08d,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
    flatShading: false,
    alphaTest: 0.3,
  });
  const topBerryMat = new THREE.MeshStandardMaterial({
    color: 0xffecb3,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: false,
  });

  const tiers = 6;
  const leavesPerTier = 5;

  for (let t = 0; t < tiers; t++) {
    const tierHeight = 0.8 + t * 0.55;
    const scale = 1 - t * 0.12;

    for (let l = 0; l < leavesPerTier; l++) {
      const leafGroup = new THREE.Group();
      leafGroup.position.y = tierHeight;
      const angle = (l / leavesPerTier) * Math.PI * 2 + t * 0.4;
      leafGroup.rotation.y = angle;

      const leafShape = new THREE.BoxGeometry(0.7 * scale, 0.02, 1.6 * scale);
      const leaf = new THREE.Mesh(leafShape, leafMat);
      leaf.position.z = 0.8 * scale;
      leaf.rotation.x = -0.3;
      leafGroup.add(leaf);
      plantGroup.add(leafGroup);
    }
  }

  const topBerryGeo = new THREE.SphereGeometry(0.25, 32, 32);
  const topBerry = new THREE.Mesh(topBerryGeo, topBerryMat);
  topBerry.position.y = 4.15;
  topBerry.scale.set(1.2, 1.3, 1.2);
  plantGroup.add(topBerry);

  const topLeafGeo = new THREE.IcosahedronGeometry(0.2, 0);
  const topLeaf = new THREE.Mesh(topLeafGeo, leafMat);
  topLeaf.position.y = 4.0;
  topLeaf.rotation.x = Math.PI;
  plantGroup.add(topLeaf);

  plantGroup.scale.set(8, 8, 8);
  plantGroup.position.y = 0;

  return plantGroup;
}

// ========== العصا ==========
export function createStaff() {
  const group = new THREE.Group();

  const geometry = new THREE.CylinderGeometry(0.18, 0.22, 7, 32, 20);

  const positions = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const noise = Math.sin(vertex.y * 2.5) * 0.04;
    const randomDetail = (Math.random() - 0.5) * 0.01;
    vertex.x *= 1 + noise + randomDetail;
    vertex.z *= 1 + noise + randomDetail;
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.8,
    metalness: 0.05,
    flatShading: false,
  });

  const staff = new THREE.Mesh(geometry, material);
  staff.rotation.z = Math.PI / 2;
  staff.rotation.y = Math.PI / 6;
  staff.position.y = 0;
  group.add(staff);

  group.scale.set(15, 15, 15);
  group.position.y = 0;

  return group;
}

// ========== دوال مساعدة ==========
function createCustomCapsule(radius, height, color) {
  const group = new THREE.Group();
  const cylinderGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
  const sphereGeo = new THREE.SphereGeometry(radius, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });

  const cylinder = new THREE.Mesh(cylinderGeo, mat);
  const topSphere = new THREE.Mesh(sphereGeo, mat);
  const bottomSphere = new THREE.Mesh(sphereGeo, mat);

  topSphere.position.y = height / 2;
  bottomSphere.position.y = -height / 2;

  group.add(cylinder);
  group.add(topSphere);
  group.add(bottomSphere);

  return group;
}

export function createRandomNormalRock() {
  const rockTypes = [
    createRockArkSolid,
    createRockArkBlue,
    createRockFlint,
    createRockLayered,
  ];

  const randomIndex = Math.floor(Math.random() * rockTypes.length);
  return rockTypes[randomIndex]();
}
