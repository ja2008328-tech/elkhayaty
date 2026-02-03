import * as THREE from "three";
import { globals } from "./globals.js";
import { getTerrainHeight } from "./environmentManager.js";

// دالة لحساب الصندوق المحيط مع هامش
function calculateBoundingBoxWithMargin(mesh, marginFactor = 0.8) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // تطبيق الهامش
  size.multiplyScalar(marginFactor);

  return {
    minX: center.x - size.x * 0.5,
    maxX: center.x + size.x * 0.5,
    minY: center.y - size.y * 0.5,
    maxY: center.y + size.y * 0.5,
    minZ: center.z - size.z * 0.5,
    maxZ: center.z + size.z * 0.5,
    size: size,
    center: center,
    minY: box.min.y,
  };
}

// إنشاء شكل مركب للأشجار
function createTreeCompoundShape(mesh, objectType, scale) {
  if (!globals.ammo) return null;
  const AmmoLib = globals.ammo;

  const compoundShape = new AmmoLib.btCompoundShape();

  // حساب المربع المحيط للجذع
  const trunkBox = new THREE.Box3();
  mesh.traverse((child) => {
    if (child.isMesh && child.name && child.name.includes("trunk")) {
      const childBox = new THREE.Box3().setFromObject(child);
      trunkBox.union(childBox);
    }
  });

  if (!trunkBox.isEmpty()) {
    const trunkSize = trunkBox.getSize(new THREE.Vector3());
    const trunkCenter = trunkBox.getCenter(new THREE.Vector3());

    const halfExtents = new AmmoLib.btVector3(
      trunkSize.x * 0.5 * scale,
      trunkSize.y * 0.5 * scale,
      trunkSize.z * 0.5 * scale,
    );

    const trunkShape = new AmmoLib.btBoxShape(halfExtents);

    const transform = new AmmoLib.btTransform();
    transform.setIdentity();
    transform.setOrigin(
      new AmmoLib.btVector3(
        trunkCenter.x * scale,
        trunkCenter.y * scale,
        trunkCenter.z * scale,
      ),
    );

    compoundShape.addChildShape(transform, trunkShape);
  }

  // للأشجار الكبيرة، إضافة شكل للأوراق
  if (objectType === "oak" || objectType === "apple_tree") {
    const leavesBox = new THREE.Box3();
    mesh.traverse((child) => {
      if (child.isMesh && child.name && child.name.includes("leaves")) {
        const childBox = new THREE.Box3().setFromObject(child);
        leavesBox.union(childBox);
      }
    });

    if (!leavesBox.isEmpty()) {
      const leavesSize = leavesBox.getSize(new THREE.Vector3());
      const leavesCenter = leavesBox.getCenter(new THREE.Vector3());

      const halfExtents = new AmmoLib.btVector3(
        leavesSize.x * 0.4 * scale,
        leavesSize.y * 0.4 * scale,
        leavesSize.z * 0.4 * scale,
      );

      const leavesShape = new AmmoLib.btBoxShape(halfExtents);

      const transform = new AmmoLib.btTransform();
      transform.setIdentity();
      transform.setOrigin(
        new AmmoLib.btVector3(
          leavesCenter.x * scale,
          leavesCenter.y * scale,
          leavesCenter.z * scale,
        ),
      );

      compoundShape.addChildShape(transform, leavesShape);
    }
  }

  return compoundShape;
}

export async function initPhysics() {
  if (typeof Ammo === "undefined") {
    console.error("❌ مكتبة Ammo.js غير موجودة!");
    return;
  }

  try {
    const AmmoLib = await Ammo();
    globals.ammo = AmmoLib;

    const colConfig = new AmmoLib.btDefaultCollisionConfiguration();
    const disp = new AmmoLib.btCollisionDispatcher(colConfig);
    const broad = new AmmoLib.btDbvtBroadphase();
    const solv = new AmmoLib.btSequentialImpulseConstraintSolver();

    globals.physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
      disp,
      broad,
      solv,
      colConfig,
    );
    globals.physicsWorld.setGravity(new AmmoLib.btVector3(0, -9.8, 0));

    globals.collisionObjects = [];
    globals.objectPhysicsBodies = new Map();
    globals.CCDObjects = new Map();
    globals.inactivePhysicsBodies = new Map();

    globals.physicsInitialized = true;
    console.log("✅ الفيزياء اكتملت بنجاح!");

    // إنشاء فيزياء الأرض
    createFloorPhysics();
  } catch (error) {
    console.error("❌ خطأ في تهيئة الفيزياء:", error);
  }
}

