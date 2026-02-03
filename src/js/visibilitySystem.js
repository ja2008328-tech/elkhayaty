// visibilitySystem.js - نظام إدارة الرؤية وتحسين الأداء المحسن
import * as THREE from "three";
import { globals } from "./globals.js";

// --- إعدادات الرؤية المحسنة ---
const VISIBILITY_SETTINGS = {
  baseViewDistance: 7000,             // تقليل مسافة الرؤية
  alwaysVisibleDistance: 1500,        // تقليل المسافة المرئية دائماً
  fadeStartDistance: 6000,            // تقليل مسافة التلاشي
  chunkSize: 1000,                    // حجم القطعة
  maxVisibleChunks: 50,               // الحد الأقصى للقطع المرئية
  occlusionTestInterval: 1000,        // فترات اختبار الانسداد
  performanceMode: "balanced",        // وضع الأداء المتوازن
};

// --- تهيئة متغيرات الرؤية ---
let lastVisibilityCheck = 0;
let visibleObjectCount = 0;
let visibilityOptimized = false;

// --- دالة التحقق من رؤية الكائن المحسنة ---
export function checkObjectVisibility(object) {
  if (!object || !object.position || !globals.camera || !globals.player) {
    return false;
  }

  const distanceToPlayer = globals.player.position.distanceTo(object.position);

  // التحقق من المسافات
  if (distanceToPlayer <= VISIBILITY_SETTINGS.alwaysVisibleDistance) {
    return { visible: true, reason: "always_visible" };
  }

  if (distanceToPlayer > VISIBILITY_SETTINGS.baseViewDistance) {
    return { visible: false, reason: "beyond_view_distance" };
  }

  // اختبار الانسداد (تجاهل مؤقتاً للأداء)
  if (distanceToPlayer > VISIBILITY_SETTINGS.fadeStartDistance) {
    const fadeFactor = 1 - ((distanceToPlayer - VISIBILITY_SETTINGS.fadeStartDistance) / 
                          (VISIBILITY_SETTINGS.baseViewDistance - VISIBILITY_SETTINGS.fadeStartDistance));
    return { 
      visible: true, 
      reason: "faded", 
      fadeFactor: fadeFactor,
      distance: distanceToPlayer 
    };
  }

  // اختبار إطار العرض
  if (object.geometry) {
    const boundingSphere = new THREE.Sphere();
    object.geometry.computeBoundingSphere();
    boundingSphere.copy(object.geometry.boundingSphere);
    boundingSphere.applyMatrix4(object.matrixWorld);

    const inFrustum = globals.viewFrustum.intersectsSphere(boundingSphere);
    return { 
      visible: inFrustum, 
      reason: inFrustum ? "in_frustum" : "out_of_frustum",
      distance: distanceToPlayer 
    };
  }

  const boundingSphere = new THREE.Sphere(object.position, 100);
  const inFrustum = globals.viewFrustum.intersectsSphere(boundingSphere);
  
  return { 
    visible: inFrustum, 
    reason: inFrustum ? "in_frustum_simple" : "out_of_frustum_simple",
    distance: distanceToPlayer 
  };
}

// --- دالة تحديث منظور الكاميرا ---
export function updateCameraFrustum() {
  if (!globals.camera) return;

  globals.camera.updateMatrixWorld();

  globals.frustumMatrix.multiplyMatrices(
    globals.camera.projectionMatrix,
    globals.camera.matrixWorldInverse,
  );
  globals.viewFrustum.setFromProjectionMatrix(globals.frustumMatrix);
}

// --- دالة التحقق من تغير منظور الكاميرا ---
export function hasCameraPerspectiveChanged() {
  if (!globals.camera) return true;

  const currentPosition = globals.camera.position.clone();
  const currentQuaternion = globals.camera.quaternion.clone();

  const positionChanged =
    globals.lastCameraPosition.distanceTo(currentPosition) > 50; // زيادة عتبة التغيير
  const rotationChanged =
    !globals.lastCameraQuaternion.equals(currentQuaternion);

  globals.lastCameraPosition.copy(currentPosition);
  globals.lastCameraQuaternion.copy(currentQuaternion);

  return positionChanged || rotationChanged;
}

