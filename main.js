
// Remove imports, use globals: global.APP_CONFIG, global.AvatarSystem

// State
const state = {
    apiKey: (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_MAPS_API_KEY) || '',
    map: null,
    panorama: null,
    directionsService: null,
    directionsRenderer: null,
    currentRoute: null,
    currentPath: [], // Array of LatLng objects
    pathIndex: 0,
    isWalking: false,
    speed: 3, // Multiplier
    animationId: null,
    lastPanoPos: null
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    if (state.apiKey) {
        loadGoogleMaps(state.apiKey);
    }
});

function initUI() {


    // Playback
    document.getElementById('play-pause-btn').addEventListener('click', toggleWalking);
    document.getElementById('reset-btn').addEventListener('click', resetWalking);
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value, 10);
    });

    // Route
    document.getElementById('calculate-route-btn').addEventListener('click', calculateRoute);

    // Sidebar Toggle (Mobile)
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            const icon = toggleBtn.querySelector('i');
            if (sidebar.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }
}


// --- Google Maps Loader ---

function loadGoogleMaps(key) {
    if (window.google && window.google.maps) return; // Already loaded

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => alert('Google Maps APIの読み込みに失敗しました。APIキーを確認してください。');
    document.head.appendChild(script);

    window.initMap = initMap;
}

