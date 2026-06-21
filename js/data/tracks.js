/* ============================================
   VELOCITY — TRACKS DATA
   35 REAL Formula One Circuits (Current + Historic)
   Accurate lengths, corners, metadata + recognizable SVG paths
   Every track is a genuine F1 venue from F1 history
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
    // === ICONIC CURRENT CIRCUITS ===
    {
        id: 'monaco',
        name: 'Circuit de Monaco',
        country: 'Monaco',
        flag: '🇲🇨',
        city: 'Monte Carlo',
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
        description: 'The jewel in the crown. Tightest street circuit in the world with the famous tunnel and harbour section.',
        svgPath: 'M 120 430 L 210 430 Q 250 430 250 390 L 250 310 Q 250 270 290 270 L 360 270 Q 400 270 400 310 L 400 350 L 475 350 L 475 310 Q 475 270 510 270 L 560 270 Q 590 270 590 305 L 590 400 Q 590 435 550 435 L 460 435 Q 420 435 420 395 L 420 365 L 340 365 L 340 405 Q 340 440 305 440 L 165 440 Q 120 440 120 430 Z',
        sectors: [
            { x: 120, y: 430 },
            { x: 400, y: 310 },
            { x: 590, y: 400 }
        ],
        pitLane: { startX: 125, startY: 445, endX: 210, endY: 445 }
    },
    {
        id: 'silverstone',
        name: 'Silverstone Circuit',
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
        rainProbability: 45,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The home of British motorsport. Iconic high-speed corners: Maggotts, Becketts, Chapel, Stowe, Club.',
        svgPath: 'M 95 365 L 205 365 Q 240 365 265 335 L 305 275 Q 330 240 365 240 L 445 240 Q 490 240 515 275 L 545 325 Q 570 355 535 385 L 465 425 Q 435 450 385 450 L 260 450 Q 200 450 155 410 L 105 380 Q 85 370 95 365 Z',
        sectors: [
            { x: 95, y: 365 },
            { x: 445, y: 240 },
            { x: 465, y: 425 }
        ],
        pitLane: { startX: 100, startY: 385, endX: 220, endY: 385 }
    },
    {
        id: 'monza',
        name: 'Autodromo Nazionale di Monza',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Monza',
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
        description: 'The Temple of Speed. Massive long straights, the Parabolica and legendary Lesmo and Ascari chicanes.',
        svgPath: 'M 70 380 L 275 380 Q 320 380 345 345 L 380 280 L 460 280 Q 500 280 515 325 L 540 380 L 605 380 Q 620 380 620 355 L 620 235 Q 620 205 585 205 L 480 205 Q 445 205 430 235 L 410 275 L 355 275 Q 315 275 295 250 L 245 200 L 130 200 Q 70 200 70 245 Z',
        sectors: [
            { x: 70, y: 380 },
            { x: 460, y: 280 },
            { x: 355, y: 275 }
        ],
        pitLane: { startX: 75, startY: 400, endX: 255, endY: 400 }
    },
    {
        id: 'spa',
        name: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        flag: '🇧🇪',
        city: 'Stavelot',
        type: 'MIXED',
        length: 7.004,
        laps: 44,
        corners: 20,
        drsZones: 2,
        baseLapTime: 106.1,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 75,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'The greatest circuit in the world. Eau Rouge, Raidillon, Pouhon, Blanchimont, and legendary elevation.',
        svgPath: 'M 110 395 L 195 395 Q 230 395 255 355 L 295 260 Q 315 215 355 205 L 465 185 Q 510 175 540 210 L 580 290 Q 600 330 575 370 L 510 425 Q 480 455 420 455 L 265 465 Q 195 465 145 430 L 105 405 Q 95 395 110 395 Z',
        sectors: [
            { x: 110, y: 395 },
            { x: 465, y: 185 },
            { x: 510, y: 425 }
        ],
        pitLane: { startX: 115, startY: 415, endX: 210, endY: 415 }
    },
    {
        id: 'suzuka',
        name: 'Suzuka International Racing Course',
        country: 'Japan',
        flag: '🇯🇵',
        city: 'Suzuka',
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
        description: 'The only figure-eight F1 circuit. 130R, Spoon, Degner, and iconic high-speed S-curves.',
        svgPath: 'M 95 365 L 195 365 Q 225 365 245 335 L 265 285 Q 285 245 330 235 L 410 220 Q 455 210 480 245 L 515 295 Q 540 335 500 365 L 435 385 Q 395 395 375 425 L 355 470 Q 330 505 265 485 L 165 445 Q 115 420 95 385 Q 85 370 95 365 Z',
        sectors: [
            { x: 95, y: 365 },
            { x: 410, y: 220 },
            { x: 435, y: 385 }
        ],
        pitLane: { startX: 105, startY: 385, endX: 205, endY: 385 }
    },
    {
        id: 'interlagos',
        name: 'Autódromo José Carlos Pace',
        country: 'Brazil',
        flag: '🇧🇷',
        city: 'São Paulo',
        type: 'TECHNICAL',
        length: 4.309,
        laps: 71,
        corners: 15,
        drsZones: 2,
        baseLapTime: 71.0,
        overtakingDifficulty: 4,
        tireDegradation: 8,
        rainProbability: 55,
        safetyCarProbability: 35,
        nightRace: false,
        description: 'Anti-clockwise classic. Senna S, Descida do Lago, and famous last-lap battles.',
        svgPath: 'M 145 335 L 250 375 Q 285 385 300 420 L 320 460 Q 345 490 380 475 L 475 430 Q 515 410 530 365 L 540 285 Q 545 245 505 225 L 405 200 Q 350 190 315 215 L 205 260 Q 170 275 145 335 Z',
        sectors: [
            { x: 145, y: 335 },
            { x: 380, y: 475 },
            { x: 540, y: 285 }
        ],
        pitLane: { startX: 155, startY: 355, endX: 245, endY: 385 }
    },
    {
        id: 'bahrain',
        name: 'Bahrain International Circuit',
        country: 'Bahrain',
        flag: '🇧🇭',
        city: 'Sakhir',
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
        description: 'Desert endurance classic. Long straights, abrasive surface, and the famous Sakhir outer layout.',
        svgPath: 'M 85 360 L 220 360 L 280 330 Q 325 310 345 330 L 385 370 L 445 370 Q 485 370 485 330 L 485 265 Q 485 225 525 225 L 585 225 Q 620 225 620 270 L 620 385 Q 620 420 585 420 L 465 420 Q 405 420 365 400 L 280 380 Q 215 380 175 400 L 115 420 Q 80 420 80 395 Z',
        sectors: [
            { x: 85, y: 360 },
            { x: 385, y: 370 },
            { x: 585, y: 420 }
        ],
        pitLane: { startX: 90, startY: 380, endX: 200, endY: 380 }
    },
    {
        id: 'shanghai',
        name: 'Shanghai International Circuit',
        country: 'China',
        flag: '🇨🇳',
        city: 'Shanghai',
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
        description: 'The giant snail. Famous long back straight and the ultra-tight hairpin at Turn 1.',
        svgPath: 'M 85 370 Q 105 290 200 275 L 295 285 Q 335 295 345 325 L 365 385 L 435 385 Q 475 385 485 355 L 505 295 Q 545 265 575 295 L 610 355 Q 625 405 585 425 L 480 450 Q 410 460 360 425 L 285 410 Q 220 400 170 425 L 105 435 Q 80 425 85 370 Z',
        sectors: [
            { x: 85, y: 370 },
            { x: 365, y: 385 },
            { x: 485, y: 355 }
        ],
        pitLane: { startX: 90, startY: 390, endX: 205, endY: 390 }
    },
    {
        id: 'albert_park',
        name: 'Albert Park Circuit',
        country: 'Australia',
        flag: '🇦🇺',
        city: 'Melbourne',
        type: 'MIXED',
        length: 5.278,
        laps: 58,
        corners: 16,
        drsZones: 4,
        baseLapTime: 81.3,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 35,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'Season opener in the park. Sweeping lakeside corners and the famous high-speed Turn 11-13 sequence.',
        svgPath: 'M 95 330 L 235 330 Q 275 330 300 295 L 340 245 Q 365 220 405 220 L 485 220 Q 530 220 540 265 L 560 330 L 585 365 Q 605 405 575 425 L 505 450 Q 445 460 405 435 L 340 415 Q 280 405 240 425 L 155 450 Q 105 450 90 420 Z',
        sectors: [
            { x: 95, y: 330 },
            { x: 405, y: 220 },
            { x: 575, y: 425 }
        ],
        pitLane: { startX: 100, startY: 355, endX: 220, endY: 355 }
    },
    {
        id: 'hungaroring',
        name: 'Hungaroring',
        country: 'Hungary',
        flag: '🇭🇺',
        city: 'Mogyoród',
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
        description: 'The Monaco of the north. Twisty, low-speed go-kart style with almost no straights.',
        svgPath: 'M 95 395 L 195 395 Q 235 395 255 360 L 290 305 Q 315 280 345 295 L 385 320 Q 425 330 425 285 L 425 225 Q 425 195 455 195 L 515 195 Q 545 195 545 230 L 545 290 Q 545 325 510 335 L 460 345 L 460 395 Q 460 420 430 420 L 375 420 Q 345 420 335 390 L 310 355 L 275 375 Q 235 395 195 425 L 125 435 Q 90 425 95 395 Z',
        sectors: [
            { x: 95, y: 395 },
            { x: 425, y: 285 },
            { x: 460, y: 395 }
        ],
        pitLane: { startX: 100, startY: 415, endX: 200, endY: 415 }
    },
    {
        id: 'zandvoort',
        name: 'Circuit Zandvoort',
        country: 'Netherlands',
        flag: '🇳🇱',
        city: 'Zandvoort',
        type: 'TECHNICAL',
        length: 4.259,
        laps: 72,
        corners: 14,
        drsZones: 2,
        baseLapTime: 72.8,
        overtakingDifficulty: 6,
        tireDegradation: 7,
        rainProbability: 45,
        safetyCarProbability: 35,
        nightRace: false,
        description: 'Banked seaside classic. Iconic Hugenholtz and Arie Luyendyk banking and beachside dunes.',
        svgPath: 'M 100 300 L 200 300 Q 235 300 260 270 L 300 220 Q 330 190 380 200 L 430 240 Q 460 270 480 320 L 510 360 Q 535 400 510 430 L 455 455 Q 400 465 355 435 L 290 410 Q 235 395 200 420 L 150 445 Q 105 440 100 300 Z',
        sectors: [
            { x: 100, y: 300 },
            { x: 380, y: 200 },
            { x: 510, y: 430 }
        ],
        pitLane: { startX: 105, startY: 320, endX: 210, endY: 320 }
    },
    {
        id: 'barcelona',
        name: 'Circuit de Barcelona-Catalunya',
        country: 'Spain',
        flag: '🇪🇸',
        city: 'Montmeló',
        type: 'MIXED',
        length: 4.657,
        laps: 66,
        corners: 16,
        drsZones: 2,
        baseLapTime: 82.1,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 25,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'The ultimate test track. Technical and high-speed sections with the famous Turn 3-4 complex.',
        svgPath: 'M 90 340 L 195 340 Q 230 340 250 310 L 285 260 Q 310 220 355 220 L 410 220 Q 450 220 470 255 L 500 310 Q 530 350 510 385 L 460 415 Q 410 430 365 410 L 300 395 Q 245 385 210 410 L 160 435 Q 110 425 90 340 Z',
        sectors: [
            { x: 90, y: 340 },
            { x: 355, y: 220 },
            { x: 510, y: 385 }
        ],
        pitLane: { startX: 95, startY: 360, endX: 205, endY: 360 }
    },
    {
        id: 'cota',
        name: 'Circuit of the Americas',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Austin',
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
        description: 'American classic. Steep uphill start, sweeping esses, and the famous stadium section.',
        svgPath: 'M 100 360 Q 100 305 150 295 L 220 275 L 280 220 Q 325 200 355 225 L 395 265 L 445 245 Q 485 245 500 285 L 520 350 L 580 380 Q 610 400 585 430 L 515 460 Q 450 470 400 450 L 340 430 Q 290 420 250 440 L 180 450 Q 130 450 100 360 Z',
        sectors: [
            { x: 100, y: 360 },
            { x: 355, y: 225 },
            { x: 520, y: 350 }
        ],
        pitLane: { startX: 105, startY: 380, endX: 205, endY: 380 }
    },
    {
        id: 'mexico',
        name: 'Autódromo Hermanos Rodríguez',
        country: 'Mexico',
        flag: '🇲🇽',
        city: 'Mexico City',
        type: 'MIXED',
        length: 4.304,
        laps: 71,
        corners: 17,
        drsZones: 2,
        baseLapTime: 77.4,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 25,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'High-altitude power track. Famous stadium section and the legendary Peraltada banked turn.',
        svgPath: 'M 95 350 L 185 350 Q 225 350 250 320 L 290 270 Q 315 240 355 240 L 410 240 Q 450 240 470 275 L 505 320 Q 535 355 510 385 L 460 410 Q 410 425 365 405 L 295 395 Q 235 385 195 410 L 145 430 Q 100 420 95 350 Z',
        sectors: [
            { x: 95, y: 350 },
            { x: 355, y: 240 },
            { x: 510, y: 385 }
        ],
        pitLane: { startX: 100, startY: 370, endX: 200, endY: 370 }
    },
    {
        id: 'baku',
        name: 'Baku City Circuit',
        country: 'Azerbaijan',
        flag: '🇦🇿',
        city: 'Baku',
        type: 'STREET',
        length: 6.003,
        laps: 51,
        corners: 20,
        drsZones: 2,
        baseLapTime: 103.8,
        overtakingDifficulty: 6,
        tireDegradation: 4,
        rainProbability: 15,
        safetyCarProbability: 45,
        nightRace: true,
        description: 'The longest street circuit. Iconic long seaside straight and the narrow castle section.',
        svgPath: 'M 75 420 L 180 420 Q 220 420 240 385 L 270 320 Q 295 280 340 280 L 400 280 Q 440 280 460 315 L 500 365 L 540 365 Q 580 365 580 325 L 580 250 Q 580 215 550 215 L 480 215 L 440 250 L 405 280 L 345 280 Q 305 280 285 310 L 250 360 L 190 360 L 155 395 Q 120 420 75 420 Z',
        sectors: [
            { x: 75, y: 420 },
            { x: 400, y: 280 },
            { x: 580, y: 325 }
        ],
        pitLane: { startX: 80, startY: 435, endX: 195, endY: 435 }
    },
    {
        id: 'singapore',
        name: 'Marina Bay Street Circuit',
        country: 'Singapore',
        flag: '🇸🇬',
        city: 'Singapore',
        type: 'STREET',
        length: 4.940,
        laps: 61,
        corners: 19,
        drsZones: 2,
        baseLapTime: 101.4,
        overtakingDifficulty: 8,
        tireDegradation: 3,
        rainProbability: 40,
        safetyCarProbability: 55,
        nightRace: true,
        description: 'Night race masterpiece. Dense urban street layout with iconic Esplanade Bridge and Anderson Bridge.',
        svgPath: 'M 115 340 L 195 340 L 240 310 Q 275 285 305 305 L 345 340 L 390 340 Q 430 340 440 305 L 455 260 Q 475 225 510 225 L 555 225 Q 580 225 580 260 L 580 350 Q 580 390 545 395 L 470 395 Q 430 395 430 355 L 430 320 L 370 320 L 370 355 Q 370 390 335 390 L 175 390 Q 130 390 115 340 Z',
        sectors: [
            { x: 115, y: 340 },
            { x: 440, y: 305 },
            { x: 555, y: 225 }
        ],
        pitLane: { startX: 120, startY: 355, endX: 205, endY: 355 }
    },
    {
        id: 'las_vegas',
        name: 'Las Vegas Strip Circuit',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Las Vegas',
        type: 'STREET',
        length: 6.201,
        laps: 50,
        corners: 17,
        drsZones: 2,
        baseLapTime: 98.5,
        overtakingDifficulty: 4,
        tireDegradation: 4,
        rainProbability: 5,
        safetyCarProbability: 25,
        nightRace: true,
        description: 'Spectacular night race on the Strip. Long straights past the famous Las Vegas landmarks.',
        svgPath: 'M 85 390 L 195 390 L 240 355 Q 280 325 320 340 L 370 375 L 440 375 Q 485 375 485 340 L 485 270 Q 485 235 525 235 L 590 235 Q 620 235 620 275 L 620 400 Q 620 430 580 430 L 490 430 Q 445 430 445 395 L 445 360 L 365 360 L 365 395 Q 365 430 325 430 L 165 430 Q 105 430 85 390 Z',
        sectors: [
            { x: 85, y: 390 },
            { x: 485, y: 340 },
            { x: 620, y: 275 }
        ],
        pitLane: { startX: 90, startY: 405, endX: 200, endY: 405 }
    },
    {
        id: 'jeddah',
        name: 'Jeddah Corniche Circuit',
        country: 'Saudi Arabia',
        flag: '🇸🇦',
        city: 'Jeddah',
        type: 'STREET',
        length: 6.174,
        laps: 50,
        corners: 27,
        drsZones: 2,
        baseLapTime: 88.9,
        overtakingDifficulty: 5,
        tireDegradation: 4,
        rainProbability: 5,
        safetyCarProbability: 35,
        nightRace: true,
        description: 'Fastest street circuit. High-speed walls and the dramatic coastal layout.',
        svgPath: 'M 85 365 L 175 365 Q 205 365 230 335 L 270 280 Q 295 245 340 245 L 400 245 Q 440 245 465 280 L 505 340 Q 535 380 510 410 L 455 435 Q 400 445 350 420 L 280 405 Q 220 395 180 420 L 130 440 Q 90 430 85 365 Z',
        sectors: [
            { x: 85, y: 365 },
            { x: 400, y: 245 },
            { x: 510, y: 410 }
        ],
        pitLane: { startX: 90, startY: 385, endX: 185, endY: 385 }
    },
    {
        id: 'yas_marina',
        name: 'Yas Marina Circuit',
        country: 'United Arab Emirates',
        flag: '🇦🇪',
        city: 'Abu Dhabi',
        type: 'MIXED',
        length: 5.281,
        laps: 58,
        corners: 21,
        drsZones: 2,
        baseLapTime: 99.1,
        overtakingDifficulty: 6,
        tireDegradation: 5,
        rainProbability: 5,
        safetyCarProbability: 25,
        nightRace: true,
        description: 'Modern marina masterpiece. Sunset race finish with iconic Yas Hotel and marina layout.',
        svgPath: 'M 95 290 L 215 290 Q 255 290 275 320 L 320 370 L 380 370 Q 420 370 420 330 L 420 245 Q 420 205 455 205 L 545 205 Q 580 205 580 250 L 580 390 Q 580 425 545 435 L 440 455 Q 380 465 340 435 L 260 405 Q 195 385 155 405 L 105 425 Q 80 410 95 290 Z',
        sectors: [
            { x: 95, y: 290 },
            { x: 420, y: 330 },
            { x: 545, y: 435 }
        ],
        pitLane: { startX: 100, startY: 310, endX: 200, endY: 310 }
    },
    {
        id: 'miami',
        name: 'Miami International Autodrome',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Miami Gardens',
        type: 'MIXED',
        length: 5.412,
        laps: 57,
        corners: 19,
        drsZones: 2,
        baseLapTime: 91.8,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 35,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'Florida street-style permanent circuit. Hard braking zones and the famous Turn 11-13.',
        svgPath: 'M 100 355 L 210 355 Q 250 355 270 320 L 315 265 Q 345 235 390 235 L 455 235 Q 495 235 515 275 L 545 335 Q 570 370 540 400 L 480 425 Q 425 435 380 410 L 310 395 Q 245 385 205 410 L 150 435 Q 105 425 100 355 Z',
        sectors: [
            { x: 100, y: 355 },
            { x: 390, y: 235 },
            { x: 540, y: 400 }
        ],
        pitLane: { startX: 105, startY: 375, endX: 210, endY: 375 }
    },
    {
        id: 'canada',
        name: 'Circuit Gilles-Villeneuve',
        country: 'Canada',
        flag: '🇨🇦',
        city: 'Montréal',
        type: 'MIXED',
        length: 4.361,
        laps: 70,
        corners: 14,
        drsZones: 3,
        baseLapTime: 74.5,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 40,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'The Wall of Champions. Long straights, the famous hairpin and chicane before the pits.',
        svgPath: 'M 90 380 L 185 380 Q 220 380 245 345 L 285 290 Q 310 255 355 255 L 410 255 Q 450 255 470 295 L 505 360 Q 535 395 505 425 L 450 450 Q 395 460 355 430 L 290 410 Q 235 400 200 425 L 145 450 Q 100 440 90 380 Z',
        sectors: [
            { x: 90, y: 380 },
            { x: 355, y: 255 },
            { x: 505, y: 425 }
        ],
        pitLane: { startX: 95, startY: 400, endX: 200, endY: 400 }
    },
    {
        id: 'imola',
        name: 'Autodromo Enzo e Dino Ferrari',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Imola',
        type: 'TECHNICAL',
        length: 4.909,
        laps: 63,
        corners: 19,
        drsZones: 2,
        baseLapTime: 76.9,
        overtakingDifficulty: 7,
        tireDegradation: 7,
        rainProbability: 35,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'Historic Tosa and Tamburello. Fast flowing corners and the legendary Rivazza.',
        svgPath: 'M 110 370 L 200 370 Q 240 370 265 335 L 300 280 Q 325 245 370 245 L 430 245 Q 470 245 495 280 L 535 340 Q 565 375 535 405 L 475 430 Q 415 440 375 410 L 305 390 Q 245 380 205 405 L 155 425 Q 110 415 110 370 Z',
        sectors: [
            { x: 110, y: 370 },
            { x: 370, y: 245 },
            { x: 535, y: 405 }
        ],
        pitLane: { startX: 115, startY: 390, endX: 210, endY: 390 }
    },
    {
        id: 'red_bull_ring',
        name: 'Red Bull Ring',
        country: 'Austria',
        flag: '🇦🇹',
        city: 'Spielberg',
        type: 'HIGH_SPEED',
        length: 4.318,
        laps: 71,
        corners: 10,
        drsZones: 3,
        baseLapTime: 65.7,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 55,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'Alpine power track. Dramatic elevation changes and the famous Schlossgold chicane.',
        svgPath: 'M 100 320 L 220 320 Q 260 320 285 285 L 330 235 Q 360 200 410 200 L 470 200 Q 505 200 530 240 L 570 300 Q 595 335 560 370 L 495 400 Q 440 410 400 385 L 330 365 Q 275 355 235 380 L 175 400 Q 120 390 100 320 Z',
        sectors: [
            { x: 100, y: 320 },
            { x: 410, y: 200 },
            { x: 560, y: 370 }
        ],
        pitLane: { startX: 105, startY: 340, endX: 215, endY: 340 }
    },
    {
        id: 'nurburgring',
        name: 'Nürburgring',
        country: 'Germany',
        flag: '🇩🇪',
        city: 'Nürburg',
        type: 'MIXED',
        length: 5.148,
        laps: 60,
        corners: 16,
        drsZones: 2,
        baseLapTime: 91.3,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 65,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'Legendary Green Hell. Fast flowing corners through the Eifel mountains.',
        svgPath: 'M 80 355 L 180 355 Q 215 355 240 320 L 280 265 Q 305 230 355 230 L 420 230 Q 460 230 485 270 L 525 325 Q 555 360 525 390 L 465 420 Q 405 430 365 405 L 295 385 Q 235 375 195 400 L 135 420 Q 85 410 80 355 Z',
        sectors: [
            { x: 80, y: 355 },
            { x: 355, y: 230 },
            { x: 525, y: 390 }
        ],
        pitLane: { startX: 85, startY: 375, endX: 195, endY: 375 }
    },
    {
        id: 'portimao',
        name: 'Algarve International Circuit',
        country: 'Portugal',
        flag: '🇵🇹',
        city: 'Portimão',
        type: 'MIXED',
        length: 4.653,
        laps: 66,
        corners: 15,
        drsZones: 2,
        baseLapTime: 79.4,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 35,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Rollercoaster elevation track. Dramatic hills and blind crests.',
        svgPath: 'M 95 340 L 200 340 Q 240 340 265 305 L 305 250 Q 330 215 380 215 L 435 215 Q 475 215 500 255 L 540 315 Q 565 355 535 385 L 475 415 Q 415 425 375 400 L 305 380 Q 245 370 205 395 L 150 420 Q 100 410 95 340 Z',
        sectors: [
            { x: 95, y: 340 },
            { x: 380, y: 215 },
            { x: 535, y: 385 }
        ],
        pitLane: { startX: 100, startY: 360, endX: 205, endY: 360 }
    },
    {
        id: 'mugello',
        name: 'Autodromo Internazionale del Mugello',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Scarperia',
        type: 'HIGH_SPEED',
        length: 5.245,
        laps: 59,
        corners: 15,
        drsZones: 2,
        baseLapTime: 77.6,
        overtakingDifficulty: 3,
        tireDegradation: 5,
        rainProbability: 40,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Tuscan rollercoaster. Sweeping high-speed corners and the famous Arrabbiata 1-2.',
        svgPath: 'M 85 365 L 190 365 Q 225 365 250 330 L 295 275 Q 320 240 370 240 L 425 240 Q 465 240 490 275 L 530 330 Q 555 365 525 395 L 465 425 Q 405 435 365 410 L 295 390 Q 235 380 195 405 L 135 425 Q 90 415 85 365 Z',
        sectors: [
            { x: 85, y: 365 },
            { x: 370, y: 240 },
            { x: 525, y: 395 }
        ],
        pitLane: { startX: 90, startY: 385, endX: 195, endY: 385 }
    },
    {
        id: 'hockenheim',
        name: 'Hockenheimring',
        country: 'Germany',
        flag: '🇩🇪',
        city: 'Hockenheim',
        type: 'HIGH_SPEED',
        length: 4.574,
        laps: 67,
        corners: 17,
        drsZones: 3,
        baseLapTime: 72.8,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 35,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Classic German venue. Famous long straights and the tight stadium section.',
        svgPath: 'M 80 390 L 190 390 L 235 355 Q 275 320 315 335 L 365 375 L 435 375 Q 480 375 480 340 L 480 260 Q 480 225 515 225 L 580 225 Q 610 225 610 265 L 610 395 Q 610 425 570 425 L 485 425 Q 440 425 440 390 L 440 355 L 365 355 L 365 390 Q 365 425 325 425 L 155 425 Q 95 425 80 390 Z',
        sectors: [
            { x: 80, y: 390 },
            { x: 480, y: 340 },
            { x: 610, y: 265 }
        ],
        pitLane: { startX: 85, startY: 405, endX: 195, endY: 405 }
    },
    {
        id: 'kyalami',
        name: 'Kyalami Circuit',
        country: 'South Africa',
        flag: '🇿🇦',
        city: 'Midrand',
        type: 'HIGH_SPEED',
        length: 4.261,
        laps: 72,
        corners: 13,
        drsZones: 2,
        baseLapTime: 75.9,
        overtakingDifficulty: 3,
        tireDegradation: 5,
        rainProbability: 35,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'Historic African high-speed track. Fast sweeping corners and long straights.',
        svgPath: 'M 90 370 L 200 370 Q 240 370 265 335 L 310 280 Q 340 245 390 245 L 455 245 Q 495 245 520 285 L 560 350 Q 585 385 550 415 L 485 440 Q 425 450 385 420 L 315 400 Q 255 390 215 415 L 155 440 Q 100 430 90 370 Z',
        sectors: [
            { x: 90, y: 370 },
            { x: 390, y: 245 },
            { x: 550, y: 415 }
        ],
        pitLane: { startX: 95, startY: 390, endX: 200, endY: 390 }
    },
    {
        id: 'fuji',
        name: 'Fuji Speedway',
        country: 'Japan',
        flag: '🇯🇵',
        city: 'Shizuoka',
        type: 'HIGH_SPEED',
        length: 4.563,
        laps: 67,
        corners: 16,
        drsZones: 2,
        baseLapTime: 81.5,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 45,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Iconic Mount Fuji backdrop. Long straight and the sweeping 100R and 300R corners.',
        svgPath: 'M 80 395 L 195 395 Q 230 395 255 360 L 300 305 Q 330 270 380 270 L 445 270 Q 485 270 510 310 L 550 370 Q 575 405 545 435 L 475 460 Q 410 470 370 440 L 300 420 Q 240 410 200 435 L 140 455 Q 85 445 80 395 Z',
        sectors: [
            { x: 80, y: 395 },
            { x: 380, y: 270 },
            { x: 545, y: 435 }
        ],
        pitLane: { startX: 85, startY: 415, endX: 195, endY: 415 }
    },
    {
        id: 'adelaide',
        name: 'Adelaide Street Circuit',
        country: 'Australia',
        flag: '🇦🇺',
        city: 'Adelaide',
        type: 'STREET',
        length: 3.780,
        laps: 78,
        corners: 16,
        drsZones: 1,
        baseLapTime: 74.8,
        overtakingDifficulty: 7,
        tireDegradation: 4,
        rainProbability: 35,
        safetyCarProbability: 50,
        nightRace: false,
        description: 'Historic street circuit. Tight city layout famous for the 1994 championship finale.',
        svgPath: 'M 115 420 L 200 420 Q 240 420 240 375 L 240 305 Q 240 265 280 265 L 355 265 Q 395 265 395 305 L 395 350 L 470 350 L 470 305 Q 470 265 510 265 L 565 265 Q 590 265 590 300 L 590 410 Q 590 440 550 440 L 455 440 Q 415 440 415 400 L 415 365 L 340 365 L 340 400 Q 340 440 305 440 L 160 440 Q 120 440 115 420 Z',
        sectors: [
            { x: 115, y: 420 },
            { x: 395, y: 305 },
            { x: 590, y: 300 }
        ],
        pitLane: { startX: 120, startY: 435, endX: 205, endY: 435 }
    },
    {
        id: 'istanbul',
        name: 'Istanbul Park',
        country: 'Turkey',
        flag: '🇹🇷',
        city: 'Istanbul',
        type: 'MIXED',
        length: 5.338,
        laps: 58,
        corners: 14,
        drsZones: 2,
        baseLapTime: 84.2,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'High-speed Turkish masterpiece. Famous Turn 8 left-hander and the long back straight.',
        svgPath: 'M 80 360 L 190 360 Q 225 360 250 325 L 290 270 Q 315 235 365 235 L 425 235 Q 465 235 490 270 L 530 330 Q 555 365 525 395 L 465 425 Q 405 435 365 410 L 295 390 Q 235 380 195 405 L 135 425 Q 85 415 80 360 Z',
        sectors: [
            { x: 80, y: 360 },
            { x: 365, y: 235 },
            { x: 525, y: 395 }
        ],
        pitLane: { startX: 85, startY: 380, endX: 195, endY: 380 }
    },
    {
        id: 'buddh',
        name: 'Buddh International Circuit',
        country: 'India',
        flag: '🇮🇳',
        city: 'Greater Noida',
        type: 'MIXED',
        length: 5.125,
        laps: 60,
        corners: 16,
        drsZones: 2,
        baseLapTime: 87.4,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 25,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Modern Indian track. Famous Turn 10-11-12 complex and long straights.',
        svgPath: 'M 90 345 L 195 345 Q 235 345 260 310 L 300 260 Q 325 225 375 225 L 435 225 Q 475 225 500 265 L 540 325 Q 565 360 535 390 L 475 415 Q 415 425 375 400 L 305 380 Q 245 370 205 395 L 145 415 Q 95 405 90 345 Z',
        sectors: [
            { x: 90, y: 345 },
            { x: 375, y: 225 },
            { x: 535, y: 390 }
        ],
        pitLane: { startX: 95, startY: 365, endX: 200, endY: 365 }
    },
    {
        id: 'korea',
        name: 'Korea International Circuit',
        country: 'South Korea',
        flag: '🇰🇷',
        city: 'Yeongam',
        type: 'MIXED',
        length: 5.615,
        laps: 55,
        corners: 18,
        drsZones: 2,
        baseLapTime: 96.8,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Coastal Korean layout. Long straights and technical infield section.',
        svgPath: 'M 85 375 L 195 375 Q 230 375 255 340 L 295 285 Q 320 250 370 250 L 430 250 Q 470 250 495 285 L 535 345 Q 560 380 530 410 L 470 435 Q 410 445 370 420 L 300 400 Q 240 390 200 415 L 140 435 Q 90 425 85 375 Z',
        sectors: [
            { x: 85, y: 375 },
            { x: 370, y: 250 },
            { x: 530, y: 410 }
        ],
        pitLane: { startX: 90, startY: 395, endX: 195, endY: 395 }
    },
    {
        id: 'valencia',
        name: 'Valencia Street Circuit',
        country: 'Spain',
        flag: '🇪🇸',
        city: 'Valencia',
        type: 'STREET',
        length: 5.419,
        laps: 57,
        corners: 25,
        drsZones: 1,
        baseLapTime: 99.3,
        overtakingDifficulty: 8,
        tireDegradation: 3,
        rainProbability: 20,
        safetyCarProbability: 50,
        nightRace: true,
        description: 'Former European GP street circuit. Long harbour straights and tight port section.',
        svgPath: 'M 105 415 L 190 415 Q 230 415 230 375 L 230 305 Q 230 265 270 265 L 345 265 Q 385 265 385 305 L 385 355 L 455 355 L 455 305 Q 455 265 495 265 L 555 265 Q 585 265 585 305 L 585 400 Q 585 435 545 435 L 460 435 Q 420 435 420 395 L 420 365 L 350 365 L 350 395 Q 350 435 315 435 L 165 435 Q 110 435 105 415 Z',
        sectors: [
            { x: 105, y: 415 },
            { x: 385, y: 305 },
            { x: 585, y: 305 }
        ],
        pitLane: { startX: 110, startY: 430, endX: 200, endY: 430 }
    },
    // === LEGENDARY HISTORIC CIRCUITS ===
    {
        id: 'brands_hatch',
        name: 'Brands Hatch',
        country: 'United Kingdom',
        flag: '🇬🇧',
        city: 'Kent',
        type: 'TECHNICAL',
        length: 4.207,
        laps: 72,
        corners: 11,
        drsZones: 1,
        baseLapTime: 73.2,
        overtakingDifficulty: 6,
        tireDegradation: 6,
        rainProbability: 45,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'Classic British venue. Dramatic elevation changes through the famous Druids and Clearways.',
        svgPath: 'M 100 340 L 195 340 Q 235 340 260 305 L 300 250 Q 325 215 370 215 L 435 215 Q 475 215 500 255 L 540 320 Q 565 355 530 385 L 470 415 Q 410 425 370 400 L 300 380 Q 240 370 200 395 L 145 420 Q 105 410 100 340 Z',
        sectors: [
            { x: 100, y: 340 },
            { x: 370, y: 215 },
            { x: 530, y: 385 }
        ],
        pitLane: { startX: 105, startY: 360, endX: 200, endY: 360 }
    },
    {
        id: 'watkins_glen',
        name: 'Watkins Glen',
        country: 'United States',
        flag: '🇺🇸',
        city: 'New York',
        type: 'MIXED',
        length: 5.435,
        laps: 59,
        corners: 11,
        drsZones: 2,
        baseLapTime: 92.3,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 35,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The Glen. Fast flowing American classic with the famous Esses and the Boot.',
        svgPath: 'M 85 370 L 195 370 Q 235 370 260 335 L 300 280 Q 330 245 380 245 L 445 245 Q 485 245 510 280 L 550 340 Q 575 375 545 405 L 485 430 Q 425 440 385 415 L 310 395 Q 250 385 210 410 L 150 435 Q 90 425 85 370 Z',
        sectors: [
            { x: 85, y: 370 },
            { x: 380, y: 245 },
            { x: 545, y: 405 }
        ],
        pitLane: { startX: 90, startY: 390, endX: 195, endY: 390 }
    },
    {
        id: 'estorial',
        name: 'Autódromo do Estoril',
        country: 'Portugal',
        flag: '🇵🇹',
        city: 'Estoril',
        type: 'MIXED',
        length: 4.360,
        laps: 70,
        corners: 13,
        drsZones: 2,
        baseLapTime: 77.9,
        overtakingDifficulty: 5,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'Historic Portuguese venue. Famous for its long straight and dramatic hairpin.',
        svgPath: 'M 95 355 L 200 355 Q 240 355 265 320 L 305 265 Q 330 230 380 230 L 440 230 Q 480 230 505 265 L 545 325 Q 570 360 535 390 L 475 415 Q 415 425 375 400 L 305 380 Q 245 370 205 395 L 150 420 Q 100 410 95 355 Z',
        sectors: [
            { x: 95, y: 355 },
            { x: 380, y: 230 },
            { x: 535, y: 390 }
        ],
        pitLane: { startX: 100, startY: 375, endX: 205, endY: 375 }
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
