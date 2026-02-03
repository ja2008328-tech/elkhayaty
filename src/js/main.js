// main.js - ملف الدخول الرئيسي المحدث مع الأرانب
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { globals, initializeGlobals, updateRabbitStats } from "./globals.js";

// استيراد المدير الرئيسي للبيئة
import {
  createMassiveArtisticIsland,
  createAdvancedEnvironment,
  updateEnvironmentAnim,
  getTerrainHeight,
  renderEnvironment,
  setViewSettings,
  getEnvironmentStats,
  forceShowAllObjects,
  reloadVisibility,
  getEnvironmentInfo,
  getRabbitSystemConfiguration,
  configureRabbitSystemSettings
} from "./environmentManager.js";

// استيراد دوال اللاعب
import {
  createPlayer,
  setupInputs,
  updatePlayerMovement,
  updatePlayerAnimation,
} from "./player.js";

// استيراد نظام الأرانب
import { 
  getRabbitSystemInfo 
} from "./rabbit.js";

const clock = new THREE.Clock();

// تشغيل الدالة الرئيسية للعبة
async function initGame() {
  try {
    await init();
    animate();
  } catch (error) {
    console.error("❌ خطأ في تهيئة اللعبة:", error);
  }
}

initGame();

// دالة التهيئة الأساسية
async function init() {
  console.log("🎮 بدء تهيئة اللعبة مع نظام الأرانب...");

  // تهيئة المتغيرات العامة
  initializeGlobals();

  // --- تهيئة المشهد ---
  globals.scene = new THREE.Scene();
  const pinkSky = 0xffe4e1;
  globals.scene.background = new THREE.Color(pinkSky);
  globals.scene.fog = new THREE.Fog(pinkSky, 4000, 14000);

  // --- تهيئة الكاميرا ---
  const aspect = window.innerWidth / window.innerHeight;
  const d = 1500;
  globals.camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    -20000,
    40000,
  );

  globals.camera.position.set(2000, 2200, 2000);
  globals.camera.lookAt(0, 0, 0);

  // تهيئة متغيرات تتبع الكاميرا
  globals.lastCameraPosition.copy(globals.camera.position);
  globals.lastCameraQuaternion.copy(globals.camera.quaternion);

  // --- تهيئة العارض ---
  globals.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    precision: "highp",
  });

  globals.renderer.setSize(window.innerWidth, window.innerHeight);
  globals.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
  globals.renderer.shadowMap.enabled = false;
  document.body.appendChild(globals.renderer.domElement);

  // --- إضافة الإضاءة ---
  globals.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe4e1, 0.7);
  globals.scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(4000, 3500, 2000);
  globals.scene.add(sun);

  // --- إنشاء البيئة ---
  createMassiveArtisticIsland();
  await createAdvancedEnvironment();

  // --- إنشاء اللاعب ---
  const playerMesh = createPlayer();

  // --- تهيئة الإدخال ---
  setupInputs();

  // --- إعداد عناصر تحكم الكاميرا ---
  globals.controls = new OrbitControls(
    globals.camera,
    globals.renderer.domElement,
  );
  globals.controls.enableRotate = false;
  globals.controls.enablePan = false;
  globals.controls.enableZoom = true;
  globals.controls.minDistance = 1000;
  globals.controls.maxDistance = 4000;
  globals.controls.zoomSpeed = 0.8;

  // --- تهيئة متغيرات إدارة الرؤية ---
  globals.lastPlayerPosition.copy(globals.player.position);

  // ضبط إعدادات الرؤية الثابتة
  setViewSettings();

  // --- تهيئة نظام تتبع السرعة ---
  globals.playerVelocity = {
    x: 0,
    z: 0,
    lastPosition: globals.player.position.clone(),
    lastTime: performance.now()
  };

  // فرض إظهار جميع العناصر في البداية
  setTimeout(() => {
    forceShowAllObjects();
    console.log("✅ تم تهيئة النظام بنجاح");

    // عرض معلومات النظام
    const info = getEnvironmentInfo();
    console.log("📊 معلومات النظام:", info);
    
    // عرض معلومات الرقاقات إذا كانت موجودة
    if (info.chips) {
      console.log("💎 معلومات الرقاقات:", info.chips);
    }
    
    // عرض معلومات الأرانب إذا كانت موجودة
    if (info.rabbits) {
      console.log("🐇 معلومات الأرانب:", info.rabbits);
      updateRabbitStats(info.rabbits);
    }
  }, 1000);

  // إنشاء واجهة تحكم بسيطة مع معلومات الأرانب
  createDebugUI();

  console.log("🎉 تم الانتهاء من تهيئة اللعبة مع نظام الأرانب");
}

