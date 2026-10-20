import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mapSkeleton, captureRestPose, applyPoseToSkeleton } from './rig/retarget.ts';
import { aimRestToNeutral } from './rig/actorRig.ts';
import { NEUTRAL_POSE } from './rig/pose.ts';
import { PHYSIQUE_PRESETS } from './rig/physique.ts';

const body = new THREE.Color('#cbd0d3');
const muscle = new THREE.Color('#ef7d28');
const materials = new WeakMap();
const geometryVariants = new WeakMap();
const v = () => new THREE.Vector3();

export async function loadHuman(url) {
  const { scene } = await new GLTFLoader().loadAsync(url);
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const height = bounds.max.y - bounds.min.y;
  scene.scale.setScalar(1.82 / height);
  scene.position.set(-(bounds.max.x + bounds.min.x) / 2 * scene.scale.x, -bounds.min.y * scene.scale.y, 0);
  scene.updateMatrixWorld(true);
  return scene;
}

function grayMaterial(source) {
  if (materials.has(source)) return materials.get(source);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: source.map, roughness: .83, metalness: 0,
    vertexColors: true, side: THREE.DoubleSide,
  });
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment.replace(
      'diffuseColor *= sampledDiffuseColor;',
      'float tone = dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)); diffuseColor.rgb *= mix(0.40, 1.0, smoothstep(0.025, 0.55, tone)); diffuseColor.a *= sampledDiffuseColor.a;',
    ));
  };
  material.customProgramCacheKey = () => 'fitness-gray-body-v1';
  materials.set(source, material); return material;
}

