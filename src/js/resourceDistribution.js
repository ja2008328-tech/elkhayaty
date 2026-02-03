// resourceDistribution.js - نظام توزيع الموارد باستخدام Simplex Noise المحسن
import { globals } from "./globals.js";
import * as THREE from "three";
import { getBiomeType } from "./terrainSystem.js";
import {
  getSimplexDensity,
  createNewNoiseGenerator,
} from "./simplexNoiseSystem.js";





// --- تعريف توزيعات الموارد مع المسافات المحسنة ---
// --- تعريف توزيعات الموارد مع المسافات المحسنة ---
export const RESOURCE_DISTRIBUTION = {
  // الرقاقات (موارد نادرة جداً)
  chips: {
    chip_white: {
      weight: 0.008,
      probability: 0.006,
      minDistance: 5000,
      count: 2,
      biome: "forest",
      maxPerMap: 2,
      spacing: 3000,
      rarity: "ultra_rare"
    },
    chip_yellow: {
      weight: 0.008,
      probability: 0.006,
      minDistance: 5000,
      count: 2,
      biome: "forest",
      maxPerMap: 2,
      spacing: 3000,
      rarity: "ultra_rare"
    },
    chip_gold: {
      weight: 0.008,
      probability: 0.006,
      minDistance: 5000,
      count: 2,
      biome: "forest",
      maxPerMap: 2,
      spacing: 3000,
      rarity: "ultra_rare"
    },
    chip_red: {
      weight: 0.008,
      probability: 0.006,
      minDistance: 5000,
      count: 2,
      biome: "desert",
      maxPerMap: 2,
      spacing: 3000,
      rarity: "ultra_rare"
    },
    chip_blue: {
      weight: 0.008,
      probability: 0.006,
      minDistance: 5000,
      count: 2,
      biome: "desert",
      maxPerMap: 2,
      spacing: 3000,
      rarity: "ultra_rare"
    }
  },

  rare: {
    flint: {
      weight: 0.02,
      probability: 0.015,
      minDistance: 1200,
      clusterSize: 1,
      biome: "both",
      maxPerMap: 10,
    },
    limestone: {
      weight: 0.03,
      probability: 0.025,
      minDistance: 900,
      clusterSize: 1,
      biome: "both",
      maxPerMap: 15,
    },
    cactus: {
      weight: 0.04,
      probability: 0.03,
      minDistance: 800,
      clusterSize: 2,
      biome: "desert",
      maxPerMap: 12,
    },
  },

  uncommon: {
    desert_stone: {
      weight: 0.06,
      probability: 0.05,
      minDistance: 600,
      clusterSize: 2,
      biome: "desert",
      spacing: 150,
    },
    blue_berry: {
      weight: 0.05,
      probability: 0.04,
      minDistance: 500,
      clusterSize: 3,
      biome: "desert",
      spacing: 120,
    },
    lilac_berry: {
      weight: 0.05,
      probability: 0.04,
      minDistance: 500,
      clusterSize: 3,
      biome: "desert",
      spacing: 120,
    },
    red_berry: {
      weight: 0.06,
      probability: 0.05,
      minDistance: 500,
      clusterSize: 3,
      biome: "forest",
      spacing: 120,
    },
    yellow_berry: {
      weight: 0.06,
      probability: 0.05,
      minDistance: 500,
      clusterSize: 3,
      biome: "forest",
      spacing: 120,
    },
  },

  common: {
    wood: {
      weight: 0.12,
      probability: 0.15,
      minDistance: 350,
      clusterSize: 4,
      clusterDensity: 0.5,
      biome: "forest",
      spacing: 100,
    },
    stone: {
      weight: 0.10,
      probability: 0.12,
      minDistance: 400,
      clusterSize: 3,
      clusterDensity: 0.45,
      biome: "forest",
      spacing: 120,
    },
    straw: {
      weight: 0.08,
      probability: 0.09,
      minDistance: 300,
      clusterSize: 5,
      clusterDensity: 0.6,
      biome: "forest",
      spacing: 80,
    },
    stick: {
      weight: 0.07,
      probability: 0.08,
      minDistance: 250,
      clusterSize: 6,
      clusterDensity: 0.7,
      biome: "both",
      spacing: 60,
    },
    wood_palm: {
      weight: 0.09,
      probability: 0.10,
      minDistance: 400,
      clusterSize: 3,
      clusterDensity: 0.4,
      biome: "desert",
      spacing: 110,
    },
  },
};
// --- دالة تحسين التحقق من المسافة ---
export function checkSafeDistance(x, z, minDistance, checkAgainstAll = false) {
  if (!globals.obstacleData || globals.obstacleData.length === 0) {
    return true;
  }

  // استخدام شبكة لتسريع التحقق
  const gridSize = 500;
  const gridX = Math.floor(x / gridSize);
  const gridZ = Math.floor(z / gridSize);
  
  // التحقق من الخلايا المجاورة فقط
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const checkGridX = gridX + dx;
      const checkGridZ = gridZ + dz;
      const gridKey = `${checkGridX},${checkGridZ}`;
      
      // إذا كان هناك عناصر في هذه الخلية
      if (globals.spatialGrid && globals.spatialGrid[gridKey]) {
        for (const obs of globals.spatialGrid[gridKey]) {
          if (!obs.mesh || !obs.x || !obs.z) continue;

          const dxObs = obs.x - x;
          const dzObs = obs.z - z;
          const distance = Math.sqrt(dxObs * dxObs + dzObs * dzObs);

          // إضافة مسافة إضافية بناءً على نوع العنصر
          let adjustedDistance = minDistance;
          if (obs.type && RESOURCE_DISTRIBUTION.common[obs.type]) {
            adjustedDistance += RESOURCE_DISTRIBUTION.common[obs.type].spacing || 0;
          }

          if (distance < adjustedDistance) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

// --- دالة تحديث الشبكة المكانية ---
function updateSpatialGrid(element) {
  if (!globals.spatialGrid) {
    globals.spatialGrid = {};
  }
  
  const gridSize = 500;
  const gridX = Math.floor(element.x / gridSize);
  const gridZ = Math.floor(element.z / gridSize);
  const gridKey = `${gridX},${gridZ}`;
  
  if (!globals.spatialGrid[gridKey]) {
    globals.spatialGrid[gridKey] = [];
  }
  
  globals.spatialGrid[gridKey].push(element);
}

// --- دالة توزيع الموارد النادرة بشكل استراتيجي ---
export function distributeRareResources(obstacleData) {
  console.log("💎 توزيع الموارد النادرة...");

  const rareResources = [];
  
  // تهيئة عداد لكل نوع
  const typeCounters = {
    flint: 0,
    limestone: 0,
    cactus: 0,
  };

  // توزيع الصوان (نادر جداً)
  for (let i = 0; i < RESOURCE_DISTRIBUTION.rare.flint.maxPerMap; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) { // تقليل المحاولات
      const angle = Math.random() * Math.PI * 2;
      const distance = 15000 + Math.random() * 15000; // زيادة المسافة

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // التحقق من المسافة الكبيرة
      if (checkSafeDistance(x, z, RESOURCE_DISTRIBUTION.rare.flint.minDistance, true)) {
        rareResources.push({
          x,
          z,
          type: "flint",
          value: "high",
          rarity: "ultra_rare",
          minDistance: RESOURCE_DISTRIBUTION.rare.flint.minDistance,
        });
        typeCounters.flint++;
        placed = true;
      }

      attempts++;
    }
  }

  // توزيع الحجر الجيري (نادر)
  for (let i = 0; i < RESOURCE_DISTRIBUTION.rare.limestone.maxPerMap; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 40) {
      const angle = Math.random() * Math.PI * 2;
      let distance;

      if (Math.random() > 0.5) {
        distance = Math.random() * 8000;
      } else {
        distance = 12000 + Math.random() * 16000;
      }

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      if (checkSafeDistance(x, z, RESOURCE_DISTRIBUTION.rare.limestone.minDistance, true)) {
        rareResources.push({
          x,
          z,
          type: "limestone",
          value: "medium_high",
          rarity: "rare",
          minDistance: RESOURCE_DISTRIBUTION.rare.limestone.minDistance,
        });
        typeCounters.limestone++;
        placed = true;
      }

      attempts++;
    }
  }

  // توزيع الصبار (نادر في الصحراء)
  for (let i = 0; i < RESOURCE_DISTRIBUTION.rare.cactus.maxPerMap; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 30) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 6000;

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      if (checkSafeDistance(x, z, RESOURCE_DISTRIBUTION.rare.cactus.minDistance, true)) {
        rareResources.push({
          x,
          z,
          type: "cactus",
          value: "medium",
          rarity: "uncommon",
          clusterSize: 1 + Math.floor(Math.random() * 2), // تقليل حجم التجمع
          minDistance: RESOURCE_DISTRIBUTION.rare.cactus.minDistance,
        });
        typeCounters.cactus++;
        placed = true;
      }

      attempts++;
    }
  }

  console.log(`✅ تم توزيع ${rareResources.length} مورد نادر`, typeCounters);
  return rareResources;
}

