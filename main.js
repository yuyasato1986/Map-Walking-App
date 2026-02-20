
import { avatars, renderAvatars, updateAvatarOverlay } from './avatar.js';
import { config } from './config.js';

// State
const state = {
    apiKey: config.GOOGLE_MAPS_API_KEY || localStorage.getItem('google_maps_api_key') || '',
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
    currentAvatar: 'walker-1',
    heading: 0
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    if (state.apiKey) {
        document.getElementById('api-key-input').value = state.apiKey;
        loadGoogleMaps(state.apiKey);
    }
});

function initUI() {
    // API Key
    document.getElementById('set-api-key-btn').addEventListener('click', () => {
        const key = document.getElementById('api-key-input').value.trim();
        if (key) {
            localStorage.setItem('google_maps_api_key', key);
            state.apiKey = key;
            loadGoogleMaps(key);
            alert('API Key saved! Reloading...'); // Reload to load script
            location.reload();
        }
    });

    // Avatars
    renderAvatars('avatar-list', (id) => {
        state.currentAvatar = id;
        // Re-render to update selection style
        renderAvatars('avatar-list', (newId) => {
            state.currentAvatar = newId;
            updateAvatarOverlay('avatar-overlay', state.currentAvatar, state.isWalking);
            renderAvatars('avatar-list', null, state.currentAvatar); // redraw selection
        }, state.currentAvatar);

        updateAvatarOverlay('avatar-overlay', state.currentAvatar, state.isWalking);
    }, state.currentAvatar);

    // Initial render
    renderAvatars('avatar-list', (id) => {
        state.currentAvatar = id;
        updateAvatarOverlay('avatar-overlay', state.currentAvatar, state.isWalking);
        // recursive re-render to separate concerns would be better, but for now just re-calling the init logic is messy.
        // Let's simplify.
        // Actually, let's just make the callback update the state and internal DOM, checking the implementation of renderAvatars.
        // checking avatar.js... it clears innerHTML. So we need to re-render the whole list to change class 'selected'.
        renderAvatarsWrapper(id);
    }, state.currentAvatar);

    updateAvatarOverlay('avatar-overlay', state.currentAvatar, false);

    // Playback
    document.getElementById('play-pause-btn').addEventListener('click', toggleWalking);
    document.getElementById('reset-btn').addEventListener('click', resetWalking);
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value, 10);
    });

    // Route
    document.getElementById('calculate-route-btn').addEventListener('click', calculateRoute);
}

// Wrapper to handle re-rendering for selection state
function renderAvatarsWrapper(selectedId) {
    renderAvatars('avatar-list', (id) => {
        state.currentAvatar = id;
        updateAvatarOverlay('avatar-overlay', state.currentAvatar, state.isWalking);
        renderAvatarsWrapper(id);
    }, selectedId);
}

// --- Google Maps Loader ---

function loadGoogleMaps(key) {
    if (window.google && window.google.maps) return; // Already loaded

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => alert('Failed to load Google Maps API. Check your key.');
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
}

// --- Route Logic ---

async function calculateRoute() {
    const origin = document.getElementById('origin-input').value;
    const destination = document.getElementById('destination-input').value;

    if (!origin || !destination) {
        alert('Please enter both start and end points.');
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

        // Flatten path for processing
        state.currentPath = [];
        const overviewPath = state.currentRoute.overview_path;

        // Interpolate for smoother walking (simple linear interpolation)
        for (let i = 0; i < overviewPath.length - 1; i++) {
            const start = overviewPath[i];
            const end = overviewPath[i + 1];
            state.currentPath.push(start);

            // Add intermediate points (every ~5 meters roughly)
            const dist = google.maps.geometry.spherical.computeDistanceBetween(start, end);
            const steps = Math.floor(dist / 5);

            for (let j = 1; j < steps; j++) {
                const fraction = j / steps;
                const interp = google.maps.geometry.spherical.interpolate(start, end, fraction);
                state.currentPath.push(interp);
            }
        }
        state.currentPath.push(overviewPath[overviewPath.length - 1]);

        // Reset state
        state.pathIndex = 0;
        resetWalking();

        // Initialize position
        updatePosition(0);

        // Enable controls
        document.getElementById('playback-controls').style.display = 'block';

    } catch (error) {
        alert('Could not calculate route: ' + error);
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
        updateAvatarOverlay('avatar-overlay', state.currentAvatar, false);
    } else {
        // Play
        if (state.currentPath.length === 0) return;
        state.isWalking = true;
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        walkLoop();
        updateAvatarOverlay('avatar-overlay', state.currentAvatar, true);
    }
}

function resetWalking() {
    state.isWalking = false;
    cancelAnimationFrame(state.animationId);
    state.pathIndex = 0;
    updatePosition(0);
    document.getElementById('play-pause-btn').innerHTML = '<i class="fa-solid fa-play"></i>';
    updateAvatarOverlay('avatar-overlay', state.currentAvatar, false);
}

function walkLoop() {
    if (!state.isWalking) return;

    // Speed determines how many points we skip/advance per frame (or update frequency)
    // For simplicity, we just increment index based on speed roughly
    // A better approach would be time-based delta, but this is a prototype

    // Slow down the loop slightly to be realistic, or just use speed to skip frames

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
        updateAvatarOverlay('avatar-overlay', state.currentAvatar, false);
        alert('Arrived at destination!');
        return;
    }

    updatePosition(Math.floor(state.pathIndex));

    state.animationId = requestAnimationFrame(walkLoop);
}

function updatePosition(index) {
    if (!state.map || !state.panorama) return;

    const point = state.currentPath[index];
    const nextPoint = state.currentPath[index + 1] || point;

    // Calculate heading to next point
    const heading = google.maps.geometry.spherical.computeHeading(point, nextPoint);

    // Only update heading if we are moving significantly
    if (index < state.currentPath.length - 1) {
        state.heading = heading;
    }

    // Update Street View
    // Note: setPosition finds the nearest panorama. It might jump if points are far from road.
    state.panorama.setPosition(point);
    state.panorama.setPov({
        heading: state.heading,
        pitch: 0
    });

    // Update Map Marker (optional, but good for feedback)
    // could add a marker tracking logic here
    state.map.panTo(point);
}
