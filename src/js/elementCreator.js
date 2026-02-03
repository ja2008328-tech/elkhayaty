// elementCreator.js - نظام إنشاء العناصر المرئية في المشهد المحسن
import * as THREE from "three";
import { globals } from "./globals.js";
import { getTerrainHeight } from "./terrainSystem.js";

// استيراد دوال إنشاء العناصر
import {
  createTreeNormal,
  createTreeStraw,
  createRockArkSolid,
  createRockArkBlue,
  createRockFlint,
  createRockLayered,
  createPlantRedBerry,
  createPlantYellowBerry,
  createStaff,
  createRandomNormalRock,
} from "./forestElements.js";

import {
  createTreePalm,
  createTreeCactus,
  createRockDesert,
  createRockDesertPastel,
  createPlantBlueBerry,
  createPlantLilacBerry,
  createRandomDesertRock,
} from "./desertElements.js";

// --- إعدادات إنشاء العناصر المحسنة ---
const CREATION_SETTINGS = {
  baseScale: 3.5,                     // تقليل المقياس الأساسي
  scaleVariation: 1.5,                // تقليل التباين
  minSpacing: 100,                    // الحد الأدنى للمسافة
  rotationVariation: true,            // تنوع الدوران
  optimizeGeometry: true,             // تحسين الهندسة
  mergeSimilar: true,                 // دمج العناصر المتشابهة
};

// --- شبكة مكانية لتتبع العناصر ---
let spatialGrid = {};

// --- دالة تحديث الشبكة المكانية ---
function updateSpatialGrid(x, z, element, cellSize = 500) {
  const gridX = Math.floor(x / cellSize);
  const gridZ = Math.floor(z / cellSize);
  const key = `${gridX},${gridZ}`;
  
  if (!spatialGrid[key]) {
    spatialGrid[key] = [];
  }
  
  spatialGrid[key].push({
    x, z, element,
    radius: element.userData?.collisionRadius || 100
  });
}

// --- دالة التحقق من التداخل في الشبكة ---
function checkGridOverlap(x, z, radius) {
  const gridSize = 500;
  const gridX = Math.floor(x / gridSize);
  const gridZ = Math.floor(z / gridSize);
  
  // التحقق من الخلايا المجاورة
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const key = `${gridX + dx},${gridZ + dz}`;
      if (spatialGrid[key]) {
        for (const item of spatialGrid[key]) {
          const distance = Math.sqrt(
            Math.pow(x - item.x, 2) + Math.pow(z - item.z, 2)
          );
          
          if (distance < (radius + item.radius)) {
            return { overlapping: true, distance: distance, element: item.element };
          }
        }
      }
    }
  }
  
  return { overlapping: false };
}

