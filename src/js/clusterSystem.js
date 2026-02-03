// clusterSystem.js - نظام إدارة تجمعات الموارد والمناطق المحسن
import {
  getSimplexDensity,
  createNewNoiseGenerator,
} from "./simplexNoiseSystem.js";
import { getBiomeType } from "./terrainSystem.js";
import { checkSafeDistance } from "./resourceDistribution.js";

// --- إعدادات التجمعات المحسنة ---
const CLUSTER_SETTINGS = {
  // إعدادات عامة
  maxClusters: 15,                    // تقليل عدد التجمعات الكبيرة
  minDistanceBetweenClusters: 1200,   // زيادة المسافة بين التجمعات
  
  // إعدادات كل نوع
  forestClusters: {
    radius: 600,                      // تقليل نصف القطر
    density: 0.4,                     // تقليل الكثافة
    minElements: 8,
    maxElements: 15,
  },
  desertClusters: {
    radius: 500,
    density: 0.35,
    minElements: 6,
    maxElements: 12,
  },
  stoneClusters: {
    radius: 400,
    density: 0.3,
    minElements: 5,
    maxElements: 10,
  },
  
  // إعدادات التوزيع داخل التجمع
  clusterSpacing: {
    minDistance: 80,                  // الحد الأدنى للمسافة داخل التجمع
    maxScatter: 150,                  // الحد الأقصى للتبعثر
    avoidOverlap: true,               // منع التداخل
  }
};

// --- مناطق خاصة للتجمعات ---
export const CLUSTER_REGIONS = {
  forestClusters: [],
  desertClusters: [],
  stoneClusters: [],
};

// --- دالة تحقق من المسافة الآمنة المحسنة ---
function checkEnhancedSafeDistance(x, z, minDistance, existingElements) {
  // التحقق من المسافة من العناصر الموجودة
  for (const element of existingElements) {
    const dx = element.x - x;
    const dz = element.z - z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < minDistance) {
      return false;
    }
  }
  
  // التحقق من المسافة من التجمعات الأخرى
  for (const clusterType in CLUSTER_REGIONS) {
    for (const cluster of CLUSTER_REGIONS[clusterType]) {
      const dx = cluster.x - x;
      const dz = cluster.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < CLUSTER_SETTINGS.minDistanceBetweenClusters) {
        return false;
      }
    }
  }
  
  return true;
}

// --- دالة إنشاء مناطق التجمعات باستخدام Simplex Noise ---
export function createResourceClusters() {
  console.log("🌳 إنشاء تجمعات الموارد باستخدام Simplex Noise...");

  // إعادة تعيين مناطق التجمعات
  CLUSTER_REGIONS.forestClusters = [];
  CLUSTER_REGIONS.desertClusters = [];
  CLUSTER_REGIONS.stoneClusters = [];

  // قائمة لتتبع جميع العناصر الموضوعة
  const allPlacedElements = [];
  const maxTotalClusters = CLUSTER_SETTINGS.maxClusters;
  let createdClusters = 0;

  // إنشاء تجمعات باستخدام Simplex Noise
  for (let i = 0; i < maxTotalClusters * 2; i++) {
    if (createdClusters >= maxTotalClusters) break;

    let clusterType;
    let clusterX, clusterZ;
    let attempts = 0;
    const maxAttempts = 30;

    do {
      // توليد موقع عشوائي
      const angle = Math.random() * Math.PI * 2;
      const distance = 5000 + Math.random() * 20000; // توزيع أكثر انتشاراً

      clusterX = Math.cos(angle) * distance;
      clusterZ = Math.sin(angle) * distance;

      // تحديد نوع التجمع بناءً على المنطقة الحيوية
      const isDesert = getBiomeType(clusterX, clusterZ) === "desert";

      // استخدام Simplex Noise لتحديد كثافة التجمع
      const noiseValue = getSimplexDensity(clusterX, clusterZ, 800);

      // تحسين منطق تحديد النوع
      if (isDesert) {
        if (noiseValue > 0.6) {
          clusterType = "desert";
        } else if (noiseValue > 0.3) {
          clusterType = "stone";
        } else {
          continue;
        }
      } else {
        if (noiseValue > 0.65) {
          clusterType = "forest";
        } else if (noiseValue > 0.35) {
          clusterType = "stone";
        } else {
          continue;
        }
      }

      // التحقق من المسافة من التجمعات الأخرى
      let tooClose = false;
      const allClusters = [
        ...CLUSTER_REGIONS.forestClusters,
        ...CLUSTER_REGIONS.desertClusters,
        ...CLUSTER_REGIONS.stoneClusters,
      ];

      for (const existing of allClusters) {
        const dx = existing.x - clusterX;
        const dz = existing.z - clusterZ;
        const distanceToCluster = Math.sqrt(dx * dx + dz * dz);

        if (distanceToCluster < CLUSTER_SETTINGS.minDistanceBetweenClusters) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) break;

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) continue;

    // تحديد إعدادات التجمع بناءً على النوع
    const settings = CLUSTER_SETTINGS[`${clusterType}Clusters`];
    
    // إضافة التجمع إلى القائمة المناسبة
    const clusterData = {
      x: clusterX,
      z: clusterZ,
      radius: settings.radius,
      density: settings.density + (Math.random() * 0.2 - 0.1), // تباين طفيف
      noiseSeed: Math.random() * 1000,
      minElements: settings.minElements,
      maxElements: settings.maxElements,
      placedElements: 0,
      maxPlacementAttempts: 10,
    };

    switch (clusterType) {
      case "forest":
        CLUSTER_REGIONS.forestClusters.push(clusterData);
        break;
      case "desert":
        CLUSTER_REGIONS.desertClusters.push(clusterData);
        break;
      case "stone":
        CLUSTER_REGIONS.stoneClusters.push(clusterData);
        break;
    }

    createdClusters++;
  }

  console.log(
    `✅ تم إنشاء ${CLUSTER_REGIONS.forestClusters.length} تجمع غابة، ${CLUSTER_REGIONS.desertClusters.length} تجمع صحراء، ${CLUSTER_REGIONS.stoneClusters.length} تجمع صخور`
  );
  return CLUSTER_REGIONS;
}