// --- دالة إنشاء تجمعات التوت المحسنة ---
export function createBerryClusters(obstacleData) {
  console.log("🍓 إنشاء تجمعات التوت...");

  const berryTypes = ["red_berry", "yellow_berry", "blue_berry", "lilac_berry"];
  const berryClusters = [];
  
  // إعدادات لكل نوع توت
  const berrySettings = {
    "red_berry": { minDistance: 500, clusterCount: 6, clusterSize: 2 },
    "yellow_berry": { minDistance: 500, clusterCount: 6, clusterSize: 2 },
    "blue_berry": { minDistance: 500, clusterCount: 5, clusterSize: 2 },
    "lilac_berry": { minDistance: 500, clusterCount: 5, clusterSize: 2 },
  };

  berryTypes.forEach((berryType, typeIndex) => {
    const isDesertBerry =
      berryType === "blue_berry" || berryType === "lilac_berry";
    const settings = berrySettings[berryType];
    const clusterCount = settings.clusterCount;

    for (let i = 0; i < clusterCount; i++) {
      let clusterX, clusterZ;
      let attempts = 0;
      const maxAttempts = 25;

      do {
        const angle = Math.random() * Math.PI * 2;
        let distance;

        if (isDesertBerry) {
          distance = Math.random() * 5000; // تقليل المسافة
        } else {
          distance = 10000 + Math.random() * 15000;
        }

        clusterX = Math.cos(angle) * distance;
        clusterZ = Math.sin(angle) * distance;

        attempts++;
        if (attempts >= maxAttempts) break;
      } while (!checkSafeDistance(clusterX, clusterZ, settings.minDistance));

      if (attempts >= maxAttempts) continue;

      // إنشاء مجموعة صغيرة من التوت
      const berryCount = settings.clusterSize + Math.floor(Math.random() * 2);
      const berryNoise = createNewNoiseGenerator(typeIndex * 1000 + i);
      
      for (let j = 0; j < berryCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 70; // تقليل المسافة

        const x = clusterX + Math.cos(angle) * distance;
        const z = clusterZ + Math.sin(angle) * distance;
        
        // استخدام الضوضاء للتوزيع الطبيعي
        const noiseValue = berryNoise.noise2D(x / 50, z / 50);

        if (noiseValue > 0.3 && checkSafeDistance(x, z, 100)) { // زيادة المسافة الدنيا
          berryClusters.push({
            x,
            z,
            type: berryType,
            rarity: "uncommon",
            value: "low",
            inCluster: true,
            clusterId: 300 + typeIndex * 10 + i,
            spacing: 100,
          });
        }
      }
    }
  });

  console.log(`✅ تم إنشاء ${berryClusters.length} عنصر توت في مجموعات`);
  return berryClusters;
}

