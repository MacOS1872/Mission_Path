document.addEventListener('DOMContentLoaded', () => {

  const svgNS = "http://www.w3.org/2000/svg";

  // Mission data (kept from your backend, with features from frontend)
  const missions = [
    {
      id: 'apollo11',
      name: 'Apollo 11',
      date: 'Jul 16–24, 1969',
      desc: 'First crewed lunar landing.',
      dest: { x: 250, y: 150 }, // moved/adjusted per frontend
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'images/planets/Moon.png',
      planetName: 'Moon'
    },
    {
      id: 'mars2020',
      name: 'Mars 2020',
      date: 'Launched Jul 30, 2020',
      desc: 'Mars rover mission to Jezero Crater.',
      dest: { x: 1100, y: 100 },
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'images/planets/mars.png',
      planetName: 'Mars'
    },
    {
      id: 'voyager1',
      name: 'Voyager 1',
      date: 'Launched Sep 5, 1977',
      desc: 'Interstellar probe.',
      dest: { x: 1070, y: 470 },
      shipImg: 'images/ships/VoyagerF.png',
      planetImg: '', // no planet image for voyager
      planetName: ''
    },
    {
      id: 'hubble',
      name: 'Hubble Telescope',
      date: 'Launched Apr 24, 1990',
      desc: 'Space telescope orbiting Earth.',
      dest: { x: 770, y: 460 },
      shipImg: 'images/ships/Hubble5.png',
      planetImg: '', // no planet image for hubble
      planetName: ''
    },
    {
      id: 'juno',
      name: 'Juno Mission',
      date: 'Launched Aug 5, 2011',
      desc: 'Jupiter exploration probe',
      dest: { x: 1150, y: 330 },
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'images/planets/Jupiter.gif',
      planetName: 'Jupiter'
    }
  ];

  // DOM refs (matching your backend)
  const missionButtonsDiv = document.getElementById('missionButtons');
  const missionInfo = document.getElementById('missionData'); // kept backend name
  const canvas = document.getElementById('canvas');
  const pathsGroup = document.getElementById('paths');
  const shipsGroup = document.getElementById('ships');
  const destinationsGroup = document.getElementById('destinations');
  const earthCoords = { x: 600, y: 300 };

  // Animation state (multiple ships supported)
  let activeShips = [];          // array of {mission, elShip, elTrail, pathEl, progress, ...}
  let animationFrame = null;
  let lastTimestamp = null;

  // Voyager reset distance used by super mode and normal mode where requested
  const VOYAGER_RESET_DISTANCE = 400;

  // ----------------------
  // Create destination planet images & labels
  // (This preserves backend behavior but skips planets when none specified)
  // ----------------------
  missions.forEach(m => {
    // If there's no planetImg, still create a label so user knows which mission is there.
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'destination-group');
    g.setAttribute('transform', `translate(${m.dest.x}, ${m.dest.y})`);

    if (m.planetImg) {
      const planetImage = document.createElementNS(svgNS, 'image');
      planetImage.setAttribute('href', m.planetImg);
      planetImage.setAttribute('width', 80);
      planetImage.setAttribute('height', 80);
      planetImage.setAttribute('x', -40);
      planetImage.setAttribute('y', -40);
      planetImage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      g.appendChild(planetImage);
    }

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('class', 'destination-label');
    label.setAttribute('x', 0);
    label.setAttribute('y', m.planetImg ? 55 : 5); // place label below image if image exists
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#eaf6ff');
    label.textContent = m.planetName;
    g.appendChild(label);

    destinationsGroup.appendChild(g);
  });

  // ----------------------
  // Utility: build cubic Bezier arc path
  // ----------------------
  function buildArcPath(dest, liftOverride = null) {
    const mx = (earthCoords.x + dest.x) / 2;
    const my = (earthCoords.y + dest.y) / 2;
    const dx = dest.x - earthCoords.x;
    const dy = dest.y - earthCoords.y;
    const dist = Math.hypot(dx, dy);
    const lift = liftOverride !== null ? liftOverride : Math.max(70, Math.min(300, dist * 0.35));
    const cx1 = mx - lift * 0.4;
    const cy1 = my - lift;
    const cx2 = mx + lift * 0.4;
    const cy2 = my - lift;
    return `M ${earthCoords.x} ${earthCoords.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${dest.x} ${dest.y}`;
  }

  // ----------------------
  // Apollo 11 custom path (smooth short-range Bezier)
  // ----------------------
  function buildApollo11Path() {
    const start = earthCoords;
    const end = { x: 250, y: 150 };
    const cp1 = { x: start.x - 50, y: start.y - 120 };
    const cp2 = { x: end.x + 50, y: end.y - 120 };
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  }

  // ----------------------
  // Cleanup all ships (remove ship elements & trails but *keep* planet images & buttons)
  // ----------------------
  function cleanupAllShips() {
    activeShips.forEach(s => {
      if (s.elShip) s.elShip.remove();
      if (s.elTrail) s.elTrail.remove();
      if (s.pathEl) s.pathEl.remove();
    });
    activeShips = [];
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastTimestamp = null;
  }

  // ----------------------
  // Create a ship + trail + path for a mission
  // speedMultiplier (not used everywhere) and superMode toggle
  // ----------------------
  function createShip(mission, speedMultiplier = 1, superMode = false) {
    // Create path element describing the route (used for both ship motion and trail)
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', 'transparent');

    if (mission.id === 'hubble') {
      // circular path used for trail (start at center)
      const r = 90;
      const cx = earthCoords.x;
      const cy = earthCoords.y;
      let d = `M ${cx} ${cy}`;
      const steps = 100;
      for (let i = 1; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        d += ` L ${x} ${y}`;
      }
      pathEl.setAttribute('d', d);
    } else if (mission.id === 'voyager1') {
      // flare path from Earth outward
      let d = `M ${earthCoords.x} ${earthCoords.y}`;
      const steps = 200;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = earthCoords.x + t * 1500;
        const y = earthCoords.y - 0.5 * Math.pow(t * 1500, 1.2);
        d += ` L ${x} ${y}`;
      }
      pathEl.setAttribute('d', d);
    } else if (mission.id === 'apollo11') {
      pathEl.setAttribute('d', buildApollo11Path());
    } else {
      // default Bezier arc
      pathEl.setAttribute('d', buildArcPath(mission.dest, mission.id === 'apollo11' ? 150 : null));
    }

    // Append path to SVG
    pathsGroup.appendChild(pathEl);

    // Create trail (stroke dashed) from same path
    const trail = document.createElementNS(svgNS, 'path');
    trail.setAttribute('d', pathEl.getAttribute('d'));
    trail.setAttribute('fill', 'none');
    trail.setAttribute('stroke', superMode ? '#fffa5c' : '#9be2ff');
    trail.setAttribute('stroke-width', 2);
    trail.setAttribute('stroke-linecap', 'round');
    trail.setAttribute('stroke-dasharray', '8 8');
    // initialize dashoffset to hide stroke, will be animated
    // Important: must use getTotalLength AFTER the element is inserted into the DOM
    trail.style.strokeDashoffset = pathEl.getTotalLength();
    pathsGroup.appendChild(trail);

    // Create the ship image element
    const shipImg = document.createElementNS(svgNS, 'image');
    shipImg.setAttribute('href', mission.shipImg);
    // Use a larger display size by default to match frontend example
    shipImg.setAttribute('width', 74);
    shipImg.setAttribute('height', 74);
    shipImg.setAttribute('x', -37);
    shipImg.setAttribute('y', -37);
    shipImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // give an SVG-friendly class for any CSS
    shipImg.classList.add('ship-image');
    shipsGroup.appendChild(shipImg);

    // Create ship object in activeShips
    const shipObj = {
      mission,
      elShip: shipImg,
      elTrail: trail,
      pathEl,
      progress: 0,
      speedMultiplier,
      superMode,
      totalLength: pathEl.getTotalLength()
    };

    activeShips.push(shipObj);

    // Ensure animation loop is running
    if (!animationFrame) {
      lastTimestamp = null;
      animationFrame = requestAnimationFrame(animateShips);
    }

    return shipObj;
  }

  // ----------------------
  // Animate all active ships
  // ----------------------
  function animateShips(ts) {
    if (!lastTimestamp) lastTimestamp = ts;
    const delta = ts - lastTimestamp;
    lastTimestamp = ts;

    activeShips.forEach(s => {
      const m = s.mission;
      const totalLength = s.totalLength;

      // HUBBLE: cinematic takeoff then orbit
      if (m.id === 'hubble') {
        const r = 90;
        if (s.progress < 0.12) { // first ~12%: slow takeoff
          const t = s.progress / 0.12;
          // simple outward motion to the right — adjust if you want a different launch vector
          const x = earthCoords.x + t * r;
          const y = earthCoords.y;
          s.elShip.setAttribute('transform', `translate(${x},${y}) rotate(0)`);
          if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength * (1 - s.progress);
          s.progress += delta / (s.superMode ? 2500 : 25000); // super or normal slow takeoff
        } else {
          // orbiting phase
          const orbitProgress = (s.progress - 0.12) / 0.88; // map remaining progress to [0..1]
          const angle = orbitProgress * 2 * Math.PI;
          const x = earthCoords.x + r * Math.cos(angle);
          const y = earthCoords.y + r * Math.sin(angle);
          const rot = angle * 180 / Math.PI + 90;
          s.elShip.setAttribute('transform', `translate(${x},${y}) rotate(${rot})`);
          if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength * (1 - s.progress);
          s.progress += delta / (s.superMode ? 2500 : 10000); // faster orbit after takeoff
        }
        if (s.progress > 1) s.progress -= 1;
      }

      // VOYAGER: flare path; reset after a set distance when in superMode or at path end otherwise
      else if (m.id === 'voyager1') {
        s.progress += delta / (s.superMode ? 2000 : 25000);
        let lengthAtProgress = s.progress * totalLength;

        // If in super mode, reset when reaching VOYAGER_RESET_DISTANCE
        if (s.superMode && lengthAtProgress >= VOYAGER_RESET_DISTANCE) {
          s.progress = 0;
          lengthAtProgress = 0;
          if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength; // reset trail
        }

        // Otherwise if not super mode, loop at end of path
        if (!s.superMode && s.progress >= 1) {
          s.progress = 0;
          if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength;
        }

        lengthAtProgress = s.progress * totalLength;
        const point = s.pathEl.getPointAtLength(lengthAtProgress);
        const deltaT = 0.001;
        const l1 = Math.max(0, lengthAtProgress - deltaT * totalLength);
        const l2 = Math.min(totalLength, lengthAtProgress + deltaT * totalLength);
        const p1 = s.pathEl.getPointAtLength(l1);
        const p2 = s.pathEl.getPointAtLength(l2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        s.elShip.setAttribute('transform', `translate(${point.x},${point.y}) rotate(${angle})`);
        if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength * (1 - s.progress);
      }

      // DEFAULT: generic missions follow their path looping
      else {
        s.progress += delta / (s.superMode ? 2000 : 10000);
        if (s.progress > 1) s.progress = 0;
        const lengthAtProgress = s.progress * totalLength;
        const point = s.pathEl.getPointAtLength(lengthAtProgress);
        const deltaT = 0.001;
        const l1 = Math.max(0, lengthAtProgress - deltaT * totalLength);
        const l2 = Math.min(totalLength, lengthAtProgress + deltaT * totalLength);
        const p1 = s.pathEl.getPointAtLength(l1);
        const p2 = s.pathEl.getPointAtLength(l2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        s.elShip.setAttribute('transform', `translate(${point.x},${point.y}) rotate(${angle})`);
        if (s.elTrail) s.elTrail.style.strokeDashoffset = totalLength * (1 - s.progress);
      }
    });

    animationFrame = requestAnimationFrame(animateShips);
  }

  // ----------------------
  // Handle mission click: fetch backend info THEN start animation for that mission
  // (keeps your backend priority)
  // ----------------------
  function handleMissionClick(missionId, missionObj) {
    // fetch textual data from backend endpoint
    fetch('/mission/' + missionId)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        // write into the backend-provided missionData element
        missionInfo.innerHTML = `
          <h2>${data.name}</h2>
          <p>Destination: ${data.destination || missionObj.planetName || ''}</p>
          <p>Launch Date: ${data.launchDate || missionObj.date}</p>
          <p>Description: ${data.desc || missionObj.desc}</p>
          <p>${data.summary || ''}</p>
        `;
      })
      .catch(err => {
        console.error('Fetch error:', err);
        // if backend fails, still populate minimal info from missionObj
        missionInfo.innerHTML = `<h2>${missionObj.name}</h2><p>${missionObj.desc}</p>`;
      });

    // Start SVG animation for that mission (clean single-launch behavior)
    cleanupAllShips();
    createShip(missionObj, 1, false);
  }

  // ----------------------
  // Build the mission buttons (preserve backend behavior)
  // ----------------------
  missions.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'mission-btn';
    btn.type = 'button';
    btn.textContent = m.name;
    btn.setAttribute('aria-pressed', 'false');
    btn.title = `Launch ${m.name} mission`;
    btn.addEventListener('click', () => handleMissionClick(m.id, m));
    missionButtonsDiv.appendChild(btn);
  });

  // ----------------------
  // Secret super-launch button (works anytime)
  // - does not remove mission buttons or planet images
  // - cleans up existing ships/trails then launches all ships in super mode
  // ----------------------
  const secretBtn = document.createElement('button');
  secretBtn.style.position = 'fixed';
  secretBtn.style.bottom = '10px';
  secretBtn.style.right = '10px';
  secretBtn.style.opacity = '0'; // invisible UI trigger
  secretBtn.textContent = 'SUPER LAUNCH';
  secretBtn.addEventListener('click', () => {
    cleanupAllShips();
    // launch all missions in superMode
    missions.forEach(m => createShip(m, 1, true));
  });
  document.body.appendChild(secretBtn);

  // ----------------------
  // Helpful CSS suggestion for pixel art images (optional but recommended).
  // If you have a stylesheet, add these rules; otherwise you can inject them here.
  // ----------------------
  (function injectPixelCSS() {
    const css = `
      /* keep pixel art crisp inside the SVG */
      svg image.ship-image {
        image-rendering: pixelated;
        shape-rendering: crispEdges;
      }
      /* other helpful visual defaults */
      .destination-label { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
    `;
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  })();

}); // DOMContentLoaded end