export function createPlayerPhysics(mesh) {
  if (!globals.ammo || !globals.physicsWorld) {
    console.warn("لم يتم تهيئة الفيزياء بعد");
    return null;
  }

  const AmmoLib = globals.ammo;
  const transform = new AmmoLib.btTransform();
  transform.setIdentity();

  const terrainHeight = getTerrainHeight(mesh.position.x, mesh.position.z);
  transform.setOrigin(
    new AmmoLib.btVector3(mesh.position.x, terrainHeight + 85, mesh.position.z),
  );

  const shape = new AmmoLib.btCapsuleShape(8, 40);
  const localInertia = new AmmoLib.btVector3(0, 0, 0);
  shape.calculateLocalInertia(1, localInertia);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    1,
    new AmmoLib.btDefaultMotionState(transform),
    shape,
    localInertia,
  );
  const body = new AmmoLib.btRigidBody(rbInfo);

  body.setAngularFactor(new AmmoLib.btVector3(0, 0, 0));
  body.setFriction(0.7);
  body.setDamping(0.1, 0.1);
  body.setRestitution(0.0);
  body.setActivationState(4);

  body.setCcdMotionThreshold(0.05);
  body.setCcdSweptSphereRadius(0.1);

  globals.physicsWorld.addRigidBody(body, 1, 2 | 4);
  globals.playerBody = body;

  if (mesh.userData) {
    mesh.userData.physicsBody = body;
  }

  globals.CCDObjects.set(body, mesh);

  console.log("✅ فيزياء اللاعب اكتملت بنجاح!");
  return body;
}

export function createPrecisePhysics(
  mesh,
  objectType,
  collisionRadius,
  scale = 1,
) {
  if (!globals.ammo || !globals.physicsWorld) return null;
  const AmmoLib = globals.ammo;

  let shape;
  const effectiveRadius = collisionRadius * scale;

  const bbox = calculateBoundingBoxWithMargin(mesh, 0.85);
  const halfExtents = new AmmoLib.btVector3(
    bbox.size.x * 0.5,
    bbox.size.y * 0.5,
    bbox.size.z * 0.5,
  );

  switch (objectType) {
    case "oak":
    case "apple_tree":
    case "pomegranate_tree":
      shape = createTreeCompoundShape(mesh, objectType, scale);
      break;

    case "palm":
    case "straw_tree":
    case "cactus":
      shape = new AmmoLib.btCylinderShape(
        new AmmoLib.btVector3(
          halfExtents.x(),
          halfExtents.y(),
          halfExtents.z(),
        ),
      );
      break;

    case "stone":
    case "flint":
    case "limestone":
    case "desert_stone":
      shape = new AmmoLib.btBoxShape(halfExtents);
      break;

    case "copper_ore":
    case "iron_ore":
    case "shard_deposit":
      shape = new AmmoLib.btBoxShape(
        new AmmoLib.btVector3(
          halfExtents.x(),
          halfExtents.y() * 0.7,
          halfExtents.z(),
        ),
      );
      break;

    case "stick_pile":
      shape = new AmmoLib.btBoxShape(
        new AmmoLib.btVector3(
          halfExtents.x(),
          halfExtents.y() * 0.4,
          halfExtents.z(),
        ),
      );
      break;

    case "tower":
      shape = new AmmoLib.btCylinderShape(
        new AmmoLib.btVector3(
          halfExtents.x(),
          halfExtents.y(),
          halfExtents.z(),
        ),
      );
      break;

    case "crystal":
      shape = new AmmoLib.btBoxShape(halfExtents);
      break;

    case "red_plant":
    case "yellow_plant":
    case "carrot_plant":
    case "butter_plant":
    case "dried_milk_plant":
    case "red_berry":
    case "yellow_berry":
    case "blue_berry":
    case "lilac_berry":
      shape = new AmmoLib.btCylinderShape(
        new AmmoLib.btVector3(
          halfExtents.x(),
          halfExtents.y() * 0.5,
          halfExtents.z(),
        ),
      );
      break;

    default:
      shape = new AmmoLib.btBoxShape(halfExtents);
  }

  if (!shape) {
    console.warn(`لم يتم إنشاء شكل فيزيائي لنوع: ${objectType}`);
    return null;
  }

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();

  const terrainHeight = getTerrainHeight(mesh.position.x, mesh.position.z);
  let physicsHeight = terrainHeight;

  if (objectType.includes("tree") || objectType.includes("palm")) {
    physicsHeight = terrainHeight + Math.abs(bbox.minY * scale * 0.1);
  } else if (objectType.includes("stone") || objectType.includes("ore")) {
    physicsHeight = terrainHeight + Math.abs(bbox.minY * scale * 0.05);
  } else if (objectType.includes("plant") || objectType.includes("berry")) {
    physicsHeight = terrainHeight + Math.abs(bbox.minY * scale * 0.1);
  } else {
    physicsHeight = terrainHeight + Math.abs(bbox.minY * scale * 0.05);
  }

  if (physicsHeight > terrainHeight + 5) {
    physicsHeight = terrainHeight + 2;
  }

  mesh.position.y = physicsHeight;

  const worldCenter = new THREE.Vector3();
  mesh.getWorldPosition(worldCenter);

  transform.setOrigin(
    new AmmoLib.btVector3(worldCenter.x, physicsHeight, worldCenter.z),
  );

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new AmmoLib.btVector3(0, 0, 0),
  );

  const body = new AmmoLib.btRigidBody(rbInfo);

  body.setFriction(0.8);
  body.setRestitution(0.05);
  body.setDamping(0.0, 0.0);

  body.setAngularFactor(new AmmoLib.btVector3(0, 0, 0));
  body.setLinearFactor(new AmmoLib.btVector3(0, 0, 0));

  let collisionGroup = 2;
  let collisionMask = 1 | 2;

  if (
    objectType.includes("tree") ||
    objectType.includes("stone") ||
    objectType === "tower"
  ) {
    body.setCcdMotionThreshold(0.05);
    body.setCcdSweptSphereRadius(0.3);
    globals.CCDObjects.set(body, mesh);
  }

  globals.physicsWorld.addRigidBody(body, collisionGroup, collisionMask);

  if (!mesh.userData) mesh.userData = {};
  mesh.userData.physicsBody = body;
  mesh.userData.collisionRadius = effectiveRadius;
  mesh.userData.objectType = objectType;
  mesh.userData.physicsHeight = physicsHeight;
  mesh.userData.boundingBox = bbox;
  mesh.userData.isActive = true;
  mesh.userData.wasCulled = false;

  if (!globals.collisionObjects) globals.collisionObjects = [];
  globals.collisionObjects.push(mesh);

  globals.objectPhysicsBodies.set(mesh.uuid || mesh.id, body);

  console.log(
    `✅ إنشاء فيزياء لـ ${objectType}: الارتفاع=${physicsHeight.toFixed(2)}, مقياس=${scale.toFixed(2)}`,
  );

  return body;
}

