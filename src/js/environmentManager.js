// environmentManager.js - المدير الرئيسي لنظام البيئة المحسن مع الأرانب
import * as THREE from "three";
import { globals } from "./globals.js";

// استيراد جميع الأنظمة المحسنة
import {
  createMassiveArtisticIsland,
  getTerrainHeight,
} from "./terrainSystem.js";
import { initSimplexNoise } from "./simplexNoiseSystem.js";
import {
  distributeRareResources,
  createBerryClusters,
  distributeIndividualElements,
  getResourceDistributionInfo,
  optimizeExistingDistribution,
} from "./resourceDistribution.js";
import {
  createResourceClusters,
  CLUSTER_REGIONS,
  createClusterElements,
  createStoneClusterElements,
  getClusterInfo,
  optimizeClusterDistribution,
} from "./clusterSystem.js";
import {
  createResourceElement,
  createResourceElements,
  removeResourceElement,
  optimizeExistingElements,
  getCreationStats,
} from "./elementCreator.js";
import {
  renderEnvironment,
  updateVisibilityAnim,
  getEnvironmentStats,
  setViewSettings,
  forceShowAllObjects,
  reloadVisibility,
  optimizeVisibleSpacing,
} from "./visibilitySystem.js";

// استيراد نظام الرقاقات الجديد
import {
  initChipSystem,
  updateAllChips,
  getChipSystemInfo,
  findNearbyChips,
  harvestChip,
} from "./chipSystem.js";

// استيراد نظام الأرانب الجديد
import {
  initRabbitSystem,
  updateRabbitSystem,
  getRabbitSystemInfo,
  resetRabbitSystem,
  configureRabbitSettings,
  getRabbitSettings,
} from "./rabbit.js";

// --- إعدادات البيئة المحسنة ---
const ENVIRONMENT_SETTINGS = {
  maxTotalElements: 800,
  rareElementPercentage: 0.05,
  clusterElementPercentage: 0.3,
  individualElementPercentage: 0.65,
  optimizationEnabled: true,
  validationEnabled: true,
  performanceMode: "balanced",
  enableChips: true,
  chipCount: 10,
  enableRabbits: true, // تفعيل نظام الأرانب
  rabbitCount: 4, // عدد الأرانب
};

