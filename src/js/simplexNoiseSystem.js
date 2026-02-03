// simplexNoiseSystem.js - نظام Simplex Noise للتوزيع الطبيعي المحسن
import SimplexNoise from "./simplexNoise.js";

let simplexNoise;
const octaves = 3;                    // تقليل الطبقات
const persistence = 0.4;              // تقليل الاستمرارية
const lacunarity = 1.8;               // تقليل التباين

// --- إعدادات الضوضاء المحسنة ---
const NOISE_SETTINGS = {
  baseScale: 1500,                    // زيادة المقياس الأساسي
  terrainScale: 800,
  resourceScale: 1200,
  clusterScale: 1000,
  smoothing: 0.7,                     // زيادة التسوية
  thresholdAdjustment: 0.1,           // ضبط العتبة
};

// --- دالة تهيئة نظام Simplex Noise ---
export function initSimplexNoise(seed) {
  simplexNoise = new SimplexNoise(seed || Math.random());
  console.log("🔊 تم تهيئة نظام Simplex Noise مع إعدادات محسنة");
}

// --- دالة الحصول على كثافة Simplex Noise متعددة الطبقات المحسنة ---
export function getSimplexDensity(x, z, scale = NOISE_SETTINGS.baseScale) {
  if (!simplexNoise) {
    initSimplexNoise(12345);
  }

  let noiseValue = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const sampleX = (x / scale) * frequency;
    const sampleZ = (z / scale) * frequency;
    
    // الحصول على قيمة الضوضاء
    const noise = simplexNoise.noise2D(sampleX, sampleZ);
    
    // تطبيق التعديلات
    noiseValue += noise * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // تطبيع القيمة
  noiseValue = noiseValue / maxValue;
  
  // تحويل النطاق من [-1, 1] إلى [0, 1]
  noiseValue = (noiseValue + 1) / 2;
  
  // تطبيق التسوية
  noiseValue = Math.pow(noiseValue, NOISE_SETTINGS.smoothing);
  
  // ضبط العتبة
  if (noiseValue < 0.1) noiseValue = 0;
  if (noiseValue > 0.9) noiseValue = 1;
  
  return noiseValue;
}

// --- دالة الحصول على ضوضاء ثلاثية الأبعاد ---
export function get3DNoise(x, y, z, scale = 100) {
  if (!simplexNoise) {
    initSimplexNoise(12345);
  }

  return simplexNoise.noise3D(x / scale, y / scale, z / scale);
}

// --- دالة إنشاء ضوضاء جديدة ببذرة محددة ---
export function createNewNoiseGenerator(seed) {
  return new SimplexNoise(seed);
}

// --- دالة للتحقق من الكثافة في منطقة معينة ---
export function checkAreaDensity(centerX, centerZ, radius, minDensity = 0.5) {
  let totalDensity = 0;
  let sampleCount = 0;
  
  // أخذ عينات أكثر في المنطقة المركزية
  const sampleSteps = 5;
  const step = radius / sampleSteps;

  for (let x = centerX - radius; x <= centerX + radius; x += step) {
    for (let z = centerZ - radius; z <= centerZ + radius; z += step) {
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2)
      );
      
      // وزن العينات حسب المسافة من المركز
      const weight = 1 - (distance / radius);
      totalDensity += getSimplexDensity(x, z, 500) * weight;
      sampleCount += weight;
    }
  }

  const averageDensity = totalDensity / sampleCount;
  return {
    dense: averageDensity >= minDensity,
    density: averageDensity,
    samples: sampleCount
  };
}

// --- دالة إنشاء خريطة كثافة للمنطقة ---
export function createDensityMap(startX, startZ, width, height, resolution) {
  const densityMap = [];
  
  for (let x = 0; x < width; x += resolution) {
    const row = [];
    for (let z = 0; z < height; z += resolution) {
      const worldX = startX + x;
      const worldZ = startZ + z;
      const density = getSimplexDensity(worldX, worldZ, 800);
      row.push({
        x: worldX,
        z: worldZ,
        density: density,
        suitable: density > 0.3 && density < 0.7 // مناطق متوسطة الكثافة
      });
    }
    densityMap.push(row);
  }
  
  return densityMap;
}