// --- دالة إنشاء عنصر بناءً على النوع والإحداثيات المحسنة ---
export function createResourceElement(type, x, z, isDesert, options = {}) {
  const asset = new THREE.Group();
  let collisionRadius = 80;           // تقليل نصف قطر التصادم
  let lootType = "";
  let scale = CREATION_SETTINGS.baseScale + Math.random() * CREATION_SETTINGS.scaleVariation;
  let variant = 1;
  
  // التحقق من التداخل قبل الإنشاء
  const overlapCheck = checkGridOverlap(x, z, collisionRadius * scale);
  if (overlapCheck.overlapping && options.avoidOverlap !== false) {
    console.log(`⚠️ تخطي إنشاء ${type} بسبب التداخل (مسافة: ${overlapCheck.distance.toFixed(1)})`);
    return null;
  }

  if (options.variant) {
    variant = options.variant;
  } else if (type.includes("_")) {
    const parts = type.split("_");
    if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
      variant = parseInt(parts[parts.length - 1]);
      type = parts.slice(0, -1).join("_");
    }
  }

  switch (type) {
    case "wood_palm":
      const palm = createTreePalm();
      asset.add(palm);
      lootType = "wood_palm";
      scale = 1.0 + Math.random() * 0.3;
      collisionRadius = 50;
      break;
    case "cactus":
      const cactus = createTreeCactus();
      asset.add(cactus);
      lootType = "cactus";
      scale = 0.9 + Math.random() * 0.2;
      collisionRadius = 30;
      break;
    case "wood":
      const normalTree = createTreeNormal();
      asset.add(normalTree);
      lootType = "wood";
      scale = 1.5 + Math.random() * 0.4;
      collisionRadius = 50;
      break;
    case "desert_stone":
      const desertStone =
        variant === 1 ? createRockDesert() : createRockDesertPastel();
      asset.add(desertStone);
      lootType = "desert_stone";
      scale = (variant === 1 ? 5 : 2.5) + Math.random() * 0.4;
      collisionRadius = variant === 1 ? 30 : 35;
      break;
    case "limestone":
      const limestone = createRockLayered();
      asset.add(limestone);
      lootType = "limestone";
      scale = 4.5 + Math.random() * 0.4;
      collisionRadius = 40;
      break;
    case "flint":
      const flint = createRockFlint();
      asset.add(flint);
      lootType = "flint";
      scale = 4.5 + Math.random() * 0.2;
      collisionRadius = 40;
      break;
    case "blue_berry":
      const bluePlant = createPlantBlueBerry();
      asset.add(bluePlant);
      lootType = "blue_berry";
      collisionRadius = 10;
      scale = 2.5 + Math.random() * 0.4;
      break;
    case "lilac_berry":
      const lilacPlant = createPlantLilacBerry();
      asset.add(lilacPlant);
      lootType = "lilac_berry";
      collisionRadius = 10;
      scale = 2.5 + Math.random() * 0.4;
      break;
    case "straw":
      const strawTree = createTreeStraw();
      asset.add(strawTree);
      lootType = "straw";
      scale = 1.5 + Math.random() * 0.3;
      collisionRadius = 35;
      break;
    case "stone":
      const stone = variant === 1 ? createRockArkSolid() : createRockArkBlue();
      asset.add(stone);
      lootType = "stone";
      scale = 3.0 + Math.random() * 0.4;
      collisionRadius = 50;
      break;
    case "red_berry":
      const redBerry = createPlantRedBerry();
      asset.add(redBerry);
      lootType = "red_berry";
      collisionRadius = 10;
      scale = 2.5 + Math.random() * 0.4;
      break;
    case "yellow_berry":
      const yellowBerry = createPlantYellowBerry();
      asset.add(yellowBerry);
      lootType = "yellow_berry";
      collisionRadius = 10;
      scale = 2.5 + Math.random() * 0.4;
      break;
    case "stick":
      const staff = createStaff();
      asset.add(staff);
      lootType = "stick";
      scale = 2.0 + Math.random() * 0.2;
      collisionRadius = 30;
      break;
    default:
      const defaultRock = isDesert
        ? createRandomDesertRock()
        : createRandomNormalRock();
      asset.add(defaultRock);
      lootType = isDesert ? "desert_stone" : "stone";
      scale = isDesert ? 2.5 : 3.0;
      collisionRadius = isDesert ? 35 : 45;
  }

  const terrainHeight = getTerrainHeight(x, z);

  // تطبيق المقياس مع تنوع محسّن
  if (
    type.includes("wood") ||
    type.includes("palm") ||
    type.includes("cactus") ||
    type.includes("straw")
  ) {
    const heightScale = 1.2 + Math.random() * 0.3;
    asset.scale.set(scale, scale * heightScale, scale);
  } else {
    const uniformScale = scale * (0.9 + Math.random() * 0.2);
    asset.scale.set(uniformScale, uniformScale, uniformScale);
  }

  asset.position.x = x;
  asset.position.z = z;
  asset.position.y = terrainHeight;
  
  // تطبيق دوران طبيعي
  if (CREATION_SETTINGS.rotationVariation) {
    asset.rotation.y = Math.random() * Math.PI * 2;
    if (Math.random() > 0.7) {
      asset.rotation.x = (Math.random() - 0.5) * 0.1;
      asset.rotation.z = (Math.random() - 0.5) * 0.1;
    }
  }

  // تحسين الهندسة
  if (CREATION_SETTINGS.optimizeGeometry) {
    asset.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // تبسيط المواد
        if (child.material && Array.isArray(child.material)) {
          child.material = child.material[0];
        }
      }
    });
  }

  asset.userData = {
    originalScale: scale,
    type: lootType,
    isVisible: true,
    hasPhysics: false,
    lastCheck: 0,
    chunkX: Math.floor(x / 1000),
    chunkZ: Math.floor(z / 1000),
    isAsset: true,
    stableVisible: false,
    rarity: options.rarity || "common",
    value: options.value || "normal",
    clusterId: options.clusterId || null,
    inCluster: options.inCluster || false,
    createdAt: Date.now(),
    id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    collisionRadius: collisionRadius * scale,
    avoidOverlap: options.avoidOverlap !== false,
    spacing: options.spacing || CREATION_SETTINGS.minSpacing,
  };

  // إضافة إلى المشهد
  if (!globals.forestGroup) {
    globals.forestGroup = new THREE.Group();
    globals.forestGroup.name = "EnvironmentGroup";
  }
  
  globals.forestGroup.add(asset);

  // تسجيل في بيانات العقبات
  if (!globals.obstacleData) {
    globals.obstacleData = [];
  }
  
  const obstacle = {
    mesh: asset,
    x,
    z,
    radius: collisionRadius * scale,
    type: lootType,
    health: 3,
    originalScale: scale,
    isInFrustum: false,
    isFading: false,
    rarity: asset.userData.rarity,
    value: asset.userData.value,
    userData: asset.userData,
  };
  
  globals.obstacleData.push(obstacle);
  
  // تحديث الشبكة المكانية
  updateSpatialGrid(x, z, asset);

  // دمج العناصر المتشابهة القريبة
  if (CREATION_SETTINGS.mergeSimilar && options.mergeSimilar !== false) {
    mergeSimilarElements(asset, lootType, x, z);
  }

  console.log(`✅ تم إنشاء ${lootType} في (${x.toFixed(1)}, ${z.toFixed(1)})`);
  return asset;
}