// --- دالة إنشاء بيئة متقدمة محسنة مع الأرانب ---
export function createAdvancedEnvironment() {
  console.log("🎨 إنشاء بيئة متقدمة مع توزيع محترف والأرانب...");

  // التحقق من النظام
  if (!globals.scene) {
    console.error("❌ المشهد غير مهيء");
    return { success: false, error: "Scene not initialized" };
  }

  // إعداد المجموعات
  if (!globals.forestGroup) {
    globals.forestGroup = new THREE.Group();
    globals.forestGroup.name = "EnvironmentGroup";
    globals.scene.add(globals.forestGroup);
  }
  
  if (!globals.obstacleData) {
    globals.obstacleData = [];
  }

  // تهيئة نظام Simplex Noise
  initSimplexNoise(12345);

  // إنشاء مناطق التجمعات
  console.log("🌳 إنشاء تجمعات الموارد...");
  const clusters = createResourceClusters();

  // توزيع الموارد النادرة
  console.log("💎 توزيع الموارد النادرة...");
  const rareResources = distributeRareResources(globals.obstacleData);

  // إضافة الموارد النادرة إلى المشهد
  console.log("🔄 إنشاء العناصر النادرة...");
  const rareElementsResult = createResourceElements(rareResources);
  console.log(`✅ ${rareElementsResult.success.length} عنصر نادر تم إنشاؤه`);

  // إنشاء الرقاقات إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableChips) {
    console.log("💎 إنشاء الرقاقات النادرة...");
    const chipSystemResult = initChipSystem();
    console.log(`✅ نظام الرقاقات: ${chipSystemResult.createdChips.length} رقاقة تم إنشاؤها`);
  }

  // إنشاء الأرانب إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableRabbits) {
    console.log("🐇 إنشاء الأرانب في الغابة...");
    const rabbitSystemResult = initRabbitSystem();
    console.log(`✅ نظام الأرانب: تم إنشاء ${ENVIRONMENT_SETTINGS.rabbitCount} أرنب في الغابة`);
  }

  // إضافة العناصر داخل تجمعات الغابة
  console.log("🌲 إنشاء عناصر تجمعات الغابة...");
  clusters.forestClusters.forEach((cluster, index) => {
    const elements = createClusterElements(cluster, false);
    elements.forEach((elem) => {
      createResourceElement(elem.type, elem.x, elem.z, false, {
        clusterId: index,
        inCluster: true,
        spacing: 150,
        avoidOverlap: true,
      });
    });
  });

  // إضافة العناصر داخل تجمعات الصحراء
  console.log("🏜️ إنشاء عناصر تجمعات الصحراء...");
  clusters.desertClusters.forEach((cluster, index) => {
    const elements = createClusterElements(cluster, true);
    elements.forEach((elem) => {
      createResourceElement(elem.type, elem.x, elem.z, true, {
        clusterId: index + 100,
        inCluster: true,
        spacing: 150,
        avoidOverlap: true,
      });
    });
  });

  // إضافة العناصر داخل تجمعات الصخور
  console.log("🪨 إنشاء عناصر تجمعات الصخور...");
  clusters.stoneClusters.forEach((cluster, index) => {
    const isDesert =
      Math.sqrt(cluster.x * cluster.x + cluster.z * cluster.z) < 8000;
    const elements = createStoneClusterElements(cluster, isDesert);
    elements.forEach((elem) => {
      createResourceElement(elem.type, elem.x, elem.z, isDesert, {
        clusterId: index + 200,
        inCluster: true,
        spacing: 180,
        avoidOverlap: true,
      });
    });
  });

  // إضافة تجمعات التوت
  console.log("🍓 إنشاء تجمعات التوت...");
  const berryClusters = createBerryClusters(globals.obstacleData);
  berryClusters.forEach((berry) => {
    createResourceElement(
      berry.type,
      berry.x,
      berry.z,
      berry.type === "blue_berry" || berry.type === "lilac_berry",
      {
        ...berry,
        avoidOverlap: true,
      }
    );
  });

  // توزيع العناصر الفردية
  console.log("🌿 توزيع العناصر الفردية...");
  const individualElements = distributeIndividualElements(
    200,
    globals.obstacleData
  );
  individualElements.forEach((elem) => {
    const isDesert =
      elem.type === "blue_berry" ||
      elem.type === "lilac_berry" ||
      elem.type === "wood_palm" ||
      elem.type === "desert_stone_1";
    createResourceElement(elem.type, elem.x, elem.z, isDesert, {
      ...elem,
      avoidOverlap: true,
    });
  });

  // التحسين التلقائي
  if (ENVIRONMENT_SETTINGS.optimizationEnabled) {
    console.log("🔧 تطبيق التحسينات التلقائية...");
    
    // تحسين التجمعات
    optimizeClusterDistribution();
    
    // تحسين العناصر الحالية
    const optimizationResult = optimizeExistingElements();
    console.log(`✅ تم تحسين ${optimizationResult.optimized} عنصر`);
    
    // تحسين التباعد المرئي
    const spacingResult = optimizeVisibleSpacing();
    console.log(`📏 تم تحسين تباعد ${spacingResult.optimized} عنصر مرئي`);
  }

  console.log(`✅ تم إنشاء بيئة متقدمة مع ${globals.obstacleData.length} عنصر`);

  const clusterInfo = getClusterInfo();
  console.log("📊 إحصائيات التجمعات:", clusterInfo);

  const resourceInfo = getResourceDistributionInfo();
  console.log("📊 إحصائيات الموارد:", resourceInfo);

  const creationStats = getCreationStats();
  console.log("📊 إحصائيات الإنشاء:", creationStats);

  // إحصائيات الرقاقات إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableChips) {
    const chipInfo = getChipSystemInfo();
    console.log("💎 إحصائيات الرقاقات:", chipInfo);
  }

  // إحصائيات الأرانب إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableRabbits) {
    const rabbitInfo = getRabbitSystemInfo();
    console.log("🐇 إحصائيات الأرانب:", rabbitInfo);
  }

  return {
    success: true,
    totalElements: globals.obstacleData.length,
    clusters: clusterInfo,
    resources: resourceInfo,
    creation: creationStats,
    chips: ENVIRONMENT_SETTINGS.enableChips ? getChipSystemInfo() : null,
    rabbits: ENVIRONMENT_SETTINGS.enableRabbits ? getRabbitSystemInfo() : null,
  };
}

// --- دالة تحديث الرسوم المتحركة للبيئة مع الرقاقات والأرانب ---
export function updateEnvironmentAnim(deltaTime) {
  if (!deltaTime) deltaTime = 0.016;
  
  // تحديث الرقاقات
  const time = performance.now() * 0.001;
  if (ENVIRONMENT_SETTINGS.enableChips) {
    const chipCount = updateAllChips(time);
    
    // تحديث تلميحات التفاعل للرقاقات
    updateChipInteractionHints();
  }

  // تحديث الأرانب إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableRabbits && globals.player) {
    updateRabbitSystem(deltaTime, globals.player.position);
  }

  // تحديث العناصر الباهتة
  updateVisibilityAnim(deltaTime);
}