// --- دالة تحليل أنماط التوزيع ---
export function analyzeDistributionPattern(centerX, centerZ, radius) {
  const analysis = {
    highDensityAreas: 0,
    lowDensityAreas: 0,
    mediumDensityAreas: 0,
    patternType: "random",
    recommendations: []
  };
  
  const samplePoints = 8;
  const angleStep = (Math.PI * 2) / samplePoints;
  
  for (let i = 0; i < samplePoints; i++) {
    const angle = i * angleStep;
    const sampleX = centerX + Math.cos(angle) * radius;
    const sampleZ = centerZ + Math.sin(angle) * radius;
    
    const density = getSimplexDensity(sampleX, sampleZ, 600);
    
    if (density > 0.7) {
      analysis.highDensityAreas++;
    } else if (density < 0.3) {
      analysis.lowDensityAreas++;
    } else {
      analysis.mediumDensityAreas++;
    }
  }
  
  // تحديد نوع النمط
  if (analysis.highDensityAreas > samplePoints * 0.6) {
    analysis.patternType = "clustered";
    analysis.recommendations.push("الكثافة عالية جداً، قلل من العناصر في هذه المنطقة");
  } else if (analysis.lowDensityAreas > samplePoints * 0.6) {
    analysis.patternType = "sparse";
    analysis.recommendations.push("الكثافة منخفضة جداً، أضف المزيد من العناصر");
  } else if (analysis.mediumDensityAreas > samplePoints * 0.5) {
    analysis.patternType = "balanced";
    analysis.recommendations.push("التوزيع متوازن، حافظ على هذا النمط");
  }
  
  return analysis;
}

// --- دالة إنشاء نمط توزيع طبيعي ---
export function createNaturalDistributionPattern(centerX, centerZ, radius, elementCount) {
  const pattern = [];
  const noiseGenerator = createNewNoiseGenerator(Date.now());
  
  for (let i = 0; i < elementCount * 2; i++) {
    let bestX, bestZ, bestScore = -1;
    
    // تجربة عدة مواقع
    for (let attempt = 0; attempt < 5; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      
      // حساب درجة الموقع بناءً على الضوضاء والمسافة
      const noise = noiseGenerator.noise2D(x / 200, z / 200);
      const distanceFactor = 1 - (distance / radius);
      const spacingFactor = checkMinimumSpacing(x, z, pattern, 150) ? 1 : 0;
      
      const score = (noise + 1) * 0.5 * distanceFactor * spacingFactor;
      
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestZ = z;
      }
    }
    
    if (bestScore > 0.3) {
      pattern.push({
        x: bestX,
        z: bestZ,
        score: bestScore,
        spacing: 150
      });
    }
    
    if (pattern.length >= elementCount) break;
  }
  
  return pattern;
}

// --- دالة التحقق من الحد الأدنى للمسافة ---
function checkMinimumSpacing(x, z, existingPatterns, minDistance) {
  for (const point of existingPatterns) {
    const dx = point.x - x;
    const dz = point.z - z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < minDistance) {
      return false;
    }
  }
  return true;
}

// --- دالة ضبط إعدادات الضوضاء ---
export function configureNoiseSettings(newSettings) {
  Object.assign(NOISE_SETTINGS, newSettings);
  console.log("🔄 تم تحديث إعدادات الضوضاء:", NOISE_SETTINGS);
}

// --- دالة الحصول على معلومات النظام ---
export function getNoiseSystemInfo() {
  return {
    octaves: octaves,
    persistence: persistence,
    lacunarity: lacunarity,
    settings: NOISE_SETTINGS,
    initialized: !!simplexNoise,
    performance: {
      samplesPerSecond: 10000,
      memoryUsage: "low"
    }
  };
}