// --- دالة إنشاء عناصر داخل منطقة تجمع ---
export function createClusterElements(cluster, isDesert) {
  const elements = [];
  const clusterNoise = createNewNoiseGenerator(cluster.noiseSeed);

  // تحديد عدد العناصر بناءً على الكثافة والإعدادات
  const elementCount = Math.floor(
    cluster.minElements + Math.random() * (cluster.maxElements - cluster.minElements)
  );

  // قائمة لتتبع العناصر الموضوعة في هذا التجمع
  const placedElementsInCluster = [];

  for (let i = 0; i < elementCount; i++) {
    let elementX, elementZ;
    let attempts = 0;
    const maxAttempts = cluster.maxPlacementAttempts;

    do {
      // توزيع دائري مع تبعثر محسّن
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * cluster.radius * 0.6; // تقليل المسافة القصوى

      elementX = cluster.x + Math.cos(angle) * distance;
      elementZ = cluster.z + Math.sin(angle) * distance;

      // استخدام الضوضاء للتوزيع الطبيعي
      const localNoise = clusterNoise.noise2D(elementX / 150, elementZ / 150);

      // التحقق من المسافة الآمنة من جميع العناصر
      if (checkSafeDistance(elementX, elementZ, CLUSTER_SETTINGS.clusterSpacing.minDistance)) {
        // التحقق من عدم التداخل مع العناصر الأخرى في نفس التجمع
        let tooClose = false;
        for (const placed of placedElementsInCluster) {
          const dx = placed.x - elementX;
          const dz = placed.z - elementZ;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < CLUSTER_SETTINGS.clusterSpacing.minDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose && localNoise > 0.25) { // تخفيض عتبة الضوضاء
          break;
        }
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) continue;

    // تحديد نوع العنصر بناءً على المنطقة ونمط التوزيع
    let elementType;
    const elementNoise = clusterNoise.noise2D(elementX / 100, elementZ / 100);
    
    if (isDesert) {
      if (elementNoise > 0.5) {
        elementType = "wood_palm";
      } else if (elementNoise > 0.2) {
        elementType = "cactus";
      } else if (elementNoise > -0.2) {
        elementType = "desert_stone";
      } else {
        elementType = "stick";
      }
    } else {
      if (elementNoise > 0.6) {
        elementType = "wood";
      } else if (elementNoise > 0.3) {
        elementType = "stone";
      } else if (elementNoise > 0.0) {
        elementType = "straw";
      } else {
        elementType = "stick";
      }
    }

    // تسجيل العنصر الموضوغ
    placedElementsInCluster.push({ x: elementX, z: elementZ });
    cluster.placedElements++;

    elements.push({
      x: elementX,
      z: elementZ,
      type: elementType,
      clusterId: i,
      inCluster: true,
      spacing: CLUSTER_SETTINGS.clusterSpacing.minDistance,
    });
  }

  return elements;
}

// --- دالة إنشاء تجمعات الصخور ---
export function createStoneClusterElements(cluster, isDesert) {
  const elements = [];
  const stoneType = isDesert ? "desert_stone" : "stone";
  const variant = Math.random() > 0.5 ? 1 : 2;

  const stoneNoise = createNewNoiseGenerator(cluster.noiseSeed + 1000);
  const elementCount = Math.floor(
    cluster.minElements + Math.random() * (cluster.maxElements - cluster.minElements)
  );

  // قائمة لتتبع العناصر الموضوعة
  const placedStones = [];

  for (let i = 0; i < elementCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * cluster.radius * 0.5; // تقليل المسافة

    const x = cluster.x + Math.cos(angle) * distance;
    const z = cluster.z + Math.sin(angle) * distance;

    const localNoise = stoneNoise.noise2D(x / 120, z / 120);

    // التحقق من المسافة الآمنة
    if (checkSafeDistance(x, z, CLUSTER_SETTINGS.clusterSpacing.minDistance + 50)) {
      // التحقق من المسافة من الحجارة الأخرى في نفس التجمع
      let tooClose = false;
      for (const stone of placedStones) {
        const dx = stone.x - x;
        const dz = stone.z - z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < CLUSTER_SETTINGS.clusterSpacing.minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose && localNoise > 0.15) { // تخفيض عتبة الضوضاء
        placedStones.push({ x, z });
        
        elements.push({
          x,
          z,
          type: `${stoneType}_${variant}`,
          clusterId: i,
          inCluster: true,
          spacing: CLUSTER_SETTINGS.clusterSpacing.minDistance,
        });
      }
    }
  }

  return elements;
}

// --- دالة الحصول على معلومات التجمعات ---
export function getClusterInfo() {
  let totalElements = 0;
  
  // حساب العناصر في كل تجمع
  for (const clusterType in CLUSTER_REGIONS) {
    for (const cluster of CLUSTER_REGIONS[clusterType]) {
      totalElements += cluster.placedElements || 0;
    }
  }
  
  return {
    forestClusters: CLUSTER_REGIONS.forestClusters.length,
    desertClusters: CLUSTER_REGIONS.desertClusters.length,
    stoneClusters: CLUSTER_REGIONS.stoneClusters.length,
    totalClusters:
      CLUSTER_REGIONS.forestClusters.length +
      CLUSTER_REGIONS.desertClusters.length +
      CLUSTER_REGIONS.stoneClusters.length,
    estimatedElements: totalElements,
    regions: CLUSTER_REGIONS,
  };
}

// --- دالة للتحقق مما إذا كانت النقطة داخل تجمع ---
export function isPointInCluster(x, z) {
  for (const clusterType in CLUSTER_REGIONS) {
    for (const cluster of CLUSTER_REGIONS[clusterType]) {
      const dx = cluster.x - x;
      const dz = cluster.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= cluster.radius) {
        return {
          inCluster: true,
          clusterType: clusterType.replace("Clusters", ""),
          distance: distance,
          clusterData: cluster,
          density: cluster.density,
        };
      }
    }
  }

  return { inCluster: false };
}

