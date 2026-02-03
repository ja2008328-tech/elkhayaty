// chipSystem.js - نظام إدارة الرقاقات (محدث للأحجام)
import * as THREE from "three";
import { globals } from "./globals.js";
import { getBiomeType, getTerrainHeight } from "./terrainSystem.js";
import { checkSafeDistance } from "./resourceDistribution.js";
import { getSimplexDensity } from "./simplexNoiseSystem.js";

// --- تعريف أنواع الرقاقات وإعداداتها ---
export const CHIP_TYPES = {
  white_chip: {
    name: "رقاقة بيضاء",
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
    metalness: 0.2,
    roughness: 0.1,
    value: "عالية",
    rarity: "نادرة جداً",
    maxCount: 2,
    biome: "forest",
    weight: 0.5,
    minDistance: 1500,
    sizeMultiplier: 3.5, // حجم أكبر (بحجم الحجر الجيري)
  },
  yellow_chip: {
    name: "رقاقة صفراء",
    color: 0xfff176,
    emissive: 0xfff176,
    emissiveIntensity: 0.3,
    metalness: 0.4,
    roughness: 0.2,
    value: "عالية",
    rarity: "نادرة جداً",
    maxCount: 2,
    biome: "forest",
    weight: 0.5,
    minDistance: 1500,
    sizeMultiplier: 3.5,
  },
  red_chip: {
    name: "رقاقة حمراء",
    color: 0xef5350,
    emissive: 0xff1744,
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.2,
    value: "عالية",
    rarity: "نادرة جداً",
    maxCount: 2,
    biome: "desert",
    weight: 0.5,
    minDistance: 1500,
    sizeMultiplier: 3.5,
  },
  blue_chip: {
    name: "رقاقة زرقاء",
    color: 0x4fc3f7,
    emissive: 0x03a9f4,
    emissiveIntensity: 0.5,
    metalness: 0.4,
    roughness: 0.2,
    value: "عالية",
    rarity: "نادرة جداً",
    maxCount: 2,
    biome: "desert",
    weight: 0.5,
    minDistance: 1500,
    sizeMultiplier: 3.5,
  },
  gold_chip: {
    name: "رقاقة ذهبية",
    color: 0xffd700,
    emissive: 0xffa000,
    emissiveIntensity: 0.3,
    metalness: 1.0,
    roughness: 0.1,
    value: "استثنائية",
    rarity: "أسطورية",
    maxCount: 2,
    biome: "forest",
    weight: 0.3,
    minDistance: 2000,
    sizeMultiplier: 4.0, // أكبر قليلاً لأنها أسطورية
  },
};

// --- مجموعة لتتبع الرقاقات الموضوعة ---
let placedChips = {
  white_chip: 0,
  yellow_chip: 0,
  red_chip: 0,
  blue_chip: 0,
  gold_chip: 0,
};

