import * as THREE from 'three';
import { loadHuman, createHuman, animateHuman, gripFor, disposeHuman } from './fitness-human.js';

const sourceUrl = new URL('./fitness-human.glb?v=1', document.currentScript.src).href;
const metal = new THREE.MeshStandardMaterial({ color: '#68717a', metalness: .58, roughness: .32 });
const black = new THREE.MeshStandardMaterial({ color: '#252a30', roughness: .83 });
const pad = new THREE.MeshStandardMaterial({ color: '#343c47', roughness: .96 });
const frameMaterial = new THREE.MeshStandardMaterial({ color: '#adb5bd', metalness: .35, roughness: .48 });
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
const box = new THREE.BoxGeometry(1, 1, 1);
const hex = new THREE.CylinderGeometry(1, 1, 1, 6);
const xAxis = new THREE.Vector3(1, 0, 0), yAxis = new THREE.Vector3(0, 1, 0);
const scenes = new Map();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer, template, loading, loadError, paused = false, lastFrame = 0;

function mesh(parent, geometry, material, scale, position = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, material);
  item.scale.set(...scale); item.position.set(...position); parent.add(item); return item;
}
function rod(parent, a, b, radius = .025, material = frameMaterial) {
  const item = mesh(parent, cylinder, material, [radius, 1, radius]); positionRod(item, a, b); return item;
}
function positionRod(item, a, b) {
  const from = Array.isArray(a) ? new THREE.Vector3(...a) : a;
  const to = Array.isArray(b) ? new THREE.Vector3(...b) : b;
  item.position.copy(from).add(to).multiplyScalar(.5);
  item.scale.y = from.distanceTo(to);
  item.quaternion.setFromUnitVectors(yAxis, to.clone().sub(from).normalize());
}
function weight(parent, dumbbell = true) {
  const group = new THREE.Group(); parent.add(group);
  const handle = mesh(group, cylinder, metal, [.016, dumbbell ? .30 : 1.75, .016]);
  handle.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const end = dumbbell ? .12 : .73;
    const disk = mesh(group, dumbbell ? hex : cylinder, black, [dumbbell ? .092 : .18, dumbbell ? .073 : .045, dumbbell ? .092 : .18], [side * end, 0, 0]);
    disk.rotation.z = Math.PI / 2;
    const collar = mesh(group, cylinder, metal, [.028, .024, .028], [side * (dumbbell ? .077 : .64), 0, 0]);
    collar.rotation.z = Math.PI / 2;
    const cap = mesh(group, cylinder, metal, [.029, .004, .029], [side * (end + (dumbbell ? .039 : .025)), 0, 0]);
    cap.rotation.z = Math.PI / 2;
  }
  group.name = dumbbell ? 'Dumbbell' : 'Barbell'; return group;
}
function bench(parent, incline = 0, seated = false) {
  const back = mesh(parent, box, pad, [.34, .09, seated ? .38 : .98], [0, .49, seated ? 0 : -.11]);
  back.rotation.x = incline;
  if (incline) back.position.set(0, .49 + .43 * Math.sin(incline), -.02 - .43 * Math.cos(incline));
  if (!seated) mesh(parent, box, pad, [.35, .09, .35], [0, .49, .48]);
  rod(parent, [0, .35, -.50], [0, .35, .61], .035);
  for (const z of seated ? [-.13, .18] : [-.58, .59]) {
    rod(parent, [0, .06, z], [0, .45, z], .04);
    rod(parent, [-.30, .035, z], [.30, .035, z], .03);
    for (const x of [-.30, .30]) mesh(parent, box, black, [.09, .065, .11], [x, .035, z]);
  }
}
function tower(parent, x, z = -.50) {
  for (const dx of [-.12, .12]) rod(parent, [x + dx, .05, z], [x + dx, 2.18, z], .023);
  for (let i = 0; i < 10; i += 1) mesh(parent, box, black, [.20, .035, .15], [x, .18 + i * .04, z]);
  rod(parent, [x - .23, .04, z - .18], [x + .23, .04, z + .18], .035);
  const pulley = mesh(parent, cylinder, black, [.075, .025, .075], [x, 2.14, z]); pulley.rotation.z = Math.PI / 2;
}
function buildMachine(parent, motion, name, equipmentType) {
  const moving = [];
  if (motion === 'chestrow' || motion === 'inclinerow') {
    const incline = motion === 'inclinerow';
    if (!incline) bench(parent, 0, true);
    const support = mesh(parent, box, pad, [.34, incline ? .65 : .32, .09], [0, 1.0, .23]);
    support.name = 'ChestSupport'; support.rotation.x = incline ? -.75 : -.08;
    rod(parent, [0,.04,.3],[0,.98,.3],.045);
    rod(parent, [-.45,.04,.3],[.45,.04,.3],.045);
    if (incline && equipmentType === '機械') { const origin=[0,.06,.9]; moving.push({cable:rod(parent,origin,[0,.8,.3],.03,metal),origin}); }
    if (!incline) {
      tower(parent, -.7, .65);
      for (const side of [-1,1]) {
        const origin = [side*.52,.8,.95];
        rod(parent,[side*.52,.04,.95],origin,.04);
        moving.push({side,cable:rod(parent,origin,[side*.3,1,.4],.025,metal),origin});
      }
    }
  }
  if (['seateddip','torsorotation','wristcurl','seatedstretch'].includes(motion)) {
    bench(parent,0,true);
    if (motion !== 'wristcurl' && motion !== 'seatedstretch') tower(parent,-.65,-.4);
    if (motion === 'seateddip') for (const side of [-1,1]) {
      const origin=[side*.45,.55,-.1];
      moving.push({side,cable:rod(parent,origin,[side*.3,.7,.2],.025,metal),origin});
    }
    if (motion === 'torsorotation') moving.push({ torsoPad: mesh(parent,box,pad,[.5,.14,.18]) });
    if (motion === 'seatedstretch') rod(parent,[-.4,.8,.8],[.4,.8,.8],.03,black);
  }
  if (['standingabduction','standingadduction','hipflexion'].includes(motion)) {
    tower(parent,-.6,.45);
    rod(parent,[-.5,1.05,.5],[.5,1.05,.5],.025,black);
    moving.push({ ankleCable:rod(parent,[-.5,.15,.45],[0,.1,0],.008,black),origin:[-.5,.15,.45] });
  }
  if (['cycle','recumbent','elliptical','stair','treadmill','ergrow'].includes(motion)) {
    const cardioBase = mesh(parent,box,black,[.8,.06,motion==='treadmill'?1.8:1.45],[0,-.06,.1]);
    cardioBase.name = 'CardioFrame';
    if (['cycle','recumbent'].includes(motion)) {
      bench(parent,0,true);
      const wheel=mesh(parent,cylinder,metal,[.3,.10,.3],[0,.28,.5]);wheel.rotation.z=Math.PI/2;
      rod(parent,[0,.03,.5],[0,1,.65],.04);
      rod(parent,[-.32,1,.65],[.32,1,.65],.028,black);
      if(motion==='recumbent')mesh(parent,box,pad,[.36,.6,.08],[0,.85,-.45]);
    }
    if(motion==='ergrow') {
      rod(parent,[0,.35,-.8],[0,.35,.95],.04);
      const fan=mesh(parent,cylinder,metal,[.28,.12,.28],[0,.34,1.03]);fan.rotation.z=Math.PI/2;
      moving.push({slidingSeat:mesh(parent,box,pad,[.35,.08,.28])});
      moving.push({cable:rod(parent,[0,.55,1],[0,1,.4],.006,black),origin:[0,.55,1]});
    } else if (!['cycle','recumbent'].includes(motion)) {
      for(const side of [-1,1])rod(parent,[side*.45,.02,.65],[side*.45,1.18,.65],.035);
      mesh(parent,box,black,[.7,.18,.09],[0,1.25,.65]);
    }
    if(['cycle','recumbent','elliptical','stair'].includes(motion)) for(const side of [-1,1]) {
      moving.push({side,pedal:mesh(parent,box,black,[.18,.04,.27])});
      if(motion==='elliptical')moving.push({side,cable:rod(parent,[side*.4,.05,.7],[side*.3,1,.4],.025,metal),origin:[side*.4,.05,.7]});
    }
  }

  if (['press', 'incline', 'lyingfly', 'inclinefly', 'skullcrusher'].includes(motion)) {
    bench(parent, ['incline', 'inclinefly'].includes(motion) ? Math.PI / 6 : 0);
    if (equipmentType === '槓鈴') for (const x of [-.62, .62]) {
      rod(parent, [x, .04, -.65], [x, 1.30, -.65], .032);
      rod(parent, [x - .16, .035, -.65], [x + .16, .035, -.65], .035);
      rod(parent, [x, 1.15, -.65], [x, 1.15, -.48], .025, black);
    }
  } else if (['pulldown', 'machinepress', 'extension', 'legcurl', 'pecdeck', 'reversepecdeck', 'highrow', 'machinelateral', 'preachercurl', 'tricepsextension', 'abductor', 'adductor', 'seatedcalf', 'machinecrunch', 'backextension', 'horizontalpress'].includes(motion) || motion === 'shoulder' && !/站姿/.test(name) || motion === 'curl' && /集中|牧師/.test(name)) {
    bench(parent, 0, true);
    if (['shoulder', 'machinepress'].includes(motion)) mesh(parent, box, pad, [.34, .66, .07], [0, .88, -.13]);
    if (motion === 'curl' && /牧師/.test(name)) {
      const rest = mesh(parent, box, pad, [.60, .07, .35], [0, .92, .25]); rest.rotation.x = .45;
      rod(parent, [0, .06, .3], [0, .9, .3], .035);
    }
  } else if (motion === 'row') {
    if (/啞鈴|槓鈴/.test(name)) { /* Bent-over free-weight row. */ }
    else {
      mesh(parent, box, pad, [.35, .09, .7], [0, .49, -.12]);
      rod(parent, [0, .03, -.3], [0, .46, -.3], .035);
      rod(parent, [0, .04, -.5], [0, .04, 1.08], .04);
      tower(parent, 0, 1.15);
      for (const x of [-.18, .18]) { const foot = mesh(parent, box, black, [.16, .30, .04], [x, .19, .82]); foot.rotation.x = -.25; }
      moving.push({ cable: rod(parent, [0, .35, 1.1], [0, 1, .5], .006, black), origin: [0, .35, 1.1] });
    }
  } else if (motion === 'legpress') {
    bench(parent, -.40, true);
    const back = mesh(parent, box, pad, [.38, .7, .08], [0, .7, -.34]); back.rotation.x = -.4;
    for (const x of [-.40, .40]) rod(parent, [x, .1, .4], [x, 1.2, 1.5], .035);
    const platform = mesh(parent, box, black, [.65, .40, .07], [0, .85, 1.05]); platform.rotation.x = -.6; moving.push({ platform });
  }
  if (['pulldown', 'pushdown'].includes(motion)) {
    tower(parent, -.42);
    rod(parent, [-.42, 2.17, -.50], [0, 2.17, .18], .035);
    moving.push({ cable: rod(parent, [0, 2.17, .18], [0, 1.7, .18], .006, black), origin: [0, 2.17, .18] });
  }
  if (motion === 'fly') for (const side of [-1, 1]) {
    tower(parent, side * .85, -.35);
    moving.push({ side, cable: rod(parent, [side * .85, 1.65, -.35], [side * .5, 1.3, .2], .005, black), origin: [side * .85, 1.65, -.35] });
  }
  if (['extension', 'legcurl'].includes(motion)) {
    rod(parent, [0, .06, -.2], [0, .06, .65], .035);
    moving.push({ roller: rod(parent, [-.28, .2, .5], [.28, .2, .5], .08, black) });
  }
  if (/史密斯/.test(name)) {
    for (const x of [-.73, .73]) {
      rod(parent, [x, .04, -.12], [x, 2.2, -.12], .035);
      rod(parent, [x, .04, -.75], [x, .04, .75], .045);
    }
    rod(parent, [-.73, 2.2, -.12], [.73, 2.2, -.12], .04);
  }
  const leverMotions = ['machinepress', 'pecdeck', 'reversepecdeck', 'shoulder', 'highrow', 'machinelateral', 'preachercurl', 'tricepsextension', 'machinecrunch', 'backextension'];
  if (equipmentType === '機械' && leverMotions.includes(motion) && !/史密斯/.test(name)) {
    tower(parent, -.65, -.60);
    mesh(parent, box, pad, [.33, .6, .07], [0, .88, motion === 'reversepecdeck' || motion === 'highrow' ? .32 : -.14]);
    if (motion === 'preachercurl' || motion === 'tricepsextension') {
      const rest = mesh(parent, box, pad, [.6, .08, .35], [0, .92, .25]); rest.rotation.x = .45;
    }
    for (const side of [-1, 1]) {
      const origin = [side * .5, ['shoulder', 'highrow'].includes(motion) ? 1.85 : 1.1, -.30];
      rod(parent, [side * .5, .05, -.30], origin, .035);
      moving.push({ side, cable: rod(parent, origin, [side * .3, 1.0, .3], .025, metal), origin });
    }
  }
  if (['abductor', 'adductor'].includes(motion)) {
    mesh(parent, box, pad, [.34, .65, .07], [0, .9, -.16]); tower(parent, -.65);
    for (const side of [-1, 1]) moving.push({ side, thighPad: mesh(parent, box, pad, [.12, .22, .17]), lever: rod(parent, [0, .45, 0], [side * .3, .55, .4], .03) });
  }
  if (motion === 'hacksquat') {
    for (const side of [-1, 1]) rod(parent, [side * .48, .05, .35], [side * .48, 2.1, -.3], .04);
    mesh(parent, box, black, [.85, .08, .65], [0, .03, .30]);
    moving.push({ backPad: mesh(parent, box, pad, [.42, .65, .12]) });
  }
  if (['pronecurl', 'romanextension'].includes(motion)) {
    bench(parent, motion === 'romanextension' ? -.45 : 0);
    moving.push({ roller: rod(parent, [-.28, .2, .5], [.28, .2, .5], .08, black) });
  }
  if (motion === 'standingcurl') {
    tower(parent, -.65); mesh(parent, box, pad, [.35, .4, .08], [0, 1.1, .35]);
    moving.push({ ankleRoller: mesh(parent, cylinder, black, [.08, .25, .08]) });
  }
  if (motion === 'horizontalpress') {
    const back = mesh(parent, box, pad, [.4, .65, .08], [0, .85, -.22]); back.rotation.x = -.1;
    for (const x of [-.4,.4]) rod(parent, [x,.12,0], [x,.12,1.3], .04);
    moving.push({ platform: mesh(parent, box, black, [.65, .4, .07]) });
  }
  if (motion === 'calf' && equipmentType === '機械') {
    for (const x of [-.42, .42]) rod(parent, [x, .04, -.2], [x, 1.9, -.2], .04);
    mesh(parent, box, black, [.5, .1, .25], [0, .04, .1]);
    moving.push({ shoulders: mesh(parent, box, pad, [.5, .12, .25]) });
  }
  if (motion === 'seatedcalf') {
    moving.push({ thighBar: rod(parent, [-.28,.6,.4], [.28,.6,.4], .08, pad) });
    rod(parent, [0,.05,0], [0,.05,.75], .04);
  }
  if (motion === 'hipthrust') {
    mesh(parent, box, pad, [.8,.14,.3], [0,.48,-.6]);
    if (equipmentType === '機械') moving.push({ hipPad: mesh(parent, box, pad, [.65,.10,.2]) });
  }
  if (['pullup', 'hangingknee', 'dip', 'kneeraise'].includes(motion)) {
    for (const x of [-.6, .6]) rod(parent, [x,.03, -.2], [x,2.35,-.2], .04);
    if (motion === 'pullup' || motion === 'hangingknee') rod(parent, [-.65,2.35,.05],[.65,2.35,.05], .023, black);
    if (motion === 'dip' || motion === 'kneeraise') for (const x of [-.42,.42]) rod(parent,[x,1.3,-.2],[x,1.3,.55],.03,black);
    if (/輔助/.test(name)) moving.push({ kneeSupport: mesh(parent,box,pad,[.46,.10,.3]) });
    if (motion === 'kneeraise') mesh(parent,box,pad,[.4,.6,.08],[0,1.25,-.15]);
  }
  if (motion === 'kickback') {
    if (equipmentType === '機械') { tower(parent,-.65); mesh(parent,box,pad,[.4,.45,.08],[0,1.05,.4]); }
    moving.push({ ankleCable: rod(parent,[0,.15,.9],[0,.1,0],.008,black), origin:[0,.15,.9] });
  }
  if (equipmentType === '滑輪' && !['row','pulldown','pushdown','fly','standingabduction','standingadduction','hipflexion'].includes(motion)) {
    const high = ['straightpull','facepull','overheadextension','cablecrunch'].includes(motion);
    const origin = [0, high ? 2.1 : .12, .85]; tower(parent, -.5, .85);
    if (motion !== 'kickback') moving.push({ cable:rod(parent,origin,[0,1,.3],.006,black),origin });
  }
  if (['pushup','kneepushup','bridge','crunch','legraise','deadbug','birddog','cablecrunch'].includes(motion)) mesh(parent,box,pad,[.75,.018,2.1],[0,0,0]);
  return moving;
}
function create(canvas) {
  const { motion = 'squat', group, name, equipment: equipmentType } = canvas.dataset;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x66717b, 1.7));
  const light = new THREE.DirectionalLight(0xffffff, 2.3); light.position.set(-3, 5, 5); scene.add(light);
  const rim = new THREE.DirectionalLight(0xffffff, 1); rim.position.set(3, 3, -4); scene.add(rim);
  const human = createHuman(template, group); scene.add(human.root);
  const machine = new THREE.Group(); machine.name = 'ExerciseEquipment'; scene.add(machine);
  const moving = buildMachine(machine, motion, name, equipmentType);
  const dumbbells = [weight(scene), weight(scene)];
  const barbell = weight(scene, false);
  const handle = rod(scene, [-.3, 1, 0], [.3, 1, 0], .017, metal);
  const camera = new THREE.OrthographicCamera(-1.35, 1.35, 1.2375, -1.2375, .1, 30);
  const lying = ['press', 'incline', 'crunch', 'lyingfly', 'inclinefly', 'skullcrusher', 'pronecurl', 'bridge', 'hipthrust', 'legraise', 'pushup', 'kneepushup', 'deadbug', 'birddog'].includes(motion);
  camera.position.set(lying ? 3 : 2.8, lying ? 2.8 : 2.25, group === '背' ? -4.3 : 4.3);
  camera.lookAt(0, lying ? .65 : 1.04, lying ? .05 : 0);
  if (['pullup', 'dip', 'hangingknee', 'kneeraise'].includes(motion)) { camera.zoom = .83; camera.lookAt(0, 1.2, 0); camera.updateProjectionMatrix(); }
  if (equipmentType === '機械' || equipmentType === '滑輪') { camera.zoom = Math.min(camera.zoom, .80); camera.updateProjectionMatrix(); }
  const item = { scene, human, camera, machine, moving, dumbbells, barbell, handle, motion, name, equipmentType };
  canvas.dataset.model = 'rigged'; scenes.set(canvas, item); return item;
}
function pose(item, phase) {
  const t = (1 - Math.cos(phase)) / 2;
  animateHuman(item.human, item.motion, item.name, t);
  const grips = [gripFor(item.human.bones.leftHand), gripFor(item.human.bones.rightHand)];
  const midpoint = grips[0].point.clone().add(grips[1].point).multiplyScalar(.5);
  const axis = grips[1].point.clone().sub(grips[0].point).normalize();
  item.dumbbells.forEach((weight, i) => {
    weight.visible = item.equipmentType === '啞鈴';
    weight.position.copy(grips[i].point); weight.quaternion.setFromUnitVectors(xAxis, grips[i].axis);
  });
  item.barbell.visible = item.equipmentType === '槓鈴' || /史密斯/.test(item.name);
  item.barbell.position.copy(midpoint); item.barbell.quaternion.setFromUnitVectors(xAxis, axis);
  item.handle.visible = item.equipmentType === '滑輪' && !['fly','lateral','kickback','standingabduction','standingadduction','hipflexion'].includes(item.motion) || ['machinepress','ergrow'].includes(item.motion);
  positionRod(item.handle, grips[0].point.clone().addScaledVector(axis, -.09), grips[1].point.clone().addScaledVector(axis, .09));
  const joint = key => item.human.bones[key].getWorldPosition(new THREE.Vector3());
  const hips = joint('hips');
  if (item.motion === 'hipthrust') item.barbell.position.copy(hips).add(new THREE.Vector3(0,.10,0));
  for (const moving of item.moving) {
    if (moving.pedal) moving.pedal.position.copy(joint(moving.side < 0 ? 'leftFoot' : 'rightFoot')).add(new THREE.Vector3(0,-.05,.06));
    if (moving.slidingSeat) moving.slidingSeat.position.copy(hips).add(new THREE.Vector3(0,-.12,0));
    if (moving.torsoPad) {moving.torsoPad.position.copy(joint('spine')).add(new THREE.Vector3(0,.25,.15));moving.torsoPad.rotation.y=(-25+50*t)*Math.PI/180;}
    if (moving.platform) moving.platform.position.copy(joint('leftFoot').add(joint('rightFoot')).multiplyScalar(.5)).add(new THREE.Vector3(0,0,.06));
    if (moving.thighPad) {
      const knee = joint(moving.side < 0 ? 'leftLowerLeg' : 'rightLowerLeg');
      moving.thighPad.position.copy(knee); positionRod(moving.lever,hips,knee);
    }
    if (moving.backPad) moving.backPad.position.copy(hips).add(new THREE.Vector3(0,.3,-.18));
    if (moving.hipPad) moving.hipPad.position.copy(hips).add(new THREE.Vector3(0,.12,0));
    if (moving.shoulders) moving.shoulders.position.copy(joint('neck')).add(new THREE.Vector3(0,-.1,0));
    if (moving.thighBar) positionRod(moving.thighBar,joint('leftLowerLeg'),joint('rightLowerLeg'));
    if (moving.kneeSupport) moving.kneeSupport.position.copy(joint('leftLowerLeg').add(joint('rightLowerLeg')).multiplyScalar(.5)).add(new THREE.Vector3(0,-.08,0));
    if (moving.ankleCable) positionRod(moving.ankleCable,moving.origin,joint('leftFoot'));
    if (moving.ankleRoller) {moving.ankleRoller.position.copy(joint('leftFoot'));moving.ankleRoller.rotation.z=Math.PI/2;}

    if (moving.cable) positionRod(moving.cable, moving.origin, moving.side ? grips[moving.side < 0 ? 0 : 1].point : midpoint);
    if (moving.roller) {
      const ankles = [item.human.bones.leftFoot, item.human.bones.rightFoot].map(bone => bone.getWorldPosition(new THREE.Vector3()));
      positionRod(moving.roller, ankles[0], ankles[1]);
    }
  }
}
function fallback(canvas, label) {
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#767078'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
}
function frame(time) {
  requestAnimationFrame(frame);
  if (document.hidden || time - lastFrame < 90) return;
  lastFrame = time;
  for (const [canvas, item] of scenes) if (!canvas.isConnected) { disposeHuman(item.human); scenes.delete(canvas); }
  const dialog = document.querySelector('dialog[open]');
  const canvases = [...document.querySelectorAll('canvas.exercise-demo')].filter(canvas => {
    if (dialog && !dialog.contains(canvas)) return false;
    const rect = canvas.getBoundingClientRect();
    return rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight && canvas.checkVisibility?.() !== false;
  });
  const visible = new Set(canvases.slice(0, 12));
  for (const [canvas, item] of scenes) if (!visible.has(canvas)) {
    disposeHuman(item.human); scenes.delete(canvas);
    canvas.width = 1; canvas.height = 1; canvas.dataset.model = 'loading';
  }
  if (!canvases.length) return;
  if (!template) {
    loading ||= loadHuman(sourceUrl).then(value => { template = value; }).catch(() => { loadError = true; });
    for (const canvas of canvases) { canvas.dataset.model = loadError ? 'error' : 'loading'; fallback(canvas, loadError ? '示範載入失敗' : '載入示範'); }
    return;
  }
  try {
    renderer ||= new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(480, 440, false); renderer.setClearColor(0xffffff, 0);
    for (const canvas of canvases.slice(0, 12)) {
      if (canvas.width !== 480) { canvas.width = 480; canvas.height = 440; }
      const item = scenes.get(canvas) || create(canvas);
      pose(item, canvas.dataset.static === '1' || canvas.dataset.paused === '1' || (paused || reduced.matches) && canvas.dataset.animate !== '1' ? .85 : time / 1000);
      renderer.render(item.scene, item.camera);
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
      if (canvas.dataset.static === '1') {const img=document.createElement('img');img.src=canvas.toDataURL('image/png');img.alt=canvas.getAttribute('aria-label');img.className='fitness-exercise-image';canvas.replaceWith(img);}
    }
  } catch (error) {
    document.documentElement.classList.add('demo-unavailable');
    for (const canvas of canvases) { canvas.dataset.model = 'error'; fallback(canvas, '示範暫時無法顯示'); }
    console.error('Fitness model rendering failed', error);
  }
}
window.FitnessDemos = {
  attach(host, exercise, large = false) {
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 440;
    canvas.className = `exercise-demo${large ? ' exercise-demo--large' : ''}`;
    Object.assign(canvas.dataset, { motion: window.FitnessCore.motionFor(exercise), group: exercise.group, name: exercise.name, equipment: exercise.equipment, model: 'loading' });
    if (canvas.dataset.motion === 'neutral') { const note = document.createElement('small'); note.textContent = '自訂動作尚無示範'; host.append(note); return note; }
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${exercise.displayName || exercise.name}完整人體動態示意${['有氧','伸展'].includes(exercise.group) ? '' : '，橘色標示'+exercise.group+'肌群'}`);
    host.append(canvas); return canvas;
  },
  setPaused(value) { paused = value; },
  inspect(canvas) {
    const item = scenes.get(canvas); if (!item) return { ready: false };
    let bones = 0, meshes = 0;
    item.human.model.traverse(node => { if (node.isBone) bones += 1; if (node.isSkinnedMesh) meshes += 1; });
    return { ready: true, bones, meshes, motion: item.motion, dumbbells: item.dumbbells.filter(weight => weight.visible).length,
      joints: Object.fromEntries(Object.entries(item.human.bones).map(([name, bone]) => [name, bone.getWorldPosition(new THREE.Vector3()).toArray()])),
      gripError: item.dumbbells.map((weight, i) => weight.position.distanceTo(gripFor(i ? item.human.bones.rightHand : item.human.bones.leftHand).point)) };
  },
};
requestAnimationFrame(frame);
