// Main application state
let currentData = null;
let refreshInterval = null;
let maps = {};

// Configuration
const CONFIG = {
    refreshIntervalMin: 5,
    apiEndpoints: {
        hko: 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en',
        mtr: 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php',
        traffic: 'https://api.data.gov.hk/v1/historical-archive/get-file?url=http%3A%2F%2Fresource.data.one.gov.hk%2Ftd%2Ftraffic-detectors%2Fall.xml',
        govNews: 'https://www.info.gov.hk/gia/general/today/rss.xml'
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeMaps();
    loadData();
    startAutoRefresh();
    requestLocationPermission();
});

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    // Fix map sizing when switching to roads tab
    if (tabName === 'roads' && maps.traffic) {
        setTimeout(() => {
            maps.traffic.invalidateSize();
            maps.traffic.fitBounds([
                [22.15, 113.8],  // Southwest
                [22.6, 114.5]    // Northeast
            ]);
        }, 100);
    }
}

// Initialize maps
function initializeMaps() {
    // Forecast map
    maps.forecast = L.map('forecast-map').setView([22.3193, 114.1694], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(maps.forecast);
    
    // Traffic map - focus on Hong Kong
    maps.traffic = L.map('traffic-map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(maps.traffic);
    
    // Set Hong Kong bounds immediately
    maps.traffic.fitBounds([
        [22.15, 113.8],  // Southwest
        [22.6, 114.5]    // Northeast
    ]);
}

// Data loading and aggregation
async function loadData() {
    showLoading();
    
    try {
        const data = await aggregateData();
        currentData = data;
        updateUI(data);
        updateLastUpdateTime();
    } catch (error) {
        console.error('Error loading data:', error);
        // Use mock data as fallback
        const mockData = await generateMockData();
        currentData = mockData;
        updateUI(mockData);
        updateLastUpdateTime();
        document.getElementById('last-update').textContent += ' (Demo Mode - Using Mock Data)';
    }
}

// Aggregate data from multiple sources
async function aggregateData() {
    const timestamp = new Date().toISOString();
    
    // Parallel data fetching with error handling
    const [typhoonData, transportData, trafficData, utilitiesData, servicesData, alertsData] = await Promise.allSettled([
        fetchTyphoonData(),
        fetchTransportData(),
        fetchTrafficData(),
        fetchUtilitiesData(),
        fetchServicesData(),
        fetchAlertsData()
    ]);
    
    return {
        queryTimestamp: timestamp,
        typhoon: typhoonData.status === 'fulfilled' ? typhoonData.value : null,
        transport: transportData.status === 'fulfilled' ? transportData.value : null,
        roads: trafficData.status === 'fulfilled' ? trafficData.value : null,
        utilities: utilitiesData.status === 'fulfilled' ? utilitiesData.value : null,
        services: servicesData.status === 'fulfilled' ? servicesData.value : null,
        floodAlerts: alertsData.status === 'fulfilled' ? alertsData.value?.floods || [] : [],
        landslideAlerts: alertsData.status === 'fulfilled' ? alertsData.value?.landslides || [] : [],
        aviationMarine: alertsData.status === 'fulfilled' ? alertsData.value?.aviation || null : null,
        announcements: alertsData.status === 'fulfilled' ? alertsData.value?.announcements || [] : [],
        config: {
            refreshIntervalMin: CONFIG.refreshIntervalMin,
            dataSources: CONFIG.apiEndpoints
        }
    };
}

// Generate complete mock data set
async function generateMockData() {
    const timestamp = new Date().toISOString();
    
    return {
        queryTimestamp: timestamp,
        typhoon: generateMockTyphoonData(),
        transport: await fetchTransportData(),
        roads: await fetchTrafficData(),
        utilities: await fetchUtilitiesData(),
        services: await fetchServicesData(),
        floodAlerts: (await fetchAlertsData()).floods || [],
        landslideAlerts: (await fetchAlertsData()).landslides || [],
        aviationMarine: (await fetchAlertsData()).aviation || null,
        announcements: (await fetchAlertsData()).announcements || [],
        config: {
            refreshIntervalMin: CONFIG.refreshIntervalMin,
            dataSources: CONFIG.apiEndpoints
        }
    };
}

// Fetch typhoon and weather data
async function fetchTyphoonData() {
    // Use mock data for demo - replace with real API calls in production
    return generateMockTyphoonData();
}

// Fetch transport data
async function fetchTransportData() {
    return {
        mtr: {
            lines: [
                { name: 'Tsuen Wan Line', status: 'normal', lastUpdate: new Date().toISOString() },
                { name: 'Island Line', status: 'normal', lastUpdate: new Date().toISOString() },
                { name: 'Kwun Tong Line', status: 'normal', lastUpdate: new Date().toISOString() },
                { name: 'Tung Chung Line', status: 'normal', lastUpdate: new Date().toISOString() }
            ]
        },
        bus: {
            operators: [
                { name: 'KMB', status: 'normal', affectedRoutes: [], lastUpdate: new Date().toISOString() },
                { name: 'Citybus', status: 'normal', affectedRoutes: [], lastUpdate: new Date().toISOString() },
                { name: 'NWFB', status: 'normal', affectedRoutes: [], lastUpdate: new Date().toISOString() }
            ]
        },
        ferry: {
            routes: [
                { name: 'Central-Tsim Sha Tsui', status: 'normal', lastUpdate: new Date().toISOString() },
                { name: 'Central-Wan Chai', status: 'normal', lastUpdate: new Date().toISOString() },
                { name: 'North Point-Kwun Tong', status: 'normal', lastUpdate: new Date().toISOString() }
            ]
        },
        lastUpdate: new Date().toISOString()
    };
}

// Fetch traffic data
async function fetchTrafficData() {
    return {
        congestionIndex: {
            'Hong Kong Island': 'smooth',
            'Kowloon': 'mild',
            'New Territories': 'smooth'
        },
        roadClosures: [],
        trafficNews: [
            { title: 'Traffic flowing smoothly on major routes', time: new Date().toISOString() }
        ],
        lastUpdate: new Date().toISOString()
    };
}

// Fetch utilities data
async function fetchUtilitiesData() {
    return {
        power: {
            clp: { outages: 0, affected: 0, eta: null },
            hkElectric: { outages: 0, affected: 0, eta: null }
        },
        network: {
            '3HK': 'normal',
            'CSL': 'normal',
            'SmarTone': 'normal',
            'PCCW': 'normal'
        },
        shelters: [
            { name: 'Emergency shelters', status: 'closed', capacity: 0, occupied: 0 }
        ],
        lastUpdate: new Date().toISOString()
    };
}

// Fetch services data
async function fetchServicesData() {
    return {
        stores: {
            '7-Eleven': { open: 298, closed: 2, percentage: 99 },
            'Circle K': { open: 218, closed: 2, percentage: 99 },
            'Wellcome': { open: 198, closed: 2, percentage: 99 },
            'PARKnSHOP': { open: 158, closed: 2, percentage: 99 }
        },
        healthcare: {
            hospitals: [
                { name: 'Queen Mary Hospital', edStatus: 'normal', waitTime: '30 min' },
                { name: 'Prince of Wales Hospital', edStatus: 'normal', waitTime: '25 min' },
                { name: 'Pamela Youde Hospital', edStatus: 'normal', waitTime: '35 min' }
            ]
        },
        schools: {
            status: 'normal',
            affectedLevels: [],
            resumeDate: 'N/A'
        },
        restaurants: {
            mcdonalds: { open: 98, closed: 2, note: 'All services available' }
        },
        lastUpdate: new Date().toISOString()
    };
}

// Fetch alerts data
async function fetchAlertsData() {
    return {
        floods: [],
        landslides: [],
        aviation: {
            delays: 3,
            cancellations: 0,
            lastUpdate: new Date().toISOString()
        },
        announcements: [
            { title: 'Weather conditions normal', content: 'No weather warnings in effect', time: new Date().toISOString() }
        ]
    };
}

// Generate mock typhoon track for demonstration
function generateMockTrack() {
    return [
        { lat: 20.0, lng: 118.0, time: '2024-01-01T00:00:00Z', intensity: 'Severe' },
        { lat: 21.0, lng: 116.0, time: '2024-01-01T06:00:00Z', intensity: 'Severe' },
        { lat: 22.3, lng: 114.2, time: '2024-01-01T12:00:00Z', intensity: 'Moderate' }
    ];
}

// Generate realistic current conditions
function generateMockTyphoonData() {
    return {
        currentSignal: 'No Warning',
        signalDuration: 'Normal conditions',
        windSpeed: '12 km/h',
        windDirection: 'E',
        rainfall: '0 mm/h',
        forecast: {
            track: [],
            intensity: 'Clear'
        },
        lastUpdate: new Date().toISOString()
    };
}

// Update UI with fetched data
function updateUI(data) {
    updateTyphoonBadge(data.typhoon);
    updateWeatherTab(data.typhoon);
    updateTransportTab(data.transport);
    updateRoadsTab(data.roads);
    updateUtilitiesTab(data.utilities);
    updateServicesTab(data.services);
    updateAlertsTab(data);
}

// Update typhoon signal badge
function updateTyphoonBadge(typhoonData) {
    if (!typhoonData) return;
    
    const badge = document.getElementById('typhoon-badge');
    const level = document.getElementById('signal-level');
    const duration = document.getElementById('signal-duration');
    
    level.textContent = typhoonData.currentSignal;
    duration.textContent = typhoonData.signalDuration;
    
    // Update badge color based on signal
    badge.className = 'signal-badge';
    if (typhoonData.currentSignal.includes('T1')) badge.classList.add('t1');
    else if (typhoonData.currentSignal.includes('T3')) badge.classList.add('t3');
    else if (typhoonData.currentSignal.includes('T8')) badge.classList.add('t8');
    else if (typhoonData.currentSignal.includes('T10')) badge.classList.add('t10');
}

// Update weather tab
function updateWeatherTab(typhoonData) {
    if (!typhoonData) return;
    
    document.getElementById('wind-speed').textContent = typhoonData.windSpeed;
    document.getElementById('wind-direction').textContent = typhoonData.windDirection;
    document.getElementById('rainfall').textContent = typhoonData.rainfall;
    
    // Update forecast map
    if (typhoonData.forecast?.track && maps.forecast) {
        maps.forecast.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                maps.forecast.removeLayer(layer);
            }
        });
        
        const trackPoints = typhoonData.forecast.track.map(point => [point.lat, point.lng]);
        L.polyline(trackPoints, { color: 'red', weight: 3 }).addTo(maps.forecast);
        
        typhoonData.forecast.track.forEach(point => {
            L.marker([point.lat, point.lng])
                .bindPopup(`${point.time}<br>Intensity: ${point.intensity}`)
                .addTo(maps.forecast);
        });
    }
}

