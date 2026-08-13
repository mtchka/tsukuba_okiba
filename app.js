/* global L */

const campusCenter = [36.10381, 140.10250];

const map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
}).setView(campusCenter, 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const mapContainer = document.getElementById('map');

if (!mapContainer) {
  throw new Error('マップ要素が見つかりません。');
}

const shapeOverlay = document.createElement('div');
shapeOverlay.className = 'shape-overlay';
shapeOverlay.innerHTML = '<img src="./tsuku.svg" alt="筑波大学のシルエット" />';
shapeOverlay.style.opacity = '1';
mapContainer.appendChild(shapeOverlay);

const baseShapeSize = 460.1;
let baseZoom = map.getZoom();

function getLatitudeScale(latitude) {
  return 1 / Math.cos(latitude * Math.PI / 180);
}

function createShapeIcon(size) {
  return L.divIcon({
    className: 'map-shape-icon',
    html: `
      <div class="fixed-shape-inner">
        <img src="./tsuku.svg" alt="筑波大学" />
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const fixedLayer = L.marker(campusCenter, {
  icon: createShapeIcon(baseShapeSize),
  title: '筑波大学',
  opacity: 0,
}).addTo(map);

let mode = 'centered';
let overlayPosition = { x: mapContainer.clientWidth / 2, y: mapContainer.clientHeight / 2 };
let fixedLatLng = campusCenter;
let currentShapeSize = baseShapeSize;
let rotation = 0;
let opacity = 100;
let dragState = null;

const rotationSlider = document.getElementById('rotation-slider');
const rotationValue = document.getElementById('rotation-value');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');

function setOverlayPosition(x, y) {
  overlayPosition = { x, y };
  shapeOverlay.style.left = `${x}px`;
  shapeOverlay.style.top = `${y}px`;
  shapeOverlay.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}

function setShapeSize(size) {
  const nextSize = Math.round(size);

  currentShapeSize = nextSize;
  shapeOverlay.style.width = `${nextSize}px`;
  shapeOverlay.style.height = `${nextSize}px`;

  fixedLayer.setIcon(createShapeIcon(nextSize));

  updateFixedLayerTransform();
}

function updateShapePresentation() {
  const zoomScale = map.getZoomScale(map.getZoom(), baseZoom);
  
  let latitudeScale = 1;


  if (mode === 'centered') {
    latitudeScale = getLatitudeScale(map.getCenter().lat);
    const size = baseShapeSize * zoomScale * latitudeScale;
    setShapeSize(size);
    setOverlayPosition(mapContainer.clientWidth / 2, mapContainer.clientHeight / 2);
  } else {
    latitudeScale = getLatitudeScale(fixedLatLng.lat);
    const size = baseShapeSize * zoomScale * latitudeScale;
    setShapeSize(size);
    updateOverlayFromMap();
  }
}

function updateOverlayFromMap() {
  const point = map.latLngToContainerPoint(fixedLatLng);
  setOverlayPosition(point.x, point.y);
}

function positionToLatLng() {
  return map.containerPointToLatLng([overlayPosition.x, overlayPosition.y]);
}

function applyMode(nextMode) {
  mode = nextMode;

  modeButtons.forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.mode === nextMode
    );
  });

  if (mode === 'fixed') {
    fixedLatLng = positionToLatLng();

    fixedLayer.setLatLng(fixedLatLng);
    fixedLayer.setOpacity(opacity / 100);
    
    shapeOverlay.classList.add('is-hidden');

    updateFixedLayerTransform();
  } else {
    fixedLayer.setOpacity(0);
    shapeOverlay.classList.remove('is-hidden');

    setOverlayPosition(
      mapContainer.clientWidth / 2,
      mapContainer.clientHeight / 2
    );
  }
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyMode(button.dataset.mode);
  });
});

rotationSlider.addEventListener('input', (event) => {
  rotation = parseInt(event.target.value);
  rotationValue.textContent = `${rotation}°`;
  setOverlayPosition(overlayPosition.x, overlayPosition.y);
  updateFixedLayerTransform();
});

opacitySlider.addEventListener('input', (event) => {
  opacity = parseInt(event.target.value);
  opacityValue.textContent = `${opacity}%`;
  shapeOverlay.style.opacity = `${opacity / 100}`;

  if (mode === 'fixed') {
    fixedLayer.setOpacity(opacity / 100);
  }


  updateFixedLayerTransform();
});

function updateFixedLayerTransform() {
  if (!fixedLayer || !fixedLayer._icon) {
    return;
  }

  const inner = fixedLayer._icon.querySelector('.fixed-shape-inner');

  if (!inner) {
    return;
  }

  inner.style.transform = `rotate(${rotation}deg)`;
}
/*
function beginDrag(event) {
  if (mode !== 'centered') {
    return;
  }

  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    startOverlayX: overlayPosition.x,
    startOverlayY: overlayPosition.y,
  };
  shapeOverlay.classList.add('is-dragging');
  event.preventDefault();
}

function onDrag(event) {
  if (!dragState || mode !== 'centered') {
    return;
  }

  const nextX = dragState.startOverlayX + (event.clientX - dragState.startX);
  const nextY = dragState.startOverlayY + (event.clientY - dragState.startY);
  setOverlayPosition(nextX, nextY);
}

function endDrag() {
  if (!dragState) {
    return;
  }

  dragState = null;
  shapeOverlay.classList.remove('is-dragging');
}

shapeOverlay.addEventListener('pointerdown', beginDrag);
shapeOverlay.addEventListener('pointermove', onDrag);
shapeOverlay.addEventListener('pointerup', endDrag);
shapeOverlay.addEventListener('pointerleave', endDrag);
shapeOverlay.addEventListener('pointercancel', endDrag);
*/


window.addEventListener('resize', () => {
  map.invalidateSize();
  updateShapePresentation();
});
map.on('zoom', () => {
  updateShapePresentation();
});

map.on('move', () => {
  updateShapePresentation();
});

baseZoom = map.getZoom();
updateShapePresentation();
applyMode(mode);
