/* ============================================
   VELOCITY — TRACKS DATA
   21 real circuits for the world calendar.
   Circuit outlines traced from the supplied poster
   art (satellite-style reference images) and
   normalized to the shared 700 x 600 SVG viewBox.
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
        baseLapTime: 103.6,
        pitLanePenalty: 20,
        overtakingDifficulty: 3,
        tireDegradation: 3,
        rainProbability: 15,
        safetyCarProbability: 70,
        nightRace: false,
        description: 'Blind castle section barely seven metres wide, then the longest flat-out blast in Formula 1 down the Caspian promenade.',
        svgPath: 'M 643 190 L 593 210 L 571 162 L 487 203 L 479 183 L 480 241 L 417 255 L 417 234 L 408 253 L 323 270 L 327 313 L 214 343 L 229 284 L 184 263 L 189 244 L 45 364 L 82 425 L 118 406 L 161 438 L 243 362 L 655 332 L 648 253 L 633 256 L 643 316 L 228 351 L 166 416 L 120 390 L 80 405 L 63 372 L 133 283 L 184 266 L 220 299 L 187 336 L 207 354 L 331 319 L 339 276 L 484 246 L 495 196 L 576 184 L 591 218 L 631 207 L 644 249 L 645 200 L 624 200 Z',
        sectors: [
            { x: 643, y: 190 },
            { x: 243, y: 362 },
            { x: 166, y: 416 }
        ],
        pitLane: { startX: 643, startY: 204, endX: 723, endY: 204 }
    },
    {
        id: 'nurburgring',
        name: 'Nürburgring Nordschleife',
        country: 'Germany',
        flag: '🇩🇪',
        city: 'Nürburg',
        type: 'HIGH_SPEED',
        length: 20.832,
        laps: 14,
        corners: 73,
        drsZones: 1,
        baseLapTime: 300.0,
        pitLanePenalty: 35,
        overtakingDifficulty: 4,
        tireDegradation: 7,
        rainProbability: 50,
        safetyCarProbability: 45,
        nightRace: false,
        description: 'The Green Hell. Nearly 21 kilometres through the Eifel forest — Flugplatz, Fuchsröhre, Karussell — the most feared lap on Earth.',
        svgPath: 'M 654 135 L 582 94 L 553 121 L 502 89 L 482 111 L 413 106 L 393 42 L 364 77 L 294 89 L 283 124 L 209 94 L 229 164 L 181 195 L 183 238 L 153 269 L 178 288 L 157 301 L 235 167 L 216 126 L 287 129 L 375 75 L 401 78 L 420 136 L 598 120 L 633 169 L 605 215 L 542 222 L 576 289 L 470 338 L 468 404 L 297 479 L 283 526 L 183 539 L 141 492 L 106 489 L 89 459 L 126 407 L 81 338 L 69 354 L 46 338 L 101 384 L 82 464 L 105 518 L 162 553 L 272 558 L 324 487 L 496 403 L 474 345 L 605 288 L 575 229 L 637 217 Z',
        sectors: [
            { x: 654, y: 135 },
            { x: 375, y: 75 },
            { x: 126, y: 407 }
        ],
        pitLane: { startX: 654, startY: 149, endX: 734, endY: 149 }
    },
    {
        id: 'zandvoort',
        name: 'Circuit Zandvoort',
        country: 'Netherlands',
        flag: '🇳🇱',
        city: 'Zandvoort',
        type: 'HIGH_SPEED',
        length: 4.259,
        laps: 72,
        corners: 14,
        drsZones: 2,
        baseLapTime: 73.5,
        pitLanePenalty: 18,
        overtakingDifficulty: 7,
        tireDegradation: 6,
        rainProbability: 55,
        safetyCarProbability: 28,
        nightRace: false,
        description: 'Banked walls and dunes by the North Sea. The Hugenholtz and Arie Luyendyk bends tilt to 18 degrees — qualifying is everything.',
        svgPath: 'M 563 44 L 461 71 L 467 148 L 403 207 L 421 270 L 217 256 L 87 431 L 45 555 L 240 556 L 234 536 L 76 546 L 62 500 L 243 262 L 416 298 L 493 81 L 530 61 L 567 81 L 591 186 L 547 227 L 528 301 L 632 384 L 648 474 L 625 506 L 527 522 L 478 469 L 484 404 L 409 395 L 317 466 L 353 530 L 249 548 L 364 537 L 347 457 L 418 405 L 463 409 L 503 540 L 650 506 L 655 401 L 549 279 L 561 226 L 620 199 Z',
        sectors: [
            { x: 563, y: 44 },
            { x: 243, y: 262 },
            { x: 409, y: 395 }
        ],
        pitLane: { startX: 563, startY: 58, endX: 643, endY: 58 }
    },
    {
        id: 'shanghai',
        name: 'Shanghai International Circuit',
        country: 'China',
        flag: '🇨🇳',
        city: 'Shanghai',
        type: 'MIXED',
        length: 5.451,
        laps: 56,
        corners: 16,
        drsZones: 2,
        baseLapTime: 96.5,
        pitLanePenalty: 22,
        overtakingDifficulty: 4,
        tireDegradation: 7,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The never-ending right spiral eats front tires, then a 1.2 km back straight delivers the biggest slipstream battle of the sector.',
        svgPath: 'M 655 413 L 620 377 L 597 386 L 592 420 L 373 410 L 363 392 L 369 373 L 421 372 L 440 355 L 416 289 L 430 253 L 457 243 L 552 250 L 576 231 L 500 201 L 375 212 L 360 197 L 362 179 L 377 173 L 400 190 L 412 170 L 399 147 L 372 141 L 343 158 L 209 411 L 75 415 L 45 446 L 56 458 L 617 459 L 646 444 Z',
        sectors: [
            { x: 655, y: 413 },
            { x: 500, y: 201 },
            { x: 75, y: 415 }
        ],
        pitLane: { startX: 655, startY: 427, endX: 735, endY: 427 }
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
        drsZones: 3,
        baseLapTime: 90.8,
        pitLanePenalty: 16,
        overtakingDifficulty: 5,
        tireDegradation: 3,
        rainProbability: 5,
        safetyCarProbability: 65,
        nightRace: true,
        description: 'The fastest street circuit in the world — 27 flat-out corners between unforgiving walls under the corniche floodlights.',
        svgPath: 'M 655 166 L 619 167 L 488 245 L 473 237 L 479 261 L 440 256 L 447 277 L 382 310 L 368 302 L 362 327 L 327 317 L 314 343 L 279 328 L 258 377 L 241 375 L 243 355 L 211 378 L 213 354 L 178 343 L 174 357 L 130 370 L 118 358 L 114 375 L 67 390 L 52 381 L 59 409 L 45 419 L 87 434 L 107 392 L 120 404 L 122 387 L 162 388 L 171 401 L 173 385 L 195 419 L 242 401 L 256 413 L 256 396 L 309 361 L 328 375 L 383 354 L 380 336 L 408 329 L 407 312 L 489 315 L 505 267 L 620 258 L 654 218 L 648 180 L 653 197 L 626 244 L 609 240 L 614 255 L 509 261 L 468 304 L 395 306 L 451 298 L 453 272 Z',
        sectors: [
            { x: 655, y: 166 },
            { x: 67, y: 390 },
            { x: 620, y: 258 }
        ],
        pitLane: { startX: 655, startY: 180, endX: 735, endY: 180 }
    },
    {
        id: 'lusail',
        name: 'Lusail International Circuit',
        country: 'Qatar',
        flag: '🇶🇦',
        city: 'Lusail',
        type: 'HIGH_SPEED',
        length: 5.38,
        laps: 57,
        corners: 16,
        drsZones: 2,
        baseLapTime: 83.5,
        pitLanePenalty: 20,
        overtakingDifficulty: 5,
        tireDegradation: 8,
        rainProbability: 2,
        safetyCarProbability: 20,
        nightRace: true,
        description: 'Desert night race built for bikes, conquered by cars. Fast, flowing corners demand powerful necks and perfect tire management.',
        svgPath: 'M 51 42 L 66 70 L 51 81 L 73 78 L 106 142 L 149 172 L 278 175 L 427 95 L 468 94 L 588 272 L 575 398 L 605 415 L 636 512 L 604 526 L 509 491 L 479 379 L 435 344 L 386 434 L 424 514 L 408 537 L 200 549 L 439 558 L 412 413 L 455 376 L 476 404 L 476 490 L 626 551 L 649 543 L 599 374 L 607 244 L 573 231 L 539 137 L 461 65 L 433 65 L 378 123 L 255 164 L 151 132 L 126 142 Z',
        sectors: [
            { x: 51, y: 42 },
            { x: 479, y: 379 },
            { x: 626, y: 551 }
        ],
        pitLane: { startX: 51, startY: 56, endX: 131, endY: 56 }
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
        baseLapTime: 97.0,
        pitLanePenalty: 20,
        overtakingDifficulty: 4,
        tireDegradation: 6,
        rainProbability: 25,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'A hill climb to Turn 1, a Silverstone-style esses tribute, and the 40-metre grid drop into the Turn 12 hairpin. Texas-sized.',
        svgPath: 'M 606 116 L 572 130 L 519 96 L 508 112 L 534 160 L 519 190 L 432 218 L 406 198 L 396 222 L 228 257 L 539 194 L 529 121 L 604 138 L 631 259 L 606 284 L 631 359 L 584 373 L 536 318 L 488 327 L 470 304 L 283 282 L 167 423 L 183 489 L 45 470 L 205 504 L 176 426 L 253 355 L 267 307 L 301 292 L 461 311 L 494 355 L 535 327 L 565 387 L 633 368 L 655 344 L 626 299 L 643 282 L 627 207 L 642 185 L 616 175 Z',
        sectors: [
            { x: 606, y: 116 },
            { x: 631, y: 259 },
            { x: 205, y: 504 }
        ],
        pitLane: { startX: 606, startY: 130, endX: 686, endY: 130 }
    },
    {
        id: 'mexico_city',
        name: 'Autódromo Hermanos Rodríguez',
        country: 'Mexico',
        flag: '🇲🇽',
        city: 'Mexico City',
        type: 'MIXED',
        length: 4.304,
        laps: 71,
        corners: 17,
        drsZones: 3,
        baseLapTime: 81.0,
        pitLanePenalty: 18,
        overtakingDifficulty: 7,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 35,
        nightRace: false,
        description: '2,200 metres above sea level — thin air starves wings of downforce and engines of oxygen. The Foro Sol stadium section roars.',
        svgPath: 'M 655 175 L 603 157 L 594 127 L 387 158 L 356 147 L 345 171 L 201 147 L 201 176 L 273 170 L 286 192 L 562 144 L 637 195 L 626 329 L 567 409 L 576 438 L 548 460 L 499 410 L 472 424 L 364 396 L 348 381 L 359 299 L 251 268 L 233 286 L 278 358 L 246 426 L 224 403 L 45 407 L 272 438 L 302 340 L 259 301 L 274 289 L 331 298 L 339 412 L 479 434 L 513 452 L 512 473 L 552 470 L 654 321 L 639 288 Z',
        sectors: [
            { x: 655, y: 175 },
            { x: 626, y: 329 },
            { x: 272, y: 438 }
        ],
        pitLane: { startX: 655, startY: 189, endX: 735, endY: 189 }
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
        drsZones: 2,
        baseLapTime: 78.0,
        pitLanePenalty: 20,
        overtakingDifficulty: 9,
        tireDegradation: 6,
        rainProbability: 20,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'A technical knot with almost no straight — "Monaco without walls". Track position is king, so hesitation in the pits costs races.',
        svgPath: 'M 45 370 L 80 466 L 56 497 L 96 501 L 99 551 L 111 534 L 207 551 L 120 532 L 77 408 L 128 373 L 279 427 L 315 417 L 301 343 L 347 166 L 312 98 L 347 91 L 435 121 L 491 256 L 571 238 L 585 308 L 636 366 L 603 499 L 485 487 L 458 517 L 579 551 L 490 523 L 493 501 L 591 517 L 653 490 L 632 457 L 655 342 L 592 291 L 625 244 L 560 220 L 489 235 L 459 167 L 477 132 L 352 80 L 340 49 L 311 81 L 329 206 L 301 298 L 265 310 L 296 376 L 260 405 L 142 362 Z',
        sectors: [
            { x: 45, y: 370 },
            { x: 435, y: 121 },
            { x: 655, y: 342 }
        ],
        pitLane: { startX: 45, startY: 384, endX: 125, endY: 384 }
    },
    {
        id: 'gilles_villeneuve',
        name: 'Circuit Gilles-Villeneuve',
        country: 'Canada',
        flag: '🇨🇦',
        city: 'Montréal',
        type: 'MIXED',
        length: 4.361,
        laps: 70,
        corners: 14,
        drsZones: 3,
        baseLapTime: 75.5,
        pitLanePenalty: 17,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 40,
        safetyCarProbability: 55,
        nightRace: false,
        description: 'Island of chicanes and bravery. Kiss the Wall of Champions wrong and your weekend is over — overtakes into the final chicane win hearts.',
        svgPath: 'M 655 401 L 611 324 L 618 220 L 594 225 L 578 165 L 469 205 L 439 247 L 354 223 L 348 241 L 223 287 L 205 271 L 133 324 L 114 316 L 45 399 L 174 412 L 181 435 L 192 419 L 333 407 L 200 412 L 74 392 L 80 357 L 187 296 L 216 300 L 327 253 L 405 243 L 462 261 L 471 214 L 488 231 L 490 206 L 557 186 L 602 245 L 584 259 L 605 268 L 605 334 L 586 347 L 610 348 L 633 388 L 497 371 L 484 352 L 451 390 L 348 406 L 392 401 L 406 416 L 475 381 L 543 375 L 643 414 Z',
        sectors: [
            { x: 655, y: 401 },
            { x: 174, y: 412 },
            { x: 488, y: 231 }
        ],
        pitLane: { startX: 655, startY: 415, endX: 735, endY: 415 }
    },
    {
        id: 'albert_park',
        name: 'Albert Park Circuit',
        country: 'Australia',
        flag: '🇦🇺',
        city: 'Melbourne',
        type: 'STREET',
        length: 5.278,
        laps: 58,
        corners: 14,
        drsZones: 4,
        baseLapTime: 81.0,
        pitLanePenalty: 18,
        overtakingDifficulty: 6,
        tireDegradation: 5,
        rainProbability: 25,
        safetyCarProbability: 45,
        nightRace: false,
        description: 'The parkland season hangover cure — bumpy, temporary, and treacherous. Four DRS zones, fast walls, zero forgiveness.',
        svgPath: 'M 45 293 L 86 341 L 65 377 L 78 395 L 219 409 L 252 442 L 446 449 L 447 434 L 254 438 L 222 406 L 70 386 L 90 342 L 50 299 L 97 178 L 171 156 L 245 198 L 252 242 L 320 305 L 426 311 L 460 279 L 534 277 L 649 336 L 618 404 L 544 389 L 531 437 L 452 443 L 534 441 L 544 393 L 619 409 L 655 346 L 536 273 L 459 275 L 425 306 L 320 301 L 254 237 L 244 191 L 167 151 L 92 177 Z',
        sectors: [
            { x: 45, y: 293 },
            { x: 97, y: 178 },
            { x: 534, y: 441 }
        ],
        pitLane: { startX: 45, startY: 307, endX: 125, endY: 307 }
    },
    {
        id: 'suzuka',
        name: 'Suzuka International Racing Course',
        country: 'Japan',
        flag: '🇯🇵',
        city: 'Suzuka',
        type: 'HIGH_SPEED',
        length: 5.807,
        laps: 53,
        corners: 18,
        drsZones: 1,
        baseLapTime: 91.5,
        pitLanePenalty: 21,
        overtakingDifficulty: 6,
        tireDegradation: 7,
        rainProbability: 45,
        safetyCarProbability: 30,
        nightRace: false,
        description: 'The only figure-8 in Grand Prix racing. The S Curves, Degners, 130R and Spoon — the purest driver circuit on the calendar.',
        svgPath: 'M 655 211 L 623 170 L 578 166 L 555 244 L 403 241 L 315 343 L 267 330 L 225 390 L 103 433 L 58 414 L 48 369 L 154 306 L 149 260 L 175 237 L 208 232 L 229 264 L 285 275 L 335 307 L 288 273 L 230 262 L 212 231 L 187 230 L 148 257 L 153 303 L 56 353 L 45 394 L 72 429 L 115 434 L 226 393 L 268 333 L 310 347 L 341 316 L 399 365 L 430 366 L 646 256 Z',
        sectors: [
            { x: 655, y: 211 },
            { x: 48, y: 369 },
            { x: 56, y: 353 }
        ],
        pitLane: { startX: 655, startY: 225, endX: 735, endY: 225 }
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
        baseLapTime: 88.5,
        pitLanePenalty: 20,
        overtakingDifficulty: 5,
        tireDegradation: 8,
        rainProbability: 45,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The home of British motorsport. Maggotts-Becketts-Chapel taken flat is the single greatest sequence in racing.',
        svgPath: 'M 646 241 L 449 152 L 435 130 L 410 221 L 449 231 L 429 246 L 452 257 L 436 299 L 423 278 L 402 295 L 321 231 L 316 255 L 50 366 L 45 451 L 122 470 L 52 435 L 67 363 L 172 316 L 204 325 L 321 261 L 413 311 L 440 307 L 464 244 L 423 178 L 437 159 L 625 233 L 612 350 L 646 393 L 635 411 L 486 447 L 468 422 L 470 449 L 437 464 L 633 419 L 655 433 L 654 390 L 615 314 Z',
        sectors: [
            { x: 646, y: 241 },
            { x: 45, y: 451 },
            { x: 625, y: 233 }
        ],
        pitLane: { startX: 646, startY: 255, endX: 726, endY: 255 }
    },
    {
        id: 'monza',
        name: 'Autodromo Nazionale Monza',
        country: 'Italy',
        flag: '🇮🇹',
        city: 'Monza',
        type: 'HIGH_SPEED',
        length: 5.793,
        laps: 53,
        corners: 11,
        drsZones: 2,
        baseLapTime: 82.5,
        pitLanePenalty: 22,
        overtakingDifficulty: 2,
        tireDegradation: 4,
        rainProbability: 25,
        safetyCarProbability: 20,
        nightRace: false,
        description: 'The Temple of Speed. Lowest drag package of the year, the Parabolica sweep, and tifosi opera in every grandstand.',
        svgPath: 'M 45 168 L 171 219 L 524 221 L 542 258 L 574 269 L 624 324 L 628 393 L 594 406 L 205 421 L 205 432 L 557 432 L 557 422 L 616 407 L 635 420 L 655 410 L 636 387 L 655 324 L 626 318 L 584 270 L 583 240 L 549 250 L 524 189 L 503 209 L 182 209 L 96 184 L 97 168 Z',
        sectors: [
            { x: 45, y: 168 },
            { x: 205, y: 421 },
            { x: 655, y: 410 }
        ],
        pitLane: { startX: 45, startY: 182, endX: 125, endY: 182 }
    },
    {
        id: 'marina_bay',
        name: 'Marina Bay Street Circuit',
        country: 'Singapore',
        flag: '🇸🇬',
        city: 'Singapore',
        type: 'STREET',
        length: 4.927,
        laps: 62,
        corners: 19,
        drsZones: 3,
        baseLapTime: 95.5,
        pitLanePenalty: 21,
        overtakingDifficulty: 6,
        tireDegradation: 3,
        rainProbability: 40,
        safetyCarProbability: 90,
        nightRace: true,
        description: 'The original night race. 19 corners under 1,600 lights, 90% humidity, and a safety car streak that bends every championship.',
        svgPath: 'M 47 270 L 100 307 L 253 332 L 260 290 L 219 160 L 250 78 L 272 110 L 338 119 L 419 170 L 569 183 L 596 210 L 625 325 L 580 339 L 610 407 L 547 434 L 507 371 L 397 368 L 384 392 L 301 403 L 295 424 L 346 496 L 335 530 L 229 534 L 230 558 L 367 531 L 331 414 L 434 388 L 484 392 L 533 446 L 632 431 L 610 357 L 653 288 L 627 273 L 601 177 L 441 156 L 348 116 L 334 83 L 281 101 L 241 42 L 221 58 L 223 120 L 189 140 L 248 298 L 214 316 L 124 293 L 111 272 Z',
        sectors: [
            { x: 47, y: 270 },
            { x: 547, y: 434 },
            { x: 610, y: 357 }
        ],
        pitLane: { startX: 47, startY: 284, endX: 127, endY: 284 }
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
        corners: 19,
        drsZones: 2,
        baseLapTime: 107.0,
        pitLanePenalty: 18,
        overtakingDifficulty: 5,
        tireDegradation: 7,
        rainProbability: 75,
        safetyCarProbability: 40,
        nightRace: false,
        description: 'Eau Rouge, Raidillon, Pouhon, Blanchimont. It rains in one sector and shines in another. The greatest circuit in the world.',
        svgPath: 'M 655 273 L 612 178 L 551 192 L 539 145 L 479 178 L 252 220 L 239 206 L 239 248 L 180 249 L 63 352 L 45 406 L 191 353 L 220 371 L 330 353 L 391 366 L 448 455 L 424 420 L 440 399 L 413 392 L 401 344 L 222 362 L 182 324 L 175 350 L 56 385 L 259 227 L 526 174 L 550 201 L 599 198 L 611 227 L 536 255 L 469 254 L 451 234 L 431 312 L 518 369 L 501 410 L 554 455 L 567 435 L 570 455 L 569 436 L 509 405 L 547 357 L 462 331 L 448 272 L 587 257 L 614 295 Z',
        sectors: [
            { x: 655, y: 273 },
            { x: 391, y: 366 },
            { x: 526, y: 174 }
        ],
        pitLane: { startX: 655, startY: 287, endX: 735, endY: 287 }
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
        baseLapTime: 67.5,
        pitLanePenalty: 17,
        overtakingDifficulty: 3,
        tireDegradation: 6,
        rainProbability: 30,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'A 66-second lap of climbing hairpins. Three DRS zones and downhill braking into Turn 3 guarantee the fight every year.',
        svgPath: 'M 45 96 L 45 112 L 375 113 L 357 167 L 301 213 L 76 226 L 50 261 L 56 301 L 146 400 L 280 338 L 567 324 L 605 443 L 556 479 L 521 451 L 514 497 L 353 543 L 528 510 L 548 542 L 577 535 L 562 493 L 655 411 L 614 389 L 587 320 L 608 292 L 594 270 L 566 305 L 260 326 L 160 384 L 125 373 L 72 299 L 92 235 L 275 236 L 340 209 L 393 139 L 393 58 L 370 57 L 364 96 L 188 105 L 172 67 L 149 104 Z',
        sectors: [
            { x: 45, y: 96 },
            { x: 567, y: 324 },
            { x: 260, y: 326 }
        ],
        pitLane: { startX: 45, startY: 110, endX: 125, endY: 110 }
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
        baseLapTime: 98.0,
        pitLanePenalty: 18,
        overtakingDifficulty: 4,
        tireDegradation: 3,
        rainProbability: 2,
        safetyCarProbability: 55,
        nightRace: true,
        description: 'Saturday night lights on the Strip — a 2 km flat-out blast past the Sphere, then a cold-tire paddle through the paddock hairpins.',
        svgPath: 'M 524 73 L 395 64 L 365 42 L 375 135 L 360 165 L 226 175 L 220 236 L 74 248 L 225 247 L 257 189 L 396 164 L 372 79 L 490 81 L 528 138 L 545 286 L 569 300 L 577 398 L 597 416 L 583 527 L 461 531 L 430 488 L 329 465 L 277 505 L 177 493 L 77 517 L 182 531 L 354 490 L 400 495 L 410 520 L 493 558 L 591 535 L 626 480 L 604 457 L 614 390 L 596 376 L 549 181 L 561 153 L 537 137 Z',
        sectors: [
            { x: 524, y: 73 },
            { x: 490, y: 81 },
            { x: 77, y: 517 }
        ],
        pitLane: { startX: 524, startY: 87, endX: 604, endY: 87 }
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
        corners: 16,
        drsZones: 2,
        baseLapTime: 88.0,
        pitLanePenalty: 19,
        overtakingDifficulty: 6,
        tireDegradation: 4,
        rainProbability: 2,
        safetyCarProbability: 30,
        nightRace: true,
        description: 'Day turns to dusk through the W Hotel. Two long straights feed two DRS zones — championships go one-stop side or other here.',
        svgPath: 'M 612 100 L 555 122 L 414 51 L 251 62 L 242 135 L 206 122 L 123 175 L 78 443 L 160 165 L 251 143 L 283 83 L 435 81 L 525 142 L 582 126 L 613 151 L 623 236 L 544 233 L 623 416 L 591 482 L 534 507 L 497 489 L 493 409 L 395 351 L 308 213 L 218 231 L 235 299 L 172 321 L 116 541 L 76 525 L 96 456 L 67 451 L 45 517 L 151 549 L 182 351 L 265 326 L 238 264 L 287 231 L 328 252 L 362 354 L 479 442 L 492 523 L 596 493 L 655 441 L 575 262 L 634 238 L 647 164 Z',
        sectors: [
            { x: 612, y: 100 },
            { x: 525, y: 142 },
            { x: 96, y: 456 }
        ],
        pitLane: { startX: 612, startY: 114, endX: 692, endY: 114 }
    },
    {
        id: 'miami',
        name: 'Miami International Autodrome',
        country: 'United States',
        flag: '🇺🇸',
        city: 'Miami',
        type: 'STREET',
        length: 5.412,
        laps: 57,
        corners: 19,
        drsZones: 3,
        baseLapTime: 93.0,
        pitLanePenalty: 19,
        overtakingDifficulty: 5,
        tireDegradation: 5,
        rainProbability: 35,
        safetyCarProbability: 45,
        nightRace: false,
        description: 'Built around Hard Rock Stadium. Purple surfacings, an unforgiving twistless chicane at Turns 13-16, heat that cooks torque.',
        svgPath: 'M 45 188 L 45 204 L 155 123 L 213 108 L 228 211 L 288 282 L 216 319 L 191 309 L 180 329 L 215 336 L 273 429 L 324 437 L 420 372 L 480 393 L 578 345 L 579 371 L 612 379 L 599 416 L 573 403 L 562 425 L 597 430 L 623 499 L 607 532 L 655 539 L 655 510 L 608 446 L 647 296 L 501 370 L 473 340 L 476 382 L 430 357 L 434 333 L 413 322 L 414 362 L 297 428 L 305 390 L 270 402 L 226 327 L 337 272 L 326 258 L 299 270 L 244 217 L 274 191 L 238 187 L 222 62 L 203 61 L 199 92 Z',
        sectors: [
            { x: 45, y: 188 },
            { x: 578, y: 345 },
            { x: 413, y: 322 }
        ],
        pitLane: { startX: 45, startY: 202, endX: 125, endY: 202 }
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
        corners: 14,
        drsZones: 2,
        baseLapTime: 80.0,
        pitLanePenalty: 19,
        overtakingDifficulty: 6,
        tireDegradation: 7,
        rainProbability: 15,
        safetyCarProbability: 25,
        nightRace: false,
        description: 'The aero exam paper everyone memorized in testing. Turn 3 is the benchmark corner — decent through there means fast everywhere.',
        svgPath: 'M 655 365 L 631 362 L 643 270 L 599 251 L 591 187 L 508 210 L 571 291 L 549 312 L 466 274 L 464 251 L 444 267 L 345 240 L 275 329 L 296 341 L 293 370 L 215 381 L 137 356 L 238 313 L 247 286 L 225 267 L 106 298 L 85 286 L 91 309 L 45 367 L 143 413 L 133 391 L 73 377 L 69 344 L 118 300 L 225 275 L 232 308 L 143 331 L 131 360 L 217 389 L 295 377 L 344 247 L 487 288 L 483 316 L 503 303 L 568 323 L 577 286 L 513 226 L 530 201 L 578 208 L 594 257 L 623 269 L 614 397 L 380 413 L 621 413 L 630 370 Z',
        sectors: [
            { x: 655, y: 365 },
            { x: 225, y: 267 },
            { x: 487, y: 288 }
        ],
        pitLane: { startX: 655, startY: 379, endX: 735, endY: 379 }
    }
];

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
    if (typeof CalendarService !== 'undefined') {
        return CalendarService.createCalendar({ seasonLength: numRaces || 10, shuffle: true })
            .map(id => getTrackById(id))
            .filter(Boolean);
    }
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