// --- دالة دمج العناصر المتشابهة ---
function mergeSimilarElements(newElement, type, x, z) {
  const mergeRadius = 150;
  const mergeThreshold = 3; // الحد الأدنى للعناصر للدمج
  
  // البحث عن عناصر متشابهة قريبة
  const similarElements = [];
  
  for (const key in spatialGrid) {
    const elements = spatialGrid[key];
    for (const item of elements) {
      if (item.element === newElement) continue;
      
      if (item.element.userData.type === type) {
        const distance = Math.sqrt(
          Math.pow(x - item.x, 2) + Math.pow(z - item.z, 2)
        );
        
        if (distance < mergeRadius) {
          similarElements.push({
            element: item.element,
            distance: distance,
            x: item.x,
            z: item.z
          });
        }
      }
    }
  }
  
  // إذا كان هناك ما يكفي من العناصر المتشابهة القريبة
  if (similarElements.length >= mergeThreshold) {
    console.log(`🔄 دمج ${similarElements.length + 1} عنصر من نوع ${type}`);
    
    // حساب المركز المتوسط
    let totalX = x;
    let totalZ = z;
    
    similarElements.forEach(item => {
      totalX += item.x;
      totalZ += item.z;
    });
    
    const centerX = totalX / (similarElements.length + 1);
    const centerZ = totalZ / (similarElements.length + 1);
    
    // نقل العنصر الجديد إلى المركز
    newElement.position.x = centerX;
    newElement.position.z = centerZ;
    
    // تحديث البيانات
    const obstacle = globals.obstacleData.find(o => o.mesh === newElement);
    if (obstacle) {
      obstacle.x = centerX;
      obstacle.z = centerZ;
    }
    
    // تحديث الشبكة المكانية
    updateSpatialGrid(centerX, centerZ, newElement);
  }
}