// --- دالة إنشاء نموذج الرقاقة بحجم أكبر ---
export function createChipModel(chipType, scale = 1.0) {
  const chipData = CHIP_TYPES[chipType];
  if (!chipData) {
    console.error(`❌ نوع الرقاقة غير معروف: ${chipType}`);
    return null;
  }

  // استخدام مضاعف الحجم لجعل الرقاقة بحجم الحجر الجيري
  const sizeMultiplier = chipData.sizeMultiplier || 3.5;
  const totalScale = scale * sizeMultiplier;

  // إنشاء مجموعة للرقاقة
  const chipGroup = new THREE.Group();
  chipGroup.name = `chip_${chipType}`;

  // 1. القاعدة السداسية المعدنية (أكبر)
  const baseGeo = new THREE.CylinderGeometry(
    25 * totalScale,  // زيادة القطر
    28 * totalScale,  // زيادة القطر العلوي
    5 * totalScale,   // زيادة الارتفاع
    6
  );
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x90a4ae,
    roughness: 0.3,
    metalness: 0.6,
  });
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.castShadow = true;
  base.receiveShadow = true;
  chipGroup.add(base);

  // 2. الأذرع المتصلة (أطول وأسمك)
  const armCount = 3;
  for (let i = 0; i < armCount; i++) {
    const angle = (i / armCount) * Math.PI * 2;
    
    // الذراع العمودية (أطول)
    const verticalGeo = new THREE.BoxGeometry(
      2.5 * totalScale,   // زيادة العرض
      35 * totalScale,    // زيادة الطول
      3 * totalScale      // زيادة العمق
    );
    const verticalArm = new THREE.Mesh(verticalGeo, metalMat);
    verticalArm.position.set(
      Math.cos(angle) * 20 * totalScale,  // زيادة المسافة من المركز
      17.5 * totalScale,                  // زيادة الارتفاع
      Math.sin(angle) * 20 * totalScale
    );
    verticalArm.castShadow = true;
    chipGroup.add(verticalArm);

    // الذراع الأفقية (أطول)
    const horizontalGeo = new THREE.BoxGeometry(
      12 * totalScale,    // زيادة الطول
      1.5 * totalScale,   // زيادة الارتفاع
      3 * totalScale      // زيادة العمق
    );
    const horizontalArm = new THREE.Mesh(horizontalGeo, metalMat);
    horizontalArm.position.set(
      Math.cos(angle) * 14 * totalScale,  // زيادة المسافة من المركز
      34 * totalScale,                    // زيادة الارتفاع
      Math.sin(angle) * 14 * totalScale
    );
    horizontalArm.rotation.y = -angle;
    horizontalArm.castShadow = true;
    chipGroup.add(horizontalArm);
  }

  // 3. حلقة الربط العلوية (أكبر)
  const ringGeo = new THREE.TorusGeometry(
    8 * totalScale,     // زيادة نصف القطر
    0.8 * totalScale,   // زيادة سمك الحلقة
    16, 100
  );
  const ring = new THREE.Mesh(ringGeo, metalMat);
  ring.position.y = 34 * totalScale;
  ring.rotation.x = Math.PI / 2;
  chipGroup.add(ring);

  // 4. الرقاقة العائمة (النواة) - أكبر
  const chipGeo = new THREE.CylinderGeometry(
    8 * totalScale,     // زيادة نصف القطر
    8 * totalScale,     // زيادة نصف القطر
    1.2 * totalScale,   // زيادة السماكة
    6
  );
  
  const chipMat = new THREE.MeshStandardMaterial({
    color: chipData.color,
    emissive: chipData.emissive,
    emissiveIntensity: chipData.emissiveIntensity,
    metalness: chipData.metalness,
    roughness: chipData.roughness,
  });
  
  const chip = new THREE.Mesh(chipGeo, chipMat);
  chip.rotation.x = Math.PI / 2;
  chip.castShadow = true;
  
  // إضافة تفاصيل هندسية
  const edges = new THREE.EdgesGeometry(chipGeo);
  let edgeColor;
  switch (chipType) {
    case "white_chip": edgeColor = 0xcccccc; break;
    case "yellow_chip": edgeColor = 0xfbc02d; break;
    case "red_chip": edgeColor = 0xb71c1c; break;
    case "blue_chip": edgeColor = 0x01579b; break;
    case "gold_chip": edgeColor = 0x8d6e63; break;
    default: edgeColor = 0xffffff;
  }
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
  chip.add(line);
  
  // إضافة الرقاقة إلى مجموعة منفصلة للحركة
  const floatingGroup = new THREE.Group();
  floatingGroup.add(chip);
  floatingGroup.position.y = 17.5 * totalScale;
  chipGroup.add(floatingGroup);

  // إعداد بيانات المستخدم
  chipGroup.userData = {
    type: "chip",
    chipType: chipType,
    chipName: chipData.name,
    value: chipData.value,
    rarity: chipData.rarity,
    isChip: true,
    isCollectible: true,
    floatingGroup: floatingGroup,
    originalScale: totalScale,
    sizeMultiplier: sizeMultiplier,
    health: 1,
    maxHealth: 1,
    collectTime: 2.0,
    particleColor: chipData.color,
    emitLight: true,
    lightIntensity: 0.5,
    boundingRadius: 30 * totalScale, // نصف قطر أكبر للتصادم
  };

  // إضافة ضوء ناعم للرقاقة
  if (chipData.emissiveIntensity > 0) {
    const chipLight = new THREE.PointLight(
      chipData.emissive, 
      chipData.emissiveIntensity * 2, 
      150 * totalScale // زيادة مدى الضوء
    );
    chipLight.position.set(0, 15 * totalScale, 0);
    chipGroup.add(chipLight);
    chipGroup.userData.chipLight = chipLight;
  }

  // إضافة تأثير توهج إضافي للرقاقات النادرة
  if (chipType === "gold_chip") {
    const glowGeometry = new THREE.SphereGeometry(12 * totalScale, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.position.y = 17.5 * totalScale;
    chipGroup.add(glowSphere);
    chipGroup.userData.glowSphere = glowSphere;
  }

  return chipGroup;
}