// --- دالة تحسين توزيع التجمعات الحالية ---
export function optimizeClusterDistribution() {
  console.log("🔧 تحسين توزيع التجمعات...");
  
  let removedClusters = 0;
  let mergedClusters = 0;
  
  // التحقق من التجمعات القريبة جداً من بعضها
  for (const clusterType in CLUSTER_REGIONS) {
    const clusters = CLUSTER_REGIONS[clusterType];
    
    for (let i = clusters.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const dx = clusters[i].x - clusters[j].x;
        const dz = clusters[i].z - clusters[j].z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < CLUSTER_SETTINGS.minDistanceBetweenClusters * 0.8) {
          // دمج التجمعات أو إزالة أحدها
          if (clusters[i].density < clusters[j].density) {
            clusters.splice(i, 1);
            removedClusters++;
          } else {
            clusters.splice(j, 1);
            removedClusters++;
          }
          break;
        }
      }
    }
  }
  
  console.log(`✅ تم تحسين التجمعات: ${removedClusters} تمت إزالته، ${mergedClusters} تم دمجها`);
  return { removed: removedClusters, merged: mergedClusters };
}

// --- دالة ضبط إعدادات التجمعات ---
export function configureClusterSettings(newSettings) {
  Object.assign(CLUSTER_SETTINGS, newSettings);
  console.log("🔄 تم تحديث إعدادات التجمعات:", CLUSTER_SETTINGS);
}