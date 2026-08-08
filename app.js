/* global L */

const campusCenter = [36.1077, 140.1023];

const map = L.map('map', {
  zoomControl: true,
  attributionControl: true,
}).setView(campusCenter, 14);

window.__tsukuMap = map;

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
mapContainer.appendChild(shapeOverlay);

const baseShapeSize = 220;
let baseZoom = map.getZoom();

function createShapeIcon(size) {
  return L.icon({
    iconUrl: './tsuku.svg',
    className: 'map-shape-icon',
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

function setOverlayPosition(x, y) {
  overlayPosition = { x, y };
  shapeOverlay.style.left = `${x}px`;
  shapeOverlay.style.top = `${y}px`;
  shapeOverlay.style.transform = 'translate(-50%, -50%)';
}

function setShapeSize(size) {
  const nextSize = Math.max(64, Math.round(size));

  currentShapeSize = nextSize;
  shapeOverlay.style.width = `${nextSize}px`;
  shapeOverlay.style.height = `${nextSize}px`;
  fixedLayer.setIcon(createShapeIcon(nextSize));
}

function updateShapePresentation() {
  const zoomScale = map.getZoomScale(map.getZoom(), baseZoom);
  setShapeSize(baseShapeSize * zoomScale);

  if (mode === 'centered') {
    setOverlayPosition(mapContainer.clientWidth / 2, mapContainer.clientHeight / 2);
  } else {
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
    button.classList.toggle('active', button.dataset.mode === nextMode);
  });

  if (mode === 'fixed') {
    fixedLatLng = positionToLatLng();
    fixedLayer.setLatLng(fixedLatLng);
    fixedLayer.setOpacity(1);
    shapeOverlay.classList.add('is-hidden');
  } else {
    fixedLayer.setOpacity(0);
    shapeOverlay.classList.remove('is-hidden');
    setOverlayPosition(mapContainer.clientWidth / 2, mapContainer.clientHeight / 2);
  }
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyMode(button.dataset.mode);
  });
});
window.addEventListener('resize', () => {
  updateShapePresentation();
});
map.on('zoom', () => {
  updateShapePresentation();
});

L.marker(campusCenter, {
  title: '筑波大学',
})
  .addTo(map)
  .bindPopup('筑波大学')
  .openPopup();

map.fitBounds([[36.09, 140.07], [36.12, 140.13]], { padding: [24, 24] });
baseZoom = map.getZoom();
updateShapePresentation();
applyMode(mode);
