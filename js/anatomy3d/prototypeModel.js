import * as THREE from "three";

/**
 * Builds a structured 6-layer 3D Human Body Prototype (Skin, Skeletal, Muscular,
 * Internal Organs, Nervous, Cardiovascular).
 * NOTE: This is an educational structural prototype, NOT a medically accurate anatomical mesh.
 * Each mesh includes standardized userData for Phase 4 interaction tools.
 */
export function buildPrototypeHumanModel() {
  const root = new THREE.Group();
  root.name = "PrototypeHumanBody";

  const layers = {
    skin: new THREE.Group(),
    skeletal: new THREE.Group(),
    muscular: new THREE.Group(),
    organs: new THREE.Group(),
    nervous: new THREE.Group(),
    vascular: new THREE.Group()
  };

  Object.entries(layers).forEach(([key, group]) => {
    group.name = `layer_${key}`;
    root.add(group);
  });

  function createPart(geometry, material, meta, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = meta.organId;
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData = {
      ...meta,
      originalPosition: new THREE.Vector3(pos[0], pos[1], pos[2])
    };
    layers[meta.layer].add(mesh);
    return mesh;
  }

  // ===== Materials =====
  const matSkin = new THREE.MeshPhysicalMaterial({
    color: 0xd9a88f,
    roughness: 0.55,
    metalness: 0.0,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const matBone = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.48,
    metalness: 0.05
  });

  const matMuscle = new THREE.MeshStandardMaterial({
    color: 0xa83c3c,
    roughness: 0.62,
    metalness: 0.05,
    transparent: true,
    opacity: 0.65
  });

  const matHeart = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.35, metalness: 0.1 });
  const matLung = new THREE.MeshStandardMaterial({ color: 0xd98a94, roughness: 0.55, metalness: 0.05 });
  const matLiver = new THREE.MeshStandardMaterial({ color: 0x7c3626, roughness: 0.4, metalness: 0.08 });
  const matStomach = new THREE.MeshStandardMaterial({ color: 0xc98a5b, roughness: 0.5, metalness: 0.05 });
  const matKidney = new THREE.MeshStandardMaterial({ color: 0x8d493a, roughness: 0.45, metalness: 0.05 });
  const matBrain = new THREE.MeshStandardMaterial({ color: 0xe2b6b3, roughness: 0.6, metalness: 0.02 });
  const matNerve = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.35, emissive: 0x3b2f00 });
  const matArtery = new THREE.MeshStandardMaterial({ color: 0xe03131, roughness: 0.3 });
  const matVein = new THREE.MeshStandardMaterial({ color: 0x228be6, roughness: 0.3 });

  // ===== 1. SKIN LAYER (Outer Translucent Silhouette) =====
  createPart(new THREE.SphereGeometry(0.135, 24, 24), matSkin, { organId: "skin_head", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الرأس", nameEn: "Skin - Head" }, [0, 1.62, 0], [0, 0, 0], [0.95, 1.12, 1.0]);
  createPart(new THREE.CapsuleGeometry(0.22, 0.52, 12, 24), matSkin, { organId: "skin_torso", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الجذع", nameEn: "Skin - Torso" }, [0, 1.12, 0], [0, 0, 0], [1.05, 1.0, 0.7]);
  createPart(new THREE.CapsuleGeometry(0.068, 0.52, 8, 16), matSkin, { organId: "skin_arm_l", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الذراع اليسرى", nameEn: "Skin - Left Arm" }, [0.33, 1.12, 0], [0, 0, -0.08]);
  createPart(new THREE.CapsuleGeometry(0.068, 0.52, 8, 16), matSkin, { organId: "skin_arm_r", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الذراع اليمنى", nameEn: "Skin - Right Arm" }, [-0.33, 1.12, 0], [0, 0, 0.08]);
  createPart(new THREE.CapsuleGeometry(0.09, 0.72, 8, 16), matSkin, { organId: "skin_leg_l", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الساق اليسرى", nameEn: "Skin - Left Leg" }, [0.12, 0.42, 0]);
  createPart(new THREE.CapsuleGeometry(0.09, 0.72, 8, 16), matSkin, { organId: "skin_leg_r", layer: "skin", systemId: "integumentary", nameAr: "الجلد - الساق اليمنى", nameEn: "Skin - Right Leg" }, [-0.12, 0.42, 0]);

  // ===== 2. SKELETAL LAYER =====
  createPart(new THREE.SphereGeometry(0.115, 20, 20), matBone, { organId: "bone_skull", layer: "skeletal", systemId: "skeletal", nameAr: "الجمجمة", nameEn: "Skull" }, [0, 1.63, 0], [0, 0, 0], [0.95, 1.1, 1.0]);
  createPart(new THREE.CylinderGeometry(0.012, 0.014, 0.62, 8), matBone, { organId: "bone_spine", layer: "skeletal", systemId: "skeletal", nameAr: "العمود الفقري", nameEn: "Vertebral Column" }, [0, 1.18, -0.05]);

  // Ribcage (10 rib levels, barrel-shaped profile)
  for (let i = 0; i < 10; i++) {
    const y = 1.41 - i * 0.04;
    const radius = 0.09 + 0.05 * Math.sin((Math.PI * (i + 1)) / 11);
    createPart(
      new THREE.TorusGeometry(radius, 0.011, 8, 24),
      matBone,
      { organId: `bone_rib_${i + 1}`, layer: "skeletal", systemId: "skeletal", nameAr: `القفص الصدري (ضلع ${i + 1})`, nameEn: `Ribcage (Rib ${i + 1})` },
      [0, y, 0.0],
      [Math.PI / 2, 0, 0],
      [1.15, 0.75, 1]
    );
  }

  createPart(new THREE.CylinderGeometry(0.15, 0.12, 0.14, 16), matBone, { organId: "bone_pelvis", layer: "skeletal", systemId: "skeletal", nameAr: "الحوض", nameEn: "Pelvis" }, [0, 0.82, 0], [0, 0, 0], [1.1, 1, 0.7]);
  createPart(new THREE.CylinderGeometry(0.024, 0.02, 0.56, 10), matBone, { organId: "bone_humerus_l", layer: "skeletal", systemId: "skeletal", nameAr: "عظم العضد والساعد الأيسر", nameEn: "Left Arm Bones" }, [0.33, 1.14, 0], [0, 0, -0.08]);
  createPart(new THREE.CylinderGeometry(0.024, 0.02, 0.56, 10), matBone, { organId: "bone_humerus_r", layer: "skeletal", systemId: "skeletal", nameAr: "عظم العضد والساعد الأيمن", nameEn: "Right Arm Bones" }, [-0.33, 1.14, 0], [0, 0, 0.08]);
  createPart(new THREE.CylinderGeometry(0.032, 0.024, 0.76, 10), matBone, { organId: "bone_femur_l", layer: "skeletal", systemId: "skeletal", nameAr: "عظم الفخذ والساق الأيسر", nameEn: "Left Leg Bones" }, [0.12, 0.42, 0]);
  createPart(new THREE.CylinderGeometry(0.032, 0.024, 0.76, 10), matBone, { organId: "bone_femur_r", layer: "skeletal", systemId: "skeletal", nameAr: "عظم الفخذ والساق الأيمن", nameEn: "Right Leg Bones" }, [-0.12, 0.42, 0]);

  // ===== 3. MUSCULAR LAYER =====
  createPart(new THREE.SphereGeometry(0.085, 16, 16), matMuscle, { organId: "muscle_deltoid_l", layer: "muscular", systemId: "muscular", nameAr: "العضلة الدالية اليسرى", nameEn: "Left Deltoid Muscle" }, [0.27, 1.40, 0]);
  createPart(new THREE.SphereGeometry(0.085, 16, 16), matMuscle, { organId: "muscle_deltoid_r", layer: "muscular", systemId: "muscular", nameAr: "العضلة الدالية اليمنى", nameEn: "Right Deltoid Muscle" }, [-0.27, 1.40, 0]);
  createPart(new THREE.BoxGeometry(0.14, 0.13, 0.06), matMuscle, { organId: "muscle_pectoral_l", layer: "muscular", systemId: "muscular", nameAr: "العضلة الصدرية اليسرى", nameEn: "Left Pectoralis Major" }, [0.09, 1.33, 0.11]);
  createPart(new THREE.BoxGeometry(0.14, 0.13, 0.06), matMuscle, { organId: "muscle_pectoral_r", layer: "muscular", systemId: "muscular", nameAr: "العضلة الصدرية اليمنى", nameEn: "Right Pectoralis Major" }, [-0.09, 1.33, 0.11]);
  createPart(new THREE.CapsuleGeometry(0.06, 0.28, 8, 14), matMuscle, { organId: "muscle_quad_l", layer: "muscular", systemId: "muscular", nameAr: "عضلة الفخذ اليسرى", nameEn: "Left Quadriceps" }, [0.12, 0.60, 0.02]);
  createPart(new THREE.CapsuleGeometry(0.06, 0.28, 8, 14), matMuscle, { organId: "muscle_quad_r", layer: "muscular", systemId: "muscular", nameAr: "عضلة الفخذ اليمنى", nameEn: "Right Quadriceps" }, [-0.12, 0.60, 0.02]);

  // ===== 4. INTERNAL ORGANS LAYER =====
  createPart(new THREE.SphereGeometry(0.088, 18, 18), matBrain, { organId: "organ_brain", layer: "organs", systemId: "nervous", nameAr: "الدماغ", nameEn: "Brain" }, [0, 1.65, 0], [0, 0, 0], [1.0, 0.88, 1.1]);
  createPart(new THREE.SphereGeometry(0.058, 18, 18), matHeart, { organId: "organ_heart", layer: "organs", systemId: "cardiovascular", nameAr: "القلب", nameEn: "Heart" }, [0.035, 1.28, 0.04], [0, 0, -0.25], [0.9, 1.15, 0.85]);
  createPart(new THREE.CapsuleGeometry(0.058, 0.13, 10, 16), matLung, { organId: "organ_lung_l", layer: "organs", systemId: "respiratory", nameAr: "الرئة اليسرى", nameEn: "Left Lung" }, [0.095, 1.31, 0.0]);
  createPart(new THREE.CapsuleGeometry(0.062, 0.14, 10, 16), matLung, { organId: "organ_lung_r", layer: "organs", systemId: "respiratory", nameAr: "الرئة اليمنى", nameEn: "Right Lung" }, [-0.095, 1.31, 0.0]);
  createPart(new THREE.SphereGeometry(0.072, 16, 16), matLiver, { organId: "organ_liver", layer: "organs", systemId: "digestive", nameAr: "الكبد", nameEn: "Liver" }, [-0.07, 1.13, 0.04], [0, 0, 0.25], [1.25, 0.75, 0.85]);
  createPart(new THREE.SphereGeometry(0.058, 16, 16), matStomach, { organId: "organ_stomach", layer: "organs", systemId: "digestive", nameAr: "المعدة", nameEn: "Stomach" }, [0.065, 1.11, 0.04], [0, 0, -0.35], [1.1, 0.85, 0.8]);
  createPart(new THREE.CapsuleGeometry(0.028, 0.045, 8, 12), matKidney, { organId: "organ_kidney_l", layer: "organs", systemId: "urinary", nameAr: "الكلية اليسرى", nameEn: "Left Kidney" }, [0.07, 1.03, -0.04]);
  createPart(new THREE.CapsuleGeometry(0.028, 0.045, 8, 12), matKidney, { organId: "organ_kidney_r", layer: "organs", systemId: "urinary", nameAr: "الكلية اليمنى", nameEn: "Right Kidney" }, [-0.07, 1.03, -0.04]);

  // ===== 5. NERVOUS SYSTEM LAYER =====
  createPart(new THREE.CylinderGeometry(0.012, 0.01, 0.58, 8), matNerve, { organId: "nerve_spinal_cord", layer: "nervous", systemId: "nervous", nameAr: "الحبل الشوكي", nameEn: "Spinal Cord" }, [0, 1.24, -0.065]);
  createPart(new THREE.CylinderGeometry(0.006, 0.005, 0.45, 8), matNerve, { organId: "nerve_sciatic_l", layer: "nervous", systemId: "nervous", nameAr: "العصب الوركي الأيسر", nameEn: "Left Sciatic Nerve" }, [0.11, 0.62, -0.03]);
  createPart(new THREE.CylinderGeometry(0.006, 0.005, 0.45, 8), matNerve, { organId: "nerve_sciatic_r", layer: "nervous", systemId: "nervous", nameAr: "العصب الوركي الأيمن", nameEn: "Right Sciatic Nerve" }, [-0.11, 0.62, -0.03]);

  // ===== 6. CARDIOVASCULAR / VESSELS LAYER =====
  createPart(new THREE.CylinderGeometry(0.012, 0.011, 0.48, 10), matArtery, { organId: "vessel_aorta", layer: "vascular", systemId: "cardiovascular", nameAr: "الشريان الأبهر", nameEn: "Aorta" }, [0.015, 1.15, 0.01]);
  createPart(new THREE.CylinderGeometry(0.012, 0.011, 0.48, 10), matVein, { organId: "vessel_vena_cava", layer: "vascular", systemId: "cardiovascular", nameAr: "الوريد الأجوف", nameEn: "Vena Cava" }, [-0.018, 1.15, 0.01]);

  // ===== REFINEMENT PASS: anatomically-shaped parts =====
  const shape = (geo, fn) => {
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); fn(v); pos.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    return geo;
  };
  const lbl = (s) => (s > 0 ? ["يسار", "Left"] : ["يمين", "Right"]);
  const meta = (id, layer, sys, ar, en) => ({ organId: id, layer, systemId: sys, nameAr: ar, nameEn: en });
  const tube = (pts, r, mat, m) => createPart(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 32, r, 8, false), mat, m, [0, 0, 0]);

  // Lungs: tapered apex, broad base, flattened front-to-back
  [["organ_lung_l"], ["organ_lung_r"]].forEach(([id]) => {
    const m = layers.organs.getObjectByName(id);
    if (!m) return;
    m.geometry.dispose();
    m.geometry = shape(new THREE.SphereGeometry(0.07, 24, 20), (v) => {
      const t = (v.y / 0.07 + 1) / 2;
      v.x *= 0.62 + 0.5 * (1 - t); v.z *= 0.7; v.y *= 1.75;
    });
    m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
  });
  // Heart: teardrop with apex pointing down-left
  const heart = layers.organs.getObjectByName("organ_heart");
  if (heart) {
    heart.geometry.dispose();
    heart.geometry = shape(new THREE.SphereGeometry(0.058, 24, 20), (v) => {
      const t = (v.y / 0.058 + 1) / 2;
      v.x *= 0.55 + 0.6 * t; v.z *= 0.8 + 0.2 * t;
    });
  }

  // Skin additions: neck, hands, feet
  const skinMeta = (id, ar, en) => meta(id, "skin", "integumentary", ar, en);
  createPart(new THREE.CylinderGeometry(0.05, 0.058, 0.14, 16), matSkin, skinMeta("skin_neck", "الجلد - الرقبة", "Skin - Neck"), [0, 1.49, 0]);
  [1, -1].forEach((s) => {
    const [a, e] = lbl(s);
    createPart(new THREE.SphereGeometry(0.045, 16, 12), matSkin, skinMeta(`skin_hand_${s > 0 ? "l" : "r"}`, `الجلد - اليد (${a})`, `Skin - ${e} Hand`), [s * 0.345, 0.72, 0], [0, 0, 0], [0.8, 1.5, 0.45]);
    createPart(new THREE.BoxGeometry(0.085, 0.05, 0.19), matSkin, skinMeta(`skin_foot_${s > 0 ? "l" : "r"}`, `الجلد - القدم (${a})`, `Skin - ${e} Foot`), [s * 0.12, 0.0, 0.05]);
  });

  // Skeleton additions
  const boneMeta = (id, ar, en) => meta(id, "skeletal", "skeletal", ar, en);
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const grp = i < 7 ? ["عنقية", "Cervical"] : i < 19 ? ["صدرية", "Thoracic"] : ["قطنية", "Lumbar"];
    createPart(new THREE.CylinderGeometry(0.012 + 0.012 * t, 0.013 + 0.012 * t, 0.02, 10), matBone,
      boneMeta(`bone_vertebra_${i + 1}`, `فقرة ${grp[0]} (${i + 1})`, `${grp[1]} Vertebra ${i + 1}`),
      [0, 1.49 - t * 0.62, -0.05 + 0.016 * Math.sin(t * Math.PI * 2)]);
  }
  createPart(new THREE.BoxGeometry(0.035, 0.2, 0.012), matBone, boneMeta("bone_sternum", "القص", "Sternum"), [0, 1.3, 0.1]);
  createPart(new THREE.SphereGeometry(0.07, 18, 12), matBone, boneMeta("bone_mandible", "الفك السفلي", "Mandible"), [0, 1.545, 0.045], [0, 0, 0], [0.95, 0.45, 0.8]);
  [1, -1].forEach((s) => {
    const [a, e] = lbl(s), k = s > 0 ? "l" : "r";
    createPart(new THREE.CylinderGeometry(0.009, 0.009, 0.17, 8), matBone, boneMeta(`bone_clavicle_${k}`, `الترقوة (${a})`, `${e} Clavicle`), [s * 0.085, 1.47, 0.055], [0, 0, Math.PI / 2 - s * 0.15]);
    createPart(new THREE.SphereGeometry(0.06, 14, 10), matBone, boneMeta(`bone_scapula_${k}`, `لوح الكتف (${a})`, `${e} Scapula`), [s * 0.1, 1.37, -0.08], [0, 0, 0], [1, 1.2, 0.22]);
    createPart(new THREE.SphereGeometry(0.02, 12, 10), matBone, boneMeta(`bone_patella_${k}`, `الرضفة (${a})`, `${e} Patella`), [s * 0.12, 0.42, 0.045], [0, 0, 0], [1, 1.2, 0.6]);
    createPart(new THREE.BoxGeometry(0.05, 0.09, 0.02), matBone, boneMeta(`bone_hand_${k}`, `عظام اليد (${a})`, `${e} Hand Bones`), [s * 0.345, 0.7, 0]);
    createPart(new THREE.BoxGeometry(0.06, 0.035, 0.15), matBone, boneMeta(`bone_foot_${k}`, `عظام القدم (${a})`, `${e} Foot Bones`), [s * 0.12, 0.0, 0.05]);
  });

  // Muscle additions
  const musMeta = (id, ar, en) => meta(id, "muscular", "muscular", ar, en);
  for (let i = 0; i < 3; i++) {
    [1, -1].forEach((s) => {
      const [a, e] = lbl(s);
      createPart(new THREE.BoxGeometry(0.06, 0.06, 0.03), matMuscle, musMeta(`muscle_rectus_${s > 0 ? "l" : "r"}_${i + 1}`, `العضلة المستقيمة البطنية (${a}) ${i + 1}`, `${e} Rectus Abdominis ${i + 1}`), [s * 0.037, 1.04 - i * 0.07, 0.1]);
    });
  }
  [1, -1].forEach((s) => {
    const [a, e] = lbl(s), k = s > 0 ? "l" : "r";
    createPart(new THREE.CapsuleGeometry(0.036, 0.16, 8, 12), matMuscle, musMeta(`muscle_biceps_${k}`, `العضلة ذات الرأسين (${a})`, `${e} Biceps`), [s * 0.335, 1.25, 0.03]);
    createPart(new THREE.CapsuleGeometry(0.045, 0.14, 8, 12), matMuscle, musMeta(`muscle_gastroc_${k}`, `عضلة بطة الساق (${a})`, `${e} Gastrocnemius`), [s * 0.12, 0.28, -0.04]);
    createPart(new THREE.SphereGeometry(0.075, 16, 14), matMuscle, musMeta(`muscle_gluteus_${k}`, `العضلة الألوية (${a})`, `${e} Gluteus`), [s * 0.1, 0.78, -0.085], [0, 0, 0], [1, 1.05, 0.8]);
  });
  createPart(new THREE.BoxGeometry(0.3, 0.17, 0.03), matMuscle, musMeta("muscle_trapezius", "العضلة شبه المنحرفة", "Trapezius"), [0, 1.4, -0.1]);

  // Organ additions
  const orgMeta = (id, sys, ar, en) => meta(id, "organs", sys, ar, en);
  const matIntest = new THREE.MeshStandardMaterial({ color: 0xe8a0a0, roughness: 0.5 });
  const matColon = new THREE.MeshStandardMaterial({ color: 0xc27a5a, roughness: 0.5 });
  const matThyroid = new THREE.MeshStandardMaterial({ color: 0xb36bb3, roughness: 0.5 });
  const matDiaph = new THREE.MeshStandardMaterial({ color: 0xb85c5c, roughness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  createPart(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 10), matLung, orgMeta("organ_trachea", "respiratory", "القصبة الهوائية", "Trachea"), [0, 1.43, 0.025]);
  createPart(new THREE.SphereGeometry(0.02, 12, 10), matThyroid, orgMeta("organ_thyroid", "endocrine", "الغدة الدرقية", "Thyroid Gland"), [0, 1.49, 0.045], [0, 0, 0], [1.6, 1, 0.6]);
  createPart(new THREE.SphereGeometry(0.14, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), matDiaph, orgMeta("organ_diaphragm", "respiratory", "الحجاب الحاجز", "Diaphragm"), [0, 1.17, 0], [0, 0, 0], [1.05, 0.35, 0.7]);
  createPart(new THREE.SphereGeometry(0.036, 14, 12), matKidney, orgMeta("organ_bladder", "urinary", "المثانة", "Urinary Bladder"), [0, 0.87, 0.045]);
  const sm = [];
  for (let k = 0; k <= 36; k++) sm.push([0.075 * Math.sin(k * 1.25) * (k % 2 ? 1 : 0.9), 0.87 + k * 0.0035, 0.055 + 0.012 * Math.cos(k * 0.9)]);
  tube(sm, 0.011, matIntest, orgMeta("organ_small_intestine", "digestive", "الأمعاء الدقيقة", "Small Intestine"));
  tube([[-0.1, 0.87, 0.03], [-0.1, 0.99, 0.03], [0, 1.02, 0.03], [0.1, 0.99, 0.03], [0.1, 0.87, 0.03]], 0.016, matColon, orgMeta("organ_large_intestine", "digestive", "الأمعاء الغليظة (القولون)", "Large Intestine (Colon)"));

  // Vessel and nerve additions
  const vesMeta = (id, ar, en) => meta(id, "vascular", "cardiovascular", ar, en);
  const nerMeta = (id, ar, en) => meta(id, "nervous", "nervous", ar, en);
  [1, -1].forEach((s) => {
    const [a, e] = lbl(s), k = s > 0 ? "l" : "r";
    tube([[s * 0.02, 1.4, 0.04], [s * 0.035, 1.5, 0.05], [s * 0.045, 1.57, 0.045]], 0.006, matArtery, vesMeta(`vessel_carotid_${k}`, `الشريان السباتي (${a})`, `${e} Carotid Artery`));
    tube([[s * 0.035, 1.4, 0.03], [s * 0.05, 1.5, 0.035], [s * 0.055, 1.57, 0.03]], 0.007, matVein, vesMeta(`vessel_jugular_${k}`, `الوريد الوداجي (${a})`, `${e} Jugular Vein`));
    tube([[s * 0.06, 0.84, 0.03], [s * 0.09, 0.6, 0.04], [s * 0.115, 0.3, 0.035]], 0.008, matArtery, vesMeta(`vessel_femoral_a_${k}`, `الشريان الفخذي (${a})`, `${e} Femoral Artery`));
    tube([[s * 0.075, 0.84, 0.03], [s * 0.105, 0.6, 0.04], [s * 0.13, 0.3, 0.035]], 0.009, matVein, vesMeta(`vessel_femoral_v_${k}`, `الوريد الفخذي (${a})`, `${e} Femoral Vein`));
    tube([[s * 0.035, 1.42, -0.055], [s * 0.2, 1.38, -0.03], [s * 0.33, 1.1, -0.02], [s * 0.345, 0.8, -0.01]], 0.005, matNerve, nerMeta(`nerve_brachial_${k}`, `الضفيرة العضدية والعصب الزندي (${a})`, `${e} Brachial Plexus / Ulnar Nerve`));
  });
  tube([[0, 1.58, 0.0], [0.02, 1.48, 0.03], [0.03, 1.32, 0.045], [0.015, 1.1, 0.05]], 0.004, matNerve, nerMeta("nerve_vagus", "العصب المبهم", "Vagus Nerve"));

  return { root, layers };
}