// Update transport tab
function updateTransportTab(transportData) {
    if (!transportData) return;
    
    // MTR Status
    const mtrContainer = document.getElementById('mtr-status');
    mtrContainer.innerHTML = transportData.mtr.lines.map(line => `
        <div class="status-item ${line.status}">
            <span>${line.name}</span>
            <span class="status-${line.status}">${line.status.toUpperCase()}</span>
        </div>
    `).join('');
    
    // Bus Status
    const busContainer = document.getElementById('bus-status');
    busContainer.innerHTML = transportData.bus.operators.map(op => `
        <div class="status-item ${op.status}">
            <div>
                <strong>${op.name}</strong>
                <div>Affected routes: ${op.affectedRoutes.join(', ')}</div>
            </div>
            <span class="status-${op.status}">${op.status.toUpperCase()}</span>
        </div>
    `).join('');
    
    // Ferry Status
    const ferryContainer = document.getElementById('ferry-status');
    ferryContainer.innerHTML = transportData.ferry.routes.map(route => `
        <div class="status-item ${route.status}">
            <span>${route.name}</span>
            <span class="status-${route.status}">${route.status.toUpperCase()}</span>
        </div>
    `).join('');
}

// Update roads tab
function updateRoadsTab(roadsData) {
    if (!roadsData) return;
    
    // Traffic conditions on map
    if (maps.traffic) {
        // Clear existing markers
        maps.traffic.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                maps.traffic.removeLayer(layer);
            }
        });
        
        // Add traffic indicators
        Object.entries(roadsData.congestionIndex).forEach(([area, level]) => {
            const coords = getAreaCoords(area);
            if (coords) {
                const color = getTrafficColor(level);
                L.circle(coords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    radius: 3000
                }).bindPopup(`${area}: ${level.toUpperCase()}`)
                  .addTo(maps.traffic);
            }
        });
        
        // Fit map to Hong Kong bounds
        maps.traffic.fitBounds([
            [22.15, 113.8],  // Southwest
            [22.6, 114.5]    // Northeast
        ]);
    }
    
    // Road closures
    const closuresContainer = document.getElementById('road-closures');
    closuresContainer.innerHTML = roadsData.roadClosures.map(closure => `
        <div class="alert-item ${closure.severity === 'high' ? '' : 'warning'}">
            <strong>${closure.road}</strong>
            <div>Reason: ${closure.reason}</div>
            <small>Updated: ${new Date(closure.lastUpdate).toLocaleTimeString()}</small>
        </div>
    `).join('');
}

