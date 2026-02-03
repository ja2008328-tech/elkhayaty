// player.js - نظام اللاعب والتحكم مع التصميم المحدد
import * as THREE from "three";
import { globals } from "./globals.js";
import { getTerrainHeight } from "./environmentManager.js";
import { findNearbyChips, harvestChip } from "./chipSystem.js";

// دالة إنشاء نموذج اللاعب المطابق للتصميم المطلوب
function createSurvivalPlayerModel() {
  const playerGroup = new THREE.Group();
  playerGroup.name = "survivalPlayer";

  // === المواد والألوان - بنفس القيم من التصميم ===
  const skinColor = 0xd2a679;
  const shirtColor = 0x556b2f; // زيتوني
  const packColor = 0x3e4a32; // زيتوني غامق للحقيبة
  const strapColor = 0x222222; // أحزمة سوداء
  const bandanaColor = 0x8b0000;
  
  const skinMat = new THREE.MeshStandardMaterial({ 
    color: skinColor, 
    roughness: 0.4 
  });
  
  const shirtMat = new THREE.MeshStandardMaterial({ 
    color: shirtColor, 
    roughness: 0.8 
  });
  
  const packMat = new THREE.MeshStandardMaterial({ 
    color: packColor, 
    roughness: 0.7 
  });
  
  const strapMat = new THREE.MeshStandardMaterial({ 
    color: strapColor, 
    roughness: 0.9 
  });
  
  const faceMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, 
    roughness: 0.2 
  });
  
  const stripeMat = new THREE.MeshBasicMaterial({ 
    color: 0xff8800 
  });

  // 1. الجذع (Torso) - نفس القياسات من التصميم
  const torsoGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.9, 32);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.name = "torso";
  torso.position.y = 1.0;
  playerGroup.add(torso);

  // --- حقيبة الظهر التقنية (Backpack) - نفس التصميم بالضبط ---
  const backpackGroup = new THREE.Group();
  backpackGroup.name = "backpack";
  backpackGroup.position.set(0, 0, -0.35); // خلف الجذع
  torso.add(backpackGroup);

  // جسم الحقيبة الرئيسي
  const packBodyGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
  const packBody = new THREE.Mesh(packBodyGeo, packMat);
  packBody.name = "packBody";
  backpackGroup.add(packBody);

  // جيب الحقيبة العلوي (غطاء)
  const packTopGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
  const packTop = new THREE.Mesh(packTopGeo, packMat);
  packTop.position.set(0, 0.3, 0.05);
  packTop.name = "packTop";
  backpackGroup.add(packTop);

  // أحزمة الكتف (Straps)
  const strapGeo = new THREE.BoxGeometry(0.1, 0.8, 0.05);
  
  // حزام يمين
  const strapRight = new THREE.Mesh(strapGeo, strapMat);
  strapRight.position.set(0.25, 0, 0.35);
  strapRight.rotation.x = -0.15; // ميلان بسيط ليتبع شكل الكتف
  strapRight.name = "strapRight";
  backpackGroup.add(strapRight);

  // حزام يسار
  const strapLeft = new THREE.Mesh(strapGeo, strapMat);
  strapLeft.position.set(-0.25, 0, 0.35);
  strapLeft.rotation.x = -0.15;
  strapLeft.name = "strapLeft";
  backpackGroup.add(strapLeft);

  // جيب جانبي صغير للحقيبة
  const sidePocketGeo = new THREE.BoxGeometry(0.1, 0.3, 0.15);
  const sidePocket = new THREE.Mesh(sidePocketGeo, packMat);
  sidePocket.position.set(0.3, -0.1, 0);
  sidePocket.name = "sidePocket";
  backpackGroup.add(sidePocket);

  // --- شعار الصدر ---
  const badgeGeo = new THREE.BoxGeometry(0.3, 0.35, 0.05);
  const badgeMat = new THREE.MeshStandardMaterial({ 
    color: 0x444444 
  });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 0, 0.43);
  torso.add(badge);

  const stripe1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.06), 
    stripeMat
  );
  stripe1.position.set(0, 0.08, 0.44);
  torso.add(stripe1);

  // 2. الرأس والعصبة
  const headGeo = new THREE.SphereGeometry(0.4, 32, 32);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.name = "head";
  head.position.set(0, 1.65, 0);
  playerGroup.add(head);

  // عصبة الرأس
  const bandanaGeo = new THREE.TorusGeometry(0.39, 0.06, 16, 32);
  const bandana = new THREE.Mesh(
    bandanaGeo, 
    new THREE.MeshStandardMaterial({
      color: bandanaColor
    })
  );
  bandana.rotation.x = Math.PI / 2;
  bandana.position.set(0, 1.85, 0);
  bandana.name = "bandana";
  playerGroup.add(bandana);

  // 3. العيون (مع الرمش)
  const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  
  const rightEye = new THREE.Mesh(eyeGeo, faceMat);
  rightEye.position.set(0.12, 1.68, 0.35);
  rightEye.name = "rightEye";
  playerGroup.add(rightEye);

  const leftEye = new THREE.Mesh(eyeGeo, faceMat);
  leftEye.position.set(-0.12, 1.68, 0.35);
  leftEye.name = "leftEye";
  playerGroup.add(leftEye);

  // الفم - نفس التصميم بالضبط
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.03, 0.05), 
    faceMat
  );
  mouth.position.set(0, 1.52, 0.37);
  mouth.name = "mouth";
  playerGroup.add(mouth);

  // 4. الأيادي المنفصلة مع الضمادات - نفس التصميم بالضبط
  const handGeo = new THREE.SphereGeometry(0.2, 32, 32);
  
  const createHand = (side) => {
    const handGroup = new THREE.Group();
    handGroup.position.set(side * 0.75, 1.0, 0);
    
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.scale.set(1, 1.2, 1);
    hand.name = "hand";
    handGroup.add(hand);

    const bandage = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.04, 16, 32), 
      new THREE.MeshStandardMaterial({
        color: 0xdddddd
      })
    );
    bandage.rotation.x = Math.PI / 2;
    bandage.scale.set(1, 1, 1.2);
    bandage.name = "bandage";
    handGroup.add(bandage);
    
    return handGroup;
  };

  const rightHandGroup = createHand(1);
  rightHandGroup.name = "rightHand";
  playerGroup.add(rightHandGroup);

  const leftHandGroup = createHand(-1);
  leftHandGroup.name = "leftHand";
  playerGroup.add(leftHandGroup);

  // --- تهيئة بيانات الرسوم المتحركة ---
  playerGroup.userData = {
    blinkTimer: 0,
    isBlinking: false,
    blinkStartTime: 0,
    floatOffset: Math.random() * Math.PI * 2
  };

  console.log("✅ تم إنشاء نموذج اللاعب بنفس تصميم HTML المطلوب");
  return playerGroup;
}