function coloredGeometry(mesh, group) {
  let variants = geometryVariants.get(mesh.geometry);
  if (!variants) { variants = new Map(); geometryVariants.set(mesh.geometry, variants); }
  if (variants.has(group)) return variants.get(group);
  const geometry = mesh.geometry.clone();
  const positions = geometry.getAttribute('position');
  const joints = geometry.getAttribute('skinIndex');
  const weights = geometry.getAttribute('skinWeight');
  const colors = new Float32Array(positions.count * 3);
  const point = v(), color = new THREE.Color();
  for (let i = 0; i < positions.count; i += 1) {
    mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
    let influence = 0;
    for (let j = 0; j < 4; j += 1) {
      const bone = mesh.skeleton.bones[joints.getComponent(i, j)]?.name || '';
      const weight = weights.getComponent(i, j);
      if (group === '腿' && /Thigh/.test(bone)) influence += weight;
      if (group === '手臂' && /UpperArm/.test(bone)) influence += weight;
      if (group === '肩' && /UpperArm|Clavicle/.test(bone) && point.y > 1.34) influence += weight;
      if (group === '胸' && /Spine[12]/.test(bone) && point.z > .035 && point.y > 1.20 && point.y < 1.48) influence += weight;
      if (group === '背' && /Spine/.test(bone) && point.z < -.025 && point.y > 1.02 && point.y < 1.50) influence += weight;
      if (group === '核心' && /Spine/.test(bone) && point.z > .035 && point.y > .98 && point.y < 1.25 && Math.abs(point.x) < .13) influence += weight;
    }
    color.copy(body).lerp(muscle, THREE.MathUtils.smoothstep(influence, .12, .65));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.morphAttributes = {};
  variants.set(group, geometry); return geometry;
}

export function createHuman(template, group) {
  const model = clone(template);
  const root = new THREE.Group(); root.name = 'FitnessAthlete'; root.add(model);
  root.updateMatrixWorld(true);
  model.traverse(node => {
    if (!node.isSkinnedMesh) return;
    node.geometry = coloredGeometry(node, group);
    node.material = Array.isArray(node.material) ? node.material.map(grayMaterial) : grayMaterial(node.material);
    node.morphTargetInfluences = []; node.frustumCulled = false;
  });
  const bones = mapSkeleton(model);
  aimRestToNeutral(model, bones, PHYSIQUE_PRESETS.athletic);
  const rest = captureRestPose(model, bones);
  return { root, model, bones, rest };
}

export function workoutPose(motion, name, t) {
  const pose = { ...NEUTRAL_POSE, leftHand: 'fist', rightHand: 'fist', leftArm: -8, rightArm: 8, stanceWidth: .34, leftFootTurn: 0, rightFootTurn: 0 };
  let pitch = 0, seated = false, hip = null;
  const arms = (forward, spread, elbow) => Object.assign(pose, {
    leftArmForward: forward, rightArmForward: forward, leftArm: -spread, rightArm: spread,
    leftElbow: elbow, rightElbow: -elbow,
  });
  const legs = (upper, knee) => Object.assign(pose, { leftLeg: upper, rightLeg: upper, leftKnee: knee, rightKnee: knee, leftAnkle: upper - knee, rightAnkle: upper - knee });
  if (['squat', 'frontsquat', 'hacksquat'].includes(motion)) {
    legs(6 + 64 * t, 8 + 92 * t); pose.spineBend = 8 + 22 * t;
    arms(-12, 70, 112); pose.leftArmTwist = -65; pose.rightArmTwist = 65;
    if (/啞鈴|徒手/.test(name)) arms(/徒手/.test(name) ? 75 : 0, 8, 8);
    if (motion === 'frontsquat') { arms(80, 12, 115); pose.leftArmTwist = 0; pose.rightArmTwist = 0; }
    if (motion === 'hacksquat') { pitch = -.30; pose.spineBend = 0; arms(5, 45, 100); }

  } else if (motion === 'split' || motion === 'lunge') {
    Object.assign(pose, { leftLeg: 25 + 45 * t, rightLeg: -30, leftKnee: 15 + 68 * t, rightKnee: 42 + 40 * t, spineBend: 8, stanceWidth: .27 });
      if (motion === 'lunge') { pose.rightLeg = -18; pose.rightKnee = 10 + 75 * t; }
    if (/史密斯/.test(name)) { arms(-12, 70, 112); pose.leftArmTwist = -65; pose.rightArmTwist = 65; }
  } else if (['hinge', 'deadlift', 'sumodeadlift'].includes(motion)) {
    legs(6 + 44 * t, 12 + 10 * t); pose.spineBend = 5 + 56 * t; arms(pose.spineBend + 4, 5, 6);
    if (motion !== 'hinge') { legs(6 + 60 * t, 8 + 65 * t); pose.spineBend = 5 + 30 * t; arms(pose.spineBend + 5, 7, 6); }
    if (motion === 'sumodeadlift') { pose.stanceWidth = .72; pose.leftFootTurn = -25; pose.rightFootTurn = 25; }

  } else if (motion === 'press' || motion === 'incline') {
    const incline = motion === 'incline' ? 30 : 0;
    pitch = THREE.MathUtils.degToRad(-90 + incline); hip = [0, .61, .44];
    legs(incline - 25, 65); pose.leftAnkle = 0; pose.rightAnkle = 0;
    arms(30 + 60 * t - incline, 50 * (1 - t) + 5, 90 * (1 - t) + 5);
    pose.leftArmTwist = -30 * (1 - t); pose.rightArmTwist = 30 * (1 - t);
  } else if (motion === 'curl' || motion === 'preachercurl') {
    arms(4, 7, 12 + 108 * t);
    if (/集中|牧師/.test(name) || motion === 'preachercurl') {
      seated = true; legs(78, 88); pose.spineBend = /集中/.test(name) ? 22 : 8;
      arms(/集中/.test(name) ? 20 : 38, /集中/.test(name) ? 10 : 5, 20 + 90 * t);
    }
    if (!/錘/.test(name)) { pose.leftForearmTwist = -70; pose.rightForearmTwist = 70; }
  } else if (motion === 'pulldown') {
    seated = true; legs(85, 88); pose.spineBend = -8;
    arms(12, 158 - 87 * t, 8 + 83 * t);
  } else if (motion === 'row') {
    seated = !/啞鈴|槓鈴/.test(name);
    if (seated) { legs(65, 28); arms(72 - 70 * t, 7, 10 + 86 * t); }
    else { legs(12, 18); pose.spineBend = 65; arms(65 - 24 * t, 9, 7 + 96 * t); }
  } else if (motion === 'chestrow' || motion === 'inclinerow') {
    seated = motion === 'chestrow'; legs(seated ? 85 : 15, seated ? 88 : 20);
    pose.spineBend = seated ? 5 : 45; arms((seated ? 80 : 60) - 75 * t, /寬握/.test(name) ? 40 : 12, 10 + 90 * t);
    if (/單臂/.test(name)) { pose.rightArmForward = 70; pose.rightElbow = 10; }
  } else if (motion === 'seateddip') {
    seated = true; legs(85,88); arms(-10,12,95-80*t);
  } else if (motion === 'wristcurl') {
    seated = true; legs(85,88); arms(25,8,80); pose.leftWrist = -30+60*t; pose.rightWrist = -30+60*t;
  } else if (motion === 'torsorotation') {
    seated = true; legs(85,88); arms(65,20,95); pose.torsoYaw = -25+50*t;
  } else if (['standingabduction','standingadduction','hipflexion'].includes(motion)) {
    arms(65,12,25); pose.rightKnee=8;pose.leftKnee=8;
    if(motion==='hipflexion')pose.leftLeg=5+60*t;
    else pose.leftLegSplay=motion==='standingabduction' ? -5-30*t : -30+35*t;
  } else if (motion === 'seatedstretch') {
    seated=true;legs(75,15);pose.spineBend=10+20*t;arms(65,10,10);
  } else if (['cycle','recumbent'].includes(motion)) {
    seated=true;const wave=(t-.5)*2;
    pose.leftLeg=65+25*wave;pose.rightLeg=65-25*wave;pose.leftKnee=70-35*wave;pose.rightKnee=70+35*wave;
    arms(motion==='recumbent'?0:65,12,25);if(motion==='recumbent'){pitch=-.25;hip=[0,.61,-.25];}
  } else if (['treadmill','elliptical','stair'].includes(motion)) {
    const wave=(t-.5)*2;pose.leftLeg=25*wave;pose.rightLeg=-25*wave;
    pose.leftKnee=15+30*t;pose.rightKnee=45-30*t;
    arms(25,10,50);pose.leftArmForward=25-30*wave;pose.rightArmForward=25+30*wave;
    if(motion==='elliptical'){pose.leftArmForward+=25;pose.rightArmForward+=25;}
  } else if(motion==='ergrow') {
    seated=true;const drive=Math.min(1,t*1.5),pull=Math.max(0,(t-.6)/.4);
    legs(85-35*drive,100-75*drive);pose.spineBend=15-25*Math.max(0,(t-.4)/.6);arms(80-75*pull,10,10+90*pull);hip=[0,.61,.25-.55*drive];
  } else if (motion === 'shoulder') {
    seated = !/站姿/.test(name); if (seated) legs(85, 88); arms(8, 75 + 90 * t, 88 * (1 - t) + 6);
  } else if (motion === 'lateral') {
    arms(4, 8 + 74 * t, 12);
  } else if (motion === 'pushdown') {
    arms(12, 6, 90 - 80 * t);
  } else if (motion === 'machinepress') {
    seated = true; legs(85, 88); arms(35 + 48 * t, 35 * (1 - t) + 6, 80 * (1 - t) + 8);
  } else if (motion === 'extension' || motion === 'legcurl') {
    seated = true; legs(85, motion === 'extension' ? 90 - 78 * t : 15 + 78 * t); arms(0, 8, 8);
  } else if (motion === 'legpress') {
    seated = true; pitch = -.40; legs(98 - 35 * t, 94 - 70 * t); hip = [0, .45, -.2]; arms(0, 7, 8);
  } else if (motion === 'crunch') {
    pitch = -Math.PI / 2; hip = [0, .20, .35]; legs(45, 100); pose.spineBend = 30 * t;
    arms(70, 18, 100); pose.leftHand = 'open'; pose.rightHand = 'open';
  } else if (motion === 'fly') {
    arms(15 + 68 * t, 65 * (1 - t) + 5, 15);
  }
  if (motion === 'pecdeck' || motion === 'reversepecdeck') {
    seated = true; legs(85, 88);
    const close = motion === 'pecdeck' ? t : 1 - t;
    arms(15 + 70 * close, 75 * (1 - close) + 5, 18);
  } else if (motion === 'highrow') {
    seated = true; legs(85, 88); arms(115 - 90 * t, 20, 8 + 90 * t);
  } else if (motion === 'straightpull') {
    legs(8, 12); pose.spineBend = 12; arms(130 - 115 * t, 8, 10);
  } else if (motion === 'machinelateral') {
    seated = true; legs(85, 88); arms(5, 10 + 70 * t, 75);
  } else if (motion === 'frontraise') {
    arms(5 + 85 * t, 8, 8);
  } else if (motion === 'reversefly') {
    legs(15, 20); pose.spineBend = 65; arms(65 * (1 - t), 10 + 70 * t, 12);
  } else if (motion === 'facepull') {
    arms(90 - 45 * t, 8 + 60 * t, 8 + 90 * t);
  } else if (motion === 'shrug') {
    arms(0, 8, 5); pose.leftShoulder = 15 * t; pose.rightShoulder = 15 * t;
  } else if (motion === 'overheadextension') {
    arms(170, 8, 110 - 100 * t);
  } else if (motion === 'tricepsextension') {
    seated = true; legs(85, 88); arms(55, 8, 105 - 95 * t);
  } else if (['lyingfly', 'inclinefly', 'skullcrusher'].includes(motion)) {
    const incline = motion === 'inclinefly' ? 30 : 0;
    pitch = THREE.MathUtils.degToRad(-90 + incline); hip = [0, .61, .44]; legs(incline - 25, 65);
    pose.leftAnkle = 0; pose.rightAnkle = 0;
    if (motion === 'skullcrusher') arms(90, 8, 105 - 95 * t);
    else arms(15 + 75 * t - incline, 70 * (1 - t) + 6, 15);
  } else if (motion === 'horizontalpress') {
    seated = true; legs(90 - 28 * t, 100 - 80 * t); arms(0, 8, 8);
  } else if (motion === 'pronecurl') {
    pitch = Math.PI / 2; hip = [0, .65, .15]; legs(0, 8 + 100 * t); arms(150, 15, 30);
  } else if (motion === 'standingcurl') {
    pose.leftKnee = 10 + 95 * t; arms(70, 10, 35);
  } else if (motion === 'abductor' || motion === 'adductor') {
    seated = true; legs(85, 88); arms(0, 10, 8);
    const spread = 4 + 32 * (motion === 'abductor' ? t : 1 - t);
    pose.leftLegSplay = -spread; pose.rightLegSplay = spread;
  } else if (motion === 'kickback') {
    pose.spineBend = 15; pose.leftLeg = 12 - 38 * t; pose.leftKnee = 15; pose.rightKnee = 8; arms(60, 10, 35);
  } else if (motion === 'calf' || motion === 'seatedcalf') {
    if (motion === 'seatedcalf') { seated = true; legs(85, 90); }
    pose.leftAnkle = 25 * t; pose.rightAnkle = 25 * t; arms(0, 8, 10);
  } else if (motion === 'machinecrunch' || motion === 'backextension') {
    seated = true; legs(85, 88); arms(65, 15, 100);
    pose.spineBend = motion === 'machinecrunch' ? 5 + 35 * t : 35 * (1 - t);
  } else if (motion === 'romanextension') {
    pitch = -.5; hip = [0, .85, 0]; legs(0, 5); pose.spineBend = 65 * t; arms(50, 12, 100);
  } else if (motion === 'cablecrunch') {
    hip = [0, .52, .15]; legs(0, 130); arms(135, 15, 120); pose.spineBend = 10 + 40 * t;
  } else if (motion === 'pullup') {
    hip = [0, 1.0 + .34 * t, 0]; legs(0, /輔助/.test(name) ? 85 : 25); arms(5, 170 - 65 * t, 5 + 90 * t);
  } else if (motion === 'dip') {
    hip = [0, 1.03 - .22 * t, 0]; legs(0, 85); arms(-10, 15, 8 + 75 * t); pose.spineBend = 8;
  } else if (motion === 'legraise') {
    pitch = -Math.PI / 2; hip = [0, .20, .1]; legs(8 + 75 * t, 8); arms(0, 8, 0);
  } else if (motion === 'kneeraise' || motion === 'hangingknee') {
    hip = [0, 1.1, 0]; legs(5 + 85 * t, 20 + 70 * t);
    arms(motion === 'kneeraise' ? 60 : 5, motion === 'kneeraise' ? 20 : 175, motion === 'kneeraise' ? 90 : 5);
  } else if (motion === 'hipthrust' || motion === 'bridge') {
    pitch = -Math.PI / 2; hip = [0, (motion === 'bridge' ? .17 : .35) + .20 * t, .2];
    legs(-10 - 22 * t, 85); pose.spineBend = 12 * (1 - t); arms(motion === 'bridge' ? 0 : 12, 8, 5);
  } else if (motion === 'pushup' || motion === 'kneepushup') {
    pitch = Math.PI / 2; hip = [0, .36 - .16 * t, 0];
    legs(motion === 'kneepushup' ? 25 : 0, motion === 'kneepushup' ? 90 : 0);
    arms(85 - 45 * t, 10 + 30 * t, 5 + 80 * t); pose.leftHand = 'open'; pose.rightHand = 'open';
  } else if (motion === 'deadbug') {
    pitch = -Math.PI / 2; hip = [0, .22, 0];
    legs(85, 90); arms(90, 8, 0);
    pose.leftLeg = 85 - 65 * t; pose.leftKnee = 90 - 80 * t; pose.rightArmForward = 90 + 80 * t;
  } else if (motion === 'birddog') {
    pitch = Math.PI / 2; hip = [0, .55, 0]; legs(80, 90); arms(90, 10, 0);
    pose.leftLeg = 80 - 80 * t; pose.leftKnee = 90 - 90 * t; pose.rightArmForward = 90 + 85 * t;
  }
  if (/單臂/.test(name) && ['chestrow','row','highrow','pulldown'].includes(motion)) { pose.rightArmForward=0;pose.rightArm=8;pose.rightElbow=-8; }
  if (/反握二頭/.test(name)) { pose.leftForearmTwist=70;pose.rightForearmTwist=-70; }
  if (motion==='machinepress' && /下斜/.test(name)) { pose.leftArmForward-=20;pose.rightArmForward-=20; }
  if (seated && !hip) hip = [0, .61, 0];
  return { pose, pitch, hip };
}

export function animateHuman(human, motion, name, t) {
  const { pose, pitch, hip } = workoutPose(motion, name, t);
  const { root, model, bones, rest } = human;
  root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
  const splay = THREE.MathUtils.radToDeg(Math.atan2(pose.stanceWidth / 2 - .083, .865));
  applyPoseToSkeleton(model, bones, rest, pose, splay);
  root.rotation.x = pitch; root.updateMatrixWorld(true);
  if (hip) root.position.add(new THREE.Vector3(...hip).sub(bones.hips.getWorldPosition(v())));
  else {
    const feet = [bones.leftFoot, bones.rightFoot].map(bone => bone.getWorldPosition(v()));
    root.position.y += .08 - Math.min(...feet.map(point => point.y));
    root.position.z -= (feet[0].z + feet[1].z) / 2;
  }
  if (motion === 'calf') root.position.y += .07 * t;
  root.updateMatrixWorld(true);
}

export function gripFor(hand) {
  const index = hand.children.find(bone => /Finger1$/.test(bone.name));
  const pinky = hand.children.find(bone => /Finger4$/.test(bone.name));
  const middle = hand.children.find(bone => /Finger2$/.test(bone.name));
  const wrist = hand.getWorldPosition(v());
  const knuckle = middle.getWorldPosition(v());
  const axis = pinky.getWorldPosition(v()).sub(index.getWorldPosition(v())).normalize();
  const palm = knuckle.clone().sub(wrist).normalize();
  const normal = new THREE.Vector3().crossVectors(axis, palm).normalize();
  const point = wrist.lerp(knuckle, .80).addScaledVector(normal, hand.name.includes('_L_') ? -.012 : .012);
  return { point, axis };
}

export function disposeHuman(human) {
  const skeletons = new Set();
  human.model.traverse(node => { if (node.isSkinnedMesh) skeletons.add(node.skeleton); });
  skeletons.forEach(skeleton => skeleton.dispose());
}