// --- دالة عرض البيئة مع نظام الرؤية المحسن ---
export function renderEnvironment() {
  const now = Date.now();
  
  // التحقق من الوقت المناسب للتحديث
  if (now - lastVisibilityCheck < 100 && !hasCameraPerspectiveChanged()) {
    return {
      visible: visibleObjectCount,
      invisible: globals.forestGroup ? globals.forestGroup.children.length - visibleObjectCount : 0,
      total: globals.forestGroup ? globals.forestGroup.children.length : 0,
      chunks: globals.visibleChunks ? globals.visibleChunks.size : 0,
      timestamp: now,
      optimized: visibilityOptimized,
      cached: true
    };
  }

  updateCameraFrustum();

  // إعادة تهيئة المجموعات
  if (!globals.visibleObjects) globals.visibleObjects = new Set();
  if (!globals.invisibleObjects) globals.invisibleObjects = new Set();
  if (!globals.visibleChunks) globals.visibleChunks = new Set();
  
  globals.visibleObjects.clear();
  globals.invisibleObjects.clear();
  
  visibleObjectCount = 0;
  let invisibleCount = 0;
  
  if (!globals.forestGroup) {
    return {
      visible: 0,
      invisible: 0,
      total: 0,
      chunks: 0,
      timestamp: now,
      optimized: false,
      cached: false
    };
  }

  const playerChunkX = Math.floor(
    globals.player.position.x / VISIBILITY_SETTINGS.chunkSize
  );
  const playerChunkZ = Math.floor(
    globals.player.position.z / VISIBILITY_SETTINGS.chunkSize
  );

  const chunkRenderDistance = Math.ceil(
    VISIBILITY_SETTINGS.baseViewDistance / VISIBILITY_SETTINGS.chunkSize
  );

  // تحديد عدد الكائنات للمعالجة
  const totalObjects = globals.forestGroup.children.length;
  const maxObjectsToProcess = VISIBILITY_SETTINGS.performanceMode === "low" ? 
                             Math.min(totalObjects, 500) : totalObjects;

  for (let i = 0; i < Math.min(totalObjects, maxObjectsToProcess); i++) {
    const child = globals.forestGroup.children[i];
    if (!child || !child.position) continue;

    const chunkX = Math.floor(child.position.x / VISIBILITY_SETTINGS.chunkSize);
    const chunkZ = Math.floor(child.position.z / VISIBILITY_SETTINGS.chunkSize);

    const chunkDistance = Math.max(
      Math.abs(chunkX - playerChunkX),
      Math.abs(chunkZ - playerChunkZ)
    );

    let visibilityResult = { visible: false, reason: "initial" };

    if (chunkDistance <= chunkRenderDistance) {
      visibilityResult = checkObjectVisibility(child);
    }

    if (visibilityResult.visible) {
      globals.visibleObjects.add(child);
      child.userData.isVisible = true;
      child.userData.lastCheck = now;
      child.userData.visibilityReason = visibilityResult.reason;
      
      if (visibilityResult.fadeFactor !== undefined) {
        child.userData.fadeFactor = visibilityResult.fadeFactor;
        // تطبيق التلاشي
        child.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            obj.material.transparent = true;
            obj.material.opacity = visibilityResult.fadeFactor;
          }
        });
      } else {
        // إعادة العتامة الكاملة
        child.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            obj.material.opacity = 1.0;
          }
        });
      }
      
      child.visible = true;
      visibleObjectCount++;

      const chunkKey = `${chunkX},${chunkZ}`;
      if (globals.visibleChunks.size < VISIBILITY_SETTINGS.maxVisibleChunks) {
        globals.visibleChunks.add(chunkKey);
      }
    } else {
      globals.invisibleObjects.add(child);
      child.userData.isVisible = false;
      child.userData.lastCheck = now;
      child.userData.visibilityReason = visibilityResult.reason;

      const distanceToPlayer = globals.player.position.distanceTo(
        child.position
      );
      if (distanceToPlayer > VISIBILITY_SETTINGS.baseViewDistance + 1000) {
        child.visible = false;
      }

      invisibleCount++;
    }
  }

  // تحديث بيانات العقبات
  if (globals.obstacleData) {
    globals.obstacleData.forEach((obs) => {
      if (obs.mesh && obs.mesh.userData) {
        obs.isInFrustum = obs.mesh.userData.isVisible;
      }
    });
  }

  lastVisibilityCheck = now;
  visibilityOptimized = true;

  return {
    visible: visibleObjectCount,
    invisible: invisibleCount,
    total: totalObjects,
    chunks: globals.visibleChunks.size,
    timestamp: now,
    optimized: visibilityOptimized,
    cached: false,
    settings: VISIBILITY_SETTINGS
  };
}