export function manageDistantPhysics() {
  if (!globals.player || !globals.collisionObjects || !globals.physicsWorld)
    return;

  const playerPos = globals.player.position;
  const activationDistance = 5000;
  const deactivationDistance = 7000;
  const now = Date.now();

  // التحقق فقط كل 500 مللي ثانية للأداء
  if (globals.lastPhysicsCheck && now - globals.lastPhysicsCheck < 500) return;
  globals.lastPhysicsCheck = now;

  let activatedCount = 0;
  let deactivatedCount = 0;

  for (let i = globals.collisionObjects.length - 1; i >= 0; i--) {
    const obj = globals.collisionObjects[i];
    if (!obj || !obj.userData || !obj.userData.physicsBody) continue;

    // تخطي الكائنات المخفية بواسطة هرم المنظور
    if (obj.userData.wasCulled && obj.userData.isVisible === false) continue;

    const distance = playerPos.distanceTo(obj.position);
    const body = obj.userData.physicsBody;

    if (
      distance > deactivationDistance &&
      obj.userData.isActive &&
      !obj.userData.wasCulled
    ) {
      body.setActivationState(4);
      body.forceActivationState(4);
      try {
        globals.physicsWorld.removeRigidBody(body);
      } catch (e) {
        // تجاهل الأخطاء إذا كان الجسم مسبقاً معطلاً
      }
      globals.inactivePhysicsBodies.set(obj.uuid, body);
      obj.userData.isActive = false;
      deactivatedCount++;
    } else if (
      distance <= activationDistance &&
      !obj.userData.isActive &&
      !obj.userData.wasCulled
    ) {
      try {
        globals.physicsWorld.addRigidBody(body, 2, 1 | 2);
        body.activate();
        globals.inactivePhysicsBodies.delete(obj.uuid);
        obj.userData.isActive = true;
        activatedCount++;
      } catch (e) {
        console.warn("خطأ في إعادة تفعيل الفيزياء:", e);
      }
    }
  }

  if (activatedCount > 0 || deactivatedCount > 0) {
    console.log(
      `🔄 إدارة الفيزياء البعيدة: ${activatedCount} مفعل, ${deactivatedCount} معطل`,
    );
  }
}

export function validateAndCorrectCollisions() {
  if (!globals.playerBody || !globals.collisionObjects) return;

  const playerPos = globals.player.position;
  const playerRadius = 8;
  let correctionCount = 0;

  for (let i = 0; i < globals.collisionObjects.length; i++) {
    const obj = globals.collisionObjects[i];
    if (!obj || !obj.position || !obj.userData || !obj.userData.isActive)
      continue;

    // تخطي الكائنات المخفية بواسطة هرم المنظور
    if (obj.userData.isVisible === false) continue;

    const objPos = obj.position;
    const objRadius = obj.userData.collisionRadius || 50;
    const bbox = obj.userData.boundingBox;

    const distance = playerPos.distanceTo(objPos);
    const minDistance = playerRadius + objRadius * 0.8;

    if (distance < minDistance) {
      const pushDirection = new THREE.Vector3()
        .subVectors(playerPos, objPos)
        .normalize();

      const pushDistance = minDistance - distance + 8;

      const correctedPos = new THREE.Vector3()
        .copy(objPos)
        .add(pushDirection.multiplyScalar(pushDistance));

      const AmmoLib = globals.ammo;
      const transform = new AmmoLib.btTransform();
      transform.setIdentity();
      transform.setOrigin(
        new AmmoLib.btVector3(correctedPos.x, playerPos.y, correctedPos.z),
      );

      globals.playerBody.setWorldTransform(transform);
      globals.playerBody.activate();

      globals.player.position.copy(correctedPos);

      globals.playerBody.setCcdMotionThreshold(0.03);
      globals.playerBody.setCcdSweptSphereRadius(0.2);

      correctionCount++;
    }
  }

  if (correctionCount > 0) {
    console.log(`🛠️ تم تصحيح ${correctionCount} اصطدام`);
  }
}