export function createPlayer() {
  const playerGroup = createSurvivalPlayerModel();

  // وضع اللاعب في موقع بداية مناسب
  // تكبير النموذج ليتناسب مع عالم اللعبة الكبير
  playerGroup.scale.set(100, 100, 100); // تكبير 100x ليناسب المشهد الكبير
  playerGroup.position.set(5000, 150, 0);
  
  globals.player = playerGroup;
  
  // التأكد من أن globals.scene موجود قبل إضافة اللاعب
  if (globals.scene) {
    globals.scene.add(playerGroup);
  } else {
    console.error("❌ المشهد غير مهيئ. لا يمكن إضافة اللاعب.");
    return null;
  }

  console.log("✅ تم إنشاء اللاعب بنفس تصميم HTML المطلوب في الموقع:", playerGroup.position);
  return playerGroup;
}

export function updatePlayerAnimation(globals, time) {
  if (!globals.player) return;

  const player = globals.player;
  const playerData = player.userData;
  
  // --- حركة طفو الجسم ---
  const floatAmount = Math.sin(time * 1.5) * 0.08;
  player.position.y += floatAmount;

  // --- حركة طفو الأيدي ---
  const rightHand = player.getObjectByName("rightHand");
  const leftHand = player.getObjectByName("leftHand");
  
  if (rightHand && leftHand) {
    // طفو الأيدي أثناء الحركة أو السكون
    if (
      globals.input.w ||
      globals.input.a ||
      globals.input.s ||
      globals.input.d
    ) {
      // حركة أكثر حيوية أثناء المشي
      rightHand.position.y = 1.0 + Math.sin(time * 4) * 0.1;
      leftHand.position.y = 1.0 + Math.sin(time * 4 + Math.PI) * 0.1;
    } else {
      // طفو خفيف أثناء الوقوف
      rightHand.position.y = 1.0 + Math.sin(time * 2) * 0.05;
      leftHand.position.y = 1.0 + Math.sin(time * 2 + 0.5) * 0.05;
    }
  }

  // --- منطق رمش العيون - نفس المنطق من التصميم ---
  const rightEye = player.getObjectByName("rightEye");
  const leftEye = player.getObjectByName("leftEye");
  
  if (rightEye && leftEye) {
    if (!playerData.isBlinking && Math.random() < 0.01) {
      playerData.isBlinking = true;
      playerData.blinkStartTime = time;
    }
    
    if (playerData.isBlinking) {
      const t = time - playerData.blinkStartTime;
      let scaleY = 1;
      
      if (t < 0.075) {
        scaleY = 1 - (t / 0.075);
      } else if (t < 0.15) {
        scaleY = (t - 0.075) / 0.075;
      } else {
        scaleY = 1;
        playerData.isBlinking = false;
      }
      
      scaleY = Math.max(0.1, scaleY);
      rightEye.scale.y = leftEye.scale.y = scaleY;
    }
  }

  // حركة خفيفة للرأس مع التنفس
  const head = player.getObjectByName("head");
  if (head) {
    head.position.y = 1.65 + Math.sin(time * 1.5) * 0.02;
  }
}