// --- دالة تحديث حركة الرقاقة المعدلة للأحجام الكبيرة ---
export function updateChipAnimation(chip, time) {
  if (!chip.userData || !chip.userData.floatingGroup) return;
  
  const floatingGroup = chip.userData.floatingGroup;
  const sizeMultiplier = chip.userData.sizeMultiplier || 3.5;
  
  // حركة الطفو (أبطأ للأحجام الكبيرة)
  floatingGroup.position.y = 17.5 * sizeMultiplier + Math.sin(time * 0.8) * 2.5 * sizeMultiplier;
  floatingGroup.rotation.y = time * 0.4; // دوران أبطأ
  floatingGroup.rotation.z = Math.sin(time * 0.3) * 0.05; // اهتزاز أقل
  
  // دوران طفيف للهيكل
  chip.rotation.y = Math.sin(time * 0.08) * 0.03;
  
  // تأثير وميض للضوء
  if (chip.userData.chipLight) {
    const lightIntensity = 0.3 + Math.sin(time * 1.5) * 0.25;
    chip.userData.chipLight.intensity = lightIntensity;
  }
  
  // تأثير توهج إضافي للرقاقة الذهبية
  if (chip.userData.chipType === "gold_chip" && chip.userData.glowSphere) {
    const glowScale = 1.0 + Math.sin(time * 2) * 0.1;
    chip.userData.glowSphere.scale.setScalar(glowScale);
    
    // دوران بطيء للكرة المتوهجة
    chip.userData.glowSphere.rotation.y = time * 0.2;
    chip.userData.glowSphere.rotation.x = time * 0.1;
  }
}

// --- دالة توزيع الرقاقات المعدلة ---
export function distributeChips() {
  console.log("💎 توزيع الرقاقات النادرة (بحجم الحجر الجيري)...");
  
  const chips = [];
  
  // إعادة تعيين العداد
  placedChips = {
    white_chip: 0,
    yellow_chip: 0,
    red_chip: 0,
    blue_chip: 0,
    gold_chip: 0,
  };
  
  // توزيع الرقاقات حسب النوع
  Object.keys(CHIP_TYPES).forEach(chipType => {
    const chipData = CHIP_TYPES[chipType];
    const maxCount = chipData.maxCount;
    
    for (let i = 0; i < maxCount; i++) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!placed && attempts < maxAttempts) {
        // تحديد موقع عشوائي
        const angle = Math.random() * Math.PI * 2;
        let distance;
        
        // تحديد المسافة بناءً على المنطقة الحيوية
        if (chipData.biome === "forest") {
          distance = 8000 + Math.random() * 12000;
        } else {
          distance = Math.random() * 7000;
        }
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // التحقق من المنطقة الحيوية الصحيحة
        const biome = getBiomeType(x, z);
        if (biome !== chipData.biome) {
          attempts++;
          continue;
        }
        
        // التحقق من كثافة Simplex Noise
        const noiseValue = getSimplexDensity(x, z, 500);
        if (noiseValue < 0.4 || noiseValue > 0.8) {
          attempts++;
          continue;
        }
        
        // زيادة المسافة الدنيا بسبب الحجم الكبير
        const adjustedMinDistance = chipData.minDistance * 1.5;
        
        // التحقق من المسافة الآمنة من العناصر الأخرى
        if (checkSafeDistance(x, z, adjustedMinDistance, true)) {
          // التحقق من المسافة من الرقاقات الأخرى من نفس النوع
          let tooCloseToSameType = false;
          chips.forEach(existingChip => {
            if (existingChip.type === chipType) {
              const dx = existingChip.x - x;
              const dz = existingChip.z - z;
              const distance = Math.sqrt(dx * dx + dz * dz);
              
              if (distance < adjustedMinDistance * 2) {
                tooCloseToSameType = true;
              }
            }
          });
          
          if (!tooCloseToSameType) {
            chips.push({
              x: x,
              z: z,
              type: chipType,
              name: chipData.name,
              rarity: chipData.rarity,
              value: chipData.value,
              minDistance: adjustedMinDistance,
              scale: 1.0, // استخدام مقياس ثابت لأننا نستخدم sizeMultiplier داخلياً
              sizeMultiplier: chipData.sizeMultiplier,
            });
            
            placedChips[chipType]++;
            placed = true;
            console.log(`✅ تم وضع ${chipData.name} (حجم: ${chipData.sizeMultiplier}x) في (${x.toFixed(0)}, ${z.toFixed(0)})`);
          }
        }
        
        attempts++;
      }
      
      if (!placed && attempts >= maxAttempts) {
        console.warn(`⚠️ فشل في وضع ${chipData.name} رقم ${i + 1} بعد ${maxAttempts} محاولة`);
      }
    }
  });
  
  console.log("📊 إحصائيات توزيع الرقاقات:", placedChips);
  return chips;
}

