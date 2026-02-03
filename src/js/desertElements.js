import * as THREE from "three";

// ========== الأشجار ==========
export function createTreePalm() {
  const group = new THREE.Group();

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.5,
    metalness: 0.02,
    side: THREE.DoubleSide,
    flatShading: false,
    alphaTest: 0.3,
  });

  const trunkSegments = 15;
  const trunkRadiusBase = 0.35;
  const trunkHeight = 10;

  for (let i = 0; i < trunkSegments; i++) {
    const currentRadiusBottom = trunkRadiusBase * (1 - i * 0.05);
    const currentRadiusTop = trunkRadiusBase * (1 - (i + 1) * 0.05);

    const segmentGeo = new THREE.CylinderGeometry(
      Math.max(0.05, currentRadiusTop),
      currentRadiusBottom,
      trunkHeight / trunkSegments,
      16,
    );
    const segment = new THREE.Mesh(segmentGeo, trunkMaterial);
    segment.position.y =
      i * (trunkHeight / trunkSegments) + trunkHeight / trunkSegments / 2;
    segment.rotation.z = Math.sin(i * 0.2) * 0.02;
    group.add(segment);
  }

  const leafCount = 20;
  for (let i = 0; i < leafCount; i++) {
    const leafCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2.5, 2.5, 0),
      new THREE.Vector3(6, -4, 0),
    );

    const leafGeo = new THREE.TubeGeometry(leafCurve, 40, 0.15, 8, false);
    const leaf = new THREE.Mesh(leafGeo, leafMaterial);

    const pivot = new THREE.Group();
    pivot.position.y = trunkHeight - 0.2;
    pivot.add(leaf);

    pivot.rotation.y = (i / leafCount) * Math.PI * 2;
    pivot.rotation.z = Math.random() * 0.1;
    group.add(pivot);
  }

  group.scale.set(25, 25, 25);
  group.position.y = 0;

  return group;
}

export function createTreeCactus() {
  const group = new THREE.Group();

  const cactusMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false,
  });

  function createOrganicBranch(points, radius) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 32, radius, 16, false);
    const mesh = new THREE.Mesh(geometry, cactusMaterial);

    const topGeo = new THREE.SphereGeometry(radius, 16, 16);
    const topMesh = new THREE.Mesh(topGeo, cactusMaterial);
    topMesh.position.copy(points[points.length - 1]);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(topMesh);
    return group;
  }

  const mainTrunkPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 4, 0),
    new THREE.Vector3(0, 9, 0),
  ];
  const mainTrunk = createOrganicBranch(mainTrunkPoints, 0.45);
  group.add(mainTrunk);

  const arm1Points = [
    new THREE.Vector3(0, 4, 0),
    new THREE.Vector3(1.5, 4.2, 0),
    new THREE.Vector3(1.7, 6.5, 0),
  ];
  const arm1 = createOrganicBranch(arm1Points, 0.38);
  group.add(arm1);

  const arm2Points = [
    new THREE.Vector3(0, 2.5, 0),
    new THREE.Vector3(-1.2, 2.7, 0.5),
    new THREE.Vector3(-1.5, 5.0, 0.5),
  ];
  const arm2 = createOrganicBranch(arm2Points, 0.35);
  group.add(arm2);

  const arm3Points = [
    new THREE.Vector3(0, 5.5, 0),
    new THREE.Vector3(0, 6.0, -1.0),
    new THREE.Vector3(0.2, 7.5, -1.2),
  ];
  const arm3 = createOrganicBranch(arm3Points, 0.3);
  group.add(arm3);

  group.scale.set(20, 20, 20);
  group.position.y = 0;

  return group;
}

// ========== الحجارة ==========
export function createRockDesert() {
  const group = new THREE.Group();

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0xbc8f8f,
    roughness: 0.8,
    metalness: 0.0,
    flatShading: false,
  });

  function createSolidRock(radius, detail, scaleY) {
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const position = geometry.attributes.position;
    const vector = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vector.fromBufferAttribute(position, i);
      const noise = Math.sin(vector.x * 2) * Math.cos(vector.z * 2) * 0.15;
      vector.multiplyScalar(1 + noise);
      position.setXYZ(i, vector.x, vector.y * scaleY, vector.z);
    }

    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, rockMaterial);
    return mesh;
  }

  const rock = createSolidRock(1, 4, 0.6);
  rock.position.y = 0.3;
  group.add(rock);

  const subRock1 = createSolidRock(0.5, 3, 0.5);
  subRock1.position.set(1.4, 0.1, -0.8);
  subRock1.rotation.set(0.5, 1, 0.2);
  group.add(subRock1);

  const subRock2 = createSolidRock(0.3, 2, 0.7);
  subRock2.position.set(-1.2, 0.05, 0.5);
  subRock2.rotation.set(0.2, 0.5, 1.2);
  group.add(subRock2);

  group.scale.set(30, 30, 30);
  group.position.y = 0;

  return group;
}

export function createRockDesertPastel() {
  const group = new THREE.Group();

  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });

  const rock = new THREE.Mesh(geometry, material);
  rock.scale.set(6.5, 3.2, 5.8);
  rock.rotation.set(0.2, Math.PI / 4, 0.1);
  rock.position.y = 3.2 * 0.52;
  group.add(rock);

  group.scale.set(25, 25, 25);
  group.position.y = 0;

  return group;
}

// ========== النباتات ==========
export function createPlantBlueBerry() {
  const plantGroup = new THREE.Group();

  const stemGeo = new THREE.CylinderGeometry(0.04, 0.1, 4, 12);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x8a9a83,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 2;
  plantGroup.add(stem);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xa8c0a0,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
    flatShading: false,
    alphaTest: 0.3,
  });
  const topBerryMat = new THREE.MeshStandardMaterial({
    color: 0x81d4fa,
    roughness: 0.3,
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

  const topBerryGeo = new THREE.SphereGeometry(0.26, 32, 32);
  const topBerry = new THREE.Mesh(topBerryGeo, topBerryMat);
  topBerry.position.y = 4.15;
  topBerry.scale.set(1.2, 1.35, 1.2);
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

export function createPlantLilacBerry() {
  const plantGroup = new THREE.Group();

  const stemGeo = new THREE.CylinderGeometry(0.04, 0.1, 4, 12);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x8fa38b,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 2;
  plantGroup.add(stem);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xa8c0a0,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
    flatShading: false,
    alphaTest: 0.3,
  });

  const topBerryMat = new THREE.MeshStandardMaterial({
    color: 0xd1c4e9,
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

  const topBerryGeo = new THREE.SphereGeometry(0.26, 32, 32);
  const topBerry = new THREE.Mesh(topBerryGeo, topBerryMat);
  topBerry.position.y = 4.15;
  topBerry.scale.set(1.2, 1.35, 1.2);
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

// ========== دوال مساعدة ==========
export function createRandomDesertRock() {
  const rockTypes = [createRockDesert, createRockDesertPastel];

  const randomIndex = Math.floor(Math.random() * rockTypes.length);
  return rockTypes[randomIndex]();
}