// --- دالة تحديث الرسوم المتحركة للبيئة ---
// --- دالة تحديث الرسوم المتحركة للبيئة ---
// تم تغيير الاسم إلى updateVisibilityAnim لتجنب التعارض
export function updateVisibilityAnim(deltaTime) {
  if (!deltaTime) deltaTime = 0.016;

  if (globals.fadingObjects) {
    for (let i = globals.fadingObjects.length - 1; i >= 0; i--) {
      const item = globals.fadingObjects[i];
      item.progress += deltaTime * 2;

      if (item.progress >= 1.0) {
        if (globals.forestGroup && item.obs.mesh) {
          globals.forestGroup.remove(item.obs.mesh);

          if (item.obs.rarity === "ultra_rare" || item.obs.rarity === "rare") {
            console.log(`💎 تم حصاد مورد نادر: ${item.obs.type}`);
          }
        }

        const obsIndex = globals.obstacleData.findIndex(
          (o) => o.mesh === item.obs.mesh
        );
        if (obsIndex > -1) {
          globals.obstacleData.splice(obsIndex, 1);
        }

        globals.fadingObjects.splice(i, 1);
      } else {
        const s = (item.obs.originalScale || 1) * (1.0 - item.progress);
        item.obs.mesh.scale.setScalar(s);
        item.obs.mesh.position.y -= deltaTime * 20;

        item.obs.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = 1.0 - item.progress;
          }
        });
      }
    }
  }
}


// --- دالة الحصول على إحصائيات البيئة المحسنة ---
export function getEnvironmentStats() {
  if (!globals.forestGroup) {
    return {
      total: 0,
      visible: 0,
      invisible: 0,
      inFrustum: 0,
      chunks: 0,
      viewDistance: VISIBILITY_SETTINGS.baseViewDistance,
      alwaysVisibleDistance: VISIBILITY_SETTINGS.alwaysVisibleDistance,
      performanceMode: VISIBILITY_SETTINGS.performanceMode,
      rareResources: 0,
      clusteredElements: 0,
      obstacleDataCount: 0,
      visibilityOptimized: visibilityOptimized,
    };
  }

  let visibleCount = 0;
  let invisibleCount = 0;
  let inFrustumCount = 0;
  let rareCount = 0;
  let clusterCount = 0;
  let spacingAnalysis = {
    tooClose: 0,
    wellSpaced: 0,
    veryFar: 0
  };

  globals.forestGroup.children.forEach((child) => {
    if (child.userData) {
      if (child.visible) visibleCount++;
      else invisibleCount++;

      if (child.userData.isVisible) inFrustumCount++;

      if (
        child.userData.rarity === "rare" ||
        child.userData.rarity === "ultra_rare"
      ) {
        rareCount++;
      }

      if (child.userData.inCluster) {
        clusterCount++;
      }
      
      // تحليل التباعد
      if (child.userData.spacing) {
        if (child.userData.spacing < 100) spacingAnalysis.tooClose++;
        else if (child.userData.spacing < 300) spacingAnalysis.wellSpaced++;
        else spacingAnalysis.veryFar++;
      }
    }
  });

  return {
    total: globals.forestGroup.children.length,
    visible: visibleCount,
    invisible: invisibleCount,
    inFrustum: inFrustumCount,
    chunks: globals.visibleChunks ? globals.visibleChunks.size : 0,
    viewDistance: VISIBILITY_SETTINGS.baseViewDistance,
    alwaysVisibleDistance: VISIBILITY_SETTINGS.alwaysVisibleDistance,
    performanceMode: VISIBILITY_SETTINGS.performanceMode,
    rareResources: rareCount,
    clusteredElements: clusterCount,
    obstacleDataCount: globals.obstacleData ? globals.obstacleData.length : 0,
    visibilityOptimized: visibilityOptimized,
    spacingAnalysis: spacingAnalysis,
    recommendations: spacingAnalysis.tooClose > 10 ? 
      ["هناك عناصر قريبة جداً من بعضها، فكر في إعادة توزيعها"] : 
      ["التوزيع جيد، حافظ على هذه المسافات"]
  };
}