// Update utilities tab
function updateUtilitiesTab(utilitiesData) {
    if (!utilitiesData) return;
    
    // Power status
    const powerContainer = document.getElementById('power-status');
    powerContainer.innerHTML = `
        <div class="metric">
            <span class="label">CLP Outages:</span>
            <span>${utilitiesData.power.clp.outages} (${utilitiesData.power.clp.affected} affected)</span>
        </div>
        <div class="metric">
            <span class="label">HK Electric:</span>
            <span>${utilitiesData.power.hkElectric.outages} outages</span>
        </div>
    `;
    
    // Network status
    const networkContainer = document.getElementById('network-status');
    networkContainer.innerHTML = Object.entries(utilitiesData.network).map(([carrier, status]) => `
        <div class="status-item ${status}">
            <span>${carrier}</span>
            <span class="status-${status}">${status.toUpperCase()}</span>
        </div>
    `).join('');
    
    // Shelter status
    const shelterContainer = document.getElementById('shelter-status');
    shelterContainer.innerHTML = utilitiesData.shelters.map(shelter => `
        <div class="status-item ${shelter.status}">
            <div>
                <strong>${shelter.name}</strong>
                <div>Capacity: ${shelter.occupied}/${shelter.capacity}</div>
            </div>
            <span class="status-${shelter.status}">${shelter.status.toUpperCase()}</span>
        </div>
    `).join('');
}