// --- دالة إنشاء الرقاقات في المشهد بحجم أكبر ---
export function createChipsInScene(chipsData) {
  if (!globals.scene || !globals.forestGroup) {
    console.error("❌ المشهد أو مجموعة الغابات غير مهيأة");
    return [];
  }
  
  const createdChips = [];
  
  chipsData.forEach((chipData, index) => {
    // إنشاء نموذج الرقاقة بالحجم الكبير
    const chipModel = createChipModel(chipData.type, chipData.scale);
    
    if (!chipModel) {
      console.warn(`❌ فشل إنشاء نموذج للرقاقة: ${chipData.type}`);
      return;
    }
    
    // تعيين الموقع مع ارتفاع أعلى بسبب الحجم الكبير
    const terrainHeight = getTerrainHeight(chipData.x, chipData.z);
    const chipHeight = terrainHeight + 15; // ارتفاع أعلى للرقاقات الكبيرة
    
    chipModel.position.set(chipData.x, chipHeight, chipData.z);
    
    // إضافة إلى المشهد
    globals.forestGroup.add(chipModel);
    
    // إنشاء كائن بيانات العقبة
    const obstacleData = {
      mesh: chipModel,
      x: chipData.x,
      z: chipData.z,
      type: chipData.type,
      name: chipData.name,
      rarity: chipData.rarity,
      value: chipData.value,
      isChip: true,
      isCollectible: true,
      health: 1,
      maxHealth: 1,
      originalScale: chipData.scale,
      sizeMultiplier: chipData.sizeMultiplier,
      collectTime: 2.0,
      userData: chipModel.userData,
      boundingRadius: chipModel.userData.boundingRadius,
    };
    
    // إضافة إلى obstacleData
    if (!globals.obstacleData) {
      globals.obstacleData = [];
    }
    globals.obstacleData.push(obstacleData);
    
    // إضافة إلى القائمة المرتجعة
    createdChips.push({
      model: chipModel,
      data: obstacleData,
      index: globals.obstacleData.length - 1,
    });
    
    console.log(`✨ تم إنشاء ${chipData.name} (${chipData.sizeMultiplier}x) في العالم`);
  });
  
  return createdChips;
}