function correctObjectsHeight() {
  if (!globals.collisionObjects || globals.collisionObjects.length === 0)
    return;

  let correctedCount = 0;

  for (let i = 0; i < globals.collisionObjects.length; i++) {
    const obj = globals.collisionObjects[i];
    if (!obj || !obj.position || !obj.userData || !obj.userData.isActive)
      continue;

    // تخطي الكائنات المخفية بواسطة هرم المنظور
    if (obj.userData.isVisible === false) continue;

    const terrainHeight = getTerrainHeight(obj.position.x, obj.position.z);
    const currentHeight = obj.position.y;
    const heightDifference = Math.abs(currentHeight - terrainHeight);

    if (heightDifference > 5) {
      const correctedHeight = terrainHeight + 2;

      obj.position.y = correctedHeight;

      if (obj.userData.physicsBody) {
        const AmmoLib = globals.ammo;
        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
          new AmmoLib.btVector3(
            obj.position.x,
            correctedHeight,
            obj.position.z,
          ),
        );
        obj.userData.physicsBody.setWorldTransform(transform);
        obj.userData.physicsBody.activate();

        correctedCount++;
      }
    }
  }

  if (correctedCount > 0) {
    console.log(`📏 تم تصحيح ارتفاع ${correctedCount} جسم`);
  }
}

