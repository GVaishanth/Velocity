/* ============================================
   VELOCITY — TRACKS DATA
   30 original fictional racing circuits
   with unique characteristics and SVG paths
   ============================================ */

/* Track type characteristics */
const TRACK_TYPES = {
    STREET: { name: 'Street Circuit', overtaking: 2, tireWear: 4 },
    PERMANENT: { name: 'Permanent Circuit', overtaking: 6, tireWear: 6 },
    HIGH_SPEED: { name: 'High-Speed', overtaking: 8, tireWear: 5 },
    TECHNICAL: { name: 'Technical', overtaking: 3, tireWear: 7 },
    MIXED: { name: 'Mixed Layout', overtaking: 5, tireWear: 6 }
};

const TRACKS_DATA = [
    {
        id: 'royal_park',
        name: 'Royal Park Circuit',
        country: 'United Kingdom',
        flag: '🇬🇧',
        city: 'Westhampton',
        type: 'HIGH_SPEED',
        length: 5.891,
        laps: 52,
        corners: 18,
        drsZones: 2,
        baseLapTime: 88.5,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 45,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Fast, flowing corners and long straights make this a power circuit favorite.',
        svgPath: 'M 100 300 Q 120 200 200 180 Q 280 170 340 220 L 420 230 Q 480 240 500 290 L 550 350 Q 580 400 540 440 L 460 460 Q 380 470 320 440 L 260 410 Q 200 390 160 410 L 130 430 Q 100 420 90 370 Z',
        sectors: [
            { x: 100, y: 300 },
            { x: 340, y: 220 },
            { x: 540, y: 440 }
        ],
        pitLane: { startX: 90, startY: 320, endX: 200, endY: 320 }
    },
    {
        id: 'crimson_bay',
        name: 'Crimson Bay GP',
        country: 'Monaco',
        flag: '🇲🇨',
        city: 'Crimson Harbor',
        type: 'STREET',
        length: 3.337,
        laps: 78,
        corners: 19,
        drsZones: 1,
        baseLapTime: 73.2,
        overtakingDifficulty: 9,
        tireDegradation: 3,
        rainProbability: 30,
        safetyCarProbability: 60,
        nightRace: false,
        description: 'A legendary harbor street circuit. Tight, twisty, and unforgiving.',
        svgPath: 'M 120 400 L 200 400 Q 240 400 240 360 L 240 280 Q 240 240 280 240 L 360 240 Q 400 240 400 280 L 400 320 L 480 320 L 480 280 Q 480 240 520 240 L 560 240 Q 580 240 580 270 L 580 380 Q 580 420 540 420 L 460 420 Q 420 420 420 380 L 420 360 L 340 360 L 340 400 Q 340 440 300 440 L 160 440 Q 120 440 120 400 Z',
        sectors: [
            { x: 120, y: 400 },
            { x: 400, y: 280 },
            { x: 580, y: 380 }
        ],
        pitLane: { startX: 120, startY: 420, endX: 200, endY: 420 }
    },
    {
        id: 'mountain_pass',
        name: 'Mountain Pass Speedway',
        country: 'Belgium',
        flag: '🇧🇪',
        city: 'Alpine Valley',
        type: 'MIXED',
        length: 7.004,
        laps: 44,
        corners: 19,
        drsZones: 2,
        baseLapTime: 105.8,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 65,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'A long, sweeping mountain circuit with dramatic elevation and unpredictable weather.',
        svgPath: 'M 80 350 L 180 350 Q 220 350 240 320 L 280 260 Q 300 220 340 220 L 460 220 Q 500 220 510 260 L 530 320 L 580 340 Q 620 360 600 400 L 560 460 Q 540 490 500 480 L 380 460 Q 340 450 320 470 L 280 500 Q 240 510 220 480 L 180 430 L 120 430 Q 80 430 70 400 Z',
        sectors: [
            { x: 80, y: 350 },
            { x: 340, y: 220 },
            { x: 600, y: 400 }
        ],
        pitLane: { startX: 80, startY: 370, endX: 180, endY: 370 }
    },
    {
        id: 'sunset_boulevard',
        name: 'Sunset Boulevard Circuit',
        country: 'UAE',
        flag: '🇦🇪',
        city: 'New Marina',
        type: 'MIXED',
        length: 5.281,
        laps: 55,
        corners: 21,
        drsZones: 2,
        baseLapTime: 99.1,
        overtakingDifficulty: 6,
        tireDegradation: 5,
        rainProbability: 5,
        safetyCarProbability: 25,
        nightRace: true,
        description: 'A modern marina circuit that races into the desert sunset under floodlights.',
        svgPath: 'M 100 280 L 220 280 Q 260 280 280 310 L 320 360 L 380 360 Q 420 360 420 320 L 420 240 Q 420 200 460 200 L 540 200 Q 580 200 580 240 L 580 380 Q 580 420 540 430 L 440 450 Q 380 460 340 430 L 260 400 Q 200 380 160 400 L 110 420 Q 80 410 80 380 Z',
        sectors: [
            { x: 100, y: 280 },
            { x: 420, y: 240 },
            { x: 540, y: 430 }
        ],
        pitLane: { startX: 100, startY: 300, endX: 200, endY: 300 }
    },
    {
        id: 'imperial_forest',
        name: 'Imperial Forest Track',
        country: 'Japan',
        flag: '🇯🇵',
        city: 'Tanaka Prefecture',
        type: 'TECHNICAL',
        length: 5.807,
        laps: 53,
        corners: 18,
        drsZones: 1,
        baseLapTime: 92.4,
        overtakingDifficulty: 7,
        tireDegradation: 8,
        rainProbability: 40,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A figure-8 circuit weaving through ancient forest. Technical brilliance required.',
        svgPath: 'M 100 350 Q 100 300 150 280 L 240 240 Q 280 220 320 240 L 360 280 L 400 320 Q 420 340 400 360 L 360 380 Q 320 380 300 340 L 280 280 Q 280 240 320 220 L 400 200 Q 480 200 520 240 L 560 290 Q 580 340 550 380 L 480 420 Q 400 440 340 420 L 280 400 Q 220 380 160 400 L 110 410 Q 80 400 90 370 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 360, y: 280 },
            { x: 480, y: 420 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 200, endY: 370 }
    },
    {
        id: 'desert_mirage',
        name: 'Desert Mirage Raceway',
        country: 'Bahrain',
        flag: '🇧🇭',
        city: 'Sahir',
        type: 'PERMANENT',
        length: 5.412,
        laps: 57,
        corners: 15,
        drsZones: 3,
        baseLapTime: 91.6,
        overtakingDifficulty: 3,
        tireDegradation: 8,
        rainProbability: 5,
        safetyCarProbability: 30,
        nightRace: true,
        description: 'A flat desert circuit with abrasive tarmac that punishes tires mercilessly.',
        svgPath: 'M 90 350 L 220 350 L 280 320 Q 320 300 340 320 L 380 360 L 440 360 Q 480 360 480 320 L 480 260 Q 480 220 520 220 L 580 220 Q 620 220 620 260 L 620 380 Q 620 420 580 420 L 460 420 Q 400 420 360 400 L 280 380 Q 220 380 180 400 L 120 420 Q 80 420 80 390 Z',
        sectors: [
            { x: 90, y: 350 },
            { x: 380, y: 360 },
            { x: 580, y: 420 }
        ],
        pitLane: { startX: 90, startY: 370, endX: 200, endY: 370 }
    },
    {
        id: 'iron_valley',
        name: 'Iron Valley GP',
        country: 'Hungary',
        flag: '🇭🇺',
        city: 'Mogyorod',
        type: 'TECHNICAL',
        length: 4.381,
        laps: 70,
        corners: 14,
        drsZones: 1,
        baseLapTime: 79.5,
        overtakingDifficulty: 8,
        tireDegradation: 5,
        rainProbability: 35,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A twisty go-kart-style circuit where qualifying is everything.',
        svgPath: 'M 100 380 L 200 380 Q 240 380 260 350 L 290 300 Q 310 280 340 290 L 380 310 Q 420 320 420 280 L 420 230 Q 420 200 450 200 L 510 200 Q 540 200 540 230 L 540 280 Q 540 320 500 330 L 460 340 L 460 380 Q 460 410 430 410 L 380 410 Q 350 410 340 380 L 320 350 L 280 370 Q 240 380 200 420 L 130 430 Q 90 420 90 400 Z',
        sectors: [
            { x: 100, y: 380 },
            { x: 420, y: 280 },
            { x: 460, y: 380 }
        ],
        pitLane: { startX: 100, startY: 400, endX: 200, endY: 400 }
    },
    {
        id: 'storm_coast',
        name: 'Storm Coast Circuit',
        country: 'Australia',
        flag: '🇦🇺',
        city: 'Albert Bay',
        type: 'MIXED',
        length: 5.278,
        laps: 58,
        corners: 16,
        drsZones: 4,
        baseLapTime: 81.3,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 30,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'A semi-permanent coastal circuit famous for its season-opening drama.',
        svgPath: 'M 100 320 L 240 320 Q 280 320 300 290 L 340 240 Q 360 220 400 220 L 480 220 Q 520 220 530 260 L 550 320 L 580 360 Q 600 400 570 420 L 500 440 Q 440 450 400 430 L 340 410 Q 280 400 240 420 L 160 440 Q 110 440 90 410 Z',
        sectors: [
            { x: 100, y: 320 },
            { x: 400, y: 220 },
            { x: 570, y: 420 }
        ],
        pitLane: { startX: 100, startY: 340, endX: 220, endY: 340 }
    },
    {
        id: 'lakeside_speedway',
        name: 'Lakeside Speedway',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Brescia Lake',
        type: 'HIGH_SPEED',
        length: 5.793,
        laps: 53,
        corners: 11,
        drsZones: 3,
        baseLapTime: 80.2,
        overtakingDifficulty: 2,
        tireDegradation: 4,
        rainProbability: 25,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'The temple of speed. Long straights demand maximum power and slipstream skill.',
        svgPath: 'M 80 380 L 280 380 Q 320 380 340 350 L 380 290 L 460 290 Q 500 290 510 330 L 530 380 L 600 380 Q 620 380 620 360 L 620 250 Q 620 220 590 220 L 480 220 Q 440 220 430 250 L 410 280 L 350 280 Q 310 280 290 260 L 250 220 L 130 220 Q 80 220 80 250 Z',
        sectors: [
            { x: 80, y: 380 },
            { x: 460, y: 290 },
            { x: 350, y: 280 }
        ],
        pitLane: { startX: 80, startY: 400, endX: 250, endY: 400 }
    },
    {
        id: 'emerald_hills',
        name: 'Emerald Hills Track',
        country: 'Brazil',
        flag: '🇧🇷',
        city: 'Sao Paulo Heights',
        type: 'MIXED',
        length: 4.309,
        laps: 71,
        corners: 15,
        drsZones: 2,
        baseLapTime: 74.8,
        overtakingDifficulty: 4,
        tireDegradation: 7,
        rainProbability: 50,
        safetyCarProbability: 35,
        nightRace: false,
        description: 'Anti-clockwise undulating circuit famous for chaotic, weather-affected races.',
        svgPath: 'M 100 380 L 200 380 Q 240 380 260 350 L 290 300 L 290 250 Q 290 220 320 220 L 400 220 Q 440 220 460 250 L 500 290 Q 520 320 500 350 L 460 380 Q 440 400 410 400 L 350 400 Q 320 400 310 420 L 290 460 L 200 460 Q 160 460 130 430 L 100 410 Q 80 410 80 390 Z',
        sectors: [
            { x: 100, y: 380 },
            { x: 400, y: 220 },
            { x: 290, y: 460 }
        ],
        pitLane: { startX: 100, startY: 400, endX: 200, endY: 400 }
    },
    {
        id: 'phoenix_plains',
        name: 'Phoenix Plains Circuit',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Austin Heights',
        type: 'MIXED',
        length: 5.513,
        laps: 56,
        corners: 20,
        drsZones: 2,
        baseLapTime: 95.4,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 25,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'A modern American circuit with a steep uphill start and technical sequences.',
        svgPath: 'M 100 350 Q 100 300 150 290 L 220 270 L 280 220 Q 320 200 350 220 L 390 260 L 440 240 Q 480 240 490 280 L 510 340 L 570 370 Q 600 390 580 420 L 510 450 Q 450 460 400 440 L 340 420 Q 290 410 250 430 L 180 440 Q 130 440 100 420 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 350, y: 220 },
            { x: 510, y: 450 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 200, endY: 370 }
    },
    {
        id: 'ocean_drive',
        name: 'Ocean Drive GP',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Tropical Beach',
        type: 'STREET',
        length: 5.412,
        laps: 57,
        corners: 19,
        drsZones: 3,
        baseLapTime: 90.7,
        overtakingDifficulty: 6,
        tireDegradation: 7,
        rainProbability: 35,
        safetyCarProbability: 45,
        nightRace: false,
        description: 'A coastal street circuit with palm trees and high-stakes overtaking zones.',
        svgPath: 'M 90 340 L 200 340 L 240 300 Q 280 280 300 310 L 340 360 L 420 360 L 460 320 Q 500 290 520 320 L 560 380 L 600 380 Q 620 380 620 360 L 620 240 Q 620 220 600 220 L 480 220 Q 440 220 430 250 L 380 280 L 320 280 L 280 240 Q 240 220 210 240 L 140 250 Q 90 260 90 290 Z',
        sectors: [
            { x: 90, y: 340 },
            { x: 460, y: 320 },
            { x: 600, y: 380 }
        ],
        pitLane: { startX: 90, startY: 360, endX: 220, endY: 360 }
    },
    {
        id: 'capital_city',
        name: 'Capital City Circuit',
        country: 'Azerbaijan',
        flag: '🇦🇿',
        city: 'Caspian Bay',
        type: 'STREET',
        length: 6.003,
        laps: 51,
        corners: 20,
        drsZones: 2,
        baseLapTime: 103.5,
        overtakingDifficulty: 4,
        tireDegradation: 4,
        rainProbability: 20,
        safetyCarProbability: 55,
        nightRace: false,
        description: 'A street circuit with the longest flat-out section in motorsport.',
        svgPath: 'M 80 350 L 320 350 Q 360 350 380 320 L 410 270 L 410 230 Q 410 200 440 200 L 540 200 Q 580 200 580 230 L 580 320 Q 580 350 550 360 L 480 380 L 420 380 Q 380 380 360 410 L 320 440 Q 280 460 240 440 L 160 430 Q 100 430 80 410 Z',
        sectors: [
            { x: 80, y: 350 },
            { x: 410, y: 270 },
            { x: 480, y: 380 }
        ],
        pitLane: { startX: 80, startY: 370, endX: 250, endY: 370 }
    },
    {
        id: 'sapphire_coast',
        name: 'Sapphire Coast Track',
        country: 'Saudi Arabia',
        flag: '🇸🇦',
        city: 'Red Sea Bay',
        type: 'HIGH_SPEED',
        length: 6.174,
        laps: 50,
        corners: 27,
        drsZones: 3,
        baseLapTime: 87.2,
        overtakingDifficulty: 6,
        tireDegradation: 4,
        rainProbability: 5,
        safetyCarProbability: 40,
        nightRace: true,
        description: 'The fastest street circuit in racing. Walls inches away at 320 km/h.',
        svgPath: 'M 80 360 L 200 360 L 240 330 L 280 360 L 340 360 L 380 320 Q 410 290 430 320 L 460 360 L 540 360 Q 580 360 580 330 L 580 240 Q 580 210 550 210 L 480 210 L 440 240 L 400 210 L 340 210 L 300 240 L 260 210 L 160 210 Q 100 210 80 240 Z',
        sectors: [
            { x: 80, y: 360 },
            { x: 380, y: 320 },
            { x: 580, y: 330 }
        ],
        pitLane: { startX: 80, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'northern_lights',
        name: 'Northern Lights Speedway',
        country: 'Netherlands',
        flag: '🇳🇱',
        city: 'Zandcoast',
        type: 'TECHNICAL',
        length: 4.259,
        laps: 72,
        corners: 14,
        drsZones: 2,
        baseLapTime: 72.8,
        overtakingDifficulty: 7,
        tireDegradation: 8,
        rainProbability: 45,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A coastal circuit with iconic banking and abrasive tarmac.',
        svgPath: 'M 100 380 Q 100 340 130 320 L 200 290 Q 240 270 270 300 L 310 340 L 360 320 Q 400 300 420 330 L 460 380 L 520 380 Q 560 380 560 350 L 560 270 Q 560 230 520 230 L 460 230 Q 420 230 400 260 L 340 260 L 280 240 Q 240 230 200 250 L 130 260 Q 90 280 90 310 Z',
        sectors: [
            { x: 100, y: 380 },
            { x: 360, y: 320 },
            { x: 460, y: 230 }
        ],
        pitLane: { startX: 100, startY: 400, endX: 200, endY: 400 }
    },
    {
        id: 'volcano_ridge',
        name: 'Volcano Ridge Circuit',
        country: 'Portugal',
        flag: '🇵🇹',
        city: 'Vulcan Hills',
        type: 'MIXED',
        length: 4.692,
        laps: 60,
        corners: 15,
        drsZones: 2,
        baseLapTime: 82.5,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'An undulating circuit with blind crests and dramatic camber changes.',
        svgPath: 'M 100 350 Q 130 300 180 290 L 250 280 Q 290 270 310 290 L 340 320 L 400 320 Q 440 320 460 290 L 500 240 Q 540 220 570 250 L 590 320 Q 610 380 570 410 L 480 430 Q 420 440 380 410 L 320 390 Q 270 380 220 400 L 150 420 Q 100 410 90 380 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 400, y: 320 },
            { x: 480, y: 430 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 220, endY: 370 }
    },
    {
        id: 'marina_district',
        name: 'Marina District GP',
        country: 'Singapore',
        flag: '🇸🇬',
        city: 'Bay Harbor',
        type: 'STREET',
        length: 4.940,
        laps: 61,
        corners: 23,
        drsZones: 2,
        baseLapTime: 99.7,
        overtakingDifficulty: 8,
        tireDegradation: 4,
        rainProbability: 50,
        safetyCarProbability: 75,
        nightRace: true,
        description: 'A humid night street race with high attrition and dramatic safety cars.',
        svgPath: 'M 100 360 L 180 360 Q 220 360 220 320 L 220 280 L 280 280 L 280 240 Q 280 210 310 210 L 380 210 L 380 250 L 440 250 L 440 290 Q 440 320 470 320 L 540 320 Q 570 320 570 350 L 570 400 Q 570 430 540 430 L 460 430 L 420 400 L 360 400 L 320 430 L 240 430 L 200 410 L 140 410 Q 100 410 100 390 Z',
        sectors: [
            { x: 100, y: 360 },
            { x: 380, y: 250 },
            { x: 460, y: 430 }
        ],
        pitLane: { startX: 100, startY: 380, endX: 200, endY: 380 }
    },
    {
        id: 'highland_forest',
        name: 'Highland Forest Track',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Tuscany Vale',
        type: 'HIGH_SPEED',
        length: 5.245,
        laps: 56,
        corners: 15,
        drsZones: 1,
        baseLapTime: 78.4,
        overtakingDifficulty: 7,
        tireDegradation: 7,
        rainProbability: 25,
        safetyCarProbability: 15,
        nightRace: false,
        description: 'Sweeping high-speed corners through Tuscan countryside. A driver\'s circuit.',
        svgPath: 'M 100 350 Q 100 290 150 270 L 230 240 Q 290 220 340 250 L 400 290 Q 440 320 460 290 L 510 240 Q 550 210 590 240 L 610 310 Q 620 380 580 410 L 490 430 Q 410 440 350 410 L 270 390 Q 200 380 150 410 L 110 420 Q 80 410 90 380 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 460, y: 290 },
            { x: 490, y: 430 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 220, endY: 370 }
    },
    {
        id: 'cathedral_heights',
        name: 'Cathedral Heights Circuit',
        country: 'Spain',
        flag: '🇪🇸',
        city: 'Barcelona North',
        type: 'PERMANENT',
        length: 4.657,
        laps: 66,
        corners: 16,
        drsZones: 2,
        baseLapTime: 84.6,
        overtakingDifficulty: 7,
        tireDegradation: 8,
        rainProbability: 25,
        safetyCarProbability: 15,
        nightRace: false,
        description: 'A classic test circuit. If your car is fast here, it\'s fast everywhere.',
        svgPath: 'M 90 360 L 200 360 Q 240 360 260 330 L 290 280 Q 320 250 360 260 L 430 280 L 480 260 Q 520 240 540 270 L 580 320 Q 610 360 580 400 L 510 430 Q 440 440 380 420 L 310 400 Q 250 390 200 410 L 130 420 Q 80 410 80 390 Z',
        sectors: [
            { x: 90, y: 360 },
            { x: 430, y: 280 },
            { x: 510, y: 430 }
        ],
        pitLane: { startX: 90, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'coastal_cliffs',
        name: 'Coastal Cliffs GP',
        country: 'Portugal',
        flag: '🇵🇹',
        city: 'Algarve Bay',
        type: 'MIXED',
        length: 4.653,
        laps: 66,
        corners: 15,
        drsZones: 2,
        baseLapTime: 81.7,
        overtakingDifficulty: 6,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 15,
        nightRace: false,
        description: 'A rollercoaster circuit overlooking the ocean. Brave drivers thrive here.',
        svgPath: 'M 100 350 Q 130 290 200 280 L 280 270 Q 320 260 340 290 L 380 330 L 440 310 Q 490 290 510 320 L 550 380 Q 580 420 540 440 L 460 450 Q 390 450 350 420 L 290 400 Q 230 390 180 410 L 120 420 Q 80 410 90 380 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 380, y: 330 },
            { x: 460, y: 450 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 220, endY: 370 }
    },
    {
        id: 'riverside',
        name: 'Riverside Speedway',
        country: 'Russia',
        flag: '🇷🇺',
        city: 'Black Sea Bay',
        type: 'MIXED',
        length: 5.848,
        laps: 53,
        corners: 18,
        drsZones: 2,
        baseLapTime: 95.3,
        overtakingDifficulty: 6,
        tireDegradation: 4,
        rainProbability: 30,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A semi-permanent circuit weaving past Olympic facilities and waterways.',
        svgPath: 'M 90 340 L 240 340 Q 280 340 300 310 L 340 260 Q 380 240 410 260 L 460 290 L 530 290 Q 570 290 580 320 L 600 380 Q 610 420 570 430 L 480 450 Q 400 460 350 430 L 290 410 Q 220 400 170 420 L 110 430 Q 80 420 80 390 Z',
        sectors: [
            { x: 90, y: 340 },
            { x: 410, y: 260 },
            { x: 480, y: 450 }
        ],
        pitLane: { startX: 90, startY: 360, endX: 240, endY: 360 }
    },
    {
        id: 'stadium_circuit',
        name: 'Stadium Circuit',
        country: 'Mexico',
        flag: '🇲🇽',
        city: 'Aztec City',
        type: 'PERMANENT',
        length: 4.304,
        laps: 71,
        corners: 17,
        drsZones: 2,
        baseLapTime: 78.9,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'High-altitude circuit famous for its baseball stadium chicane and roaring fans.',
        svgPath: 'M 80 360 L 240 360 Q 280 360 290 390 L 300 430 L 360 430 Q 400 430 410 400 L 420 350 L 480 350 Q 520 350 540 320 L 580 270 Q 610 240 590 220 L 510 210 Q 440 210 410 240 L 360 270 L 300 270 Q 260 270 240 250 L 170 250 Q 100 250 80 280 Z',
        sectors: [
            { x: 80, y: 360 },
            { x: 420, y: 350 },
            { x: 360, y: 270 }
        ],
        pitLane: { startX: 80, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'old_town',
        name: 'Old Town GP',
        country: 'France',
        flag: '🇫🇷',
        city: 'Pau Heritage',
        type: 'STREET',
        length: 2.760,
        laps: 95,
        corners: 13,
        drsZones: 0,
        baseLapTime: 68.4,
        overtakingDifficulty: 10,
        tireDegradation: 3,
        rainProbability: 35,
        safetyCarProbability: 50,
        nightRace: false,
        description: 'A historic stone-walled street circuit. Overtaking is essentially impossible.',
        svgPath: 'M 150 380 L 240 380 Q 280 380 280 350 L 280 290 Q 280 260 310 260 L 380 260 Q 410 260 410 290 L 410 320 L 470 320 L 470 280 Q 470 250 500 250 L 540 250 Q 560 250 560 280 L 560 380 Q 560 410 530 410 L 460 410 Q 430 410 430 380 L 430 360 L 370 360 L 370 400 Q 370 430 340 430 L 190 430 Q 150 430 150 400 Z',
        sectors: [
            { x: 150, y: 380 },
            { x: 410, y: 290 },
            { x: 460, y: 410 }
        ],
        pitLane: { startX: 150, startY: 400, endX: 240, endY: 400 }
    },
    {
        id: 'garden_estate',
        name: 'Garden Estate Track',
        country: 'United Kingdom',
        flag: '🇬🇧',
        city: 'Norfolk Park',
        type: 'PERMANENT',
        length: 4.554,
        laps: 66,
        corners: 14,
        drsZones: 2,
        baseLapTime: 83.4,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 50,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'Set in a historic estate, this circuit features fast corners through ancient woodland.',
        svgPath: 'M 100 340 Q 120 280 180 270 L 250 270 Q 290 270 310 300 L 350 340 L 410 340 Q 450 340 460 310 L 490 260 Q 530 230 570 260 L 600 320 Q 620 380 580 410 L 490 430 Q 410 440 360 420 L 280 410 Q 220 400 170 420 L 110 430 Q 80 420 90 380 Z',
        sectors: [
            { x: 100, y: 340 },
            { x: 410, y: 340 },
            { x: 490, y: 430 }
        ],
        pitLane: { startX: 100, startY: 360, endX: 220, endY: 360 }
    },
    {
        id: 'iron_bridge',
        name: 'Iron Bridge Circuit',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Detroit River',
        type: 'STREET',
        length: 4.048,
        laps: 70,
        corners: 13,
        drsZones: 1,
        baseLapTime: 76.5,
        overtakingDifficulty: 8,
        tireDegradation: 5,
        rainProbability: 20,
        safetyCarProbability: 50,
        nightRace: false,
        description: 'An industrial street circuit crossing the river twice. Bumpy and unforgiving.',
        svgPath: 'M 100 360 L 220 360 Q 260 360 280 330 L 320 280 L 380 280 L 410 320 L 470 320 Q 510 320 530 350 L 570 400 Q 600 430 570 450 L 500 460 Q 440 470 400 440 L 340 420 Q 280 410 230 430 L 150 440 Q 100 430 90 400 Z',
        sectors: [
            { x: 100, y: 360 },
            { x: 380, y: 280 },
            { x: 500, y: 460 }
        ],
        pitLane: { startX: 100, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'pine_forest',
        name: 'Pine Forest Speedway',
        country: 'Germany',
        flag: '🇩🇪',
        city: 'Black Forest',
        type: 'MIXED',
        length: 4.574,
        laps: 67,
        corners: 17,
        drsZones: 2,
        baseLapTime: 82.1,
        overtakingDifficulty: 6,
        tireDegradation: 5,
        rainProbability: 40,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A scenic forest circuit with a unique stadium section beloved by fans.',
        svgPath: 'M 100 350 L 200 350 Q 240 350 260 320 L 290 270 Q 320 250 360 270 L 400 300 L 460 300 Q 500 300 510 270 L 540 230 Q 580 210 600 240 L 610 310 Q 620 370 580 400 L 500 430 Q 430 440 380 420 L 310 400 Q 250 390 200 410 L 130 420 Q 80 410 90 380 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 400, y: 300 },
            { x: 500, y: 430 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 220, endY: 370 }
    },
    {
        id: 'sandstone_canyon',
        name: 'Sandstone Canyon GP',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Las Vegas Strip',
        type: 'STREET',
        length: 6.201,
        laps: 50,
        corners: 17,
        drsZones: 2,
        baseLapTime: 99.8,
        overtakingDifficulty: 4,
        tireDegradation: 4,
        rainProbability: 5,
        safetyCarProbability: 45,
        nightRace: true,
        description: 'A long, fast street circuit through neon-lit casinos. Spectacle and speed combined.',
        svgPath: 'M 80 360 L 320 360 Q 360 360 380 330 L 410 280 Q 440 260 480 280 L 540 310 L 600 310 Q 620 310 620 290 L 620 240 Q 620 220 600 220 L 480 220 Q 440 220 420 240 L 380 270 L 300 270 Q 260 270 240 290 L 200 320 Q 160 340 110 340 L 90 340 Q 80 340 80 360 Z',
        sectors: [
            { x: 80, y: 360 },
            { x: 480, y: 280 },
            { x: 380, y: 270 }
        ],
        pitLane: { startX: 80, startY: 380, endX: 250, endY: 380 }
    },
    {
        id: 'aurora_falls',
        name: 'Aurora Falls Circuit',
        country: 'Canada',
        flag: '🇨🇦',
        city: 'Maple Cove',
        type: 'MIXED',
        length: 4.361,
        laps: 70,
        corners: 14,
        drsZones: 2,
        baseLapTime: 75.6,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 35,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'A semi-permanent island circuit known for its wall of champions chicane.',
        svgPath: 'M 100 360 L 240 360 Q 280 360 300 330 L 340 280 Q 380 260 410 280 L 450 310 L 510 310 Q 550 310 560 280 L 580 240 Q 610 220 620 250 L 620 350 Q 620 410 580 420 L 480 440 Q 410 450 360 420 L 290 410 Q 220 400 170 420 L 110 430 Q 80 420 80 390 Z',
        sectors: [
            { x: 100, y: 360 },
            { x: 450, y: 310 },
            { x: 480, y: 440 }
        ],
        pitLane: { startX: 100, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'imperial_capital',
        name: 'Imperial Capital GP',
        country: 'China',
        flag: '🇨🇳',
        city: 'Shanghai Heights',
        type: 'PERMANENT',
        length: 5.451,
        laps: 56,
        corners: 16,
        drsZones: 2,
        baseLapTime: 94.5,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'A modern Asian circuit with a famous tightening hairpin at turn one.',
        svgPath: 'M 90 360 Q 110 280 200 270 L 290 280 Q 330 290 340 320 L 360 380 L 430 380 Q 470 380 480 350 L 500 290 Q 540 260 570 290 L 600 350 Q 620 400 580 420 L 480 440 Q 410 450 360 420 L 290 410 Q 220 400 170 420 L 110 430 Q 80 420 80 390 Z',
        sectors: [
            { x: 90, y: 360 },
            { x: 360, y: 380 },
            { x: 480, y: 440 }
        ],
        pitLane: { startX: 90, startY: 380, endX: 220, endY: 380 }
    },
    {
        id: 'twin_peaks',
        name: 'Twin Peaks Speedway',
        country: 'Germany',
        flag: '🇩🇪',
        city: 'Eifel Highlands',
        type: 'HIGH_SPEED',
        length: 7.421,
        laps: 42,
        corners: 21,
        drsZones: 2,
        baseLapTime: 110.5,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 70,
        safetyCarProbability: 35,
        nightRace: false,
        description: 'A legendary long circuit through mountain forests. Weather changes by sector.',
        svgPath: 'M 80 360 L 180 360 Q 220 360 240 330 L 280 280 L 340 280 Q 380 280 390 250 L 420 200 Q 460 180 490 210 L 530 270 L 590 270 Q 620 270 620 300 L 620 380 Q 620 420 580 430 L 490 450 Q 410 460 360 430 L 290 420 Q 220 410 170 430 L 110 440 Q 70 430 70 400 Z',
        sectors: [
            { x: 80, y: 360 },
            { x: 420, y: 200 },
            { x: 490, y: 450 }
        ],
        pitLane: { startX: 80, startY: 380, endX: 200, endY: 380 }
    },
    {
        id: 'silverstone_heritage',
        name: 'Silverstone Heritage GP',
        country: 'United Kingdom',
        flag: '🇬🇧',
        city: 'Northamptonshire',
        type: 'HIGH_SPEED',
        length: 5.891,
        laps: 52,
        corners: 18,
        drsZones: 2,
        baseLapTime: 86.2,
        overtakingDifficulty: 6,
        tireDegradation: 8,
        rainProbability: 65,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The historic home of British motorsport, featuring ultra-high-speed aerodynamic direction changes through Maggotts and Becketts.',
        svgPath: 'M 100 350 L 220 350 Q 250 350 270 320 L 310 260 Q 330 230 360 230 L 440 230 Q 480 230 500 260 L 530 310 Q 550 340 520 370 L 460 410 Q 430 430 380 430 L 250 430 Q 200 430 150 400 L 110 380 Q 90 370 100 350 Z',
        sectors: [
            { x: 100, y: 350 },
            { x: 440, y: 230 },
            { x: 460, y: 410 }
        ],
        pitLane: { startX: 110, startY: 370, endX: 230, endY: 370 }
    },
    {
        id: 'monza_temple',
        name: 'Monza Autodromo Autentico',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Lombardy',
        type: 'HIGH_SPEED',
        length: 5.793,
        laps: 53,
        corners: 11,
        drsZones: 2,
        baseLapTime: 81.4,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'The legendary Temple of Speed. Raw powertrain acceleration down massive straights punctuated by extreme heavy braking hairpins.',
        svgPath: 'M 80 340 L 280 310 Q 300 305 310 280 L 340 220 Q 360 190 390 190 L 520 210 Q 560 220 580 260 L 600 320 Q 610 360 570 380 L 440 400 Q 400 410 360 400 L 200 380 Q 150 370 100 370 Q 70 370 80 340 Z',
        sectors: [
            { x: 80, y: 340 },
            { x: 520, y: 210 },
            { x: 570, y: 380 }
        ],
        pitLane: { startX: 100, startY: 360, endX: 260, endY: 340 }
    },
    {
        id: 'spa_francorchamps',
        name: 'Spa Forest Circuit',
        country: 'Belgium',
        flag: '🇧🇪',
        city: 'Ardennes',
        type: 'MIXED',
        length: 7.004,
        laps: 44,
        corners: 20,
        drsZones: 2,
        baseLapTime: 106.1,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 80,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'Majestic rolling elevation changes featuring the fearsome flat-out Eau Rouge and Raidillon uphill sweep.',
        svgPath: 'M 120 380 L 200 380 Q 230 380 250 340 L 290 250 Q 310 210 350 200 L 460 180 Q 500 170 530 200 L 570 280 Q 590 320 570 360 L 510 420 Q 480 450 420 450 L 260 460 Q 200 460 150 430 L 110 410 Q 100 400 120 380 Z',
        sectors: [
            { x: 120, y: 380 },
            { x: 460, y: 180 },
            { x: 510, y: 420 }
        ],
        pitLane: { startX: 130, startY: 400, endX: 220, endY: 400 }
    },
    {
        id: 'interlagos_senna',
        name: 'Interlagos Senna Autodromo',
        country: 'Brazil',
        flag: '🇧🇷',
        city: 'Sao Paulo',
        type: 'TECHNICAL',
        length: 4.309,
        laps: 71,
        corners: 15,
        drsZones: 2,
        baseLapTime: 71.0,
        overtakingDifficulty: 4,
        tireDegradation: 8,
        rainProbability: 60,
        safetyCarProbability: 35,
        nightRace: false,
        description: 'An iconic anti-clockwise bowl famous for unpredictable weather, the Senna S entry plunge, and legendary title shootouts.',
        svgPath: 'M 150 320 L 250 360 Q 280 370 290 400 L 310 440 Q 330 470 370 460 L 470 420 Q 510 400 520 360 L 530 280 Q 540 240 500 220 L 400 200 Q 350 190 310 210 L 210 250 Q 170 270 150 320 Z',
        sectors: [
            { x: 150, y: 320 },
            { x: 370, y: 460 },
            { x: 530, y: 280 }
        ],
        pitLane: { startX: 160, startY: 340, endX: 240, endY: 370 }
    },
    {
        id: 'suzuka_figure_eight',
        name: 'Suzuka International Circuit',
        country: 'Japan',
        flag: '🇯🇵',
        city: 'Mie Prefecture',
        type: 'TECHNICAL',
        length: 5.807,
        laps: 53,
        corners: 18,
        drsZones: 1,
        baseLapTime: 90.8,
        overtakingDifficulty: 7,
        tireDegradation: 9,
        rainProbability: 50,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'The world masterclass figure-eight layout. Unforgiving gravel traps, legendary high-speed S-curves, and the iconic 130R apex.',
        svgPath: 'M 100 360 L 200 360 Q 230 360 250 330 L 270 280 Q 290 240 330 230 L 410 220 Q 450 210 480 240 L 510 290 Q 530 330 490 360 L 430 380 Q 390 390 370 420 L 350 460 Q 330 500 270 480 L 170 440 Q 120 420 100 390 Q 90 375 100 360 Z',
        sectors: [
            { x: 100, y: 360 },
            { x: 410, y: 220 },
            { x: 430, y: 380 }
        ],
        pitLane: { startX: 110, startY: 380, endX: 210, endY: 380 }
    }
];

/* --- HELPER FUNCTIONS --- */

/**
 * Get track by ID
 */
function getTrackById(id) {
    return TRACKS_DATA.find(t => t.id === id);
}

/**
 * Get all tracks sorted alphabetically
 */
function getAllTracks() {
    return [...TRACKS_DATA].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get tracks by type
 */
function getTracksByType(type) {
    return TRACKS_DATA.filter(t => t.type === type);
}

/**
 * Get random track
 */
function getRandomTrack() {
    return TRACKS_DATA[Math.floor(Math.random() * TRACKS_DATA.length)];
}

/**
 * Generate a random race calendar of N tracks
 */
function generateRandomCalendar(numRaces) {
    const shuffled = [...TRACKS_DATA].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(numRaces, TRACKS_DATA.length));
}

/**
 * Get track view box for SVG rendering
 */
function getTrackViewBox(track) {
    return '0 0 700 600';
}

/**
 * Format lap time in M:SS.mmm format
 */
function formatLapTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.---';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Format gap time
 */
function formatGap(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '';
    if (Math.abs(seconds) < 0.001) return 'LEADER';
    const abs = Math.abs(seconds);
    if (abs < 60) return `+${abs.toFixed(3)}`;
    const m = Math.floor(abs / 60);
    const s = (abs % 60).toFixed(3);
    return `+${m}:${s.padStart(6, '0')}`;
}

/**
 * Calculate path length for SVG path string
 * (used by car renderer to position cars)
 */
function calculatePathLength(svgPath) {
    if (typeof document === 'undefined') return 1000;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', svgPath);
    svg.appendChild(path);
    try {
        return path.getTotalLength();
    } catch (e) {
        return 1000;
    }
}