function initMap() {
    console.log('Google Maps Initialized');

    // Mini Map
    state.map = new google.maps.Map(document.getElementById('mini-map'), {
        center: { lat: 35.681236, lng: 139.767125 }, // Tokyo Station
        zoom: 14,
        disableDefaultUI: true,
        styles: [ // Dark mode map style
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
    });

    // Street View (The "Walk")
    state.panorama = new google.maps.StreetViewPanorama(
        document.getElementById('street-view'),
        {
            position: { lat: 35.681236, lng: 139.767125 },
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            disableDefaultUI: true,
            motionTracking: false,
            motionTrackingControl: false
        }
    );
    state.map.setStreetView(state.panorama);

    // Services
    state.directionsService = new google.maps.DirectionsService();
    state.directionsRenderer = new google.maps.DirectionsRenderer({
        map: state.map,
        preserveViewport: false
    });

    // Autocomplete
    new google.maps.places.Autocomplete(document.getElementById('origin-input'));
    new google.maps.places.Autocomplete(document.getElementById('destination-input'));

    // Marker for the walker
    state.marker = new google.maps.Marker({
        map: state.map,
        title: "現在地",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#38bdf8",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });
}

// --- Route Logic ---

async function calculateRoute() {
    const origin = document.getElementById('origin-input').value;
    const destination = document.getElementById('destination-input').value;

    if (!origin || !destination) {
        alert('出発点と目的地の両方を入力してください。');
        return;
    }

    document.getElementById('loading-overlay').classList.remove('hidden');

    try {
        const response = await new Promise((resolve, reject) => {
            state.directionsService.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.WALKING
            }, (result, status) => {
                if (status === 'OK') resolve(result);
                else reject(status);
            });
        });

        state.directionsRenderer.setDirections(response);
        state.currentRoute = response.routes[0];

        // Generate detailed path from steps
        state.currentPath = [];
        const detailedPath = [];
        const legs = state.currentRoute.legs;
        for (const leg of legs) {
            for (const step of leg.steps) {
                for (const point of step.path) {
                    // Avoid strict duplicates to prevent heading issues
                    if (detailedPath.length === 0 || !point.equals(detailedPath[detailedPath.length - 1])) {
                        detailedPath.push(point);
                    }
                }
            }
        }

        // Interpolate for smoother walking
        for (let i = 0; i < detailedPath.length - 1; i++) {
            const start = detailedPath[i];
            const end = detailedPath[i + 1];
            state.currentPath.push(start);

            // Add intermediate points (every ~5 meters)
            const dist = google.maps.geometry.spherical.computeDistanceBetween(start, end);
            const steps = Math.floor(dist / 5);

            for (let j = 1; j < steps; j++) {
                const fraction = j / steps;
                const interp = google.maps.geometry.spherical.interpolate(start, end, fraction);
                state.currentPath.push(interp);
            }
        }
        state.currentPath.push(detailedPath[detailedPath.length - 1]);

        // Reset state
        state.pathIndex = 0;
        resetWalking();

        // Initialize position
        updatePosition(0);

        // Enable controls
        document.getElementById('playback-controls').style.display = 'block';

        // Auto-start walking
        toggleWalking();

    } catch (error) {
        alert('ルートを計算できませんでした: ' + error);
        console.error(error);
    } finally {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
}

// --- Simulation Logic ---

function toggleWalking() {
    const btn = document.getElementById('play-pause-btn');
    if (state.isWalking) {
        // Pause
        state.isWalking = false;
        cancelAnimationFrame(state.animationId);
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        // Play
        if (state.currentPath.length === 0) return;
        state.isWalking = true;
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        walkLoop();
    }
}

function resetWalking() {
    state.isWalking = false;
    cancelAnimationFrame(state.animationId);
    state.pathIndex = 0;
    updatePosition(0);
    document.getElementById('play-pause-btn').innerHTML = '<i class="fa-solid fa-play"></i>';
}

function walkLoop() {
    if (!state.isWalking) return;

    // Speed determines how many points we skip/advance per frame.
    // Points are interpolated to be ~5 meters apart.
    // Normal walking is ~1.4 m/s. 5m / 1.4m/s ≈ 3.5s per segment.
    // At 60 FPS, 3.5s * 60 = 210 frames.
    // Increment per frame = 1 / 210 ≈ 0.005 (Base Speed)

    const baseIncrement = 0.005;
    const increment = baseIncrement * state.speed;

    state.pathIndex += increment;

    if (Math.floor(state.pathIndex) >= state.currentPath.length) {
        state.isWalking = false;
        state.pathIndex = state.currentPath.length - 1;
        document.getElementById('play-pause-btn').innerHTML = '<i class="fa-solid fa-play"></i>';
        alert('目的地に到着しました！');
        return;
    }

    updatePosition(state.pathIndex);

    state.animationId = requestAnimationFrame(walkLoop);
}

function updatePosition(indexFloat) {
    if (!state.map || !state.panorama) return;

    const i = Math.floor(indexFloat);
    const fraction = indexFloat - i;

    const startPoint = state.currentPath[i];
    const endPoint = state.currentPath[i + 1];

    if (!startPoint) return;

    // Interpolate current position
    let currentPos = startPoint;
    if (endPoint) {
        currentPos = google.maps.geometry.spherical.interpolate(startPoint, endPoint, fraction);
    }

    // Look ahead logic for smoother heading
    const lookAheadIndex = Math.min(Math.floor(indexFloat + 5), state.currentPath.length - 1);
    const lookAheadPoint = state.currentPath[lookAheadIndex];

    // Calculate heading
    if (lookAheadPoint && !currentPos.equals(lookAheadPoint)) {
        const heading = google.maps.geometry.spherical.computeHeading(currentPos, lookAheadPoint);
        state.heading = heading;
    }

    // --- Street View Update Throttling ---
    // Update Street View position only if moved more than 2.5 meters
    let shouldUpdatePano = false;
    if (!state.lastPanoPos) {
        shouldUpdatePano = true;
    } else {
        const distMoved = google.maps.geometry.spherical.computeDistanceBetween(state.lastPanoPos, currentPos);
        if (distMoved > 2.5) {
            shouldUpdatePano = true;
        }
    }

    if (shouldUpdatePano) {
        state.panorama.setPosition(currentPos);
        state.lastPanoPos = currentPos;
    }

    // Update POV every frame for smooth rotation
    state.panorama.setPov({
        heading: state.heading,
        pitch: 0
    });

    // Update Map Marker & Map Center every frame
    if (state.marker) {
        state.marker.setPosition(currentPos);
    }
    state.map.panTo(currentPos);
}