function spawnConsistencyEffect(pos, color, count = 3) {
  if (!globals.scene) return;

  for (let i = 0; i < count; i++) {
    const geo = new THREE.RingGeometry(2, 4, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const effect = new THREE.Mesh(geo, mat);

    effect.rotation.x = Math.PI / 2;
    effect.position.set(
      pos.x + (Math.random() - 0.5) * 5,
      pos.y + 1,
      pos.z + (Math.random() - 0.5) * 5,
    );

    effect.userData = {
      scale: 1,
      life: 30,
      maxLife: 30,
    };

    globals.scene.add(effect);

    if (!globals.particles) globals.particles = [];
    globals.particles.push(effect);
  }
}

export function updatePhysicsLoop(deltaTime) {
  if (!globals.physicsWorld || !globals.ammo) return;

  try {
    // إدارة الفيزياء للكائنات البعيدة
    manageDistantPhysics();

    // محاكاة الفيزياء بمعدل ثابت
    globals.physicsWorld.stepSimulation(deltaTime, 10);

    // التحقق وتصحيح الاصطدامات
    validateAndCorrectCollisions();

    // تصحيح ارتفاعات الكائنات
    correctObjectsHeight();

    // تحديث موضع اللاعب من الفيزياء
    updatePlayerFromPhysics();

    // تحديث الكائنات المتحركة
    updateDynamicObjects();

    // تحديث الجسيمات
    updateParticles();
  } catch (error) {
    console.error("❌ خطأ في محاكاة الفيزياء:", error);
  }
}

function updatePlayerFromPhysics() {
  if (!globals.playerBody || !globals.player || !globals.ammo) return;

  const AmmoLib = globals.ammo;
  const trans = new AmmoLib.btTransform();
  const motionState = globals.playerBody.getMotionState();

  if (motionState && motionState.getWorldTransform) {
    motionState.getWorldTransform(trans);
    const origin = trans.getOrigin();

    const terrainHeight = getTerrainHeight(origin.x(), origin.z());
    const minY = terrainHeight + 40;
    const currentY = origin.y();

    if (currentY < minY) {
      const correctedTransform = new AmmoLib.btTransform();
      correctedTransform.setIdentity();
      correctedTransform.setOrigin(
        new AmmoLib.btVector3(origin.x(), minY + 10, origin.z()),
      );
      globals.playerBody.setWorldTransform(correctedTransform);
      globals.player.position.set(origin.x(), minY + 10, origin.z());
    } else {
      globals.player.position.set(origin.x(), origin.y(), origin.z());
    }

    // تحديث الكاميرا بسلاسة
    const cameraOffset = new THREE.Vector3(0, 600, 800);
    const targetPos = globals.player.position.clone().add(cameraOffset);
    globals.camera.position.lerp(targetPos, 0.1);
    globals.camera.lookAt(globals.player.position);
  }
}

function updateDynamicObjects() {
  // تحديث النيران المخيمية
  if (globals.campfires && globals.campfires.length) {
    const AmmoLib = globals.ammo;
    for (let i = 0; i < globals.campfires.length; i++) {
      const cf = globals.campfires[i];
      if (!cf || !cf.group) continue;
      const body = cf.group.userData && cf.group.userData.physicsBody;
      if (!body) continue;

      const ms = body.getMotionState && body.getMotionState();
      if (!ms) continue;

      const trans = new AmmoLib.btTransform();
      ms.getWorldTransform(trans);
      const origin = trans.getOrigin();
      const rotation = trans.getRotation ? trans.getRotation() : null;

      cf.group.position.set(origin.x(), origin.y(), origin.z());
      if (rotation) {
        cf.group.quaternion.set(
          rotation.x(),
          rotation.y(),
          rotation.z(),
          rotation.w(),
        );
      }
      cf.position = cf.group.position.clone();
    }
  }

  // تحديث الكائنات الباهتة
  if (globals.fadingObjects) {
    for (let i = globals.fadingObjects.length - 1; i >= 0; i--) {
      const item = globals.fadingObjects[i];
      item.progress += 0.05;

      if (item.progress >= 1.0) {
        removeObjectPhysics(item.obs.mesh);

        if (globals.forestGroup && item.obs.mesh) {
          globals.forestGroup.remove(item.obs.mesh);
        }

        // إزالة من obstacleData
        const obsIndex = globals.obstacleData.findIndex(
          (o) => o.mesh === item.obs.mesh,
        );
        if (obsIndex > -1) {
          globals.obstacleData.splice(obsIndex, 1);
        }

        globals.fadingObjects.splice(i, 1);
      } else {
        const s = (item.obs.originalScale || 1) * (1.0 - item.progress);
        item.obs.mesh.scale.setScalar(s);
        item.obs.mesh.position.y -= 1.5;
      }
    }
  }
}

function updateParticles() {
  if (!globals.particles) return;

  for (let i = globals.particles.length - 1; i >= 0; i--) {
    const p = globals.particles[i];
    if (p.userData && p.userData.life !== undefined) {
      p.userData.life--;

      if (p.userData.life <= 0) {
        globals.scene.remove(p);
        globals.particles.splice(i, 1);
      } else {
        const lifeRatio = p.userData.life / p.userData.maxLife;
        p.material.opacity = lifeRatio * 0.5;

        if (p.userData.scale) {
          p.scale.setScalar(p.userData.scale * (1 + (1 - lifeRatio) * 2));
        }
      }
    } else {
      // جزيئات الحصاد القديمة
      if (p.mesh && p.mesh.position) {
        p.mesh.position.add(p.vel);
        p.vel.y -= 0.5;
        p.life -= 0.02;

        p.mesh.rotation.x += 0.1;
        p.mesh.rotation.y += 0.1;

        if (p.life <= 0) {
          globals.scene.remove(p.mesh);
          globals.particles.splice(i, 1);
        } else {
          p.mesh.material.opacity = p.life;
          p.mesh.scale.setScalar(p.life);
        }
      }
    }
  }
}

export function updateCCDObjects() {
  if (!globals.CCDObjects || !globals.ammo) return;

  globals.CCDObjects.forEach((mesh, body) => {
    if (body && mesh && mesh.position) {
      // تخطي الكائنات المخفية بواسطة هرم المنظور
      if (mesh.userData && mesh.userData.isVisible === false) return;

      const AmmoLib = globals.ammo;
      const transform = new AmmoLib.btTransform();
      transform.setIdentity();
      transform.setOrigin(
        new AmmoLib.btVector3(
          mesh.position.x,
          mesh.position.y,
          mesh.position.z,
        ),
      );
      body.setWorldTransform(transform);
      body.activate();
    }
  });
}

export function harvestObstacle(obs, index) {
  if (!obs || obs.isFading) return;

  globals.isAttacking = true;

  let damage = 1;

  if (globals.currentTool === "axe") {
    switch (globals.currentAxeType) {
      case "wooden_axe":
        damage = 2;
        break;
      case "flint_axe":
        damage = 3;
        break;
      case "stone_axe":
        damage = 4;
        break;
      case "limestone_axe":
        damage = 5;
        break;
      default:
        damage = 2;
    }
  } else if (globals.currentTool === "sword") {
    damage = 2;
  }

  obs.health -= damage;

  if (obs.health <= 0) {
    obs.isFading = true;

    // إزالة الفيزياء فوراً
    removeObjectPhysics(obs.mesh);

    let amount = Math.floor(Math.random() * 2) + 1;

    if (globals.currentTool === "axe") {
      switch (globals.currentAxeType) {
        case "wooden_axe":
          amount += 1;
          break;
        case "flint_axe":
          amount += 2;
          break;
        case "stone_axe":
          amount += 3;
          break;
        case "limestone_axe":
          amount += 4;
          break;
      }
    }

    let particleColor = 0x8d6e63;

    switch (obs.type) {
      case "stone":
        globals.inventory.stone += amount;
        particleColor = 0x808080;
        break;
      case "flint":
        globals.inventory.flint += amount;
        particleColor = 0x333333;
        break;
      case "limestone":
        globals.inventory.limestone += amount;
        particleColor = 0xececec;
        break;
      case "desert_stone":
        globals.inventory.desert_stone += amount;
        particleColor = 0xd2b48c;
        break;
      case "wood":
        globals.inventory.wood += amount;
        particleColor = 0x5d4037;
        break;
      case "wood_palm":
        globals.inventory.wood += amount;
        globals.inventory.dates += 1;
        particleColor = 0x388e3c;
        break;
      case "straw":
        globals.inventory.straw += amount * 2;
        particleColor = 0xe4d00a;
        break;
      case "cactus":
        globals.inventory.cactus += amount;
        particleColor = 0x66bb6a;
        break;
      case "copper_ore":
        globals.inventory.copper += amount;
        particleColor = 0xb87333;
        break;
      case "iron_ore":
        globals.inventory.iron += amount;
        particleColor = 0x43464b;
        break;
      case "stick_pile":
        globals.inventory.stick += amount * 3;
        particleColor = 0x8d6e63;
        break;
      case "shard_deposit":
        globals.inventory.shard += amount * 2;
        particleColor = 0x607d8b;
        break;
      case "leather":
        globals.inventory.leather += amount;
        particleColor = 0x8d6e63;
        break;
      case "blue_crystal":
        globals.inventory.blue_crystal += 1;
        particleColor = 0x00bfff;
        break;
      case "red_crystal":
        globals.inventory.red_crystal += 1;
        particleColor = 0xff4500;
        break;
      case "pomegranate":
        globals.inventory.pomegranate += amount;
        particleColor = 0xdc143c;
        break;
      case "apple":
        globals.inventory.apple += amount;
        particleColor = 0xff0000;
        break;
      case "carrot":
        globals.inventory.carrot += amount;
        particleColor = 0xff8c00;
        break;
      case "honey":
        globals.inventory.honey += amount;
        particleColor = 0xffff00;
        break;
      case "butter":
        globals.inventory.butter += amount;
        particleColor = 0xfffacd;
        break;
      case "dried_milk":
        globals.inventory.dried_milk += amount;
        particleColor = 0xf5f5dc;
        break;
      case "red_berry":
        globals.inventory.red_berry += amount;
        particleColor = 0xd32f2f;
        break;
      case "blue_berry":
        globals.inventory.blue_berry += amount;
        particleColor = 0x81d4fa;
        break;
      case "yellow_berry":
        globals.inventory.yellow_berry += amount;
        particleColor = 0xfbc02d;
        break;
      case "lilac_berry":
        globals.inventory.lilac_berry += amount;
        particleColor = 0xd1c4e9;
        break;
    }

    let xpGain = 5;
    switch (obs.type) {
      case "stone":
      case "flint":
      case "limestone":
      case "desert_stone":
        xpGain = 8;
        break;
      case "wood":
      case "wood_palm":
        xpGain = 6;
        break;
      case "straw":
      case "cactus":
        xpGain = 4;
        break;
      case "red_berry":
      case "yellow_berry":
      case "blue_berry":
      case "lilac_berry":
        xpGain = 3;
        break;
    }

    if (globals.currentTool === "axe") {
      switch (globals.currentAxeType) {
        case "wooden_axe":
          xpGain += 2;
          break;
        case "flint_axe":
          xpGain += 4;
          break;
        case "stone_axe":
          xpGain += 6;
          break;
        case "limestone_axe":
          xpGain += 8;
          break;
      }
    }

    globals.playerStats.xp += xpGain;

    console.log(
      `✅ تم حصاد ${obs.type} (+${amount}), المخزون المحدث:`,
      globals.inventory[obs.type],
    );

    import("./ui.js")
      .then((module) => {
        if (module.updateHUD) module.updateHUD();
      })
      .catch(() => {
        console.warn("وحدة ui.js غير متاحة");
      });

    spawnParticles(obs.mesh.position, particleColor, 8);

    if (!globals.fadingObjects) globals.fadingObjects = [];
    globals.fadingObjects.push({
      obs,
      progress: 0,
      originalScale: obs.mesh.scale.x,
    });

    // إزالة من obstacleData
    if (globals.obstacleData && index > -1) {
      globals.obstacleData.splice(index, 1);
    }
  }
}

function spawnParticles(pos, color, count = 8) {
  if (!globals.scene) return;

  for (let i = 0; i < count; i++) {
    const geo = new THREE.BoxGeometry(10, 10, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
    });
    const p = new THREE.Mesh(geo, mat);

    p.position.copy(pos);
    p.position.y += 20;

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 15,
      Math.random() * 20 + 10,
      (Math.random() - 0.5) * 15,
    );

    if (!globals.particles) globals.particles = [];
    globals.particles.push({ mesh: p, vel, life: 1.0 });
    globals.scene.add(p);
  }
}