// --- دالة إعداد إعدادات الرؤية المحسنة ---
export function setViewSettings() {
  VISIBILITY_SETTINGS.baseViewDistance = 7000;
  VISIBILITY_SETTINGS.alwaysVisibleDistance = 1500;
  VISIBILITY_SETTINGS.fadeStartDistance = 6000;
  VISIBILITY_SETTINGS.performanceMode = "balanced";

  console.log("✅ إعدادات الرؤية والتوزيع المحترف:", {
    stableViewDistance: VISIBILITY_SETTINGS.baseViewDistance,
    alwaysVisibleDistance: VISIBILITY_SETTINGS.alwaysVisibleDistance,
    fadeStartDistance: VISIBILITY_SETTINGS.fadeStartDistance,
    performanceMode: VISIBILITY_SETTINGS.performanceMode,
    minObjectDistance: "250+ وحدة",
    rareResourceDistribution: "استراتيجي مع ندرة محسنة",
    clusterSystem: "مفعل مع توزيع منتشر",
    visibilityOptimization: "مفعلة مع التخزين المؤقت"
  });
}

// --- دالة إظهار جميع العناصر ---
export function forceShowAllObjects() {
  if (!globals.forestGroup) return;

  globals.forestGroup.children.forEach((child) => {
    if (child) {
      child.visible = true;
      child.userData.isVisible = true;

      child.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.material.opacity = 1.0;
          obj.material.transparent = false;
        }
      });
    }
  });

  console.log("✅ تم إظهار جميع العناصر");
}

// --- دالة إعادة تحميل الرؤية ---
export function reloadVisibility() {
  if (globals.visibilityCache) globals.visibilityCache.clear();
  if (globals.visibleChunks) globals.visibleChunks.clear();
  visibilityOptimized = false;

  return renderEnvironment();
}

// --- دالة التحسين الديناميكي للأداء ---
export function adjustPerformanceBasedOnFPS(currentFPS) {
  if (currentFPS < 25) {
    VISIBILITY_SETTINGS.performanceMode = "low";
    VISIBILITY_SETTINGS.baseViewDistance = 4000;
    VISIBILITY_SETTINGS.alwaysVisibleDistance = 1000;
    console.log("⚡ تحويل إلى وضع الأداء المنخفض");
  } else if (currentFPS < 40) {
    VISIBILITY_SETTINGS.performanceMode = "medium";
    VISIBILITY_SETTINGS.baseViewDistance = 5500;
    VISIBILITY_SETTINGS.alwaysVisibleDistance = 1200;
    console.log("⚡ تحويل إلى وضع الأداء المتوسط");
  } else {
    VISIBILITY_SETTINGS.performanceMode = "balanced";
    VISIBILITY_SETTINGS.baseViewDistance = 7000;
    VISIBILITY_SETTINGS.alwaysVisibleDistance = 1500;
  }
  
  return VISIBILITY_SETTINGS;
}

// --- دالة تحسين التباعد بين العناصر المرئية ---
export function optimizeVisibleSpacing() {
  console.log("📏 تحسين التباعد بين العناصر المرئية...");
  
  if (!globals.visibleObjects || globals.visibleObjects.size === 0) {
    console.log("⚠️ لا توجد عناصر مرئية لتحسينها");
    return { optimized: 0, moved: 0 };
  }
  
  let optimizedCount = 0;
  let movedCount = 0;
  const minSpacing = 200;
  
  const visibleArray = Array.from(globals.visibleObjects);
  
  for (let i = 0; i < visibleArray.length; i++) {
    const objA = visibleArray[i];
    if (!objA.position) continue;
    
    for (let j = i + 1; j < visibleArray.length; j++) {
      const objB = visibleArray[j];
      if (!objB.position) continue;
      
      const dx = objA.position.x - objB.position.x;
      const dz = objA.position.z - objB.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < minSpacing) {
        // تحريك أحد العناصر
        const moveDistance = minSpacing - distance;
        const angle = Math.atan2(dz, dx);
        
        if (Math.random() > 0.5) {
          objA.position.x += Math.cos(angle) * moveDistance * 0.5;
          objA.position.z += Math.sin(angle) * moveDistance * 0.5;
        } else {
          objB.position.x -= Math.cos(angle) * moveDistance * 0.5;
          objB.position.z -= Math.sin(angle) * moveDistance * 0.5;
        }
        
        movedCount++;
        optimizedCount++;
      }
    }
  }
  
  console.log(`✅ تم تحسين تباعد ${optimizedCount} عنصر (${movedCount} تم تحريكه)`);
  return { optimized: optimizedCount, moved: movedCount };
}

// --- دالة ضبط إعدادات الرؤية ---
export function configureVisibilitySettings(newSettings) {
  Object.assign(VISIBILITY_SETTINGS, newSettings);
  console.log("🔄 تم تحديث إعدادات الرؤية:", VISIBILITY_SETTINGS);
  return VISIBILITY_SETTINGS;
}