// دالة الحركة والرسوم المتحركة الرئيسية
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.05);
  const time = performance.now() * 0.001;

  // تحديث واجهة التفاعل
  updateInteractionUI();

  // --- تحديث اللاعب ---
  if (globals.player) {
    updatePlayerMovement();

    // --- تحديث تتبع السرعة ---
    updatePlayerVelocity();

    // --- تحديث عرض الإحداثيات ---
    updateCoordinatesDisplay();

    // --- تحديث الكاميرا ---
    const cameraDistance = 2200;
    const cameraHeight = 1500;
    const cameraOffset = new THREE.Vector3(
      cameraDistance,
      cameraHeight,
      cameraDistance,
    );
    const targetPos = globals.player.position.clone().add(cameraOffset);

    // تحريك الكاميرا بسلاسة
    globals.camera.position.lerp(targetPos, 0.1);
    globals.camera.lookAt(globals.player.position);

    // --- تحديث عناصر التحكم ---
    if (globals.controls) {
      globals.controls.target.copy(globals.player.position);
      globals.controls.update();
    }

    // --- تحديث ارتفاع اللاعب ---
    const terrainY = getTerrainHeight(
      globals.player.position.x,
      globals.player.position.z,
    );
    globals.player.position.y = terrainY + 85;
  }

  // --- تحديث إحصائيات اللاعب ---
  updatePlayerStats(deltaTime);

  // --- تحديث رسوميات البيئة ---
  updateEnvironmentAnim(deltaTime);

  // --- تحديث حركة اللاعب ---
  updatePlayerAnimation(globals, time);

  // --- تحديث نظام الرؤية ---
  const playerMoved =
    globals.lastPlayerPosition.distanceTo(globals.player.position) >
    globals.updateDistanceThreshold;

  const cameraChanged = hasCameraPerspectiveChanged();

  if (
    playerMoved ||
    cameraChanged ||
    performance.now() - globals.lastVisibilityCheck >
      globals.visibilityCheckInterval
  ) {
    const visibilityInfo = renderEnvironment();
    globals.lastPlayerPosition.copy(globals.player.position);
    globals.lastVisibilityCheck = performance.now();

    // تسجيل أداء النظام بشكل دوري
    if (performance.now() % 20000 < 100) {
      const stats = getEnvironmentStats();
      console.log("👁️  نظام الرؤية:", {
        مرئية: stats.visible,
        مرئية_بالمنظور: stats.inFrustum,
        أشكال_مرئية: stats.chunks,
        المسافة: stats.viewDistance,
        وضع_الأداء: stats.performanceMode,
      });
    }
  }

  // --- عرض المشهد ---
  globals.renderer.render(globals.scene, globals.camera);

  // تحديث إحصائيات النظام
  updatePerformanceStats();

  // تحديث واجهة التصحيح
  updateDebugUI();
}

// دالة تحديث إحصائيات اللاعب
function updatePlayerStats(deltaTime) {
  const stats = globals.playerStats;

  stats.hunger = Math.max(0, stats.hunger - deltaTime * 2);
  stats.thirst = Math.max(0, stats.thirst - deltaTime * 3);

  if (
    globals.input.w ||
    globals.input.a ||
    globals.input.s ||
    globals.input.d
  ) {
    stats.energy = Math.max(0, stats.energy - deltaTime * 5);
  } else {
    stats.energy = Math.min(100, stats.energy + deltaTime * 10);
  }

  const distance = Math.sqrt(
    globals.player.position.x ** 2 + globals.player.position.z ** 2,
  );
  if (distance < 10000) {
    stats.temperature = Math.min(100, stats.temperature + deltaTime * 5);
  } else {
    stats.temperature = Math.max(0, stats.temperature - deltaTime * 5);
  }

  if (stats.hunger < 20 || stats.thirst < 20) {
    stats.health = Math.max(0, stats.health - deltaTime * 10);
  } else {
    stats.health = Math.min(100, stats.health + deltaTime * 5);
  }
}

// دالة تحديث سرعة اللاعب
function updatePlayerVelocity() {
  if (!globals.player || !globals.playerVelocity) return;
  
  const currentTime = performance.now();
  const timeDelta = (currentTime - globals.playerVelocity.lastTime) / 1000; // تحويل إلى ثواني
  
  if (timeDelta > 0) {
    const currentPos = globals.player.position;
    const lastPos = globals.playerVelocity.lastPosition;
    
    // حساب السرعة (وحدات في الثانية)
    globals.playerVelocity.x = (currentPos.x - lastPos.x) / timeDelta;
    globals.playerVelocity.z = (currentPos.z - lastPos.z) / timeDelta;
    
    // حفظ القيم الحالية للاستخدام في المرة القادمة
    globals.playerVelocity.lastPosition.copy(currentPos);
    globals.playerVelocity.lastTime = currentTime;
  }
}

