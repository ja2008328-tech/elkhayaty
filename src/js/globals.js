// globals.js - ملف المتغيرات العامة المحدث مع الأرانب
import * as THREE from 'three';

export const globals = {
    // المشهد والعرض
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // التضاريس
    terrain: null,
    
    // المجموعات
    forestGroup: null,
    
    // اللاعب
    player: null,
    input: {
        w: false, a: false, s: false, d: false,
        space: false, shift: false, e: false, f: false
    },
    playerStats: {
        health: 100,
        hunger: 100,
        thirst: 100,
        energy: 100,
        temperature: 50,
        xp: 0
    },
    
    // نظام تتبع سرعة اللاعب
    playerVelocity: null,
    
    // المخزون (بما في ذلك الرقاقات)
    inventory: {
        // الموارد الأساسية
        wood: 0,
        stone: 0,
        flint: 0,
        limestone: 0,
        desert_stone: 0,
        straw: 0,
        cactus: 0,
        stick: 0,
        
        // الرقاقات (سيتم تهيئتها لاحقاً)
        chips: null,
        
        // الأرانب (إذا أردنا تتبعها)
        rabbits: 0
    },
    
    // العوائق والكائنات (بما في ذلك الرقاقات والأرانب)
    obstacleData: [],
    fadingObjects: [],
    
    // نظام الرؤية
    stableViewDistance: 8000,
    alwaysVisibleDistance: 2000,
    fadeStartDistance: 7000,
    performanceMode: 'high',
    
    // الكاميرا والمجال البصري
    viewFrustum: new THREE.Frustum(),
    frustumMatrix: new THREE.Matrix4(),
    lastCameraPosition: new THREE.Vector3(),
    lastCameraQuaternion: new THREE.Quaternion(),
    cameraPerspectiveThreshold: 50,
    
    // نظام التقسيم
    chunkSize: 1000,
    visibleChunks: new Set(),
    visibilityCache: new Map(),
    
    // تتبع الرؤية
    visibleObjects: new Set(),
    invisibleObjects: new Set(),
    lastPlayerPosition: new THREE.Vector3(),
    lastVisibilityCheck: 0,
    updateDistanceThreshold: 500,
    visibilityCheckInterval: 1000,
    
    // الشبكة المكانية (لتحسين أداء التحقق من المسافات)
    spatialGrid: {},
    
    // تتبع الوقت
    clock: null,
    
    // إحصائيات النظام
    performanceStats: {
        fps: 0,
        frameTime: 0,
        memory: null,
        drawCalls: 0
    },
    
    // متغيرات خاصة بالرقاقات
    lastChipHarvest: null,
    chipHarvestCooldown: 1000, // تأخير 1 ثانية بين كل حصاد
    
    // متغيرات خاصة بالأرانب
    rabbitSystemEnabled: true,
    lastRabbitUpdate: 0,
    rabbitUpdateInterval: 0.1,
    
    // إحصائيات الأرانب
    rabbitStats: {
        totalRabbits: 0,
        visibleRabbits: 0,
        idleRabbits: 0,
        wanderingRabbits: 0,
        escapingRabbits: 0,
        returningRabbits: 0
    },
    
    // الإعدادات العامة
    environmentSettings: {
        enableRabbits: true,
        rabbitCount: 4,
        enableChips: true,
        optimizationEnabled: true
    }
};

// دالة لإعادة تعيين المتغيرات
export function resetGlobals() {
    globals.scene = null;
    globals.camera = null;
    globals.renderer = null;
    globals.controls = null;
    globals.terrain = null;
    globals.forestGroup = null;
    globals.player = null;
    globals.playerVelocity = null;
    globals.obstacleData = [];
    globals.fadingObjects = [];
    globals.visibleChunks.clear();
    globals.visibilityCache.clear();
    globals.visibleObjects.clear();
    globals.invisibleObjects.clear();
    globals.lastPlayerPosition = new THREE.Vector3();
    globals.lastCameraPosition = new THREE.Vector3();
    globals.lastCameraQuaternion = new THREE.Quaternion();
    globals.lastVisibilityCheck = 0;
    globals.lastChipHarvest = null;
    globals.lastRabbitUpdate = 0;
    globals.spatialGrid = {};
    
    // إعادة تعيين المخزون
    globals.inventory = {
        wood: 0,
        stone: 0,
        flint: 0,
        limestone: 0,
        desert_stone: 0,
        straw: 0,
        cactus: 0,
        stick: 0,
        chips: null,
        rabbits: 0
    };
    
    // إعادة تعيين إحصائيات الأرانب
    globals.rabbitStats = {
        totalRabbits: 0,
        visibleRabbits: 0,
        idleRabbits: 0,
        wanderingRabbits: 0,
        escapingRabbits: 0,
        returningRabbits: 0
    };
    
    console.log('🔄 تم إعادة تعيين المتغيرات العامة');
}

