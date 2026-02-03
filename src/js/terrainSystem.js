// terrainSystem.js - نظام التضاريس والأرض
import * as THREE from "three";
import { globals } from "./globals.js";

// --- ثوابت المناطق ---
export const DESERT_RADIUS = 10000;
export const WILD_RADIUS = 30000;

// --- دالة الحصول على ارتفاع الأرض ---
export function getTerrainHeight(x, z) {
  const distance = Math.sqrt(x * x + z * z);
  if (distance > WILD_RADIUS) {
    return -50000;
  }
  return 0;
}

// --- دالة إنشاء الجزيرة الفنية الكبيرة ---
export function createMassiveArtisticIsland() {
  const size = WILD_RADIUS * 2;
  const geometry = new THREE.PlaneGeometry(size, size, 256, 256);

  geometry.rotateX(-Math.PI / 2);

  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const positions = geometry.attributes.position;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const distance = Math.sqrt(x * x + z * z);

    if (distance > WILD_RADIUS) {
      positions.setY(i, -50000);
      color.setHex(0x000000);
    } else {
      positions.setY(i, 0);

      if (distance < DESERT_RADIUS) {
        color.setHex(0xd9b382);
      } else if (distance >= DESERT_RADIUS && distance < DESERT_RADIUS + 2000) {
        const t = (distance - DESERT_RADIUS) / 2000;
        const sand = new THREE.Color(0xd9b382);
        const green = new THREE.Color(0x3a6332);
        color.copy(sand).lerp(green, t);
      } else {
        color.setHex(0x3a6332);
      }
    }
    color.toArray(colors, i * 3);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: false,
    roughness: 1.0,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  globals.terrain = new THREE.Mesh(geometry, material);
  globals.terrain.position.y = 0;
  globals.scene.add(globals.terrain);

  console.log("✅ تم إنشاء الجزيرة الفنية بنجاح");
}

// --- دالة للتحقق من حدود الجزيرة ---
export function isWithinIslandBounds(x, z) {
  const distance = Math.sqrt(x * x + z * z);
  return distance <= WILD_RADIUS;
}

// --- دالة للحصول على نوع المنطقة الحيوية ---
export function getBiomeType(x, z) {
  const distance = Math.sqrt(x * x + z * z);
  if (distance < DESERT_RADIUS) {
    return "desert";
  } else if (distance <= WILD_RADIUS) {
    return "forest";
  }
  return "ocean";
}
