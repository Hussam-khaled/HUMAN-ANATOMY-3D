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
  createPart(new THREE.CylinderGeometry(0.028, 0.032, 0.62, 12), matBone, { organId: "bone_spine", layer: "skeletal", systemId: "skeletal", nameAr: "العمود الفقري", nameEn: "Vertebral Column" }, [0, 1.18, -0.05]);

  // Ribcage (6 stylized rib pairs)
  for (let i = 0; i < 6; i++) {
    const y = 1.38 - i * 0.045;
    const radius = 0.145 - Math.abs(i - 2) * 0.008;
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

  return { root, layers };
}