// --- دالة إنشاء مجموعة من العناصر المحسنة ---
export function createResourceElements(resourceList) {
  const createdElements = [];
  const failedElements = [];
  
  console.log(`🔄 محاولة إنشاء ${resourceList.length} عنصر...`);

  resourceList.forEach((resource, index) => {
    const isDesertResource =
      resource.type === "cactus" ||
      resource.type === "wood_palm" ||
      resource.type === "desert_stone" ||
      resource.type === "blue_berry" ||
      resource.type === "lilac_berry";

    if (resource.clusterSize) {
      // إنشاء عناصر في تجمع
      for (let i = 0; i < resource.clusterSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100; // تقليل مسافة التجميع

        const x = resource.x + Math.cos(angle) * distance;
        const z = resource.z + Math.sin(angle) * distance;

        const element = createResourceElement(
          resource.type,
          x,
          z,
          isDesertResource,
          {
            rarity: resource.rarity,
            value: resource.value,
            avoidOverlap: true,
            spacing: resource.spacing || 150,
            clusterId: resource.clusterId,
            mergeSimilar: i > 0, // دمج العناصر بعد الأول
          }
        );
        
        if (element) {
          createdElements.push(element);
        } else {
          failedElements.push({ x, z, type: resource.type, reason: "overlap" });
        }
      }
    } else {
      // إنشاء عنصر فردي
      const element = createResourceElement(
        resource.type,
        resource.x,
        resource.z,
        isDesertResource,
        {
          rarity: resource.rarity,
          value: resource.value,
          avoidOverlap: true,
          spacing: resource.spacing || 200,
        }
      );
      
      if (element) {
        createdElements.push(element);
      } else {
        failedElements.push({ 
          x: resource.x, 
          z: resource.z, 
          type: resource.type, 
          reason: "overlap" 
        });
      }
    }
    
    // تحديث التقدم
    if ((index + 1) % 50 === 0) {
      console.log(`📊 تم إنشاء ${index + 1}/${resourceList.length} عنصر`);
    }
  });

  console.log(`✅ تم إنشاء ${createdElements.length} عنصر (فشل: ${failedElements.length})`);
  
  if (failedElements.length > 0) {
    console.log("❌ العناصر الفاشلة:", failedElements.slice(0, 5));
  }
  
  return {
    success: createdElements,
    failed: failedElements,
    totalAttempted: resourceList.length,
    successRate: (createdElements.length / resourceList.length * 100).toFixed(1) + '%'
  };
}

// --- دالة حذف عنصر محسنة ---
export function removeResourceElement(element) {
  if (!element || !globals.forestGroup) return false;

  try {
    // إزالة من الشبكة المكانية
    for (const key in spatialGrid) {
      spatialGrid[key] = spatialGrid[key].filter(item => item.element !== element);
      if (spatialGrid[key].length === 0) {
        delete spatialGrid[key];
      }
    }
    
    // إزالة من المشهد
    globals.forestGroup.remove(element);

    // إزالة من بيانات العقبات
    const index = globals.obstacleData.findIndex((obs) => obs.mesh === element);
    if (index > -1) {
      globals.obstacleData.splice(index, 1);
    }

    // تحرير الذاكرة
    if (element.geometry) element.geometry.dispose();
    if (element.material) {
      if (Array.isArray(element.material)) {
        element.material.forEach((mat) => mat.dispose());
      } else {
        element.material.dispose();
      }
    }

    console.log(`🗑️ تم إزالة عنصر ${element.userData?.type || "غير معروف"}`);
    return true;
  } catch (error) {
    console.error("❌ خطأ في إزالة العنصر:", error);
    return false;
  }
}

// --- دالة تحديث مقاييس العناصر ---
export function updateElementsScale(scaleMultiplier = 1.0) {
  if (!globals.forestGroup) return;

  let updatedCount = 0;
  
  globals.forestGroup.children.forEach((child) => {
    if (child.userData && child.userData.originalScale) {
      const newScale = child.userData.originalScale * scaleMultiplier;
      child.scale.set(newScale, newScale, newScale);
      updatedCount++;
      
      // تحديث نصف قطر التصادم
      if (child.userData.collisionRadius) {
        child.userData.collisionRadius *= scaleMultiplier;
      }
    }
  });

  console.log(`📏 تم تحديث مقياس ${updatedCount} عنصر`);
  return updatedCount;
}