// --- دالة حصاد الرقاقة المعدلة ---
export function harvestChip(chip, index) {
  if (!chip || chip.isFading) return;
  
  console.log(`💎 محاولة حصاد رقاقة كبيرة: ${chip.name || chip.type}`);
  
  // بدء تأثير التلاشي
  chip.isFading = true;
  
  // إضافة إلى المخزون
  const chipType = chip.type;
  if (!globals.inventory) {
    globals.inventory = {};
  }
  
  if (!globals.inventory.chips) {
    globals.inventory.chips = {
      white_chip: 0,
      yellow_chip: 0,
      red_chip: 0,
      blue_chip: 0,
      gold_chip: 0,
    };
  }
  
  // زيادة العداد (رقاقات كبيرة تعطي مواد أكثر)
  let chipCount = 1;
  if (chipType === "gold_chip") {
    chipCount = 3; // الرقاقة الذهبية تعطي 3 وحدات
  } else {
    chipCount = 2; // الرقاقات الأخرى تعطي وحدتين
  }
  
  globals.inventory.chips[chipType] = (globals.inventory.chips[chipType] || 0) + chipCount;
  
  // منح XP (أكثر للرقاقات الكبيرة)
  if (globals.playerStats) {
    let xpGain;
    switch (chipType) {
      case "gold_chip": xpGain = 100; break;
      case "white_chip": xpGain = 50; break;
      case "yellow_chip": xpGain = 50; break;
      case "red_chip": xpGain = 50; break;
      case "blue_chip": xpGain = 50; break;
      default: xpGain = 25;
    }
    globals.playerStats.xp = (globals.playerStats.xp || 0) + xpGain;
    console.log(`🎯 +${xpGain} XP لحصاد رقاقة ${chip.name || chip.type}`);
  }
  
  // إظهار رسالة أكبر للرقاقات الكبيرة
  showChipHarvestMessage(chip, chipCount);
  
  // بدء تأثير التلاشي مع جسيمات أكثر
  if (chip.mesh && !globals.fadingObjects) {
    globals.fadingObjects = [];
  }
  
  if (chip.mesh && globals.fadingObjects) {
    globals.fadingObjects.push({
      obs: chip,
      progress: 0,
      originalScale: chip.mesh.scale.x,
      isChip: true,
      particleColor: CHIP_TYPES[chipType]?.color || 0xffffff,
      particleCount: 15, // جسيمات أكثر للرقاقات الكبيرة
      chipCount: chipCount,
    });
  }
  
  // إزالة من obstacleData
  if (globals.obstacleData && index > -1) {
    globals.obstacleData.splice(index, 1);
  }
  
  // تحديث واجهة المستخدم
  updateChipUI();
  
  return true;
}