export function createFloorPhysics() {
  if (!globals.ammo || !globals.physicsWorld) return;
  const AmmoLib = globals.ammo;

  const GRID_SIZE = 256;
  const TERRAIN_SIZE = 60000;
  const SCALE = TERRAIN_SIZE / GRID_SIZE;

  const heightfieldData = new Float32Array(GRID_SIZE * GRID_SIZE);

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const x = (i - GRID_SIZE / 2) * SCALE;
      const z = (j - GRID_SIZE / 2) * SCALE;

      const distance = Math.sqrt(x * x + z * z);
      let height = 0;

      if (distance > 30000) {
        height = -50000;
      } else {
        height = 0;
      }

      heightfieldData[i * GRID_SIZE + j] = height;
    }
  }

  const upAxis = 1;
  const heightScale = 1.0;
  const minHeight = -50000;
  const maxHeight = 100;
  const flipQuadEdges = false;

  const heightfieldShape = new AmmoLib.btHeightfieldTerrainShape(
    GRID_SIZE,
    GRID_SIZE,
    heightfieldData,
    heightScale,
    minHeight,
    maxHeight,
    upAxis,
    0,
    flipQuadEdges,
  );

  const localScaling = new AmmoLib.btVector3(SCALE, 1, SCALE);
  heightfieldShape.setLocalScaling(localScaling);

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, 0, 0));

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    0,
    motionState,
    heightfieldShape,
    new AmmoLib.btVector3(0, 0, 0),
  );

  const rigidBody = new AmmoLib.btRigidBody(rbInfo);
  rigidBody.setFriction(0.5);
  rigidBody.setRestitution(0.1);

  globals.physicsWorld.addRigidBody(rigidBody);
  globals.terrainRigidBody = rigidBody;

  console.log("✅ فيزياء الأرض اكتملت بنجاح!");
}

