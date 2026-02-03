// rabbit.js - نظام الأرانب المعدل بنفس الشكل من الملف المرفق
import * as THREE from "three";
import { globals } from "./globals.js";
import { getTerrainHeight, getBiomeType } from "./terrainSystem.js";
import { getSimplexDensity } from "./simplexNoiseSystem.js";

// --- إعدادات الأرانب المعدلة ---
const RABBIT_SETTINGS = {
    totalRabbits: 4,                     // عدد الأرانب الكلي
    forestOnly: true,                    // الأرانب في الغابة فقط
    movementSpeed: 20,                   // سرعة الحركة العادية (المشي)
    escapeSpeed: 60,                     // سرعة الهرب (الجري)
    rotationSpeed: 0.15,                 // سرعة الدوران
    detectionRadius: 350,                // مسافة اكتشاف اللاعب
    escapeRadius: 600,                   // مسافة الهروب
    returnRadius: 1000,                  // مسافة العودة للنقطة الأصلية
    wanderRadius: 500,                   // نصف قطر التجوال
    minIdleTime: 2.0,                    // الحد الأدنى للوقت الساكن (ثواني)
    maxIdleTime: 4.0,                    // الحد الأقصى للوقت الساكن
    idleMoveDistance: 60,                // مسافة الحركة أثناء السكون
    scale: 80,                           // مقياس نموذج الأرنب (كبير وواضح)
    heightAboveGround: 0,                // الارتفاع فوق الأرض (سيتم حسابها تلقائياً)
    updateInterval: 0.05,                // فاصل تحديث الحركة (ثواني)
    avoidanceForce: 0.4,                 // قوة تجنب العقبات
    smoothRotation: true,                // استخدام دوران سلس
    enableAI: true,                      // تفعيل الذكاء الاصطناعي
    useSimplexNoise: true,               // استخدام الضوضاء في الحركة
    simplexScale: 0.001,                 // مقياس الضوضاء
    playerScaleRatio: 0.8,               // نسبة حجم الأرنب إلى اللاعب (80% للحجم المنطقي)
    boundingSphereRadius: 60,            // نصف قطر الكرة المحيطة للأرنب
    hopHeightMultiplier: 0.4,            // مضاعف ارتفاع القفز
    walkBobMultiplier: 0.2,              // مضاعف اهتزاز المشي
    runBobMultiplier: 0.6,               // مضاعف اهتزاز الجري
    earTwitchSpeed: 2.5,                 // سرعة حركة الأذنين
    noseTwitchSpeed: 3.0,                // سرعة حركة الأنف
};

