/* ============================================
   VELOCITY — AUDIO MANAGER (IMPROVED)
   Smoother, more pleasant procedural sounds
   Better envelopes and filtered tones
   ============================================ */

window.AudioManager = (() => {
    let audioContext = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;

    let musicEnabled = false;
    let sfxEnabled = true;
    let masterVolume = 0.5;
    let musicVolume = 0.25;
    let sfxVolume = 0.4;

    let currentMusicLoop = null;
    let engineLoopActive = false;
    let engineOscillator = null;

    function init() {
        if (audioContext) return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioCtx();

            masterGain = audioContext.createGain();
            masterGain.gain.value = masterVolume;
            masterGain.connect(audioContext.destination);

            musicGain = audioContext.createGain();
            musicGain.gain.value = musicVolume;
            musicGain.connect(masterGain);

            sfxGain = audioContext.createGain();
            sfxGain.gain.value = sfxVolume;
            sfxGain.connect(masterGain);

            console.log('[AudioManager] Initialized');
        } catch (err) {
            console.warn('[AudioManager] Web Audio not supported:', err);
        }
    }

    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    /**
     * Play a soft tone with smooth envelope and filter
     */
    function playSoftTone(freq, duration, type = 'sine', volume = 0.2, filterFreq = 2000) {
        if (!audioContext || !sfxEnabled) return;
        resume();

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, now);
        filter.Q.value = 0.5;

        // Smooth ADSR envelope
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(volume, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(volume * 0.7, now + duration * 0.4);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.connect(filter);
        filter.connect(envelope);
        envelope.connect(sfxGain);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.1);
    }

    /**
     * Filtered sweep for whoosh effects
     */
    function playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.15) {
        if (!audioContext || !sfxEnabled) return;
        resume();

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + duration);
        filter.Q.value = 1;

        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(volume, now + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.connect(filter);
        filter.connect(envelope);
        envelope.connect(sfxGain);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.1);
    }

    /**
     * Softer filtered noise
     */
    function playSoftNoise(duration, volume = 0.15, filterFreq = 800) {
        if (!audioContext || !sfxEnabled) return;
        resume();

        const now = audioContext.currentTime;
        const bufferSize = Math.floor(audioContext.sampleRate * duration);
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 0.7;

        const envelope = audioContext.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(volume, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(envelope);
        envelope.connect(sfxGain);

        noise.start(now);
    }

    /* ===== UI SOUNDS (softer, more pleasant) ===== */

    function uiClick() {
        playSoftTone(700, 0.06, 'sine', 0.12, 1500);
    }

    function uiHover() {
        playSoftTone(900, 0.04, 'sine', 0.06, 1200);
    }

    function uiConfirm() {
        playSoftTone(523, 0.08, 'sine', 0.15, 2000);
        setTimeout(() => playSoftTone(784, 0.12, 'sine', 0.15, 2000), 60);
    }

    function uiError() {
        playSoftTone(220, 0.18, 'sine', 0.15, 800);
        setTimeout(() => playSoftTone(180, 0.22, 'sine', 0.15, 800), 100);
    }

    function uiNotify() {
        playSoftTone(660, 0.1, 'sine', 0.12, 2000);
        setTimeout(() => playSoftTone(880, 0.15, 'sine', 0.12, 2000), 70);
    }

    /**
     * Achievement unlock - pleasant arpeggio
     */
    function achievementUnlock() {
        const notes = [523, 659, 784, 1046];
        notes.forEach((freq, i) => {
            setTimeout(() => playSoftTone(freq, 0.18, 'sine', 0.18, 2500), i * 90);
        });
    }

    /**
     * Engine rev - filtered and smooth
     */
    function engineRev() {
        playSweep(120, 320, 0.5, 'triangle', 0.18);
        setTimeout(() => playSweep(280, 180, 0.4, 'triangle', 0.15), 250);
    }

    /**
     * Whoosh - soft and atmospheric
     */
    function whoosh(duration = 0.8) {
        playSweep(1200, 200, duration, 'sine', 0.2);
        playSoftNoise(duration, 0.08, 1000);
    }

    function raceLight() {
        playSoftTone(440, 0.25, 'sine', 0.2, 1500);
    }

    function raceGo() {
        playSoftTone(880, 0.4, 'sine', 0.25, 2000);
        setTimeout(() => playSweep(300, 700, 0.6, 'triangle', 0.2), 80);
    }

    /**
     * Pit stop - mechanical but not harsh
     */
    function pitStop() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                playSoftNoise(0.08, 0.12, 600);
                playSoftTone(150, 0.08, 'triangle', 0.1, 600);
            }, i * 120);
        }
    }

    /**
     * Crash - dramatic but filtered
     */
    function crash() {
        playSoftNoise(0.35, 0.25, 500);
        setTimeout(() => playSoftTone(100, 0.25, 'triangle', 0.2, 400), 50);
    }

    function positionGained() {
        playSoftTone(659, 0.08, 'sine', 0.15, 2000);
        setTimeout(() => playSoftTone(880, 0.12, 'sine', 0.15, 2000), 60);
    }

    function positionLost() {
        playSoftTone(440, 0.08, 'sine', 0.12, 1500);
        setTimeout(() => playSoftTone(330, 0.12, 'sine', 0.12, 1500), 60);
    }

    function fastestLap() {
        playSoftTone(1046, 0.1, 'sine', 0.2, 2500);
        setTimeout(() => playSoftTone(1318, 0.18, 'sine', 0.2, 2500), 80);
    }

    /**
     * Victory fanfare - melodic and triumphant
     */
    function victoryFanfare() {
        const melody = [
            { freq: 523, time: 0, dur: 0.18 },
            { freq: 523, time: 180, dur: 0.18 },
            { freq: 523, time: 360, dur: 0.18 },
            { freq: 659, time: 540, dur: 0.55 },
            { freq: 784, time: 900, dur: 0.35 },
            { freq: 1046, time: 1250, dur: 0.7 }
        ];
        melody.forEach(note => {
            setTimeout(() => playSoftTone(note.freq, note.dur, 'sine', 0.22, 2500), note.time);
        });
    }

    /**
     * Safety car - softer warning, not piercing
     */
    function safetyCar() {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                playSoftTone(i % 2 === 0 ? 550 : 720, 0.25, 'sine', 0.13, 1500);
            }, i * 280);
        }
    }

    function tireScreech() {
        playSoftNoise(0.2, 0.08, 2000);
    }

    /**
     * Dive transition - smooth atmospheric
     */
    function diveTransition() {
        whoosh(0.7);
        setTimeout(() => engineRev(), 250);
        setTimeout(() => playSoftTone(80, 0.3, 'sine', 0.2, 400), 700);
    }

    /* ===== MUSIC (smoother, less repetitive) ===== */

    function startAmbientMusic() {
        if (!audioContext || !musicEnabled) return;
        stopMusic();
        resume();

        const now = audioContext.currentTime;
        const baseFreq = 110;
        const oscillators = [];
        const gains = [];

        // Layer 1: bass drone
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        const filter1 = audioContext.createBiquadFilter();
        osc1.type = 'sine';
        osc1.frequency.value = baseFreq;
        filter1.type = 'lowpass';
        filter1.frequency.value = 400;
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.12, now + 3);
        osc1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(musicGain);
        osc1.start();
        oscillators.push(osc1);
        gains.push(gain1);

        // Layer 2: fifth above
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        const filter2 = audioContext.createBiquadFilter();
        osc2.type = 'sine';
        osc2.frequency.value = baseFreq * 1.5;
        filter2.type = 'lowpass';
        filter2.frequency.value = 800;
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.07, now + 4);
        osc2.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(musicGain);
        osc2.start();
        oscillators.push(osc2);
        gains.push(gain2);

        // Layer 3: octave with slow LFO
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        const filter3 = audioContext.createBiquadFilter();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        osc3.type = 'sine';
        osc3.frequency.value = baseFreq * 2;
        filter3.type = 'lowpass';
        filter3.frequency.value = 1200;
        lfo.frequency.value = 0.12;
        lfoGain.gain.value = 4;
        lfo.connect(lfoGain);
        lfoGain.connect(osc3.frequency);
        gain3.gain.setValueAtTime(0, now);
        gain3.gain.linearRampToValueAtTime(0.05, now + 5);
        osc3.connect(filter3);
        filter3.connect(gain3);
        gain3.connect(musicGain);
        osc3.start();
        lfo.start();
        oscillators.push(osc3, lfo);
        gains.push(gain3, lfoGain);

        currentMusicLoop = {
            oscillators,
            gains,
            stop: () => {
                const stopTime = audioContext.currentTime + 1.5;
                gains.forEach(g => g.gain.linearRampToValueAtTime(0, stopTime));
                setTimeout(() => {
                    oscillators.forEach(o => {
                        try { o.stop(); } catch (e) {}
                    });
                }, 1600);
            }
        };
    }

    /**
     * Race music - subtle pulse, not repetitive
     */
    function startRaceMusic() {
        if (!audioContext || !musicEnabled) return;
        stopMusic();
        resume();

        const bassPattern = setInterval(() => {
            if (!musicEnabled) {
                clearInterval(bassPattern);
                return;
            }
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            osc.type = 'sine';
            osc.frequency.value = 73;
            filter.type = 'lowpass';
            filter.frequency.value = 300;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(musicGain);
            osc.start(now);
            osc.stop(now + 0.45);
        }, 800);

        currentMusicLoop = {
            stop: () => {
                clearInterval(bassPattern);
            }
        };
    }

    function stopMusic() {
        if (currentMusicLoop) {
            currentMusicLoop.stop();
            currentMusicLoop = null;
        }
    }

    /* ===== ENGINE LOOP ===== */

    function startEngineLoop() {
        if (!audioContext || !sfxEnabled || engineLoopActive) return;
        resume();
        engineLoopActive = true;

        const now = audioContext.currentTime;
        const baseFreq = 55;
        engineOscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        engineOscillator.type = 'sine';
        engineOscillator.frequency.value = baseFreq;

        filter.type = 'lowpass';
        filter.frequency.value = 250;
        filter.Q.value = 0.5;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 2);

        engineOscillator.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);

        engineOscillator.start();
        engineOscillator._gain = gain;
        engineOscillator._filter = filter;
    }

    function modulateEngine(intensity = 0.5) {
        if (!engineOscillator) return;
        
        // Intensity 0-1 mapped to frequency
        const targetFreq = 55 + (intensity * 120);
        
        // Intensity also opens up the filter for a "grittier" sound
        const targetFilter = 250 + (intensity * 600);
        
        const now = audioContext.currentTime;
        engineOscillator.frequency.setTargetAtTime(targetFreq, now, 0.1);
        if (engineOscillator._filter) {
            engineOscillator._filter.frequency.setTargetAtTime(targetFilter, now, 0.1);
        }
    }

    function stopEngineLoop() {
        if (!engineOscillator) return;
        const gain = engineOscillator._gain;
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
        setTimeout(() => {
            try { engineOscillator.stop(); } catch (e) {}
            engineOscillator = null;
        }, 900);
        engineLoopActive = false;
    }

    /* ===== CONTROLS ===== */

    function setMasterVolume(vol) {
        masterVolume = Math.max(0, Math.min(1, vol));
        if (masterGain) masterGain.gain.value = masterVolume;
    }

    function setMusicVolume(vol) {
        musicVolume = Math.max(0, Math.min(1, vol));
        if (musicGain) musicGain.gain.value = musicVolume;
    }

    function setSfxVolume(vol) {
        sfxVolume = Math.max(0, Math.min(1, vol));
        if (sfxGain) sfxGain.gain.value = sfxVolume;
    }

    function toggleMusic() {
        musicEnabled = !musicEnabled;
        if (musicEnabled) {
            startAmbientMusic();
        } else {
            stopMusic();
        }
        return musicEnabled;
    }

    function toggleSfx() {
        sfxEnabled = !sfxEnabled;
        if (!sfxEnabled) stopEngineLoop();
        return sfxEnabled;
    }

    function isMusicEnabled() { return musicEnabled; }
    function isSfxEnabled() { return sfxEnabled; }

    function attachEventListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('ui:click', uiClick);
        EventBus.on('ui:hover', uiHover);
        EventBus.on('ui:confirm', uiConfirm);
        EventBus.on('ui:error', uiError);
        EventBus.on('ui:notify', uiNotify);

        EventBus.on('race:start', () => {
            startRaceMusic();
            startEngineLoop();
        });
        EventBus.on('race:finish', () => {
            stopEngineLoop();
            stopMusic();
        });
        EventBus.on('race:pit_stop', pitStop);
        EventBus.on('race:safety_car', safetyCar);
        EventBus.on('race:incident', crash);
        EventBus.on('race:fastest_lap', fastestLap);
        EventBus.on('race:position_gained', positionGained);
        EventBus.on('race:position_lost', positionLost);
        EventBus.on('race:victory', victoryFanfare);

        EventBus.on('nav:go', diveTransition);
        EventBus.on('nav:home', () => whoosh(0.6));

        EventBus.on('achievement:unlocked', achievementUnlock);
    }

    return {
        init,
        resume,
        attachEventListeners,

        uiClick, uiHover, uiConfirm, uiError, uiNotify,
        achievementUnlock, engineRev, whoosh,
        raceLight, raceGo, pitStop, crash,
        positionGained, positionLost, fastestLap,
        victoryFanfare, safetyCar, tireScreech,
        diveTransition,

        startAmbientMusic, startRaceMusic, stopMusic,
        startEngineLoop, modulateEngine, stopEngineLoop,

        setMasterVolume, setMusicVolume, setSfxVolume,
        toggleMusic, toggleSfx,
        isMusicEnabled, isSfxEnabled
    };
})();