// دالة تحديث عرض الإحداثيات
function updateCoordinatesDisplay() {
  if (!globals.player) return;
  
  const xElement = document.getElementById('coord-x');
  const zElement = document.getElementById('coord-z');
  const yElement = document.getElementById('coord-y');
  const speedElement = document.getElementById('coord-speed');
  
  if (xElement && zElement && yElement && speedElement) {
    const playerPos = globals.player.position;
    
    // تحديث قيم الإحداثيات
    xElement.textContent = playerPos.x.toFixed(1);
    zElement.textContent = playerPos.z.toFixed(1);
    yElement.textContent = playerPos.y.toFixed(1);
    
    // حساب السرعة الكلية
    const speed = Math.sqrt(
      Math.pow(globals.playerVelocity.x, 2) + 
      Math.pow(globals.playerVelocity.z, 2)
    );
    
    // تحديث قيمة السرعة
    speedElement.textContent = speed.toFixed(1);
    
    // تغيير لون السرعة بناءً على القيمة
    if (speed > 50) {
      speedElement.style.color = '#ff9800'; // برتقالي للسرعة العالية
    } else if (speed > 20) {
      speedElement.style.color = '#4CAF50'; // أخضر للسرعة المتوسطة
    } else {
      speedElement.style.color = '#00bcd4'; // أزرق للسرعة المنخفضة
    }
  }
}