export function createTowerPhysics(towerMesh, radius = 500) {
  if (!globals.ammo || !globals.physicsWorld) return null;
  const AmmoLib = globals.ammo;

  const bbox = calculateBoundingBoxWithMargin(towerMesh, 0.8);

  const shape = new AmmoLib.btCylinderShape(
    new AmmoLib.btVector3(
      bbox.size.x * 0.5,
      bbox.size.y * 0.5,
      bbox.size.z * 0.5,
    ),
  );

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AmmoLib.btVector3(
      towerMesh.position.x,
      towerMesh.position.y + bbox.size.y * 0.5,
      towerMesh.position.z,
    ),
  );

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new AmmoLib.btVector3(0, 0, 0),
  );

  const body = new AmmoLib.btRigidBody(rbInfo);
  body.setFriction(0.8);
  body.setRestitution(0.0);

  body.setCcdMotionThreshold(0.1);
  body.setCcdSweptSphereRadius(0.5);

  globals.physicsWorld.addRigidBody(body, 2, 1);

  if (!towerMesh.userData) towerMesh.userData = {};
  towerMesh.userData.physicsBody = body;

  globals.CCDObjects.set(body, towerMesh);

  console.log("✅ فيزياء البرج اكتملت بنجاح!");

  return body;
}

export function removeObjectPhysics(mesh) {
  if (!mesh || !mesh.userData || !mesh.userData.physicsBody) return;

  const body = mesh.userData.physicsBody;

  // إزالة من الفيزياء العالمي
  if (globals.physicsWorld) {
    try {
      globals.physicsWorld.removeRigidBody(body);
    } catch (error) {
      // تجاهل الأخطاء إذا كان الجسم مسبقاً معطلاً
    }
  }

  // إزالة من جميع الخرائط
  if (globals.objectPhysicsBodies && mesh.uuid) {
    globals.objectPhysicsBodies.delete(mesh.uuid);
  }

  if (globals.CCDObjects) {
    globals.CCDObjects.delete(body);
  }

  if (globals.inactivePhysicsBodies) {
    globals.inactivePhysicsBodies.delete(mesh.uuid);
  }

  // إزالة من قائمة الكائنات التصادمية
  if (globals.collisionObjects) {
    const index = globals.collisionObjects.indexOf(mesh);
    if (index > -1) {
      globals.collisionObjects.splice(index, 1);
    }
  }

  // تنظيف الذاكرة
  mesh.userData.physicsBody = null;
  mesh.userData.isActive = false;
  mesh.userData.wasCulled = true;

  console.log(
    `✅ تمت إزالة الفيزياء للجسم: ${mesh.userData.objectType || "غير معروف"}`,
  );
}

export function validateAllPhysicsObjects() {
  if (!globals.collisionObjects || globals.collisionObjects.length === 0)
    return;

  console.log(`🔍 التحقق من ${globals.collisionObjects.length} جسم فيزيائي...`);

  let correctedCount = 0;

  for (let i = 0; i < globals.collisionObjects.length; i++) {
    const obj = globals.collisionObjects[i];
    if (!obj || !obj.position) {
      console.warn(`❌ جسم فيزيائي مفقود في الفهرس ${i}`);
      continue;
    }

    const terrainHeight = getTerrainHeight(obj.position.x, obj.position.z);
    const expectedHeight = obj.userData.physicsHeight || terrainHeight;

    if (Math.abs(obj.position.y - expectedHeight) > 50) {
      console.log(`🛠️ تصحيح ارتفاع الجسم ${i} (${obj.userData.objectType})`);
      obj.position.y = expectedHeight;

      if (obj.userData.physicsBody) {
        const AmmoLib = globals.ammo;
        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
          new AmmoLib.btVector3(obj.position.x, expectedHeight, obj.position.z),
        );
        obj.userData.physicsBody.setWorldTransform(transform);
      }
      correctedCount++;
    }
  }

  if (correctedCount > 0) {
    console.log(`✅ تم تصحيح ${correctedCount} جسم`);
  }
}