// --- دالة تحديث تلميحات التفاعل للرقاقات ---
function updateChipInteractionHints() {
  if (!globals.player || !document.getElementById("interaction-hint")) return;
  
  const hint = document.getElementById("interaction-hint");
  const nearbyChips = findNearbyChips(globals.player.position.x, globals.player.position.z, 250);
  
  if (nearbyChips.length > 0) {
    const closestChip = nearbyChips[0];
    
    if (closestChip && closestChip.obstacle && closestChip.obstacle.mesh) {
      const vector = closestChip.obstacle.mesh.position.clone();
      vector.y += 150;
      vector.project(globals.camera);

      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

      hint.style.display = "block";
      hint.style.left = `${x}px`;
      hint.style.top = `${y}px`;

      let chipName = closestChip.name || "رقاقة";
      let rarityColor = "#ffffff";
      let sizeText = "";
      
      switch (closestChip.rarity) {
        case "أسطورية": 
          rarityColor = "#ffd700"; 
          sizeText = " ⭐ (كبيرة جداً)";
          break;
        case "نادرة جداً": 
          rarityColor = "#ff6b6b"; 
          sizeText = " (كبيرة)";
          break;
        default: 
          rarityColor = "#ffffff";
      }

      hint.innerHTML = `
        <span style="color:${rarityColor}; font-weight:bold; font-size:16px;">
          ${chipName}${sizeText}
        </span>
        <br>
        <span style="color:#FFF; background:rgba(0,0,0,0.7); padding:3px 8px; border-radius:5px; margin-left:5px; font-size:15px;">E</span> 
        <span style="font-size:14px;">جمع الرقاقة الكبيرة</span>
      `;
      
      // إضافة حدث الحصاد عند الضغط على E
      if (globals.input.e && !globals.lastChipHarvest) {
        globals.lastChipHarvest = performance.now();
        harvestChip(closestChip.obstacle, closestChip.index);
      }
    }
  }
}

// --- دالة الحصول على معلومات النظام المحسنة مع الرقاقات والأرانب ---
export function getEnvironmentInfo() {
  const stats = getEnvironmentStats();
  const clusters = getClusterInfo();
  const resources = getResourceDistributionInfo();
  const creation = getCreationStats();
  
  const info = {
    ...stats,
    clusters: clusters,
    resources: resources,
    creation: creation,
    settings: ENVIRONMENT_SETTINGS,
  };
  
  // إضافة معلومات الرقاقات إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableChips) {
    info.chips = getChipSystemInfo();
  }
  
  // إضافة معلومات الأرانب إذا كانت مفعلة
  if (ENVIRONMENT_SETTINGS.enableRabbits) {
    info.rabbits = getRabbitSystemInfo();
  }
  
  // إضافة معلومات النظام
  info.systemInfo = {
    threejsVersion: THREE.REVISION,
    rendererInfo: globals.renderer ? globals.renderer.info : null,
    memory: performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        }
      : null,
    timestamp: Date.now(),
  };
  
  return info;
}

// --- دالة إعادة إنشاء البيئة المحسنة مع الأرانب ---
export function recreateEnvironment(seed) {
  console.log("🔄 إعادة إنشاء البيئة...");

  // إعادة تعيين نظام الأرانب
  if (ENVIRONMENT_SETTINGS.enableRabbits) {
    resetRabbitSystem();
  }

  // تنظيف البيئة الحالية
  if (globals.forestGroup) {
    console.log("🧹 تنظيف البيئة الحالية...");
    
    // إزالة جميع العناصر
    while (globals.forestGroup.children.length > 0) {
      const child = globals.forestGroup.children[0];
      globals.forestGroup.remove(child);

      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }

  // إعادة تعيين البيانات
  globals.obstacleData = [];
  
  if (globals.visibleObjects) globals.visibleObjects.clear();
  if (globals.invisibleObjects) globals.invisibleObjects.clear();
  if (globals.visibleChunks) globals.visibleChunks.clear();
  if (globals.visibilityCache) globals.visibilityCache.clear();

  if (globals.fadingObjects) {
    globals.fadingObjects.length = 0;
  }

  // إعادة إنشاء البيئة
  initSimplexNoise(seed || Date.now());
  const result = createAdvancedEnvironment();

  console.log("✅ تم إعادة إنشاء البيئة بنجاح");
  return result;
}

// --- دالة البحث عن عناصر بالقرب من موقع ---
export function findNearbyElements(x, z, radius) {
  const nearby = [];

  if (!globals.obstacleData) {
    return nearby;
  }

  globals.obstacleData.forEach((obs) => {
    if (!obs.mesh || !obs.x || !obs.z) return;

    const dx = obs.x - x;
    const dz = obs.z - z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance <= radius) {
      nearby.push({
        element: obs,
        distance: distance,
        type: obs.type,
        rarity: obs.rarity,
        position: { x: obs.x, z: obs.z },
        userData: obs.userData,
        spacing: obs.userData?.spacing || 0,
      });
    }
  });

  return nearby.sort((a, b) => a.distance - b.distance);
}