// --- دالة تحسين التوزيع الحالي ---
export function optimizeExistingElements() {
  console.log("🔧 تحسين العناصر الحالية...");
  
  if (!globals.forestGroup || globals.forestGroup.children.length === 0) {
    console.log("⚠️ لا توجد عناصر لتحسينها");
    return { moved: 0, removed: 0, optimized: 0 };
  }
  
  let movedCount = 0;
  let removedCount = 0;
  let optimizedCount = 0;
  const minSpacing = CREATION_SETTINGS.minSpacing;
  
  const elements = Array.from(globals.forestGroup.children);
  
  for (let i = 0; i < elements.length; i++) {
    const elementA = elements[i];
    if (!elementA.position || !elementA.userData) continue;
    
    for (let j = i + 1; j < elements.length; j++) {
      const elementB = elements[j];
      if (!elementB.position || !elementB.userData) continue;
      
      const dx = elementA.position.x - elementB.position.x;
      const dz = elementA.position.z - elementB.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      const radiusA = elementA.userData.collisionRadius || 50;
      const radiusB = elementB.userData.collisionRadius || 50;
      
      if (distance < (radiusA + radiusB + minSpacing)) {
        // العناصر قريبة جداً
        if (elementA.userData.rarity === elementB.userData.rarity) {
          // نفس الندرة، إزالة أحدها
          if (removeResourceElement(elementB)) {
            removedCount++;
            optimizedCount++;
            elements.splice(j, 1);
            j--;
          }
        } else {
          // ندرة مختلفة، تحريك العنصر الأقل ندرة
          const rarityOrder = { "ultra_rare": 4, "rare": 3, "uncommon": 2, "common": 1 };
          const rarityA = rarityOrder[elementA.userData.rarity] || 0;
          const rarityB = rarityOrder[elementB.userData.rarity] || 0;
          
          const elementToMove = rarityA < rarityB ? elementA : elementB;
          const moveDistance = (radiusA + radiusB + minSpacing) - distance;
          const angle = Math.atan2(dz, dx);
          
          elementToMove.position.x += Math.cos(angle) * moveDistance;
          elementToMove.position.z += Math.sin(angle) * moveDistance;
          
          movedCount++;
          optimizedCount++;
        }
      }
    }
  }
  
  console.log(`✅ تم تحسين ${optimizedCount} عنصر (${movedCount} تم تحريكه، ${removedCount} تمت إزالته)`);
  return { moved: movedCount, removed: removedCount, optimized: optimizedCount };
}

// --- دالة تنظيف الشبكة المكانية ---
export function clearSpatialGrid() {
  spatialGrid = {};
  console.log("🧹 تم تنظيف الشبكة المكانية");
}

// --- دالة الحصول على إحصائيات الإنشاء ---
export function getCreationStats() {
  const stats = {
    totalElements: globals.forestGroup ? globals.forestGroup.children.length : 0,
    spatialGridCells: Object.keys(spatialGrid).length,
    settings: CREATION_SETTINGS,
    recommendations: []
  };
  
  // تحليل الكثافة
  let totalInGrid = 0;
  for (const key in spatialGrid) {
    totalInGrid += spatialGrid[key].length;
  }
  
  const avgPerCell = totalInGrid / Math.max(1, Object.keys(spatialGrid).length);
  if (avgPerCell > 10) {
    stats.recommendations.push("الكثافة عالية جداً في بعض الخلايا، قلل من عدد العناصر");
  } else if (avgPerCell < 2) {
    stats.recommendations.push("الكثافة منخفضة جداً، أضف المزيد من العناصر");
  } else {
    stats.recommendations.push("الكثافة مناسبة، حافظ على هذا المستوى");
  }
  
  return stats;
}

// --- دالة ضبط إعدادات الإنشاء ---
export function configureCreationSettings(newSettings) {
  Object.assign(CREATION_SETTINGS, newSettings);
  console.log("🔄 تم تحديث إعدادات الإنشاء:", CREATION_SETTINGS);
  return CREATION_SETTINGS;
}