export function setupInputs() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key in globals.input) globals.input[key] = true;

    // إضافة مفاتيح للتحكم في الرؤية
    if (key === "r") {
      import("./environmentManager.js").then((module) => {
        if (module.reloadVisibility) {
          module.reloadVisibility();
          console.log("🔄 إعادة تحميل الرؤية باستخدام R");
        }
      });
    }
    
    // معالجة حصاد الرقاقات عند الضغط على E
    if (key === "e" && globals.player) {
      handleChipHarvest();
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (key in globals.input) globals.input[key] = false;
    
    // إعادة تعيين مؤشر حصاد الرقاقات
    if (key === "e") {
      globals.lastChipHarvest = null;
    }
  });
}

// --- دالة معالجة حصاد الرقاقات ---
function handleChipHarvest() {
  if (!globals.player || !globals.obstacleData) return;
  
  const playerPos = globals.player.position;
  const harvestRadius = 200;
  
  // البحث عن الرقاقات القريبة
  const nearbyChips = findNearbyChips(playerPos.x, playerPos.z, harvestRadius);
  
  if (nearbyChips.length > 0) {
    const closestChip = nearbyChips[0];
    
    // حصاد الرقاقة
    if (closestChip && closestChip.obstacle && !closestChip.obstacle.isFading) {
      harvestChip(closestChip.obstacle, closestChip.index);
      
      // تشغيل تأثير بصري عند الحصاد
      playHarvestEffect();
    }
  }
}

// دالة لتشغيل تأثير بصري عند حصاد الرقاقات
function playHarvestEffect() {
  if (!globals.player) return;
  
  // إنشاء جسيمات تأثير الحصاد البسيطة
  const particleCount = 8;
  const particleGroup = new THREE.Group();
  particleGroup.name = "harvestParticles";
  
  for (let i = 0; i < particleCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.5, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.7,
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // انتشار عشوائي حول اللاعب
    particle.position.set(
      (Math.random() - 0.5) * 2,
      1.5 + Math.random() * 1,
      (Math.random() - 0.5) * 2
    );
    
    particleGroup.add(particle);
  }
  
  globals.player.add(particleGroup);
  
  // حذف الجسيمات بعد انتهاء التأثير
  setTimeout(() => {
    if (globals.player) {
      const particles = globals.player.getObjectByName("harvestParticles");
      if (particles) {
        globals.player.remove(particles);
      }
    }
  }, 800);
}

export function updatePlayerMovement() {
  if (!globals.player) return;

  let vx = 0;
  let vz = 0;
  const speed = 30;

  if (globals.input.w) {
    vx = -speed * 0.707;
    vz = -speed * 0.707;
  }
  if (globals.input.s) {
    vx = speed * 0.707;
    vz = speed * 0.707;
  }
  if (globals.input.a) {
    vx = -speed * 0.707;
    vz = speed * 0.707;
  }
  if (globals.input.d) {
    vx = speed * 0.707;
    vz = -speed * 0.707;
  }

  globals.player.position.x += vx;
  globals.player.position.z += vz;

  // استخدام دالة getTerrainHeight المحسنة باستخدام Simplex Noise
  const terrainHeight = getTerrainHeight(
    globals.player.position.x,
    globals.player.position.z,
  );
  // ضبط الارتفاع حسب تكبير النموذج
  globals.player.position.y = terrainHeight + 150;

  if (vx !== 0 || vz !== 0) {
    const angle = Math.atan2(vx, vz);
    globals.player.rotation.y = angle;
  }
}

// دالة الحصول على معلومات اللاعب
export function getPlayerInfo() {
  if (!globals.player) return null;
  
  return {
    position: globals.player.position.clone(),
    rotation: globals.player.rotation.clone(),
    scale: globals.player.scale.clone(),
    components: {
      head: globals.player.getObjectByName("head") ? true : false,
      torso: globals.player.getObjectByName("torso") ? true : false,
      backpack: globals.player.getObjectByName("backpack") ? true : false,
      hands: globals.player.getObjectByName("rightHand") && globals.player.getObjectByName("leftHand") ? true : false,
      eyes: globals.player.getObjectByName("rightEye") && globals.player.getObjectByName("leftEye") ? true : false,
      mouth: globals.player.getObjectByName("mouth") ? true : false,
      bandana: globals.player.getObjectByName("bandana") ? true : false
    }
  };
}