// --- دالة توزيع العناصر الفردية المحسنة ---
export function distributeIndividualElements(totalElements, obstacleData) {
  console.log("🌿 توزيع العناصر الفردية...");

  const individualElements = [];
  let placedCount = 0;
  const maxElements = Math.min(totalElements, 200); // الحد الأقصى

  for (let i = 0; i < maxElements * 3; i++) {
    if (placedCount >= maxElements) break;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 25000;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const isDesert = getBiomeType(x, z) === "desert";

    // زيادة المسافة الدنيا للعناصر الفردية
    if (!checkSafeDistance(x, z, 450)) continue;

    // استخدام الضوضاء لتوزيع أكثر طبيعية
    const noiseValue = getSimplexDensity(x, z, 300);
    
    // تحديد نوع العنصر بناءً على المنطقة والضوضاء
    let type;
    if (isDesert) {
      if (noiseValue > 0.7) {
        type = "wood_palm";
      } else if (noiseValue > 0.5) {
        type = "desert_stone_1";
      } else if (noiseValue > 0.3) {
        type = "stick";
      } else if (noiseValue > 0.1) {
        type = Math.random() > 0.5 ? "blue_berry" : "lilac_berry";
      } else {
        continue; // لا تضع عنصر في هذه المنطقة
      }
    } else {
      if (noiseValue > 0.7) {
        type = "wood";
      } else if (noiseValue > 0.5) {
        type = "stone_1";
      } else if (noiseValue > 0.3) {
        type = "straw";
      } else if (noiseValue > 0.1) {
        type = Math.random() > 0.5 ? "red_berry" : "yellow_berry";
      } else {
        type = "stick";
      }
    }

    individualElements.push({
      x,
      z,
      type,
      rarity: "common",
      value: "normal",
      noiseValue: noiseValue,
      spacing: 450,
    });

    placedCount++;
    
    // تحديث الشبكة المكانية
    updateSpatialGrid({ x, z, type });
  }

  console.log(`✅ تم توزيع ${placedCount} عنصر فردي`);
  return individualElements;
}

