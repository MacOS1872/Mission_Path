document.addEventListener('DOMContentLoaded', () => {

  const svgNS = "http://www.w3.org/2000/svg";

  // Mission data for animation
  const missions = [
    {
      id:'apollo11',
      name:'Apollo 11',
      planetName:'Moon',   
      date:'Jul 16–24, 1969',
      desc:'First crewed lunar landing.',
      dest:{x:450,y:120},
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg'
    },
    {
      id:'mars2020',
      name:'Mars 2020',
      planetName:'Mars',   
      date:'Launched Jul 30, 2020',
      desc:'Mars rover mission to Jezero Crater.',
      dest:{x:1100,y:100},
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'https://mars.nasa.gov/system/resources/detail_files/24886_PIA25027-320.jpg'
    },
    {
      id:'voyager1',
      name:'Voyager 1',
      planetName:'Voyager 1',   
      date:'Launched Sep 5, 1977',
      desc:'Interstellar probe.',
      dest:{x:1070,y:470},
      shipImg: 'images/ships/appollo11.png',
      planetImg: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Voyager_spacecraft_model_pic.png'
    },
    {
      id:'hubble',
      name:'Hubble Telescope',
      planetName:'Hubble Telescope', 
      date:'Launched Apr 24, 1990',
      desc:'Space telescope orbiting Earth.',
      dest:{x:770,y:460},
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hubble_Space_Telescope_-_GPN-2000-001817.jpg/320px-Hubble_Space_Telescope_-_GPN-2000-001817.jpg'
    },
    {
      id:'juno',
      name:'Juno Mission',
      planetName:'Jupiter',
      date:'Launched Aug 5, 2011',
      desc:'Jupiter exploration probe.',
      dest:{x:1150,y:330},
      shipImg: 'images/ships/Appollo11.png',
      planetImg: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg'
    }
  ];

  const missionButtonsDiv = document.getElementById('missionButtons');
  const missionInfo = document.getElementById('missionData'); // Previously 'missionData'
  const canvas = document.getElementById('canvas');
  const pathsGroup = document.getElementById('paths');
  const shipsGroup = document.getElementById('ships');
  const destinationsGroup = document.getElementById('destinations');
  const earthCoords = {x: 600, y: 300};

  let activeShip = null;
  let animationFrame = null;
  let lastTimestamp = null;

  // Create destination planet images once
  missions.forEach(m => {
    const g = document.createElementNS(svgNS,'g');
    g.setAttribute('class','destination-group');
    g.setAttribute('transform', `translate(${m.dest.x}, ${m.dest.y})`);

    const planetImage = document.createElementNS(svgNS, 'image');
    planetImage.setAttribute('href', m.planetImg);
    planetImage.setAttribute('width', 80);
    planetImage.setAttribute('height', 80);
    planetImage.setAttribute('x', -40);
    planetImage.setAttribute('y', -40);
    planetImage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    g.appendChild(planetImage);

    const label = document.createElementNS(svgNS,'text');
    label.setAttribute('class', 'destination-label');
    label.setAttribute('x', 0);
    label.setAttribute('y', 55);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = m.planetName;
    g.appendChild(label);
    destinationsGroup.appendChild(g);
  });

  // Build a cubic Bezier path from Earth to destination
  function buildArcPath(dest) {
    const mx = (earthCoords.x + dest.x) / 2;
    const my = (earthCoords.y + dest.y) / 2;
    const dx = dest.x - earthCoords.x;
    const dy = dest.y - earthCoords.y;
    const dist = Math.hypot(dx, dy);
    const lift = Math.max(70, Math.min(300, dist * 0.35));
    const cx1 = mx - lift * 0.4;
    const cy1 = my - lift;
    const cx2 = mx + lift * 0.4;
    const cy2 = my - lift;
    return `M ${earthCoords.x} ${earthCoords.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${dest.x} ${dest.y}`;
  }

  // Cleanup current animation
  function cleanupActiveShip() {
    if (!activeShip) return;
    activeShip.elShip.remove();
    activeShip.elTrail.remove();
    activeShip.pathEl.remove();
    if (activeShip.btn) {
      activeShip.btn.setAttribute('aria-pressed', 'false');
      activeShip.btn.disabled = false;
    }
    activeShip = null;
  }

  // Animate the spaceship along the path
  function animate(ts) {
    if (!activeShip) return;
    if (!lastTimestamp) lastTimestamp = ts;
    const delta = ts - lastTimestamp;
    lastTimestamp = ts;

    if (activeShip.playing) {
      const progressIncrement = delta * activeShip.speedMult / activeShip.duration;
      activeShip.progress += progressIncrement;
      if (activeShip.progress >= 1) activeShip.progress = 0;

      const lengthAtProgress = activeShip.progress * activeShip.totalLength;
      const point = activeShip.pathEl.getPointAtLength(lengthAtProgress);

      const deltaT = 0.001;
      const l1 = Math.max(0, lengthAtProgress - deltaT * activeShip.totalLength);
      const l2 = Math.min(activeShip.totalLength, lengthAtProgress + deltaT * activeShip.totalLength);
      const p1 = activeShip.pathEl.getPointAtLength(l1);
      const p2 = activeShip.pathEl.getPointAtLength(l2);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

      activeShip.elShip.setAttribute('transform', `translate(${point.x},${point.y}) rotate(${angle})`);

      const remaining = activeShip.totalLength * (1 - activeShip.progress);
      activeShip.elTrail.style.strokeDashoffset = remaining.toFixed(2);
      activeShip.elTrail.style.display = '';
    }

    animationFrame = requestAnimationFrame(animate);
  }

  // Start a mission animation
  function startMission(mission, btn) {
    if (activeShip) {
      cancelAnimationFrame(animationFrame);
      cleanupActiveShip();
    }

    pathsGroup.innerHTML = '';
    shipsGroup.innerHTML = '';

    [...missionButtonsDiv.children].forEach(b => {
      b.setAttribute('aria-pressed', 'false');
      b.disabled = false;
    });
    btn.setAttribute('aria-pressed', 'true');
    btn.disabled = true;

    const pathD = buildArcPath(mission.dest);
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', 'transparent');
    pathsGroup.appendChild(pathEl);

    const trail = document.createElementNS(svgNS, 'path');
    trail.setAttribute('d', pathD);
    trail.setAttribute('fill', 'none');
    trail.setAttribute('stroke', '#9be2ff');
    trail.setAttribute('stroke-width', '2');
    trail.setAttribute('stroke-linecap', 'round');
    trail.setAttribute('stroke-dasharray', '8 8');
    trail.style.strokeDashoffset = pathEl.getTotalLength();
    trail.setAttribute('class', 'trail');
    pathsGroup.appendChild(trail);

    const shipImg = document.createElementNS(svgNS, 'image');
    shipImg.setAttribute('href', mission.shipImg);
    shipImg.setAttribute('width', 40);
    shipImg.setAttribute('height', 40);
    shipImg.setAttribute('x', -20);
    shipImg.setAttribute('y', -20);
    shipImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    shipsGroup.appendChild(shipImg);

    const totalLength = pathEl.getTotalLength();
    const duration = 10000;

    activeShip = {
      mission,
      elShip: shipImg,
      elTrail: trail,
      pathEl,
      progress: 0,
      playing: true,
      speedMult: 1,
      duration,
      totalLength,
      btn
    };

    lastTimestamp = null;
    animationFrame = requestAnimationFrame(animate);
  }

  // Combined function: fetch mission data AND start animation
  function handleMissionClick(missionId, missionObj, btn) {
    // Fetch data from backend
    fetch('/mission/' + missionId)
      .then(response => response.json())
      .then(data => {
        missionInfo.innerHTML =
          `<h2>${data.name}</h2>
           <p>Destination: ${data.destination}</p>
           <p>Launch Date: ${data.launchDate}</p>
           <p>${data.summary}</p>`;
      })
      .catch(error => console.error('Error:', error));

    // Start SVG animation
    startMission(missionObj, btn);
  }

  // Create buttons and attach combined click handler
  missions.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'mission-btn';
    btn.type = 'button';
    btn.textContent = m.name;
    btn.setAttribute('aria-pressed', 'false');
    btn.title = `Launch ${m.name} mission`;
    btn.addEventListener('click', () => handleMissionClick(m.id, m, btn));
    missionButtonsDiv.appendChild(btn);
  });

});