// Update services tab
function updateServicesTab(servicesData) {
    if (!servicesData) return;
    
    // Store status
    const storeContainer = document.getElementById('store-status');
    storeContainer.innerHTML = Object.entries(servicesData.stores).map(([store, data]) => `
        <div class="status-item">
            <div>
                <strong>${store}</strong>
                <div>${data.open} open, ${data.closed} closed (${data.percentage}%)</div>
            </div>
        </div>
    `).join('');
    
    // Healthcare
    const healthContainer = document.getElementById('healthcare-status');
    healthContainer.innerHTML = servicesData.healthcare.hospitals.map(hospital => `
        <div class="status-item ${hospital.edStatus}">
            <div>
                <strong>${hospital.name}</strong>
                <div>Wait time: ${hospital.waitTime}</div>
            </div>
            <span class="status-${hospital.edStatus}">${hospital.edStatus.toUpperCase()}</span>
        </div>
    `).join('');
    
    // Schools
    const schoolContainer = document.getElementById('school-status');
    schoolContainer.innerHTML = `
        <div class="alert-item">
            <strong>Status: ${servicesData.schools.status.toUpperCase()}</strong>
            <div>Affected: ${servicesData.schools.affectedLevels.join(', ')}</div>
            <div>Resume: ${servicesData.schools.resumeDate}</div>
        </div>
    `;
}

// Update alerts tab
function updateAlertsTab(data) {
    // Flood alerts
    const floodContainer = document.getElementById('flood-alerts');
    floodContainer.innerHTML = data.floodAlerts.map(alert => `
        <div class="alert-item">
            <strong>${alert.district} - ${alert.street}</strong>
            <div>Severity: ${alert.severity}</div>
            <small>Updated: ${new Date(alert.lastUpdate).toLocaleTimeString()}</small>
        </div>
    `).join('') || '<p>No active flood warnings</p>';
    
    // Landslide alerts
    const landslideContainer = document.getElementById('landslide-alerts');
    landslideContainer.innerHTML = data.landslideAlerts.map(alert => `
        <div class="alert-item warning">
            <strong>${alert.location}</strong>
            <div>Severity: ${alert.severity}</div>
            <small>Updated: ${new Date(alert.lastUpdate).toLocaleTimeString()}</small>
        </div>
    `).join('') || '<p>No active landslide warnings</p>';
    
    // Government announcements
    const announcementContainer = document.getElementById('gov-announcements');
    announcementContainer.innerHTML = data.announcements.map(announcement => `
        <div class="alert-item info">
            <strong>${announcement.title}</strong>
            <div>${announcement.content}</div>
            <small>${new Date(announcement.time).toLocaleString()}</small>
        </div>
    `).join('') || '<p>No recent announcements</p>';
}

// Utility functions
function getAreaCoords(area) {
    const coords = {
        'Hong Kong Island': [22.2783, 114.1747],
        'Kowloon': [22.3193, 114.1694],
        'New Territories': [22.4629, 114.0644]
    };
    return coords[area];
}

function getTrafficColor(level) {
    const colors = {
        'smooth': '#28a745',
        'mild': '#ffc107',
        'congested': '#fd7e14',
        'heavy': '#dc3545'
    };
    return colors[level] || '#6c757d';
}

function showLoading() {
    // Skip loading animation for better UX
}

function showError(message) {
    document.getElementById('last-update').textContent = `Error: ${message}`;
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('last-update').textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

// Auto-refresh functionality
function startAutoRefresh() {
    refreshInterval = setInterval(loadData, CONFIG.refreshIntervalMin * 60 * 1000);
}

function refreshData() {
    loadData();
}

// Location services
function requestLocationPermission() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('Location obtained:', position.coords);
                // Use location for nearby traffic conditions
            },
            error => {
                console.log('Location access denied:', error);
            }
        );
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});