// دالة لتحديث الفيزياء بناءً على حالة هرم المنظور
export function updatePhysicsForCulling() {
  if (!globals.ammo || !globals.physicsWorld || !globals.collisionObjects)
    return;

  let enabledCount = 0;
  let disabledCount = 0;

  for (let i = 0; i < globals.collisionObjects.length; i++) {
    const obj = globals.collisionObjects[i];
    if (!obj || !obj.userData) continue;

    const body = obj.userData.physicsBody;
    if (!body) continue;

    // التحقق من حالة الرؤية
    const shouldBeActive = obj.userData.isVisible !== false;
    const isActive = obj.userData.isActive === true;

    if (shouldBeActive && !isActive) {
      // تفعيل الفيزياء للكائنات المرئية
      try {
        globals.physicsWorld.addRigidBody(body, 2, 1 | 2);
        body.activate();
        obj.userData.isActive = true;
        obj.userData.wasCulled = false;
        enabledCount++;
      } catch (e) {
        console.warn("خطأ في تفعيل الفيزياء:", e);
      }
    } else if (!shouldBeActive && isActive) {
      // تعطيل الفيزياء للكائنات المخفية
      try {
        globals.physicsWorld.removeRigidBody(body);
        obj.userData.isActive = false;
        obj.userData.wasCulled = true;
        disabledCount++;
      } catch (e) {
        // تجاهل الأخطاء إذا كان الجسم مسبقاً معطلاً
      }
    }
  }

  if (enabledCount > 0 || disabledCount > 0) {
    console.log(
      `🔄 هرم المنظور الفيزيائي: ${enabledCount} مفعل, ${disabledCount} معطل`,
    );
  }
}

// دالة لتهيئة الفيزياء لكائنات البيئة
export function initEnvironmentPhysics() {
  if (!globals.physicsInitialized || !globals.forestGroup) return;

  console.log("بدء تهيئة الفيزياء للبيئة...");

  let physicsCount = 0;

  globals.forestGroup.children.forEach((child, index) => {
    if (child.userData && child.userData.assetType) {
      // الحصول على بيانات الكائن من obstacleData
      const obstacle = globals.obstacleData.find((obs) => obs.mesh === child);
      if (obstacle) {
        createPrecisePhysics(
          child,
          obstacle.type,
          obstacle.radius / (obstacle.originalScale || 1),
          obstacle.originalScale || 1,
        );
        physicsCount++;
      }
    }
  });

  console.log(`✅ تم تهيئة الفيزياء لـ ${physicsCount} كائن بيئي`);
}

// دالة لإعادة تعيين الفيزياء (في حالة حدوث مشاكل)
export function resetPhysics() {
  console.log("🔄 إعادة تعيين الفيزياء...");

  // إزالة جميع الأجسام الفيزيائية
  if (globals.physicsWorld && globals.ammo) {
    const AmmoLib = globals.ammo;

    // إزالة جميع الأجسام باستثناء الأرض واللاعب
    for (
      let i = globals.physicsWorld.getNumCollisionObjects() - 1;
      i >= 0;
      i--
    ) {
      const obj = globals.physicsWorld.getCollisionObjectArray().at(i);
      if (obj !== globals.terrainRigidBody && obj !== globals.playerBody) {
        globals.physicsWorld.removeCollisionObject(obj);
      }
    }
  }

  // تنظيف البيانات
  globals.collisionObjects = [];
  globals.objectPhysicsBodies.clear();
  globals.CCDObjects.clear();
  globals.inactivePhysicsBodies.clear();

  console.log("✅ تمت إعادة تعيين الفيزياء بنجاح");
}

// دالة للحصول على إحصائيات الفيزياء
export function getPhysicsStats() {
  if (!globals.physicsWorld) return null;

  return {
    totalObjects: globals.collisionObjects.length,
    activeObjects: globals.collisionObjects.filter(
      (obj) => obj.userData && obj.userData.isActive,
    ).length,
    inactiveObjects: globals.collisionObjects.filter(
      (obj) => obj.userData && !obj.userData.isActive,
    ).length,
    culledObjects: globals.collisionObjects.filter(
      (obj) => obj.userData && obj.userData.wasCulled,
    ).length,
    CCDObjects: globals.CCDObjects.size,
    physicsWorldObjects: globals.physicsWorld.getNumCollisionObjects(),
  };
}
