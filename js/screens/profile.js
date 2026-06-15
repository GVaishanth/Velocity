/* ============================================
   VELOCITY — VIP PROFILE SCREEN (REMODELED)
   Absolute Masterpiece Remodel with Esport Super License,
   Elite Trophy Showcase, Cybernetic Aptitude Radar, Storage Sync
   ============================================ */

const ProfileScreen = (() => {

    let container = null;
    let isActive = false;
    let currentTab = 'overview';

    /**
     * Initialize the profile screen
     */
    function init() {
        container = document.getElementById('profile-content');
        if (!container) return;
        attachListeners();
    }

    /**
     * Main rendering execution loop
     */
    function render() {
        if (!container) return;

        // Load active player profile
        const profile = StateManager.loadProfile?.() || StateManager.get('profile') || {};
        const levelData = getLevelProgress(profile.xp || 0);
        const trophyStats = getAchievementStats(profile);

        const usernameDisplay = profile.username || 'RACER_01';
        const userTitleDisplay = profile.userTitle || 'ELITE CONSTRUCTOR';
        const avatarDisplay = profile.avatar || '🪖';

        container.innerHTML = `
            <div class="profile-container">
                <!-- Universal invincible stacking Home button -->
                <button class="home-btn" id="profile-home-btn" title="Back to Home">⌂</button>

                <!-- HOLOGRAPHIC VIP SUPER LICENSE HEADER (Towering 3X Showcase) -->
                <div class="profile-vip-license" style="padding: 56px 64px; display: flex; flex-direction: column; gap: 36px; min-height: 440px; background: linear-gradient(135deg, rgba(20,20,30,0.92), rgba(8,8,14,0.98)); border: 4px solid #0080FF; border-radius: 28px; box-shadow: 0 0 60px rgba(0,128,255,0.4), inset 0 0 40px rgba(0,128,255,0.2); margin-top: 55px !important;">
                    <!-- High-Tech Paddock Security Overlay & ESport Stamp -->
                    <div class="license-security-stamp" style="top: 36px; right: 48px;">
                        <div class="security-barcode" style="font-size: 56px; letter-spacing: 4px;">VELOCITY-FIA-99</div>
                        <div class="security-serial" style="font-size: 12px; letter-spacing: 6px; color: var(--yellow);">SUPER LICENSE • SECURE FIA UPLINK</div>
                    </div>

                    <!-- Upper Tier: Massive Identity Studio Flexboard -->
                    <div class="identity-upper-tier" style="display: flex; align-items: center; gap: 48px; width: 100%; flex-wrap: wrap;">
                        <!-- Custom Esport Towering Emblem Dock -->
                        <div class="license-avatar-dock massive-dock" id="vip-avatar-dock" title="Customize Credentials Studio" style="width: 200px; height: 200px; flex-shrink: 0; cursor: pointer;">
                            <div class="avatar-hexagon-frame" style="font-size: 100px; border-width: 6px; box-shadow: 0 0 40px rgba(0,128,255,0.6), inset 0 0 30px rgba(0,128,255,0.4);">
                                <span id="active-avatar-icon">${escapeHTML(avatarDisplay)}</span>
                            </div>
                            <div class="avatar-edit-overlay" style="font-size: 13px; padding: 10px 0; font-weight: 900; letter-spacing: 3px;">✏️ CUSTOMIZE EMBLEM</div>
                        </div>

                        <!-- Towering Paddock Player Identity -->
                        <div class="player-identity-matrix" style="display: flex; flex-direction: column; justify-content: center; min-width: 0; flex: 1; gap: 16px;">
                            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                                <span class="player-title-badge" style="font-size: 13px; padding: 8px 24px; margin: 0; border-width: 2px; letter-spacing: 4px; box-shadow: 0 0 20px rgba(255,215,0,0.4);">${escapeHTML(userTitleDisplay)}</span>
                                <button class="edit-license-btn" id="btn-edit-license" title="Edit Constructor Credentials Studio" style="font-size: 15px; padding: 8px 24px; border-width: 2px;">✏️ CREDENTIALS STUDIO</button>
                            </div>
                            <div class="player-username" style="font-size: clamp(38px, 8vw, 64px); letter-spacing: 8px; margin: 0; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--white); font-family: Orbitron; font-weight: 900; text-shadow: 0 0 30px rgba(0,128,255,0.8), 0 4px 8px rgba(0,0,0,0.9);">
                                ${escapeHTML(usernameDisplay)}
                            </div>
                        </div>
                    </div>

                    <!-- Lower Tier: Complete 3X Full-Width Authority Crown & seasonal Precision XP Track -->
                    <div class="authority-lower-tier" style="display: flex; align-items: center; gap: 36px; width: 100%; border-top: 2px solid rgba(0,128,255,0.4); padding-top: 28px; flex-wrap: wrap;">
                        <div class="level-emblem" title="Calculated Executive Paddock Authority Level" style="font-size: 28px; padding: 14px 32px; min-width: 180px; justify-content: center; border-radius: 14px; border: 2px solid #00FF41; box-shadow: 0 0 25px rgba(0,255,65,0.5);">
                            <span style="font-size: 18px;">🏆 LVL</span>
                            <span style="font-size: 42px; color: var(--yellow); font-weight: 900; text-shadow: 0 0 20px rgba(255,215,0,0.8);">${levelData.level}</span>
                        </div>
                        <div class="xp-progress-system" style="flex: 1; min-width: 320px;">
                            <div class="xp-numbers" style="font-size: 16px; margin-bottom: 12px; font-weight: 900; letter-spacing: 3px;">
                                <span style="color: var(--white);">SEASONAL PRESTIGE XP PROGRESSION SYSTEM</span>
                                <span style="color: #00FF41; font-family: Orbitron; font-weight: 900; font-size: 18px; text-shadow: 0 0 12px #00FF41;">${levelData.progressXP} / ${levelData.neededXP}</span>
                            </div>
                            <div class="xp-track" style="height: 18px; border-radius: 9px; border-width: 2px; padding: 2px;">
                                <div class="xp-laser-fill" style="width: ${levelData.percent}%; border-radius: 6px; box-shadow: 0 0 20px #00FF41;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- THE Elite 2x2 INTERACTIVE DATABASE NAVIGATION CONSOLE BOX -->
                <div class="vip-nav-console-box" style="margin-top: 20px !important;">
                    <div class="console-box-title">⚡ EXECUTIVE PADDOCK DATABASE NAVIGATION CONSOLE</div>
                    <div class="console-buttons-grid">
                        <button class="console-tab-btn ${currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
                            <span class="btn-head">
                                <span class="c-icon">📊</span>
                                <span class="c-title">SUPER LICENSE & METRICS</span>
                            </span>
                            <span class="c-sub">ESport Paddock Super License, Driver Aptitude Radar, Cybernetic Statistics Grid</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
                            <span class="btn-head">
                                <span class="c-icon">🏆</span>
                                <span class="c-title">THE TROPHY CABINET (${trophyStats.unlocked}/${trophyStats.total})</span>
                            </span>
                            <span class="c-sub">Interactive 3D / Glassmorphic Trophies, Professional Silvers, Podium Excellence Badges</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'history' ? 'active' : ''}" data-tab="history">
                            <span class="btn-head">
                                <span class="c-icon">📜</span>
                                <span class="c-title">CAREER LEGACY</span>
                            </span>
                            <span class="c-sub">Immortal Championship History Tiers, Definitive Points Tally, Universal Title Trophies</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'data' ? 'active' : ''}" data-tab="data">
                            <span class="btn-head">
                                <span class="c-icon">⚡</span>
                                <span class="c-title">SUBSPACE SYNC</span>
                            </span>
                            <span class="c-sub">Local JSON Save Sync, Storage Capacity Manager, Complete In-Memory Staging Purge</span>
                        </button>
                    </div>
                </div>

                <!-- DYNAMIC TAB INTERIOR -->
                <div id="vip-tab-content" style="position: relative; z-index: 2;">
                    ${renderActiveTab(profile)}
                </div>
            </div>
        `;

        attachContentDelegates();
    }

    /**
     * Render the active tab view
     */
    function renderActiveTab(profile) {
        switch (currentTab) {
            case 'overview': return renderMetricsOverview(profile);
            case 'achievements': return renderTrophyCabinet(profile);
            case 'history': return renderCareerLegacy(profile);
            case 'data': return renderSubspaceSync(profile);
            default: return renderMetricsOverview(profile);
        }
    }

    /**
     * Tab 1: Super License Cybernetic Metrics & Aptitude Showcase
     */
    function renderMetricsOverview(profile) {
        const totalRaces = profile.totalRaces || 0;
        const totalWins = profile.totalWins || 0;
        const winRate = totalRaces > 0 ? ((totalWins / totalRaces) * 100).toFixed(1) : '0.0';

        const metrics = [
            { id: 'races', label: 'Total Grand Prix Entered', value: totalRaces, icon: '🚦' },
            { id: 'wins', label: 'Grand Prix Victories', value: totalWins, icon: '🏆' },
            { id: 'podiums', label: 'Podium Celebrations', value: profile.totalPodiums || 0, icon: '🍾' },
            { id: 'poles', label: 'Pole Position Shootouts', value: profile.totalPoles || 0, icon: '⚡' },
            { id: 'flaps', label: 'Blistering Fastest Laps', value: profile.totalFastestLaps || 0, icon: '⏱️' },
            { id: 'champs', label: 'World Constructor Titles', value: profile.totalChampionships || 0, icon: '♛' },
            { id: 'xp', label: 'Total Prestige XP', value: (profile.xp || 0).toLocaleString(), icon: '✨' },
            { id: 'rate', label: 'Calculated ESport Win Rate', value: `${winRate}%`, icon: '📈' }
        ];

        // Custom aptitude calculations
        const aptitudes = [
            { name: 'Strategic Pit Aggression', percent: Math.min(98, 65 + (profile.totalWins || 0) * 3) },
            { name: 'Wet-Weather Master Delta', percent: Math.min(96, 70 + (profile.totalPodiums || 0) * 2) },
            { name: 'Qualifying Shootout Speed', percent: Math.min(99, 68 + (profile.totalPoles || 0) * 4) },
            { name: 'Consistent Telemetry Rhythm', percent: Math.min(95, 75 + (profile.totalRaces || 0) * 1.5) },
            { name: 'Overtake Slingshot Boldness', percent: Math.min(97, 72 + (profile.totalFastestLaps || 0) * 3) }
        ];

        return `
            <div class="metrics-master-grid">
                ${metrics.map(m => `
                    <div class="cyber-metric-card" title="Calculated ESport Telemetry Channel">
                        <div class="metric-label">
                            <span style="font-size: 16px;">${m.icon}</span>
                            <span>${m.label}</span>
                        </div>
                        <div class="metric-value">${m.value}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Calculated Esport Aptitude Breakdown -->
            <div class="aptitude-showcase">
                <div class="aptitude-title">
                    <span>⚡ EXECUTIVE PADDOCK APTITUDE BREAKDOWN</span>
                </div>
                <div class="aptitude-bars-grid">
                    ${aptitudes.map(a => `
                        <div class="aptitude-bar-item">
                            <div class="aptitude-item-header">
                                <span>${a.name}</span>
                                <span style="color: var(--yellow); font-family: Orbitron;">${a.percent}%</span>
                            </div>
                            <div class="aptitude-item-track">
                                <div class="aptitude-item-fill" style="width: ${a.percent}%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Tab 2: The Trophy Cabinet (3D / Glassmorphic Silverware Showcase)
     */
    function renderTrophyCabinet(profile) {
        const unlocked = profile.achievements || [];
        const visibleAchievements = typeof getVisibleAchievements === 'function' ? getVisibleAchievements() : [];

        // Categorize
        const tiers = {
            RACE: { title: '🏆 GRAND PRIX RACING EXCELLENCE', items: [] },
            CAREER: { title: '♛ EXECUTIVE CONSTRUCTOR MILESTONES', items: [] },
            RD: { title: '🔧 PADDOCK R&D ADMINISTRATION', items: [] }
        };

        visibleAchievements.forEach(a => {
            const t = tiers[a.category] || tiers.RACE;
            t.items.push(a);
        });

        return `
            <div class="trophy-room-showcase">
                ${Object.entries(tiers).map(([key, tier]) => `
                    <div class="trophy-tier">
                        <div class="trophy-tier-title">
                            <span>${tier.title}</span>
                        </div>
                        <div class="trophy-cards-grid" style="margin-top: 16px;">
                            ${tier.items.map(a => {
                                const isUnlocked = unlocked.includes(a.id);
                                return `
                                    <div class="master-trophy-card ${isUnlocked ? 'unlocked' : 'locked'}"
                                         title="${escapeHTML(a.description)}"
                                         onclick="ProfileScreen.triggerTrophyCelebration('${isUnlocked}')">
                                        <div class="trophy-hologram-dock">
                                            <span>${isUnlocked ? a.icon : '🔒'}</span>
                                        </div>
                                        <div class="trophy-title">${isUnlocked ? escapeHTML(a.name) : '???'}</div>
                                        <div class="trophy-desc">${escapeHTML(a.description)}</div>
                                        <div class="trophy-reward-badge">+${a.xpReward} PRESTIGE XP</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Tab 3: Career Legacy Timeline
     */
    function renderCareerLegacy(profile) {
        const history = profile.careerHistory || [];

        if (history.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px; background: var(--surface-1); border-radius: 16px; border: 2px dashed var(--border-medium);">
                    <div style="font-size: 56px; margin-bottom: 16px;">🏎️💨</div>
                    <h3 style="font-family: Orbitron; font-size: 22px; color: var(--yellow); margin-bottom: 12px;">ZERO CAMPAIGNS ON RECORD</h3>
                    <p style="font-family: Rajdhani; font-size: 16px; color: var(--gray-400); max-width: 600px; margin: 0 auto; line-height: 1.5;">
                        You have not completed a full championship campaign yet. Drop straight into the Paddock in Single Player, assemble your racing machines, and win World Constructor titles to build your immortal legacy!
                    </p>
                </div>
            `;
        }

        return `
            <div class="timeline-master-container">
                ${history.map(season => {
                    const isChamp = season.position === 1;
                    const isPodium = season.position === 2 || season.position === 3;
                    const rounds = season.totalRounds || 5;
                    const ptsDisplay = season.points !== undefined ? season.points : (isChamp ? rounds * 23 : 45);
                    const winsDisplay = season.wins !== undefined ? season.wins : (isChamp ? Math.max(1, rounds - 1) : 0);
                    return `
                        <div class="timeline-card-item">
                            <div class="season-badge-dock">
                                <span class="s-label">SEASON</span>
                                <span class="s-num">${season.season}</span>
                            </div>

                            <div class="timeline-info-dock">
                                <div class="timeline-constructor-title" style="color: ${season.teamColor || '#FFF'};">
                                    <span style="display: inline-block; width: 6px; height: 26px; background: ${season.teamColor || '#FFF'}; border-radius: 3px;"></span>
                                    <span>${escapeHTML(season.teamName || 'Independent Constructor')}</span>
                                </div>
                                <div class="timeline-stats-row">
                                    <span>Definitive Summary: Round ${rounds}/${rounds}</span>
                                    <span>•</span>
                                    <span style="color: var(--white);">${ptsDisplay} Total Points</span>
                                    <span>•</span>
                                    <span style="color: var(--green);">${winsDisplay} Victories</span>
                                </div>
                            </div>

                            <div class="timeline-trophy-emblem ${isChamp ? 'champion' : isPodium ? 'podium' : 'standard'}">
                                <span>${isChamp ? '🏆 WORLD CHAMPIONS' : `P${season.position} OVERALL`}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Tab 4: Subspace Sync (Save Storage Manager)
     */
    function renderSubspaceSync() {
        const storageInfo = typeof SaveSystem !== 'undefined' && SaveSystem.getStorageInfo ? SaveSystem.getStorageInfo() : { usedKB: 120, maxKB: 5000, saveCount: 3 };
        const usedPercent = Math.min(100, ((storageInfo.usedKB / storageInfo.maxKB) * 100)).toFixed(1);

        return `
            <div class="storage-master-card">
                <div class="storage-header-flex">
                    <div class="storage-title">⚡ LOCAL SUBSPACE STORAGE USED</div>
                    <div class="storage-figures">${storageInfo.usedKB} KB / ${storageInfo.maxKB} KB (${usedPercent}%)</div>
                </div>
                <div class="storage-bar-track">
                    <div class="storage-bar-fill" style="width: ${usedPercent}%;"></div>
                </div>

                <div class="data-actions-grid">
                    <button class="data-action-btn export" id="sync-btn-export" title="Copy raw JSON snapshot to Clipboard">
                        <span style="font-size: 26px;">📤</span>
                        <span>EXPORT SNAPSHOT</span>
                    </button>
                    <button class="data-action-btn import" id="sync-btn-import" title="Import previously exported JSON code">
                        <span style="font-size: 26px;">📥</span>
                        <span>IMPORT SNAPSHOT</span>
                    </button>
                    <button class="data-action-btn delete" id="sync-btn-reset" title="Purge local workspace storage entirely">
                        <span style="font-size: 26px;">⚠️</span>
                        <span>PURGE ALL DATA</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach UI event delegates
     */
    function attachContentDelegates() {
        if (!container) return;

        // Ultimate Universal Home Button
        const homeBtn = container.querySelector('#profile-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                EventBus.emit('nav:home');
            });
        }

        // Tab selection
        container.querySelectorAll('.console-tab-btn, .vip-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTab = btn.dataset.tab;
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                render();
            });
        });

        // Edit Identity Hub
        const editHubs = container.querySelectorAll('#btn-edit-license, #vip-avatar-dock');
        editHubs.forEach(el => {
            el.addEventListener('click', () => {
                showCredentialsWizard();
            });
        });

        // Subspace sync actions
        container.querySelector('#sync-btn-export')?.addEventListener('click', () => {
            if (typeof SaveSystem === 'undefined' || !SaveSystem.exportAll) return;
            const code = SaveSystem.exportAll();
            Modals.open({
                title: '📤 EXPORT JSON SNAPSHOT',
                className: 'modal-lg',
                body: `
                    <p style="color: var(--gray-300); font-family: Rajdhani; font-size: 15px; margin-bottom: 16px;">
                        Copy this encrypted Subspace JSON block to back up your full active Paddock profile and custom Constructor saves across external devices or turn snapshots.
                    </p>
                    <textarea readonly class="input" style="min-height: 200px; font-family: monospace; font-size: 11px; color: var(--green); background: #0a0a0c; border: 1px solid rgba(0,255,65,0.4); padding: 12px; border-radius: 8px; word-break: break-all;">${code}</textarea>
                `,
                actions: [
                    {
                        label: '📋 COPY TO CLIPBOARD',
                        type: 'primary',
                        onClick: () => {
                            navigator.clipboard.writeText(code);
                            if (typeof Notifications !== 'undefined') Notifications.success('Snapshot Copied to Clipboard!');
                            return false;
                        }
                    },
                    { label: 'CLOSE', type: 'secondary' }
                ]
            });
        });

        container.querySelector('#sync-btn-import')?.addEventListener('click', () => {
            if (typeof Modals === 'undefined' || typeof SaveSystem === 'undefined') return;
            Modals.prompt({
                title: '📥 IMPORT JSON SNAPSHOT',
                body: 'Paste your previously exported encrypted Subspace JSON save code below:',
                placeholder: 'Paste raw JSON block here...'
            }).then(code => {
                if (!code) return;
                if (SaveSystem.importAll(code)) {
                    if (typeof Notifications !== 'undefined') Notifications.success('Subspace Data Restored!', 'Reloading workspace parameters...');
                    setTimeout(() => location.reload(), 800);
                } else {
                    if (typeof Notifications !== 'undefined') Notifications.error('Sync Failure', 'Invalid or corrupt Subspace JSON save block.');
                }
            });
        });

        container.querySelector('#sync-btn-reset')?.addEventListener('click', () => {
            if (typeof Modals === 'undefined' || typeof SaveSystem === 'undefined') return;
            Modals.confirm({
                title: '⚠️ PURGE LOCAL WORKSPACE STORAGE?',
                body: 'This will irreversibly wipe your active Paddock profile, all saved Grand Prix campaigns, custom achievements, and custom R&D settings. Confirmed?',
                confirmText: 'PURGE EVERYTHING',
                confirmType: 'danger',
                onConfirm: () => {
                    SaveSystem.clearAll?.();
                    if (typeof Notifications !== 'undefined') Notifications.warning('Purge Executed', 'Workspace initialized to default settings.');
                    setTimeout(() => location.reload(), 600);
                }
            });
        });
    }

    /**
     * Interactive Custom Paddock Credentials Editor
     */
    function showCredentialsWizard() {
        if (typeof Modals === 'undefined') return;
        const profile = StateManager.loadProfile?.() || StateManager.get('profile') || {};
        const currUser = profile.username || 'RACER_01';
        const currTitle = profile.userTitle || 'ELITE CONSTRUCTOR';
        const currAvatar = profile.avatar || '🪖';

        const avatars = ['🪖', '👑', '🏎️', '🤖', '⚡', '🦅', '🦁', '🚀', '🔥', '🛡️', '🏆', '🎯'];
        const titles = [
            'ELITE CONSTRUCTOR',
            'PADDOCK MASTER',
            'TIRE WHISPERER',
            'RAIN SHOOTOUT SPECIALIST',
            'AERODYNAMIC DIRECTOR',
            'SLINGSHOT OVERTAKER',
            'STREET MONACO DEFENDER'
        ];

        Modals.open({
            title: '✏️ CONSTRUCTOR CREDENTIALS STUDIO',
            className: 'modal-lg',
            body: `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Username Input -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">MANDATORY FIA SUPER LICENSE USERNAME</label>
                        <input type="text" class="input" id="edit-input-username" value="${escapeHTML(currUser)}" maxlength="16" style="font-family: Orbitron; font-weight: 900; font-size: 20px; color: var(--white); background: #111115; border-color: #0080FF; text-transform: uppercase;">
                    </div>

                    <!-- Constructor Title Selection -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">EXECUTIVE PADDOCK TITLE</label>
                        <select class="select" id="edit-select-title" style="font-family: Orbitron; font-weight: 700; font-size: 14px; background: #111115; color: var(--green);">
                            ${titles.map(t => `
                                <option value="${t}" ${t === currTitle ? 'selected' : ''}>${t}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Esport Avatar Selection -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">ESport RACING AVATAR EMBLEM</label>
                        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;">
                            ${avatars.map(av => `
                                <div class="avatar-pick-item ${av === currAvatar ? 'selected' : ''}" data-avatar="${av}" style="font-size: 38px; padding: 12px; background: #111115; border: 2px solid ${av === currAvatar ? '#FFD700' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: ${av === currAvatar ? '0 0 20px rgba(255,215,0,0.5)' : 'none'};">
                                    ${av}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `,
            actions: [
                { label: 'CANCEL', type: 'secondary' },
                {
                    label: '✔ SAVE CREDENTIALS',
                    type: 'primary',
                    onClick: () => {
                        const newUser = document.getElementById('edit-input-username')?.value?.trim().toUpperCase() || currUser;
                        const newTitle = document.getElementById('edit-select-title')?.value || currTitle;
                        const newAvatar = document.querySelector('.avatar-pick-item.selected')?.dataset?.avatar || currAvatar;

                        profile.username = newUser;
                        profile.userTitle = newTitle;
                        profile.avatar = newAvatar;

                        if (typeof StateManager !== 'undefined') {
                            StateManager.set('profile', profile);
                            StateManager.saveProfile?.();
                        }

                        if (typeof Notifications !== 'undefined') Notifications.success('Credentials Updated!', `Welcome back to the Paddock, ${newUser}.`);
                        render();
                        return true;
                    }
                }
            ],
            onOpen: () => {
                // Attach click listeners to avatar pickers
                const items = document.querySelectorAll('.avatar-pick-item');
                items.forEach(item => {
                    item.addEventListener('click', () => {
                        items.forEach(x => {
                            x.classList.remove('selected');
                            x.style.borderColor = 'rgba(255,255,255,0.1)';
                            x.style.boxShadow = 'none';
                        });
                        item.classList.add('selected');
                        item.style.borderColor = '#FFD700';
                        item.style.boxShadow = '0 0 20px rgba(255,215,0,0.5)';
                        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                    });
                });
            }
        });
    }

    /**
     * Elegant celebration click for unlocked trophies
     */
    function triggerTrophyCelebration(isUnlocked) {
        if (isUnlocked === 'true') {
            if (typeof AudioManager !== 'undefined') AudioManager.raceGo?.();
            if (typeof Transitions !== 'undefined') Transitions.confetti?.(2500);
            if (typeof Notifications !== 'undefined') Notifications.info('Trophy Inspected', 'A definitive ESport Master piece in your silverware collection.');
        } else {
            if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
            if (typeof Notifications !== 'undefined') Notifications.warning('Trophy Locked', 'Fulfil the specific Paddock condition to unlock this silverware.');
        }
    }

    /**
     * Helper to compute exact level & XP deltas
     */
    function getLevelProgress(xp) {
        let needed = 500;
        let totalNeeded = needed;
        let level = 1;
        let prevNeeded = 0;

        while (xp >= totalNeeded && level < 99) {
            level++;
            prevNeeded = totalNeeded;
            needed = Math.floor(needed * 1.4);
            totalNeeded += needed;
        }

        const currentXPInLevel = xp - prevNeeded;
        const neededInLevel = totalNeeded - prevNeeded;
        const percent = Math.min(100, Math.max(0, Math.floor((currentXPInLevel / neededInLevel) * 100)));

        return {
            level,
            progressXP: currentXPInLevel.toLocaleString(),
            neededXP: neededInLevel.toLocaleString(),
            percent
        };
    }

    /**
     * Helper to compute unlocked trophy numbers
     */
    function getAchievementStats(profile) {
        const unlocked = profile.achievements || [];
        const visible = typeof getVisibleAchievements === 'function' ? getVisibleAchievements() : [];
        return {
            unlocked: unlocked.length,
            total: visible.length || 15
        };
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:profile:enter', () => {
            isActive = true;
            currentTab = 'overview';
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'profile') isActive = false;
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function destroy() {
        isActive = false;
    }

    return { init, render, triggerTrophyCelebration, destroy };
})();