// --- دالة عرض رسالة الحصاد المعدلة للرقاقات الكبيرة ---
function showChipHarvestMessage(chip, chipCount) {
  const chipData = CHIP_TYPES[chip.type];
  if (!chipData) return;
  
  // إنشاء عنصر رسالة أكبر
  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 25px 40px;
    border-radius: 15px;
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    z-index: 10000;
    border: 3px solid ${chip.type === "gold_chip" ? "#ffd700" : "#fff"};
    box-shadow: 0 0 30px ${chipData.color};
    animation: fadeInOut 4s ease-in-out;
    min-width: 300px;
  `;
  
  // إضافة CSS للرسوم المتحركة
  if (!document.querySelector('#chip-animation-style')) {
    const style = document.createElement('style');
    style.id = 'chip-animation-style';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
        10% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        20% { transform: translate(-50%, -50%) scale(1); }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // نص الرسالة
  let rarityText = "";
  let countText = chipCount > 1 ? ` (×${chipCount})` : "";
  
  switch (chipData.rarity) {
    case "أسطورية": 
      rarityText = "⭐ ⭐ ⭐ أسطورية ⭐ ⭐ ⭐"; 
      break;
    case "نادرة جداً": 
      rarityText = "✨ ✨ نادرة جداً ✨ ✨"; 
      break;
    default: 
      rarityText = chipData.rarity;
  }
  
  messageDiv.innerHTML = `
    <div style="margin-bottom: 15px; font-size: 32px; color: ${chip.type === "gold_chip" ? "#ffd700" : "#fff"}">
      ${rarityText}
    </div>
    <div style="margin-bottom: 20px; font-size: 36px;">
      ${chipData.name}${countText}
    </div>
    <div style="font-size: 22px; opacity: 0.9;">
      ${chipData.value} - ${chipData.sizeMultiplier}x حجم
    </div>
    <div style="margin-top: 15px; font-size: 20px; color: #4CAF50;">
      ✓ تمت الإضافة إلى المخزون
    </div>
  `;
  
  document.body.appendChild(messageDiv);
  
  // إضافة صوت تأثير (إذا كان متاحاً)
  if (typeof Audio !== 'undefined') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // ترددات مختلفة لأنواع الرقاقات
      let frequency = 440; // A4
      if (chip.type === "gold_chip") frequency = 880; // A5
      else if (chip.type === "white_chip") frequency = 523.25; // C5
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("🎵 لا يمكن تشغيل تأثير الصوت:", e);
    }
  }
  
  // إزالة الرسالة بعد 4 ثوانٍ
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 4000);
}

// --- دالة تحديث واجهة الرقاقات ---
function updateChipUI() {
  // تحديث واجهة المستخدم إذا كانت موجودة
  if (typeof window.updateInventoryUI === 'function') {
    window.updateInventoryUI();
  }
  
  // تحديث شاشة الت Heads-Up Display
  if (typeof window.updateHUD === 'function') {
    window.updateHUD();
  }
  
  // تحديث عداد الرقاقات في الواجهة
  if (typeof window.updateChipCounter === 'function') {
    window.updateChipCounter();
  }
}

// --- دالة الحصول على معلومات نظام الرقاقات المعدلة ---
export function getChipSystemInfo() {
  const totalChipCount = Object.values(placedChips).reduce((a, b) => a + b, 0);
  
  return {
    totalTypes: Object.keys(CHIP_TYPES).length,
    chipTypes: CHIP_TYPES,
    placedChips: placedChips,
    totalPlaced: totalChipCount,
    maxPerType: CHIP_TYPES.white_chip.maxCount,
    averageSizeMultiplier: Object.values(CHIP_TYPES).reduce((sum, chip) => sum + chip.sizeMultiplier, 0) / Object.keys(CHIP_TYPES).length,
    distribution: {
      forest: ["white_chip", "yellow_chip", "gold_chip"],
      desert: ["red_chip", "blue_chip"],
    },
    sizeInfo: "جميع الرقاقات الآن بحجم الحجر الجيري (3.5x إلى 4x الحجم الأصلي)",
  };
}

// --- دالة تحديث جميع الرقاقات المعدلة ---
export function updateAllChips(time) {
  if (!globals.obstacleData) return;
  
  let chipCount = 0;
  
  globals.obstacleData.forEach((obstacle, index) => {
    if (obstacle.isChip && obstacle.mesh && obstacle.mesh.userData) {
      updateChipAnimation(obstacle.mesh, time);
      chipCount++;
    }
  });
  
  return chipCount;
}

// --- دالة تهيئة نظام الرقاقات المعدلة ---
export function initChipSystem() {
  console.log("💎 تهيئة نظام الرقاقات (بحجم الحجر الجيري)...");
  
  // توزيع الرقاقات
  const chipsData = distributeChips();
  
  // إنشاء الرقاقات في المشهد
  const createdChips = createChipsInScene(chipsData);
  
  console.log(`✅ تم تهيئة نظام الرقاقات: ${createdChips.length} رقاقة كبيرة تم إنشاؤها`);
  
  return {
    success: true,
    chipsData: chipsData,
    createdChips: createdChips,
    info: getChipSystemInfo(),
  };
}

// --- دالة البحث عن الرقاقات القريبة ---
export function findNearbyChips(x, z, radius = 350) { // زيادة نصف القطر لأن الرقاقات أكبر
  const nearbyChips = [];
  
  if (!globals.obstacleData) {
    return nearbyChips;
  }
  
  globals.obstacleData.forEach((obstacle, index) => {
    if (obstacle.isChip && obstacle.x !== undefined && obstacle.z !== undefined) {
      const dx = obstacle.x - x;
      const dz = obstacle.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // استخدام نصف قطر أكبر للرقاقات الكبيرة
      const detectionRadius = obstacle.boundingRadius ? obstacle.boundingRadius / 2 + radius : radius;
      
      if (distance <= detectionRadius) {
        nearbyChips.push({
          obstacle: obstacle,
          index: index,
          distance: distance,
          type: obstacle.type,
          name: obstacle.name,
          rarity: obstacle.rarity,
          sizeMultiplier: obstacle.sizeMultiplier,
        });
      }
    }
  });
  
  // ترتيب حسب المسافة
  nearbyChips.sort((a, b) => a.distance - b.distance);
  
  return nearbyChips;
}