// --- دالة تحسين منطقة محددة ---
export function optimizeArea(x, z, radius) {
  console.log(`🔧 تحسين المنطقة حول (${x.toFixed(1)}, ${z.toFixed(1)})`);
  
  const nearby = findNearbyElements(x, z, radius);
  let optimized = 0;
  let removed = 0;
  
  // تحليل الكثافة
  const density = nearby.length / (Math.PI * radius * radius);
  console.log(`📊 كثافة المنطقة: ${density.toFixed(4)} عناصر/وحدة²`);
  
  if (density > 0.001) {
    console.log("⚠️ الكثافة عالية، تقليل العناصر...");
    
    // إزالة بعض العناصر الشائعة
    nearby.sort((a, b) => {
      const rarityOrder = { "common": 1, "uncommon": 2, "rare": 3, "ultra_rare": 4 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
    
    const toRemove = Math.floor(nearby.length * 0.3);
    for (let i = 0; i < Math.min(toRemove, nearby.length); i++) {
      if (nearby[i].element.mesh && nearby[i].rarity === "common") {
        if (removeResourceElement(nearby[i].element.mesh)) {
          removed++;
        }
      }
    }
  } else if (density < 0.0001) {
    console.log("⚠️ الكثافة منخفضة، إضافة عناصر...");
    
    // إضافة عناصر جديدة
    const toAdd = Math.floor((0.0005 - density) * Math.PI * radius * radius);
    for (let i = 0; i < toAdd; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      const newX = x + Math.cos(angle) * distance;
      const newZ = z + Math.sin(angle) * distance;
      const isDesert = Math.sqrt(newX * newX + newZ * newZ) < 10000;
      
      const types = isDesert ? 
        ["wood_palm", "desert_stone", "stick"] : 
        ["wood", "stone", "straw", "stick"];
      const type = types[Math.floor(Math.random() * types.length)];
      
      createResourceElement(type, newX, newZ, isDesert, {
        avoidOverlap: true,
        spacing: 200,
      });
      
      optimized++;
    }
  }
  
  console.log(`✅ تم تحسين المنطقة: ${optimized} عنصر مضاف، ${removed} عنصر مزال`);
  return { added: optimized, removed: removed, originalDensity: density };
}

// --- دالة تحديث البيئة الديناميكية ---
export function updateDynamicEnvironment() {
  if (!ENVIRONMENT_SETTINGS.optimizationEnabled) {
    return { updated: false, reason: "optimization_disabled" };
  }
  
  const now = Date.now();
  const lastUpdate = globals.lastEnvironmentUpdate || 0;
  
  // تحديث كل 30 ثانية
  if (now - lastUpdate < 30000) {
    return { updated: false, reason: "too_soon", nextUpdate: 30000 - (now - lastUpdate) };
  }
  
  console.log("🔄 تحديث البيئة الديناميكية...");
  
  // تحسين العناصر الحالية
  const elementOptimization = optimizeExistingElements();
  
  // تحسين التوزيع
  const distributionOptimization = optimizeExistingDistribution();
  
  // تحديث الرؤية
  const visibilityUpdate = reloadVisibility();
  
  globals.lastEnvironmentUpdate = now;
  
  return {
    updated: true,
    elementOptimization,
    distributionOptimization,
    visibilityUpdate,
    timestamp: now,
  };
}

// --- دالة ضبط إعدادات البيئة ---
export function configureEnvironmentSettings(newSettings) {
  Object.assign(ENVIRONMENT_SETTINGS, newSettings);
  console.log("🔄 تم تحديث إعدادات البيئة:", ENVIRONMENT_SETTINGS);
  return ENVIRONMENT_SETTINGS;
}

// --- دالة الحصول على إعدادات الأرانب ---
export function getRabbitSystemConfiguration() {
  return getRabbitSettings();
}

// --- دالة ضبط إعدادات الأرانب ---
export function configureRabbitSystemSettings(newSettings) {
  return configureRabbitSettings(newSettings);
}

// --- تصدير الدوال الرئيسية ---
export {
  createMassiveArtisticIsland,
  getTerrainHeight,
  renderEnvironment,
  getEnvironmentStats,
  setViewSettings,
  forceShowAllObjects,
  reloadVisibility,
};