// دالة لتهيئة المتغيرات الافتراضية
export function initializeGlobals() {
    if (!globals.obstacleData) globals.obstacleData = [];
    if (!globals.fadingObjects) globals.fadingObjects = [];
    if (!globals.visibleChunks) globals.visibleChunks = new Set();
    if (!globals.visibilityCache) globals.visibilityCache = new Map();
    if (!globals.visibleObjects) globals.visibleObjects = new Set();
    if (!globals.invisibleObjects) globals.invisibleObjects = new Set();
    if (!globals.lastPlayerPosition) globals.lastPlayerPosition = new THREE.Vector3();
    if (!globals.lastCameraPosition) globals.lastCameraPosition = new THREE.Vector3();
    if (!globals.lastCameraQuaternion) globals.lastCameraQuaternion = new THREE.Quaternion();
    if (!globals.spatialGrid) globals.spatialGrid = {};
    
    // تهيئة نظام تتبع السرعة
    globals.playerVelocity = {
        x: 0,
        z: 0,
        lastPosition: new THREE.Vector3(),
        lastTime: performance.now()
    };
    
    globals.stableViewDistance = 8000;
    globals.alwaysVisibleDistance = 2000;
    globals.fadeStartDistance = 7000;
    globals.performanceMode = 'high';
    globals.chunkSize = 1000;
    globals.cameraPerspectiveThreshold = 50;
    globals.updateDistanceThreshold = 500;
    globals.visibilityCheckInterval = 1000;
    globals.chipHarvestCooldown = 1000;
    globals.rabbitUpdateInterval = 0.1;
    globals.rabbitSystemEnabled = true;
    
    // تهيئة مخزون الرقاقات
    if (!globals.inventory.chips) {
        globals.inventory.chips = {
            white_chip: 0,
            yellow_chip: 0,
            red_chip: 0,
            blue_chip: 0,
            gold_chip: 0,
        };
    }
    
    // تهيئة إحصائيات الأرانب
    globals.rabbitStats = {
        totalRabbits: 0,
        visibleRabbits: 0,
        idleRabbits: 0,
        wanderingRabbits: 0,
        escapingRabbits: 0,
        returningRabbits: 0
    };
    
    // تهيئة إعدادات البيئة
    globals.environmentSettings = {
        enableRabbits: true,
        rabbitCount: 4,
        enableChips: true,
        optimizationEnabled: true
    };
    
    console.log('✅ تم تهيئة المتغيرات العامة');
}

// دالة تحديث إحصائيات النظام
export function updatePerformanceStats(fps, frameTime, drawCalls) {
    globals.performanceStats.fps = fps;
    globals.performanceStats.frameTime = frameTime;
    globals.performanceStats.drawCalls = drawCalls;
    
    if (performance.memory) {
        globals.performanceStats.memory = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
        };
    }
}

// دالة تحديث إحصائيات الأرانب
export function updateRabbitStats(rabbitInfo) {
    if (!rabbitInfo || !rabbitInfo.rabbits) return;
    
    let total = 0;
    let visible = 0;
    let idle = 0;
    let wandering = 0;
    let escaping = 0;
    let returning = 0;
    
    rabbitInfo.rabbits.forEach(rabbit => {
        total++;
        if (rabbit.isVisible) visible++;
        
        switch (rabbit.state) {
            case 'idle': idle++; break;
            case 'wandering': wandering++; break;
            case 'escaping': escaping++; break;
            case 'returning': returning++; break;
        }
    });
    
    globals.rabbitStats = {
        totalRabbits: total,
        visibleRabbits: visible,
        idleRabbits: idle,
        wanderingRabbits: wandering,
        escapingRabbits: escaping,
        returningRabbits: returning
    };
}

// دالة الحصول على معلومات النظام
export function getSystemInfo() {
    return {
        threejsVersion: THREE.REVISION,
        performance: globals.performanceStats,
        environment: {
            totalObjects: globals.obstacleData.length,
            visibleObjects: globals.visibleObjects.size,
            viewDistance: globals.stableViewDistance,
            performanceMode: globals.performanceMode
        },
        chips: globals.inventory.chips,
        rabbits: globals.rabbitStats,
        player: {
            position: globals.player ? globals.player.position : null,
            velocity: globals.playerVelocity
        }
    };
}

// دالة تحديث الشبكة المكانية
export function updateSpatialGrid(element) {
    if (!element || !element.x || !element.z) return;
    
    const gridSize = 500;
    const gridX = Math.floor(element.x / gridSize);
    const gridZ = Math.floor(element.z / gridSize);
    const gridKey = `${gridX},${gridZ}`;
    
    if (!globals.spatialGrid[gridKey]) {
        globals.spatialGrid[gridKey] = [];
    }
    
    // التحقق إذا كان العنصر موجوداً بالفعل
    const exists = globals.spatialGrid[gridKey].some(item => 
        item.mesh === element.mesh
    );
    
    if (!exists) {
        globals.spatialGrid[gridKey].push(element);
    }
}

// دالة تنظيف الشبكة المكانية
export function cleanupSpatialGrid() {
    for (const key in globals.spatialGrid) {
        globals.spatialGrid[key] = globals.spatialGrid[key].filter(item => 
            item.mesh && item.mesh.parent
        );
        
        if (globals.spatialGrid[key].length === 0) {
            delete globals.spatialGrid[key];
        }
    }
}

// دالة التحقق من المسافة في الشبكة المكانية
export function checkDistanceInGrid(x, z, minDistance) {
    if (!globals.spatialGrid || Object.keys(globals.spatialGrid).length === 0) {
        return true;
    }
    
    const gridSize = 500;
    const gridX = Math.floor(x / gridSize);
    const gridZ = Math.floor(z / gridSize);
    
    // التحقق من الخلايا المجاورة
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const checkGridX = gridX + dx;
            const checkGridZ = gridZ + dz;
            const gridKey = `${checkGridX},${checkGridZ}`;
            
            if (globals.spatialGrid[gridKey]) {
                for (const item of globals.spatialGrid[gridKey]) {
                    if (!item.x || !item.z) continue;
                    
                    const dxItem = item.x - x;
                    const dzItem = item.z - z;
                    const distance = Math.sqrt(dxItem * dxItem + dzItem * dzItem);
                    
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
    }
    
    return true;
}