// دالة تحديث واجهة تفاعل المستخدم
function updateInteractionUI() {
  const hint = document.getElementById("interaction-hint");
  if (!hint || !globals.player || !globals.obstacleData) return;

  let closest = null;
  let minTargetDist = 300; // زيادة المسافة لأن الرقاقات أكبر

  for (const obs of globals.obstacleData) {
    if (obs && obs.mesh && obs.mesh.position && obs.mesh.visible) {
      const dist = globals.player.position.distanceTo(obs.mesh.position);
      
      // إعطاء الأولوية للرقاقات مع مسافة اكتشاف أكبر
      let priority, detectionDistance;
      if (obs.isChip) {
        priority = 0.5; // أولوية عالية للرقاقات
        detectionDistance = obs.boundingRadius ? obs.boundingRadius / 2 + 150 : 250;
      } else if (obs.type === "rabbit") {
        // مسافة اكتشاف أقل للأرانب
        priority = 0.8;
        detectionDistance = 200;
      } else {
        priority = 1;
        detectionDistance = 200;
      }
      
      const adjustedDist = dist * priority;
      
      if (adjustedDist < minTargetDist && dist < detectionDistance && !obs.isFading) {
        minTargetDist = adjustedDist;
        closest = obs;
      }
    }
  }

  if (closest) {
    const vector = closest.mesh.position.clone();
    vector.y += closest.isChip ? 150 : (closest.type === "rabbit" ? 80 : 100);
    vector.project(globals.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    hint.style.display = "block";
    hint.style.left = `${x}px`;
    hint.style.top = `${y}px`;

    let resourceName = "مورد";
    let specialStyle = "";
    let sizeIndicator = "";
    
    if (closest.isChip) {
      // تنسيق خاص للرقاقات الكبيرة
      resourceName = closest.name || "رقاقة";
      let color = "#ffffff";
      
      switch (closest.type) {
        case "white_chip": 
          color = "#ffffff";
          sizeIndicator = " (كبيرة)";
          break;
        case "yellow_chip": 
          color = "#fff176";
          sizeIndicator = " (كبيرة)";
          break;
        case "red_chip": 
          color = "#ef5350";
          sizeIndicator = " (كبيرة)";
          break;
        case "blue_chip": 
          color = "#4fc3f7";
          sizeIndicator = " (كبيرة)";
          break;
        case "gold_chip": 
          color = "#ffd700";
          sizeIndicator = " (كبيرة جداً)";
          break;
      }
      
      specialStyle = `style="color:${color}; font-weight:bold; font-size:16px;"`;
    } else if (closest.type === "rabbit") {
      // تنسيق خاص للأرانب
      resourceName = "أرنب";
      specialStyle = `style="color:#C9A86A; font-weight:bold; font-size:15px;"`;
    } else {
      switch (closest.type) {
        case "wood":
        case "wood_palm":
          resourceName = "خشب";
          break;
        case "stone":
          resourceName = "حجر عادي";
          break;
        case "flint":
          resourceName = "صوان";
          break;
        case "limestone":
          resourceName = "حجر جيري";
          break;
        case "desert_stone":
          resourceName = "حجر صحراوي";
          break;
        case "straw":
          resourceName = "قش";
          break;
        case "cactus":
          resourceName = "صبار";
          break;
        case "red_berry":
          resourceName = "توت أحمر";
          break;
        case "blue_berry":
          resourceName = "توت أزرق";
          break;
        case "yellow_berry":
          resourceName = "توت أصفر";
          break;
        case "lilac_berry":
          resourceName = "توت ليلكي";
          break;
        case "stick":
          resourceName = "عصا";
          break;
        default:
          resourceName = "عنصر";
      }
    }

    if (closest.isChip) {
      hint.innerHTML = `
        <span ${specialStyle}>${resourceName}${sizeIndicator}</span>
        <br>
        <span style="color:#FFF; background:rgba(0,0,0,0.7); padding:3px 8px; border-radius:5px; margin-left:5px; font-size:15px;">E</span> 
        <span style="font-size:14px;">جمع الرقاقة</span>
      `;
    } else if (closest.type === "rabbit") {
      hint.innerHTML = `
        <span ${specialStyle}>${resourceName}</span>
        <br>
        <span style="font-size:13px; color:#aaa;">حيوان بري</span>
      `;
    } else {
      hint.innerHTML = `
        <span style="color:#FFF; background:rgba(0,0,0,0.7); padding:3px 8px; border-radius:5px; margin-left:5px; font-size:15px;">E</span> 
        <span style="font-size:14px;">جمع ${resourceName}</span>
      `;
    }
  } else {
    hint.style.display = "none";
  }
}

// دالة التحقق من تغير منظور الكاميرا
function hasCameraPerspectiveChanged() {
  if (!globals.camera) return true;

  const currentPosition = globals.camera.position.clone();
  const currentQuaternion = globals.camera.quaternion.clone();

  const positionChanged =
    globals.lastCameraPosition.distanceTo(currentPosition) >
    globals.cameraPerspectiveThreshold;
  const rotationChanged =
    !globals.lastCameraQuaternion.equals(currentQuaternion);

  globals.lastCameraPosition.copy(currentPosition);
  globals.lastCameraQuaternion.copy(currentQuaternion);

  return positionChanged || rotationChanged;
}

// دالة إنشاء واجهة تحكم للتجربة مع معلومات الأرانب
function createDebugUI() {
  // إنشاء عناصر واجهة المستخدم للتحكم
  const debugPanel = document.createElement("div");
  debugPanel.id = "debug-panel";
  debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial;
        font-size: 12px;
        z-index: 1000;
        max-width: 350px;
    `;

  debugPanel.innerHTML = `
        <h3 style="margin-top:0; color:#4CAF50;">📊 إحصائيات النظام</h3>
        <div id="stats" style="margin-top:10px; font-size:11px; border-top:1px solid #444; padding-top:5px;">
            جاري التحميل...
        </div>
        <div style="margin-top:10px; font-size:10px; color:#aaa;">
            ⚡ النظام المنظم | Simplex Noise | نظام الأرانب
        </div>
    `;

  document.body.appendChild(debugPanel);
}

// دالة تحديث واجهة التصحيح
function updateDebugUI() {
  const statsDiv = document.getElementById("stats");
  if (!statsDiv) return;

  const stats = getEnvironmentStats();
  const playerPos = globals.player
    ? globals.player.position
    : { x: 0, y: 0, z: 0 };
  const fps = Math.round(1 / clock.getDelta());
  
  // الحصول على معلومات الرقاقات
  const envInfo = getEnvironmentInfo();
  const chipsInfo = envInfo.chips || { totalPlaced: 0 };
  
  // الحصول على معلومات الأرانب
  const rabbitInfo = getRabbitSystemInfo();
  const rabbitStats = rabbitInfo ? rabbitInfo.rabbits : [];

  statsDiv.innerHTML = `
        <div><strong>إحصائيات النظام:</strong></div>
        <div>العناصر الكلية: ${stats.total}</div>
        <div>مرئية: ${stats.visible}</div>
        <div>مرئية بالمنظور: ${stats.inFrustum}</div>
        <div>الأشكال المرئية: ${stats.chunks}</div>
        <div>الرقاقات: ${chipsInfo.totalPlaced || 0}</div>
        <div>الأرانب: ${rabbitStats.length || 0} (${rabbitStats.filter(r => r.isVisible).length || 0} مرئي)</div>
        <div>موقع اللاعب: X:${playerPos.x.toFixed(0)}, Z:${playerPos.z.toFixed(0)}</div>
        <div>معدل الإطارات: ${fps} FPS</div>
        <div>وضع الأداء: ${stats.performanceMode}</div>
        <div>الموارد النادرة: ${stats.rareResources}</div>
    `;
}

// دالة تحديث إحصائيات الأداء
function updatePerformanceStats() {
  const fps = Math.round(1 / clock.getDelta());
  const frameTime = clock.getDelta() * 1000;
  const drawCalls = globals.renderer ? globals.renderer.info.render.calls : 0;

  if (globals.performanceStats) {
    globals.performanceStats.fps = fps;
    globals.performanceStats.frameTime = frameTime;
    globals.performanceStats.drawCalls = drawCalls;

    if (performance.memory) {
      globals.performanceStats.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
      };
    }
  }
}

// حدث تغيير حجم النافذة
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 3000;

  globals.camera.left = -d * aspect;
  globals.camera.right = d * aspect;
  globals.camera.top = d;
  globals.camera.bottom = -d;
  globals.camera.updateProjectionMatrix();

  globals.renderer.setSize(window.innerWidth, window.innerHeight);

  reloadVisibility();
});

// إضافة اختصارات لوحة المفاتيح للتحكم
window.addEventListener("keydown", (e) => {
  // F5: إعادة تحميل الرؤية
  if (e.key === "F5") {
    e.preventDefault();
    reloadVisibility();
    console.log("🔄 إعادة تحميل الرؤية");
  }

  // F6: إظهار جميع العناصر
  if (e.key === "F6") {
    e.preventDefault();
    forceShowAllObjects();
    console.log("👁️ إظهار جميع العناصر");
  }

  // F7: عرض معلومات النظام
  if (e.key === "F7") {
    e.preventDefault();
    const info = getEnvironmentInfo();
    console.log("📊 معلومات النظام:", info);
    
    if (info.chips) {
      console.log("💎 معلومات الرقاقات:", info.chips);
    }
    
    if (info.rabbits) {
      console.log("🐇 معلومات الأرانب:", info.rabbits);
    }
  }
  
  // F8: إعادة توزيع الرقاقات (للتجربة)
  if (e.key === "F8") {
    e.preventDefault();
    import("./chipSystem.js").then((module) => {
      if (module.initChipSystem) {
        console.log("🔄 إعادة توزيع الرقاقات...");
        module.initChipSystem();
      }
    });
  }
  
  // F9: عرض/إخفاء عداد الرقاقات (يتم التعامل معه في index.html)
  
  // F10: عرض معلومات الرقاقات في الكونسول (يتم التعامل معه في index.html)
  
  // F11: إظهار/إخفاء الإحداثيات (يتم التعامل معه في index.html)
  
  // F12: إعدادات الأرانب
  if (e.key === "F12") {
    e.preventDefault();
    const rabbitConfig = getRabbitSystemConfiguration();
    console.log("⚙️ إعدادات الأرانب الحالية:", rabbitConfig);
    
    // عرض خيارات ضبط إعدادات الأرانب
    const newSpeed = prompt("أدخل سرعة الأرانب الجديدة (الحالية: " + rabbitConfig.movementSpeed + "):", rabbitConfig.movementSpeed);
    if (newSpeed && !isNaN(newSpeed)) {
      configureRabbitSystemSettings({ movementSpeed: parseFloat(newSpeed) });
      console.log("✅ تم تحديث سرعة الأرانب إلى: " + newSpeed);
    }
  }
});

// إنشاء عنصر تلميحات التفاعل إذا لم يكن موجودًا
if (!document.getElementById("interaction-hint")) {
  const hint = document.createElement("div");
  hint.id = "interaction-hint";
  hint.style.cssText = `
        position: fixed;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: Arial;
        font-size: 14px;
        z-index: 999;
        display: none;
        pointer-events: none;
        transform: translate(-50%, -50%);
    `;
  document.body.appendChild(hint);
}

// حدث تغيير حجم النافذة
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 3000;

  globals.camera.left = -d * aspect;
  globals.camera.right = d * aspect;
  globals.camera.top = d;
  globals.camera.bottom = -d;
  globals.camera.updateProjectionMatrix();

  globals.renderer.setSize(window.innerWidth, window.innerHeight);

  // التحقق من وجود اللاعب قبل إعادة تحميل الرؤية
  if (globals.player && globals.player.position) {
    reloadVisibility();
  } else {
    console.log("⚠️ اللاعب غير جاهز بعد، تأجيل إعادة تحميل الرؤية");
  }
});