// --- تعريف هيكل الأرنب المعدل ---
class Rabbit {
    constructor(id, x, z) {
        this.id = id;
        this.mesh = null;
        this.originalPosition = new THREE.Vector3(x, 0, z);
        this.position = new THREE.Vector3(x, 0, z);
        this.targetPosition = new THREE.Vector3(x, 0, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
        
        // حساب المقياس بناءً على نسبة حجم اللاعب
        this.scale = RABBIT_SETTINGS.scale * RABBIT_SETTINGS.playerScaleRatio;
        
        // حالة الذكاء الاصطناعي
        this.state = 'idle'; // 'idle', 'wandering', 'escaping', 'returning'
        this.currentAction = null;
        this.actionTimer = 0;
        this.idleTimer = RABBIT_SETTINGS.minIdleTime + 
                       Math.random() * (RABBIT_SETTINGS.maxIdleTime - RABBIT_SETTINGS.minIdleTime);
        this.wanderTarget = null;
        this.escapeDirection = null;
        this.lastPlayerDistance = 0;
        
        // الحركة والتجوال
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderRadius = RABBIT_SETTINGS.wanderRadius;
        this.wanderDistance = 150;
        this.wanderJitter = 0.4;
        
        // متغيرات الوقت للحركة
        this.animationTime = 0;
        this.lastUpdate = 0;
        this.updateInterval = RABBIT_SETTINGS.updateInterval;
        
        // التتبع
        this.isVisible = true;
        this.inFrustum = false;
        this.distanceToPlayer = 0;
        this.lastVisibleCheck = 0;
        
        // الرسوم المتحركة - نفس تأثيرات الملف المرفق
        this.animationState = {
            isMoving: false,
            moveSpeed: 0,
            hopHeight: 0,
            hopPhase: 0,
            earTwitch: 0,
            noseTwitch: 0,
            bodyBob: 0,
            legSwing: 0,
            // حالات الحركة من الملف المرفق
            idleBob: 0,
            walkBob: 0,
            runBob: 0,
            earMovement: 0,
            headMovement: 0
        };
        
        // إنشاء النموذج المرئي بنفس شكل الملف المرفق
        this.createVisualModel();
    }
    
    // --- إنشاء النموذج المرئي للأرنب بنفس شكل الملف المرفق ---
    createVisualModel() {
        const rabbitGroup = new THREE.Group();
        rabbitGroup.name = `rabbit_${this.id}`;
        
        // ألوان الأرنب - نفس ألوان الملف المرفق
        const furColor = 0xFFFFFF; // أبيض
        const eyeColor = 0x000000; // أسود
        const noseColor = 0xFFB7C5; // وردي
        const innerEarColor = 0xFFB7C5; // وردي (داخل الأذن)
        
        // مادة الفرو - نفس الملف المرفق
        const furMat = new THREE.MeshStandardMaterial({ 
            color: furColor, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        // مادة العيون - نفس الملف المرفق
        const eyeMat = new THREE.MeshStandardMaterial({ 
            color: eyeColor, 
            roughness: 0.2,
            metalness: 0.9
        });
        
        // مادة الأنف - نفس الملف المرفق
        const noseMat = new THREE.MeshStandardMaterial({ 
            color: noseColor, 
            roughness: 0.6,
            metalness: 0.1
        });
        
        // مادة الأذن الداخلية - نفس الملف المرفق
        const innerEarMat = new THREE.MeshStandardMaterial({ 
            color: innerEarColor, 
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        // 1. الجسم الرئيسي (بيضاوي) - بنفس شكل الملف المرفق
        const bodyGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
        bodyMesh.scale.set(1.4, 0.85, 1.3); // شكل بيضاوي كما في الملف
        bodyMesh.position.set(0, 0.6, 0);
        bodyMesh.name = "body";
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        rabbitGroup.add(bodyMesh);
        
        // 2. الرأس (مجموعة للتحريك) - نفس شكل الملف
        const headGroup = new THREE.Group();
        headGroup.name = "headGroup";
        headGroup.position.set(0, 1.2, 0.6); // موقع الرأس كما في الملف
        
        const headGeo = new THREE.SphereGeometry(0.65, 32, 32);
        const headMesh = new THREE.Mesh(headGeo, furMat);
        headMesh.castShadow = true;
        headGroup.add(headMesh);
        
        // 3. الأذنين - بنفس شكل الملف المرفق
        const earGeo = new THREE.CylinderGeometry(0.1, 0.23, 1.05, 16);
        earGeo.translate(0, 0.52, 0);
        
        const innerEarGeo = new THREE.PlaneGeometry(0.15, 0.7);
        innerEarGeo.translate(0, 0.52, 0.1);
        
        // الأذن اليمنى مع محور للتحريك
        const earRightPivot = new THREE.Group();
        earRightPivot.name = "earRightPivot";
        earRightPivot.position.set(0.25, 0.35, 0.2);
        
        const earRight = new THREE.Mesh(earGeo, furMat);
        earRight.rotation.z = -0.25;
        earRight.castShadow = true;
        
        const innerEarRight = new THREE.Mesh(innerEarGeo, innerEarMat);
        innerEarRight.rotation.z = -0.25;
        
        earRightPivot.add(earRight);
        earRightPivot.add(innerEarRight);
        headGroup.add(earRightPivot);
        
        // الأذن اليسرى مع محور للتحريك
        const earLeftPivot = new THREE.Group();
        earLeftPivot.name = "earLeftPivot";
        earLeftPivot.position.set(-0.25, 0.35, 0.2);
        
        const earLeft = new THREE.Mesh(earGeo, furMat);
        earLeft.rotation.z = 0.25;
        earLeft.castShadow = true;
        
        const innerEarLeft = new THREE.Mesh(innerEarGeo, innerEarMat);
        innerEarLeft.rotation.z = 0.25;
        
        earLeftPivot.add(earLeft);
        earLeftPivot.add(innerEarLeft);
        headGroup.add(earLeftPivot);
        
        // 4. العيون - نفس الملف المرفق
        const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
        eyeRight.position.set(0.25, 0.1, 0.55);
        eyeRight.name = "eyeRight";
        headGroup.add(eyeRight);
        
        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
        eyeLeft.position.set(-0.25, 0.1, 0.55);
        eyeLeft.name = "eyeLeft";
        headGroup.add(eyeLeft);
        
        // 5. الأنف - نفس الملف المرفق
        const noseGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const noseMesh = new THREE.Mesh(noseGeo, noseMat);
        noseMesh.position.set(0, 0, 0.65);
        noseMesh.name = "nose";
        headGroup.add(noseMesh);
        
        rabbitGroup.add(headGroup);
        
        // 6. الأرجل - بنفس شكل الملف المرفق (كروية)
        const frontLegGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const hindLegGeo = new THREE.SphereGeometry(0.32, 16, 16);
        
        // الأرجل الأمامية
        const legFrontRight = new THREE.Mesh(frontLegGeo, furMat);
        legFrontRight.position.set(0.35, 0.3, 0.9);
        legFrontRight.name = "legFrontRight";
        legFrontRight.castShadow = true;
        rabbitGroup.add(legFrontRight);
        
        const legFrontLeft = new THREE.Mesh(frontLegGeo, furMat);
        legFrontLeft.position.set(-0.35, 0.3, 0.9);
        legFrontLeft.name = "legFrontLeft";
        legFrontLeft.castShadow = true;
        rabbitGroup.add(legFrontLeft);
        
        // الأرجل الخلفية (أكبر كما في الملف)
        const legBackRight = new THREE.Mesh(hindLegGeo, furMat);
        legBackRight.position.set(0.55, 0.45, -0.6);
        legBackRight.scale.set(1, 1.2, 1.2); // مطّ قليلاً كما في الملف
        legBackRight.name = "legBackRight";
        legBackRight.castShadow = true;
        rabbitGroup.add(legBackRight);
        
        const legBackLeft = new THREE.Mesh(hindLegGeo, furMat);
        legBackLeft.position.set(-0.55, 0.45, -0.6);
        legBackLeft.scale.set(1, 1.2, 1.2); // مطّ قليلاً كما في الملف
        legBackLeft.name = "legBackLeft";
        legBackLeft.castShadow = true;
        rabbitGroup.add(legBackLeft);
        
        // 7. الذيل - نفس الملف المرفق
        const tailGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const tailMesh = new THREE.Mesh(tailGeo, furMat);
        tailMesh.position.set(0, 1.0, -1.3);
        tailMesh.name = "tail";
        tailMesh.castShadow = true;
        rabbitGroup.add(tailMesh);
        
        // تطبيق المقياس المعدل لجعل الأرنب كبيراً وواضحاً
        rabbitGroup.scale.setScalar(this.scale);
        
        // وضع الموضع الأولي
        rabbitGroup.position.copy(this.position);
        
        // حساب الأبعاد للارتفاع الصحيح
        const boundingBox = new THREE.Box3().setFromObject(rabbitGroup);
        const size = boundingBox.getSize(new THREE.Vector3());
        this.modelHeight = size.y;
        this.modelRadius = Math.max(size.x, size.z) / 2;
        
        this.mesh = rabbitGroup;
        
        // حفظ مراجع الأجزاء للتحريك
        this.headGroup = headGroup;
        this.earRightPivot = earRightPivot;
        this.earLeftPivot = earLeftPivot;
        this.legFrontRight = legFrontRight;
        this.legFrontLeft = legFrontLeft;
        this.legBackRight = legBackRight;
        this.legBackLeft = legBackLeft;
        this.tailMesh = tailMesh;
        this.noseMesh = noseMesh;
        
        // بيانات المستخدم
        this.mesh.userData = {
            id: this.id,
            type: "rabbit",
            isRabbit: true,
            originalPosition: this.originalPosition.clone(),
            wanderRadius: this.wanderRadius,
            detectionRadius: RABBIT_SETTINGS.detectionRadius,
            escapeRadius: RABBIT_SETTINGS.escapeRadius,
            movementSpeed: RABBIT_SETTINGS.movementSpeed,
            escapeSpeed: RABBIT_SETTINGS.escapeSpeed,
            scale: this.scale,
            modelHeight: this.modelHeight,
            modelRadius: this.modelRadius,
            heightOffset: this.modelHeight * 0.5,
            isVisible: true,
            inFrustum: false,
            lastUpdate: 0,
            updateInterval: RABBIT_SETTINGS.updateInterval,
            state: this.state,
            distanceToPlayer: 0,
            boundingSphereRadius: RABBIT_SETTINGS.boundingSphereRadius * (this.scale / 80)
        };
        
        console.log(`✅ تم إنشاء أرنب ${this.id} بنفس شكل الملف المرفق بحجم ${this.scale.toFixed(1)}`);
    }
    
    // --- تحديث حالة الأرنب ---
    update(deltaTime, playerPosition, currentTime) {
        // تحديث المؤقتات
        this.animationTime += deltaTime;
        this.lastUpdate += deltaTime;
        if (this.lastUpdate < this.updateInterval) return;
        
        // حفظ وقت التحديث الأخير
        this.lastUpdate = 0;
        
        // حساب المسافة إلى اللاعب
        this.distanceToPlayer = this.position.distanceTo(playerPosition);
        if (this.mesh.userData) {
            this.mesh.userData.distanceToPlayer = this.distanceToPlayer;
        }
        
        // تحديث حالة الذكاء الاصطناعي
        this.updateAI(playerPosition, currentTime);
        
        // تطبيق الحركة
        this.applyMovement(deltaTime);
        
        // تحديث الرسوم المتحركة بنفس تأثيرات الملف المرفق
        this.updateAnimation(deltaTime);
        
        // تحديث النموذج المرئي
        this.updateVisualModel();
        
        // تحديث بيانات المستخدم
        if (this.mesh.userData) {
            this.mesh.userData.state = this.state;
            this.mesh.userData.lastUpdate = currentTime;
        }
    }
    
    // --- تحديث الذكاء الاصطناعي ---
    updateAI(playerPosition, currentTime) {
        if (!RABBIT_SETTINGS.enableAI) return;
        
        // التحقق من المسافة من اللاعب
        const isPlayerNear = this.distanceToPlayer < RABBIT_SETTINGS.detectionRadius;
        const isPlayerTooClose = this.distanceToPlayer < RABBIT_SETTINGS.escapeRadius;
        const isFarFromOriginal = this.position.distanceTo(this.originalPosition) > RABBIT_SETTINGS.returnRadius;
        
        // منطق تغيير الحالة
        switch (this.state) {
            case 'idle':
                // التحقق إذا اقترب اللاعب
                if (isPlayerTooClose) {
                    this.state = 'escaping';
                    this.escapeDirection = new THREE.Vector3()
                        .subVectors(this.position, playerPosition)
                        .normalize();
                    this.actionTimer = 0;
                    console.log(`🐇 أرنب ${this.id} يجري هارباً من اللاعب!`);
                } 
                // التحقق من انتهاء وقت السكون
                else if (this.idleTimer <= 0) {
                    this.state = 'wandering';
                    this.generateWanderTarget();
                    this.actionTimer = 3.0 + Math.random() * 4.0;
                    console.log(`🐇 أرنب ${this.id} يبدأ بالتجوال`);
                } 
                // تحديث مؤقت السكون
                else {
                    this.idleTimer -= this.updateInterval;
                }
                break;
                
            case 'wandering':
                // التحقق إذا اقترب اللاعب
                if (isPlayerTooClose) {
                    this.state = 'escaping';
                    this.escapeDirection = new THREE.Vector3()
                        .subVectors(this.position, playerPosition)
                        .normalize();
                    this.actionTimer = 0;
                } 
                // التحقق من انتهاء وقت التجوال
                else if (this.actionTimer <= 0 || 
                        this.position.distanceTo(this.targetPosition) < 15) {
                    this.state = 'idle';
                    this.idleTimer = RABBIT_SETTINGS.minIdleTime + 
                                   Math.random() * (RABBIT_SETTINGS.maxIdleTime - RABBIT_SETTINGS.minIdleTime);
                    this.velocity.set(0, 0, 0);
                    console.log(`🐇 أرنب ${this.id} يتوقف للراحة`);
                }
                break;
                
            case 'escaping':
                // التحقق إذا ابتعد اللاعب بما فيه الكفاية
                if (!isPlayerNear && this.distanceToPlayer > RABBIT_SETTINGS.escapeRadius * 1.8) {
                    this.state = 'returning';
                    this.targetPosition.copy(this.originalPosition);
                    this.actionTimer = 8.0; // وقت أطول للعودة
                    console.log(`🐇 أرنب ${this.id} يعود إلى منطقته`);
                }
                // إذا ابتعد كثيراً أثناء الهرب
                else if (isFarFromOriginal) {
                    this.state = 'returning';
                    this.targetPosition.copy(this.originalPosition);
                    this.actionTimer = 8.0;
                }
                break;
                
            case 'returning':
                // التحقق إذا وصل للنقطة الأصلية
                if (this.position.distanceTo(this.originalPosition) < 80 || 
                    this.actionTimer <= 0) {
                    this.state = 'idle';
                    this.idleTimer = RABBIT_SETTINGS.minIdleTime + 
                                   Math.random() * (RABBIT_SETTINGS.maxIdleTime - RABBIT_SETTINGS.minIdleTime);
                    this.velocity.set(0, 0, 0);
                    console.log(`🐇 أرنب ${this.id} عاد واستقر`);
                }
                // التحقق إذا اقترب اللاعب مجدداً
                else if (isPlayerTooClose) {
                    this.state = 'escaping';
                    this.escapeDirection = new THREE.Vector3()
                        .subVectors(this.position, playerPosition)
                        .normalize();
                    this.actionTimer = 0;
                }
                break;
        }
        
        // تحديث مؤقتات الحالة
        if (this.actionTimer > 0) {
            this.actionTimer -= this.updateInterval;
        }
        
        // توليد هدف الحركة بناءً على الحالة
        this.generateMovementTarget();
    }
    
    // --- توليد هدف التجوال ---
    generateWanderTarget() {
        if (this.state !== 'wandering') return;
        
        // استخدام الضوضاء للحصول على حركة أكثر طبيعية
        let noiseX = 0, noiseZ = 0;
        if (RABBIT_SETTINGS.useSimplexNoise) {
            const time = performance.now() * 0.001;
            noiseX = getSimplexDensity(this.position.x, this.position.z, 100) * 80;
            noiseZ = getSimplexDensity(this.position.z, this.position.x, 100) * 80;
        }
        
        // تحديث زاوية التجوال
        this.wanderAngle += (Math.random() - 0.5) * this.wanderJitter;
        
        // حساب موضع الهدف مع الضوضاء
        const targetX = this.originalPosition.x + 
                       Math.cos(this.wanderAngle) * this.wanderDistance + 
                       noiseX;
        const targetZ = this.originalPosition.z + 
                       Math.sin(this.wanderAngle) * this.wanderDistance + 
                       noiseZ;
        
        // التأكد من أن الهدف في الغابة
        if (RABBIT_SETTINGS.forestOnly && getBiomeType(targetX, targetZ) !== 'forest') {
            // اتجاه نحو الغابة
            this.wanderAngle += Math.PI * 0.5;
            return;
        }
        
        this.targetPosition.set(targetX, 0, targetZ);
        this.wanderTarget = this.targetPosition.clone();
    }
    
    // --- توليد هدف الحركة ---
    generateMovementTarget() {
        switch (this.state) {
            case 'idle':
                // حركة صغيرة عشوائية أثناء السكون
                if (Math.random() < 0.05 && this.idleTimer > 1.0) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = RABBIT_SETTINGS.idleMoveDistance * Math.random();
                    this.targetPosition.set(
                        this.position.x + Math.cos(angle) * distance,
                        0,
                        this.position.z + Math.sin(angle) * distance
                    );
                }
                break;
                
            case 'wandering':
                // تم توليد الهدف في generateWanderTarget
                break;
                
            case 'escaping':
                if (this.escapeDirection) {
                    // الهروب بعيداً عن اللاعب
                    const escapeDistance = RABBIT_SETTINGS.escapeRadius * 2.0;
                    this.targetPosition.set(
                        this.position.x + this.escapeDirection.x * escapeDistance,
                        0,
                        this.position.z + this.escapeDirection.z * escapeDistance
                    );
                    
                    // إضافة عنصر عشوائي في الهروب
                    this.escapeDirection.x += (Math.random() - 0.5) * 0.4;
                    this.escapeDirection.z += (Math.random() - 0.5) * 0.4;
                    this.escapeDirection.normalize();
                }
                break;
                
            case 'returning':
                // الهدف هو النقطة الأصلية
                this.targetPosition.copy(this.originalPosition);
                break;
        }
        
        // التأكد من أن الهدف في الغابة (إذا كان مطلوباً)
        if (RABBIT_SETTINGS.forestOnly && 
            getBiomeType(this.targetPosition.x, this.targetPosition.z) !== 'forest') {
            // توجيه نحو أقرب نقطة في الغابة
            const angleToCenter = Math.atan2(-this.targetPosition.z, -this.targetPosition.x);
            this.targetPosition.set(
                Math.cos(angleToCenter) * 5000,
                0,
                Math.sin(angleToCenter) * 5000
            );
        }
    }
    
    // --- تطبيق الحركة ---
    applyMovement(deltaTime) {
        if (!this.mesh) return;
        
        // حساب اتجاه الحركة
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.position)
            .normalize();
        
        // تحديد السرعة بناءً على الحالة
        let speed = 0;
        switch (this.state) {
            case 'idle':
                speed = 0; // لا حركة أثناء الوقوف
                break;
            case 'wandering':
                speed = RABBIT_SETTINGS.movementSpeed; // المشي
                break;
            case 'escaping':
                speed = RABBIT_SETTINGS.escapeSpeed; // الجري
                break;
            case 'returning':
                speed = RABBIT_SETTINGS.movementSpeed * 0.9; // مشي سريع للعودة
                break;
        }
        
        // إضافة تأثير الضوضاء إذا كان مفعلاً
        if (RABBIT_SETTINGS.useSimplexNoise && this.state !== 'escaping' && this.state !== 'idle') {
            const noiseScale = RABBIT_SETTINGS.simplexScale;
            const noiseX = getSimplexDensity(this.position.x * noiseScale, this.position.z * noiseScale, 1) * 0.8;
            const noiseZ = getSimplexDensity(this.position.z * noiseScale, this.position.x * noiseScale, 1) * 0.8;
            
            direction.x += noiseX;
            direction.z += noiseZ;
            direction.normalize();
        }
        
        // تجنب العقبات القريبة
        if (this.state !== 'idle') {
            this.avoidObstacles(direction);
        }
        
        // تطبيق السرعة
        this.velocity.copy(direction).multiplyScalar(speed * deltaTime);
        
        // تحديث الموضع
        this.position.add(this.velocity);
        
        // تحديث ارتفاع الأرض مع ضبط الارتفاع الصحيح
        const terrainHeight = getTerrainHeight(this.position.x, this.position.z);
        this.position.y = terrainHeight + (this.modelHeight * 0.5);
        
        // تحديث الدوران إذا كان الأرنب يتحرك
        if (this.velocity.lengthSq() > 0.1) {
            const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
            
            if (RABBIT_SETTINGS.smoothRotation) {
                // دوران سلس
                const rotationDiff = targetRotation - this.rotation.y;
                this.rotation.y += rotationDiff * RABBIT_SETTINGS.rotationSpeed;
            } else {
                // دوران فوري
                this.rotation.y = targetRotation;
            }
            
            this.animationState.isMoving = true;
            this.animationState.moveSpeed = this.velocity.length();
        } else {
            this.animationState.isMoving = false;
            this.animationState.moveSpeed = 0;
        }
    }
    
    // --- تجنب العقبات ---
    avoidObstacles(direction) {
        if (!globals.obstacleData || globals.obstacleData.length === 0) return;
        
        const avoidanceRadius = 200; // زيادة نصف قطر التجنب للحجم الكبير
        const avoidanceForce = RABBIT_SETTINGS.avoidanceForce;
        const avoidanceVector = new THREE.Vector3(0, 0, 0);
        
        for (const obstacle of globals.obstacleData) {
            if (!obstacle || !obstacle.mesh || !obstacle.mesh.position) continue;
            
            // تخطي الأرانب الأخرى
            if (obstacle.type === 'rabbit') continue;
            
            const distance = this.position.distanceTo(obstacle.mesh.position);
            
            if (distance < avoidanceRadius && distance > 0) {
                const pushDirection = new THREE.Vector3()
                    .subVectors(this.position, obstacle.mesh.position)
                    .normalize()
                    .multiplyScalar(avoidanceForce * (1 - distance / avoidanceRadius));
                
                avoidanceVector.add(pushDirection);
            }
        }
        
        // تطبيق قوة التجنب
        if (avoidanceVector.lengthSq() > 0) {
            direction.add(avoidanceVector.normalize().multiplyScalar(avoidanceForce));
            direction.normalize();
        }
    }
    
    // --- تحديث الرسوم المتحركة بنفس تأثيرات الملف المرفق ---
    updateAnimation(deltaTime) {
        // تحديث مراحل الحركة
        this.animationState.hopPhase += deltaTime * (this.animationState.moveSpeed * 0.15);
        
        // تطبيق تأثيرات مختلفة حسب الحالة
        switch (this.state) {
            case 'idle':
                // تأثير الوقوف: تنفس خفيف وحركات بسيطة
                this.animationState.idleBob = Math.sin(this.animationTime * 2) * 0.02;
                this.animationState.headMovement = Math.sin(this.animationTime * 1.5) * 0.05;
                this.animationState.earMovement = Math.sin(this.animationTime) * 0.05 - 0.1;
                this.animationState.hopHeight = 0;
                this.animationState.bodyBob = 0;
                break;
                
            case 'wandering':
                // تأثير المشي: حركة متوسطة
                const walkSpeed = 6;
                this.animationState.walkBob = Math.abs(Math.sin(this.animationTime * walkSpeed)) * 0.1;
                this.animationState.hopHeight = Math.sin(this.animationState.hopPhase * Math.PI * 2) * 
                                               RABBIT_SETTINGS.walkBobMultiplier;
                this.animationState.bodyBob = Math.sin(this.animationState.hopPhase * Math.PI * 4) * 0.05;
                this.animationState.earMovement = -0.2 + Math.sin(this.animationTime * walkSpeed * 2) * 0.1;
                this.animationState.legSwing = this.animationTime * walkSpeed;
                break;
                
            case 'escaping':
                // تأثير الجري: حركة سريعة وقفز
                const runSpeed = 12;
                this.animationState.runBob = Math.abs(Math.sin(this.animationTime * runSpeed * 0.5)) * 0.6;
                this.animationState.hopHeight = Math.sin(this.animationState.hopPhase * Math.PI * 4) * 
                                               RABBIT_SETTINGS.runBobMultiplier;
                this.animationState.bodyBob = -Math.sin(this.animationTime * runSpeed * 0.5) * 0.1;
                this.animationState.earMovement = -0.3 + Math.sin(this.animationTime * runSpeed) * 0.15;
                this.animationState.legSwing = this.animationTime * runSpeed * 0.5;
                break;
                
            case 'returning':
                // تأثير العودة: مشي سريع
                const returnSpeed = 8;
                this.animationState.walkBob = Math.abs(Math.sin(this.animationTime * returnSpeed)) * 0.15;
                this.animationState.hopHeight = Math.sin(this.animationState.hopPhase * Math.PI * 2) * 
                                               (RABBIT_SETTINGS.walkBobMultiplier * 1.2);
                this.animationState.bodyBob = Math.sin(this.animationState.hopPhase * Math.PI * 4) * 0.08;
                this.animationState.earMovement = -0.25 + Math.sin(this.animationTime * returnSpeed * 1.5) * 0.12;
                this.animationState.legSwing = this.animationTime * returnSpeed;
                break;
        }
        
        // حركة الأذنين والأنف العشوائية
        if (Math.random() < 0.08) {
            this.animationState.earTwitch = Math.random() * 0.2;
            this.animationState.noseTwitch = Math.random() * 0.1;
        }
        
        // تهدئة الحركات
        this.animationState.earTwitch *= 0.85;
        this.animationState.noseTwitch *= 0.9;
    }
    
    // --- تحديث النموذج المرئي بنفس تأثيرات الملف المرفق ---
    updateVisualModel() {
        if (!this.mesh) return;
        
        // تحديث الموضع مع ارتفاع القفز
        this.mesh.position.copy(this.position);
        this.mesh.position.y += this.animationState.hopHeight * this.scale * 0.1;
        
        // تحديث الدوران
        this.mesh.rotation.y = this.rotation.y;
        
        // تطبيق اهتزاز الجسم أثناء الحركة
        this.mesh.position.y += (this.animationState.idleBob + 
                               this.animationState.walkBob + 
                               this.animationState.runBob) * this.scale;
        
        // تطبيق دوران الجسم أثناء الجري
        if (this.state === 'escaping') {
            this.mesh.rotation.x = this.animationState.bodyBob;
        } else {
            this.mesh.rotation.x = 0;
        }
        
        // تطبيق حركة الرأس
        if (this.headGroup) {
            this.headGroup.rotation.x = this.animationState.headMovement;
        }
        
        // تطبيق حركة الأذنين
        if (this.earRightPivot && this.earLeftPivot) {
            const earTwitch = this.animationState.earTwitch;
            const earMove = this.animationState.earMovement;
            
            this.earRightPivot.rotation.x = earMove + earTwitch;
            this.earLeftPivot.rotation.x = earMove + earTwitch;
            
            // حركة إضافية للأذنين أثناء الحركة
            if (this.animationState.isMoving) {
                const earSwing = Math.sin(this.animationState.legSwing * 2) * 0.15;
                this.earRightPivot.rotation.z = -0.25 + earSwing;
                this.earLeftPivot.rotation.z = 0.25 - earSwing;
            }
        }
        
        // تطبيق حركة الأنف
        if (this.noseMesh) {
            this.noseMesh.position.z = 0.65 + this.animationState.noseTwitch;
            this.noseMesh.position.y = Math.sin(this.animationTime * 8) * 0.02;
        }
        
        // تطبيق حركة الأرجل أثناء المشي والجري
        if (this.animationState.isMoving && this.state !== 'idle') {
            // حساب حركة الأرجل بناءً على الحالة
            let legCycle, frontLegHeight, backLegHeight, frontLegZ, backLegZ;
            
            if (this.state === 'wandering' || this.state === 'returning') {
                legCycle = this.animationState.legSwing;
                frontLegHeight = 0.3 + Math.max(0, Math.sin(legCycle) * 0.2);
                backLegHeight = 0.45 + Math.max(0, Math.sin(legCycle + Math.PI) * 0.2);
                frontLegZ = 0.9 + Math.cos(legCycle) * 0.4;
                backLegZ = -0.6 + Math.cos(legCycle + Math.PI) * 0.4;
            } else if (this.state === 'escaping') {
                legCycle = this.animationState.legSwing;
                frontLegHeight = 0.3 + Math.max(0, Math.sin(legCycle)) * 0.3;
                backLegHeight = 0.45 + Math.max(0, -Math.sin(legCycle)) * 0.3;
                frontLegZ = 0.9 + Math.cos(legCycle) * 0.5;
                backLegZ = -0.6 + Math.cos(legCycle) * 0.6;
            }
            
            // تطبيق حركات الأرجل الأمامية
            if (this.legFrontRight && this.legFrontLeft) {
                this.legFrontRight.position.y = frontLegHeight;
                this.legFrontLeft.position.y = frontLegHeight;
                this.legFrontRight.position.z = frontLegZ;
                this.legFrontLeft.position.z = frontLegZ;
            }
            
            // تطبيق حركات الأرجل الخلفية
            if (this.legBackRight && this.legBackLeft) {
                this.legBackRight.position.y = backLegHeight;
                this.legBackLeft.position.y = backLegHeight;
                this.legBackRight.position.z = backLegZ;
                this.legBackLeft.position.z = backLegZ;
            }
        } else {
            // إعادة الأرجل إلى وضعها الطبيعي أثناء الوقوف
            if (this.legFrontRight && this.legFrontLeft && 
                this.legBackRight && this.legBackLeft) {
                this.legFrontRight.position.set(0.35, 0.3, 0.9);
                this.legFrontLeft.position.set(-0.35, 0.3, 0.9);
                this.legBackRight.position.set(0.55, 0.45, -0.6);
                this.legBackLeft.position.set(-0.55, 0.45, -0.6);
            }
        }
        
        // حركة الذيل الخفيفة
        if (this.tailMesh) {
            this.tailMesh.position.y = 1.0 + Math.sin(this.animationTime * 3) * 0.05;
        }
        
        // تحديث حالة الرؤية
        this.updateVisibility();
    }
    
    // --- تحديث حالة الرؤية ---
    updateVisibility() {
        if (!this.mesh || !globals.camera || !globals.viewFrustum) return;
        
        const now = performance.now();
        
        // التحقق من الرؤية كل 500 مللي ثانية للأداء
        if (now - this.lastVisibleCheck < 500) return;
        this.lastVisibleCheck = now;
        
        // التحقق إذا كان الأرنب في هرم المنظور
        const inFrustum = globals.viewFrustum.containsPoint(this.mesh.position);
        this.inFrustum = inFrustum;
        
        // تحديث حالة الرؤية بناءً على المسافة
        const shouldBeVisible = inFrustum && 
                               this.distanceToPlayer < globals.stableViewDistance;
        
        this.isVisible = shouldBeVisible;
        
        // تطبيق الرؤية على النموذج
        if (this.mesh.visible !== shouldBeVisible) {
            this.mesh.visible = shouldBeVisible;
        }
        
        // تحديث بيانات المستخدم
        if (this.mesh.userData) {
            this.mesh.userData.isVisible = shouldBeVisible;
            this.mesh.userData.inFrustum = inFrustum;
            this.mesh.userData.lastVisibleCheck = now;
        }
    }
    
    // --- إزالة الأرنب ---
    remove() {
        if (this.mesh && globals.scene) {
            globals.scene.remove(this.mesh);
            
            // تحرير الذاكرة
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            
            console.log(`🗑️ تم إزالة أرنب ${this.id}`);
        }
        
        this.mesh = null;
    }
    
    // --- الحصول على معلومات الأرنب ---
    getInfo() {
        return {
            id: this.id,
            position: this.position.clone(),
            originalPosition: this.originalPosition.clone(),
            state: this.state,
            distanceToPlayer: this.distanceToPlayer,
            isVisible: this.isVisible,
            inFrustum: this.inFrustum,
            wanderRadius: this.wanderRadius,
            scale: this.scale,
            modelHeight: this.modelHeight,
            playerScaleRatio: RABBIT_SETTINGS.playerScaleRatio,
            settings: { ...RABBIT_SETTINGS },
            animationState: { ...this.animationState }
        };
    }
}

// --- نظام إدارة الأرانب المعدل ---
class RabbitSystem {
    constructor() {
        this.rabbits = [];
        this.isInitialized = false;
        this.lastUpdate = 0;
        this.updateInterval = 0.1;
        this.rabbitGroup = null;
    }
    
    // --- تهيئة النظام ---
    init() {
        if (this.isInitialized) {
            console.log("⚠️ نظام الأرانب مفعل بالفعل");
            return;
        }
        
        console.log("🐇 تهيئة نظام الأرانب المعدل بنفس شكل الملف المرفق...");
        
        // إنشاء مجموعة للأرانب
        this.rabbitGroup = new THREE.Group();
        this.rabbitGroup.name = "RabbitSystemGroup";
        
        // إضافة المجموعة إلى المشهد
        if (globals.scene) {
            globals.scene.add(this.rabbitGroup);
        } else {
            console.error("❌ المشهد غير مهيء، لا يمكن إضافة الأرانب");
            return;
        }
        
        // إنشاء الأرانب في الغابة
        this.createRabbitsInForest();
        
        this.isInitialized = true;
        console.log(`✅ تم تهيئة نظام الأرانب المعدل مع ${this.rabbits.length} أرنب`);
        console.log(`📏 حجم الأرانب: ${(RABBIT_SETTINGS.scale * RABBIT_SETTINGS.playerScaleRatio).toFixed(1)} وحدة (${RABBIT_SETTINGS.playerScaleRatio * 100}% من حجم اللاعب)`);
    }
    
    // --- إنشاء الأرانب في الغابة ---
    createRabbitsInForest() {
        console.log(`🌲 إنشاء ${RABBIT_SETTINGS.totalRabbits} أرنب في الغابة...`);
        
        for (let i = 0; i < RABBIT_SETTINGS.totalRabbits; i++) {
            let positionFound = false;
            let attempts = 0;
            let x, z;
            
            // البحث عن موقع مناسب في الغابة
            while (!positionFound && attempts < 100) {
                // توليد مواقع في المناطق البعيدة من الغابة
                const angle = Math.random() * Math.PI * 2;
                const distance = 8000 + Math.random() * 12000;
                
                x = Math.cos(angle) * distance;
                z = Math.sin(angle) * distance;
                
                // التحقق من أن الموقع في الغابة
                if (getBiomeType(x, z) === 'forest') {
                    // التحقق من المسافة من الأرانب الأخرى
                    let tooClose = false;
                    
                    for (const rabbit of this.rabbits) {
                        const dx = rabbit.position.x - x;
                        const dz = rabbit.position.z - z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distance < 1500) { // مسافة أكبر بين الأرانب للحجم الكبير
                            tooClose = true;
                            break;
                        }
                    }
                    
                    if (!tooClose) {
                        positionFound = true;
                    }
                }
                
                attempts++;
            }
            
            if (positionFound) {
                // إنشاء أرنب جديد
                const rabbit = new Rabbit(i + 1, x, z);
                
                // إضافة النموذج إلى مجموعة الأرانب
                if (this.rabbitGroup && rabbit.mesh) {
                    this.rabbitGroup.add(rabbit.mesh);
                    
                    // إضافة بيانات العقبة
                    const obstacle = {
                        mesh: rabbit.mesh,
                        x: x,
                        z: z,
                        radius: rabbit.mesh.userData.boundingSphereRadius || 60,
                        type: "rabbit",
                        health: 1,
                        originalScale: rabbit.scale,
                        isInFrustum: false,
                        isFading: false,
                        rarity: "rare",
                        value: "alive",
                        userData: rabbit.mesh.userData,
                        boundingRadius: rabbit.mesh.userData.boundingSphereRadius,
                        isRabbit: true
                    };
                    
                    if (!globals.obstacleData) globals.obstacleData = [];
                    globals.obstacleData.push(obstacle);
                    
                    // تخزين الأرنب
                    this.rabbits.push(rabbit);
                    
                    console.log(`📍 تم وضع أرنب ${i + 1} في: (${x.toFixed(1)}, ${z.toFixed(1)})`);
                }
            } else {
                console.warn(`⚠️ فشل في إيجاد موقع لأرنب ${i + 1}`);
            }
        }
    }
    
    // --- تحديث جميع الأرانب ---
    update(deltaTime, playerPosition) {
        if (!this.isInitialized || this.rabbits.length === 0) return;
        
        const currentTime = performance.now() * 0.001;
        
        // تحديث كل أرنب
        this.rabbits.forEach(rabbit => {
            rabbit.update(deltaTime, playerPosition, currentTime);
        });
        
        // تحديث إحصائيات النظام كل 10 ثواني
        if (currentTime - this.lastUpdate > 10.0) {
            this.lastUpdate = currentTime;
            this.logStats();
        }
    }
    
    // --- تسجيل إحصائيات النظام ---
    logStats() {
        let idleCount = 0, wanderCount = 0, escapeCount = 0, returnCount = 0;
        let visibleCount = 0;
        
        this.rabbits.forEach(rabbit => {
            switch (rabbit.state) {
                case 'idle': idleCount++; break;
                case 'wandering': wanderCount++; break;
                case 'escaping': escapeCount++; break;
                case 'returning': returnCount++; break;
            }
            
            if (rabbit.isVisible) visibleCount++;
        });
        
        console.log(`📊 إحصائيات الأرانب: ${visibleCount}/${this.rabbits.length} مرئي | ` +
                   `🛌 ${idleCount} (وقف) | 🚶 ${wanderCount} (مشي) | 🏃 ${escapeCount} (جري) | ↩️ ${returnCount} (عودة)`);
    }
    
    // --- الحصول على معلومات النظام ---
    getInfo() {
        const rabbitInfos = this.rabbits.map(r => r.getInfo());
        
        // تحليل حالات الأرانب
        let idleCount = 0, wanderCount = 0, escapeCount = 0, returnCount = 0;
        rabbitInfos.forEach(info => {
            switch (info.state) {
                case 'idle': idleCount++; break;
                case 'wandering': wanderCount++; break;
                case 'escaping': escapeCount++; break;
                case 'returning': returnCount++; break;
            }
        });
        
        return {
            totalRabbits: this.rabbits.length,
            initialized: this.isInitialized,
            rabbits: rabbitInfos,
            stats: {
                idleCount,
                wanderCount,
                escapeCount,
                returnCount,
                visibleCount: rabbitInfos.filter(r => r.isVisible).length
            },
            settings: { ...RABBIT_SETTINGS },
            scaleInfo: {
                rabbitScale: RABBIT_SETTINGS.scale * RABBIT_SETTINGS.playerScaleRatio,
                playerScaleRatio: RABBIT_SETTINGS.playerScaleRatio,
                percentage: (RABBIT_SETTINGS.playerScaleRatio * 100) + '% من حجم اللاعب',
                description: 'الأرانب كبيرة وواضحة كما في الملف المرفق'
            }
        };
    }
    
    // --- إعادة تعيين النظام ---
    reset() {
        console.log("🔄 إعادة تعيين نظام الأرانب...");
        
        // إزالة جميع الأرانب
        this.rabbits.forEach(rabbit => {
            rabbit.remove();
        });
        
        this.rabbits = [];
        
        // إزالة المجموعة من المشهد
        if (this.rabbitGroup && globals.scene) {
            globals.scene.remove(this.rabbitGroup);
        }
        
        this.rabbitGroup = null;
        this.isInitialized = false;
        this.lastUpdate = 0;
        
        console.log("✅ تمت إعادة تعيين نظام الأرانب");
    }
    
    // --- ضبط إعدادات الأرانب ---
    configureSettings(newSettings) {
        Object.assign(RABBIT_SETTINGS, newSettings);
        console.log("🔄 تم تحديث إعدادات الأرانب:", RABBIT_SETTINGS);
        return { ...RABBIT_SETTINGS };
    }
    
    // --- تغيير حجم جميع الأرانب ---
    changeScale(newScaleRatio) {
        if (newScaleRatio < 0.3 || newScaleRatio > 1.5) {
            console.warn("⚠️ نسبة الحجم يجب أن تكون بين 0.3 و 1.5 للحجم المنطقي");
            return false;
        }
        
        RABBIT_SETTINGS.playerScaleRatio = newScaleRatio;
        
        // إعادة إنشاء الأرانب بحجم جديد
        this.reset();
        this.init();
        
        console.log(`✅ تم تغيير حجم الأرانب إلى ${newScaleRatio * 100}% من حجم اللاعب`);
        return true;
    }
    
    // --- تغيير سرعة الحركة ---
    changeSpeed(walkSpeed, runSpeed) {
        if (walkSpeed > 0) RABBIT_SETTINGS.movementSpeed = walkSpeed;
        if (runSpeed > 0) RABBIT_SETTINGS.escapeSpeed = runSpeed;
        
        console.log(`✅ تم تغيير سرعة الأرانب: مشي=${walkSpeed}, جري=${runSpeed}`);
        return { movementSpeed: RABBIT_SETTINGS.movementSpeed, escapeSpeed: RABBIT_SETTINGS.escapeSpeed };
    }
}

// --- إنشاء وتصدير نسخة وحيدة من النظام ---
const rabbitSystem = new RabbitSystem();

// --- تصدير الدوال العامة ---
export function initRabbitSystem() {
    return rabbitSystem.init();
}

export function updateRabbitSystem(deltaTime, playerPosition) {
    return rabbitSystem.update(deltaTime, playerPosition);
}

export function getRabbitSystemInfo() {
    return rabbitSystem.getInfo();
}

export function resetRabbitSystem() {
    return rabbitSystem.reset();
}

export function configureRabbitSettings(newSettings) {
    return rabbitSystem.configureSettings(newSettings);
}

export function changeRabbitScale(newScaleRatio) {
    return rabbitSystem.changeScale(newScaleRatio);
}

export function changeRabbitSpeed(walkSpeed, runSpeed) {
    return rabbitSystem.changeSpeed(walkSpeed, runSpeed);
}

export function getRabbitSettings() {
    return { ...RABBIT_SETTINGS };
}

// --- تصدير النظام كاملاً (للاستخدام المتقدم) ---
export default rabbitSystem;