// --- دالة تحسين التوزيع الحالي ---
export function optimizeExistingDistribution() {
  console.log("🔧 تحسين التوزيع الحالي...");
  
  if (!globals.obstacleData || globals.obstacleData.length === 0) {
    console.log("⚠️ لا توجد عناصر لتحسينها");
    return [];
  }
  
  const optimizedElements = [];
  const toRemove = [];
  const minSpacing = 250; // الحد الأدنى للمسافة
  
  // فرز العناصر بناءً على الكثافة
  globals.obstacleData.sort((a, b) => {
    const densityA = getSimplexDensity(a.x, a.z, 200);
    const densityB = getSimplexDensity(b.x, b.z, 200);
    return densityB - densityA; // الأعلى كثافة أولاً
  });
  
  // التحقق من العناصر القريبة جداً
  for (let i = 0; i < globals.obstacleData.length; i++) {
    const elementA = globals.obstacleData[i];
    if (toRemove.includes(i)) continue;
    
    let hasCloseNeighbor = false;
    
    for (let j = i + 1; j < globals.obstacleData.length; j++) {
      const elementB = globals.obstacleData[j];
      if (toRemove.includes(j)) continue;
      
      const dx = elementA.x - elementB.x;
      const dz = elementA.z - elementB.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < minSpacing) {
        // إزالة العنصر الأقل كثافة
        const densityA = getSimplexDensity(elementA.x, elementA.z, 200);
        const densityB = getSimplexDensity(elementB.x, elementB.z, 200);
        
        if (densityA > densityB) {
          toRemove.push(j);
        } else {
          toRemove.push(i);
          hasCloseNeighbor = true;
          break;
        }
      }
    }
    
    if (!hasCloseNeighbor && !toRemove.includes(i)) {
      optimizedElements.push(elementA);
    }
  }
  
  console.log(`✅ تم تحسين التوزيع: ${toRemove.length} عنصر تمت إزالته`);
  return optimizedElements;
}

// --- دالة الحصول على معلومات توزيع الموارد ---

// --- دالة الحصول على معلومات توزيع الموارد المعدلة ---
export function getResourceDistributionInfo() {
  let rareCount = 0;
  let uncommonCount = 0;
  let commonCount = 0;
  let chipsCount = 0;
  
  // تحليل التوزيع
  const distributionAnalysis = {
    byType: {},
    densityByRegion: {},
    spacingAnalysis: {},
    chips: {
      white: 0,
      yellow: 0,
      red: 0,
      blue: 0,
      gold: 0,
      total: 0
    }
  };

  if (globals.obstacleData) {
    globals.obstacleData.forEach((obs) => {
      if (obs.type && obs.type.startsWith('chip_')) {
        chipsCount++;
        const chipType = obs.type.replace('chip_', '');
        if (distributionAnalysis.chips[chipType] !== undefined) {
          distributionAnalysis.chips[chipType]++;
          distributionAnalysis.chips.total++;
        }
      } else if (obs.rarity === "ultra_rare" || obs.rarity === "rare") {
        rareCount++;
      } else if (obs.rarity === "uncommon") {
        uncommonCount++;
      } else {
        commonCount++;
      }
      
      // تحليل حسب النوع
      if (!distributionAnalysis.byType[obs.type]) {
        distributionAnalysis.byType[obs.type] = 0;
      }
      distributionAnalysis.byType[obs.type]++;
    });
  }

  return {
    total: globals.obstacleData ? globals.obstacleData.length : 0,
    rare: rareCount,
    uncommon: uncommonCount,
    common: commonCount,
    chips: chipsCount,
    chipsDistribution: distributionAnalysis.chips,
    distribution: RESOURCE_DISTRIBUTION,
    analysis: distributionAnalysis,
    recommendations: [
      "استخدم مسافات أكبر بين العناصر",
      "قلل من التجمعات الكبيرة",
      "وزع العناصر بشكل أكثر انتظاماً",
      `الرقاقات النادرة: ${chipsCount} رقاقة موزعة في الخريطة`
    ]
  };
}

