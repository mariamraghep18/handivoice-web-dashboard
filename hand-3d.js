/**
 * HandiVoice PRO — High-Fidelity 3D Hand Simulation Engine (Three.js WebGL)
 * Realistic Anatomical Cyber-Medical Hand with 14 Articulated Joints
 * Accurate Sign Language Kinematics (Alif 'أ', Baa, Kaaf, etc.) & MPU6050 IMU Telemetry
 */

class Hand3DVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Hand3DVisualizer: Container #${containerId} not found.`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.handGroup = null;
    this.wristGroup = null;
    this.fingers = {};
    
    // Orbit / Drag State
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.userRotation = { x: 0.12, y: -0.18 };
    this.telemetryRot = { x: 0, y: 0, z: 0 };

    // Finger Bend Targets (0 = straight/extended, 100 = fully curled)
    this.targetBend = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
    this.currentBend = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      setTimeout(() => this.init(), 300);
      return;
    }

    const width = this.container.clientWidth || 380;
    const height = this.container.clientHeight || 280;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 15.5);

    // 3. WebGL Renderer with High-DPI & Shadow Support
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio & Cyber Lighting (Realistic Key + Cyan & Violet Rim)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 2.0);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 10, 12);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.6);
    fillLight.position.set(-6, -6, 8);
    this.scene.add(fillLight);

    const cyanRim = new THREE.PointLight(0x00f0ff, 3.2, 28);
    cyanRim.position.set(-7, 5, 5);
    this.scene.add(cyanRim);

    const purpleRim = new THREE.PointLight(0x8b24ff, 2.8, 28);
    purpleRim.position.set(7, -5, 5);
    this.scene.add(purpleRim);

    // 5. Construct 3D Anatomical Cyber-Medical Glove
    this.buildAnatomicalHand();

    // 6. Interactive Orbit & Touch Controls
    this.setupInteraction();

    // 7. Auto Resizing
    window.addEventListener('resize', () => this.onResize());

    // 8. Animation Render Loop
    this.animate();
  }

  buildAnatomicalHand() {
    this.handGroup = new THREE.Group();
    this.handGroup.position.set(0, -1.6, 0);

    // Realistic Materials (High-tech cyber-medical bionic skin & carbon)
    const skinBionicMat = new THREE.MeshStandardMaterial({
      color: 0x1e2538, // Sleek graphite/titanium skin tone
      roughness: 0.35,
      metalness: 0.65,
      flatShading: false
    });

    const palmPadMat = new THREE.MeshStandardMaterial({
      color: 0x161d2f,
      roughness: 0.45,
      metalness: 0.4
    });

    const knuckleMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.95
    });

    const flexRibbonMat = new THREE.MeshStandardMaterial({
      color: 0x8b24ff,
      emissive: 0x8b24ff,
      emissiveIntensity: 0.6,
      roughness: 0.25
    });

    // --- Wrist & ESP32-S3 Mount ---
    this.wristGroup = new THREE.Group();
    this.wristGroup.position.set(0, -1.3, 0);

    const wristGeo = new THREE.CylinderGeometry(1.5, 1.6, 1.4, 24);
    const wristMesh = new THREE.Mesh(wristGeo, skinBionicMat);
    this.wristGroup.add(wristMesh);

    // ESP32-S3 Microcontroller Module on wrist dorsal
    const chipGeo = new THREE.BoxGeometry(1.6, 0.9, 0.3);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.1
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(0, 0, 0.75);
    this.wristGroup.add(chipMesh);

    // Cyan Status LED
    const ledMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    ledMesh.position.set(0.6, 0.25, 0.92);
    this.wristGroup.add(ledMesh);

    this.handGroup.add(this.wristGroup);

    // --- Anatomical Palm ---
    const palmGeo = new THREE.BoxGeometry(3.5, 3.4, 1.05);
    const palmMesh = new THREE.Mesh(palmGeo, skinBionicMat);
    palmMesh.position.set(0, 1.2, 0);
    this.handGroup.add(palmMesh);

    // Palm Inner Grip Pad
    const padGeo = new THREE.BoxGeometry(2.8, 2.5, 0.2);
    const padMesh = new THREE.Mesh(padGeo, palmPadMat);
    padMesh.position.set(0, 1.2, -0.55);
    this.handGroup.add(padMesh);

    // Palm Dorsal Cyber Accent Plate
    const dorsalGeo = new THREE.BoxGeometry(2.6, 2.2, 0.15);
    const dorsalMesh = new THREE.Mesh(dorsalGeo, knuckleMat);
    dorsalMesh.position.set(0, 1.2, 0.55);
    this.handGroup.add(dorsalMesh);

    // --- 5 Articulated Realistic Fingers ---
    this.fingers.thumb  = this.createThumb(skinBionicMat, knuckleMat, flexRibbonMat);
    this.fingers.index  = this.createFinger('index',  -1.1, 2.9, 1.2, 1.05, 0.9, skinBionicMat, knuckleMat, flexRibbonMat);
    this.fingers.middle = this.createFinger('middle',  0.0, 3.1, 1.3, 1.15, 0.95, skinBionicMat, knuckleMat, flexRibbonMat);
    this.fingers.ring   = this.createFinger('ring',    1.1, 2.9, 1.2, 1.05, 0.9, skinBionicMat, knuckleMat, flexRibbonMat);
    this.fingers.pinky  = this.createFinger('pinky',   2.0, 2.5, 1.0, 0.9,  0.8, skinBionicMat, knuckleMat, flexRibbonMat);

    this.scene.add(this.handGroup);
  }

  createFinger(name, posX, posY, len1, len2, len3, matSkin, matJoint, matFlex) {
    const fingerRoot = new THREE.Group();
    fingerRoot.position.set(posX, posY, 0);

    // Knuckle Metacarpal Joint
    const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18), matJoint);
    fingerRoot.add(j1);

    // Phalanx 1 (Proximal)
    const p1Group = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, len1, 16), matSkin);
    b1.position.set(0, len1 / 2, 0);
    p1Group.add(b1);

    // Flex Sensor Ribbon 1
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, len1 * 0.88, 0.08), matFlex);
    r1.position.set(0, len1 / 2, 0.28);
    p1Group.add(r1);

    // Joint 2 (Interphalangeal)
    const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), matJoint);
    j2.position.set(0, len1, 0);
    p1Group.add(j2);

    // Phalanx 2 (Intermediate)
    const p2Group = new THREE.Group();
    p2Group.position.set(0, len1, 0);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, len2, 16), matSkin);
    b2.position.set(0, len2 / 2, 0);
    p2Group.add(b2);

    // Flex Sensor Ribbon 2
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, len2 * 0.88, 0.08), matFlex);
    r2.position.set(0, len2 / 2, 0.24);
    p2Group.add(r2);

    // Joint 3 (Distal Joint)
    const j3 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), matJoint);
    j3.position.set(0, len2, 0);
    p2Group.add(j3);

    // Phalanx 3 (Distal Fingertip Capsule)
    const p3Group = new THREE.Group();
    p3Group.position.set(0, len2, 0);
    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, len3, 16), matSkin);
    b3.position.set(0, len3 / 2, 0);
    p3Group.add(b3);

    // Rounded Fingertip Pad
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), matSkin);
    tip.position.set(0, len3, 0);
    p3Group.add(tip);

    p2Group.add(p3Group);
    p1Group.add(p2Group);
    fingerRoot.add(p1Group);

    this.handGroup.add(fingerRoot);

    return { root: fingerRoot, p1: p1Group, p2: p2Group, p3: p3Group };
  }

  createThumb(matSkin, matJoint, matFlex) {
    const thumbRoot = new THREE.Group();
    thumbRoot.position.set(-1.85, 0.5, 0.25);
    thumbRoot.rotation.z = Math.PI / 5.2; // Natural human thumb opposition angle
    thumbRoot.rotation.y = -Math.PI / 5.5;

    // Metacarpal Joint
    const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 18), matJoint);
    thumbRoot.add(j1);

    // Proximal Phalanx
    const p1Group = new THREE.Group();
    const len1 = 1.35;
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, len1, 16), matSkin);
    b1.position.set(0, len1 / 2, 0);
    p1Group.add(b1);

    // Distal Joint & Phalanx
    const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), matJoint);
    j2.position.set(0, len1, 0);
    p1Group.add(j2);

    const p2Group = new THREE.Group();
    p2Group.position.set(0, len1, 0);
    const len2 = 1.1;
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, len2, 16), matSkin);
    b2.position.set(0, len2 / 2, 0);
    p2Group.add(b2);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), matSkin);
    tip.position.set(0, len2, 0);
    p2Group.add(tip);

    p1Group.add(p2Group);
    thumbRoot.add(p1Group);

    this.handGroup.add(thumbRoot);

    return { root: thumbRoot, p1: p1Group, p2: p2Group, p3: null };
  }

  setFlexion(thumbPct, indexPct, middlePct, ringPct, pinkyPct) {
    this.targetBend.thumb  = Math.max(0, Math.min(100, thumbPct || 0));
    this.targetBend.index  = Math.max(0, Math.min(100, indexPct || 0));
    this.targetBend.middle = Math.max(0, Math.min(100, middlePct || 0));
    this.targetBend.ring   = Math.max(0, Math.min(100, ringPct || 0));
    this.targetBend.pinky  = Math.max(0, Math.min(100, pinkyPct || 0));
  }

  /**
   * ACCURATE SIGN LANGUAGE POSE KINEMATICS
   * Accurately renders letters like 'أ' (Alif: Index pointing straight up, thumb tucked, others closed)
   */
  applySignGesture(cleanLabel) {
    switch (cleanLabel) {
      case 'أ': // Alif: Index finger pointing straight up! Middle, Ring, Pinky curled tightly, Thumb tucked across
        this.setFlexion(82, 0, 96, 96, 96);
        this.telemetryRot = { x: 0.1, y: 0.05, z: 0 };
        break;

      case 'ب': // Baa: All 4 fingers flat & upright, thumb folded across palm
        this.setFlexion(85, 2, 2, 2, 2);
        this.telemetryRot = { x: 0.05, y: -0.1, z: 0 };
        break;

      case 'ت': // Taa: Index and Middle upright (two dots), Ring and Pinky closed, Thumb tucked
        this.setFlexion(85, 2, 4, 95, 95);
        this.telemetryRot = { x: 0.05, y: 0.0, z: 0 };
        break;

      case 'ث': // Thaa: Index, Middle, Ring upright (three dots), Pinky curled, Thumb tucked
        this.setFlexion(85, 2, 4, 6, 95);
        this.telemetryRot = { x: 0.05, y: 0.0, z: 0 };
        break;

      case 'ج': // Jeem / C-shape curved hand
        this.setFlexion(45, 45, 45, 45, 45);
        this.telemetryRot = { x: 0.2, y: -0.35, z: 0 };
        break;

      case 'ح': // Haa: Flat horizontal open hand
        this.setFlexion(10, 5, 5, 5, 5);
        this.telemetryRot = { x: 0.35, y: -0.5, z: 0.1 };
        break;

      case 'خ': // Khaa: Bent claw grip
        this.setFlexion(40, 60, 60, 60, 60);
        this.telemetryRot = { x: 0.2, y: -0.2, z: 0 };
        break;

      case 'د': // Dal: Index & Thumb curved together like D, others closed
        this.setFlexion(40, 45, 95, 95, 95);
        this.telemetryRot = { x: 0.1, y: -0.2, z: 0 };
        break;

      case 'ر': // Raa: Crossed / curved index pointing downward
        this.setFlexion(75, 45, 95, 95, 95);
        this.telemetryRot = { x: -0.25, y: 0.1, z: 0 };
        break;

      case 'س': // Seen: 3 fingers upright, pinky tucked
        this.setFlexion(75, 2, 2, 2, 90);
        this.telemetryRot = { x: 0.05, y: 0.0, z: 0 };
        break;

      case 'ص': // Saad: Closed fist with thumb wrapped
      case 'ض': // Daad: Closed fist
        this.setFlexion(95, 95, 95, 95, 95);
        this.telemetryRot = { x: 0.18, y: 0.1, z: 0 };
        break;

      case 'ط': // Taa: Flat hand pointing forward
        this.setFlexion(20, 5, 5, 5, 5);
        this.telemetryRot = { x: 0.45, y: 0.0, z: 0 };
        break;

      case 'ع': // Ayn: V-shape (Index and Middle spread)
        this.setFlexion(85, 2, 2, 95, 95);
        this.telemetryRot = { x: 0.05, y: 0.15, z: 0 };
        break;

      case 'ف': // Faa: Index curled with thumb touching, 3 other fingers upright (OK sign)
        this.setFlexion(50, 55, 2, 2, 2);
        this.telemetryRot = { x: 0.1, y: 0.0, z: 0 };
        break;

      case 'ق': // Qaaf: Index and Thumb curved pointing down
        this.setFlexion(30, 35, 95, 95, 95);
        this.telemetryRot = { x: -0.3, y: 0.0, z: 0 };
        break;

      case 'ك': // Kaaf: Flat open hand held upright
        this.setFlexion(4, 2, 2, 2, 4);
        this.telemetryRot = { x: 0.05, y: 0.0, z: 0 };
        break;

      case 'ل': // Laam: L-shape (Thumb extended sideways, Index extended upright, other 3 curled)
        this.setFlexion(0, 0, 95, 95, 95);
        this.telemetryRot = { x: 0.05, y: 0.0, z: 0 };
        break;

      case 'م': // Meem: Fist curled forward
        this.setFlexion(90, 85, 85, 85, 85);
        this.telemetryRot = { x: 0.35, y: 0.0, z: 0 };
        break;

      case 'ن': // Noon: Single index bent hooked, others closed
        this.setFlexion(80, 50, 95, 95, 95);
        this.telemetryRot = { x: 0.1, y: 0.0, z: 0 };
        break;

      case 'و': // Waw: Circle formed with thumb & index, others upright
        this.setFlexion(45, 50, 5, 5, 5);
        this.telemetryRot = { x: 0.15, y: 0.0, z: 0 };
        break;

      case 'ي': // Yaa: Shaka sign (Thumb and Pinky extended, Middle three fingers curled)
        this.setFlexion(0, 95, 95, 95, 0);
        this.telemetryRot = { x: 0.1, y: 0.0, z: 0 };
        break;

      case 'مسافة': // Space: Relaxed open palm facing forward
        this.setFlexion(15, 12, 12, 12, 15);
        this.telemetryRot = { x: -0.15, y: 0.0, z: 0 };
        break;

      default:
        // Use real dataset telemetry if available
        if (window.HANDIVOICE_DATASET) {
          const match = window.HANDIVOICE_DATASET.find(g => g.cleanLabel === cleanLabel);
          if (match) {
            this.setFlexion(
              match.thumb_bend_pct,
              match.index_bend_pct,
              match.middle_bend_pct,
              match.ring_bend_pct,
              match.pinky_bend_pct
            );
            return;
          }
        }
        this.setFlexion(30, 20, 20, 30, 40);
        break;
    }
  }

  setIMUOrientation(ax, ay, az) {
    const roll  = Math.atan2(ay, az);
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

    this.telemetryRot.x = pitch * 0.45;
    this.telemetryRot.z = roll * 0.45;
  }

  setupInteraction() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.prevMousePos.x;
      const deltaY = e.clientY - this.prevMousePos.y;

      this.userRotation.y += deltaX * 0.012;
      this.userRotation.x += deltaY * 0.012;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.prevMousePos.x;
      const deltaY = e.touches[0].clientY - this.prevMousePos.y;

      this.userRotation.y += deltaX * 0.015;
      this.userRotation.x += deltaY * 0.015;
      this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Kinematics Smoothing
    const lerpSpeed = 0.16;
    ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach(f => {
      this.currentBend[f] += (this.targetBend[f] - this.currentBend[f]) * lerpSpeed;
    });

    // Apply flexion angles along X-axis
    ['index', 'middle', 'ring', 'pinky'].forEach(f => {
      const finger = this.fingers[f];
      if (!finger) return;

      const bendRad = (this.currentBend[f] / 100) * (Math.PI * 0.52);

      finger.p1.rotation.x = bendRad * 0.85;
      finger.p2.rotation.x = bendRad * 0.95;
      finger.p3.rotation.x = bendRad * 0.70;
    });

    if (this.fingers.thumb) {
      const thumbRad = (this.currentBend.thumb / 100) * (Math.PI * 0.48);
      this.fingers.thumb.p1.rotation.x = thumbRad * 0.85;
      this.fingers.thumb.p1.rotation.z = -thumbRad * 0.4;
      this.fingers.thumb.p2.rotation.x = thumbRad * 0.9;
    }

    // Apply Combined Rotation
    if (this.handGroup) {
      this.handGroup.rotation.x = this.userRotation.x + this.telemetryRot.x;
      this.handGroup.rotation.y = this.userRotation.y + this.telemetryRot.y;
      this.handGroup.rotation.z = this.telemetryRot.z;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Hand3DVisualizer = Hand3DVisualizer;
