// environment.js - ملف التصدير الرئيسي المحدث (واجهة موحدة)
// تصدير جميع الأنظمة من ملفاتها المنفصلة

// تصدير من terrainSystem.js
export {
  createMassiveArtisticIsland,
  getTerrainHeight,
  isWithinIslandBounds,
  getBiomeType,
} from "./terrainSystem.js";

// تصدير من simplexNoiseSystem.js
export {
  initSimplexNoise,
  getSimplexDensity,
  get3DNoise,
  createNewNoiseGenerator,
} from "./simplexNoiseSystem.js";

// تصدير من resourceDistribution.js
export {
  RESOURCE_DISTRIBUTION,
  checkSafeDistance,
  distributeRareResources,
  createBerryClusters,
  distributeIndividualElements,
  getResourceDistributionInfo,
} from "./resourceDistribution.js";

// تصدير من clusterSystem.js
export {
  createResourceClusters,
  CLUSTER_REGIONS,
  createClusterElements,
  createStoneClusterElements,
  getClusterInfo,
  isPointInCluster,
} from "./clusterSystem.js";

// تصدير من elementCreator.js
export {
  createResourceElement,
  createResourceElements,
  removeResourceElement,
  updateElementsScale,
} from "./elementCreator.js";

// تصدير من visibilitySystem.js
export {
  checkObjectVisibility,
  updateCameraFrustum,
  hasCameraPerspectiveChanged,
  renderEnvironment,
  getEnvironmentStats,
  setViewSettings,
  forceShowAllObjects,
  reloadVisibility,
  adjustPerformanceBasedOnFPS,
  updateVisibilityAnim,
} from "./visibilitySystem.js";

// تصدير من environmentManager.js
export {
  createAdvancedEnvironment,
  recreateEnvironment,
  getEnvironmentInfo,
  findNearbyElements,
  updateEnvironmentAnim,
} from "./environmentManager.js";

// تصدير دالة البناء الرئيسية للتوافق مع الكود القديم
export function buildEnvironment() {
  console.log("🏗️ بناء البيئة باستخدام النظام المنظم...");
  createMassiveArtisticIsland();
  return createAdvancedEnvironment();
}