// --- دالة ضبط إعدادات التوزيع ---
export function configureDistributionSettings(newSettings) {
  // تحديث إعدادات التوزيع
  for (const category in newSettings) {
    if (RESOURCE_DISTRIBUTION[category]) {
      for (const resource in newSettings[category]) {
        if (RESOURCE_DISTRIBUTION[category][resource]) {
          Object.assign(RESOURCE_DISTRIBUTION[category][resource], newSettings[category][resource]);
        }
      }
    }
  }
  
  console.log("🔄 تم تحديث إعدادات التوزيع");
  return RESOURCE_DISTRIBUTION;
}


// --- دالة توزيع الرقاقات النادرة ---
export function distributeChips() {
  console.log("💎💰 توزيع الرقاقات النادرة جداً...");
  
  const chips = [];
  
  // توزيع رقاقات الغابة (البيضاء، الصفراء، الذهبية)
  const forestChips = ['white', 'yellow', 'gold'];
  forestChips.forEach(chipType => {
    const chipConfig = RESOURCE_DISTRIBUTION.chips[`chip_${chipType}`];
    
    for (let i = 0; i < chipConfig.count; i++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        // توليد موقع في الغابة (بعيد عن المركز)
        const angle = Math.random() * Math.PI * 2;
        const distance = 8000 + Math.random() * 12000;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // التحقق من أن الموقع في الغابة
        if (getBiomeType(x, z) === 'forest') {
          // التحقق من المسافة من الرقاقات الأخرى
          let tooClose = false;
          
          for (const existingChip of chips) {
            const dx = existingChip.x - x;
            const dz = existingChip.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < chipConfig.minDistance) {
              tooClose = true;
              break;
            }
          }
          
          if (!tooClose) {
            chips.push({
              x,
              z,
              type: chipType,
              isDesert: false,
              minDistance: chipConfig.minDistance,
              rarity: chipConfig.rarity
            });
            placed = true;
            console.log(`📍 تم وضع رقاقة ${chipType} في الغابة: (${x.toFixed(1)}, ${z.toFixed(1)})`);
          }
        }
        
        attempts++;
      }
      
      if (!placed && attempts >= 100) {
        console.warn(`⚠️ فشل في وضع رقاقة ${chipType} بعد 100 محاولة`);
      }
    }
  });
  
  // توزيع رقاقات الصحراء (الحمراء، الزرقاء)
  const desertChips = ['red', 'blue'];
  desertChips.forEach(chipType => {
    const chipConfig = RESOURCE_DISTRIBUTION.chips[`chip_${chipType}`];
    
    for (let i = 0; i < chipConfig.count; i++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        // توليد موقع في الصحراء (قريب من المركز)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 6000;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // التحقق من أن الموقع في الصحراء
        if (getBiomeType(x, z) === 'desert') {
          // التحقق من المسافة من الرقاقات الأخرى
          let tooClose = false;
          
          for (const existingChip of chips) {
            const dx = existingChip.x - x;
            const dz = existingChip.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < chipConfig.minDistance) {
              tooClose = true;
              break;
            }
          }
          
          if (!tooClose) {
            chips.push({
              x,
              z,
              type: chipType,
              isDesert: true,
              minDistance: chipConfig.minDistance,
              rarity: chipConfig.rarity
            });
            placed = true;
            console.log(`📍 تم وضع رقاقة ${chipType} في الصحراء: (${x.toFixed(1)}, ${z.toFixed(1)})`);
          }
        }
        
        attempts++;
      }
      
      if (!placed && attempts >= 100) {
        console.warn(`⚠️ فشل في وضع رقاقة ${chipType} بعد 100 محاولة`);
      }
    }
  });
  
  console.log(`✅ تم توزيع ${chips.length} رقاقة نادرة في الخريطة`);
  return chips;
}