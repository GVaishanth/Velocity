/* ============================================
   VELOCITY — ONLINE MULTIPLAYER SCREEN & MANAGER
   WebRTC Peer-to-Peer Star Topology Multi-Client Broker
   Supports up to 12 Online Human Constructors!
   ============================================ */

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str.toString();
    return div.innerHTML;
}

window.OnlineManager = (() => {
    let peer = null;
    let myConnection = null;       // Client connected to Host broker
    let clientConnections = [];    // Host connected to up to 11 Client peers
    let isHost = false;
    let roomCode = null;
    let matchStarted = false;

    // Local Constructor Package
    let myUsername = 'RACER_' + Math.floor(100 + Math.random() * 900);
    let myTeam = null;
    let myDrivers = [];
    let myStaff = null;

    // Master Master List of All Joined Online Constructors
    // Structure: [{ isHost: bool, connectionId: string, username: string, team: Object, drivers: Array, staff: Object, isReady: bool }]
    let onlinePlayers = [];

    let chatMessages = [];
    let matchSettings = { races: 5, difficulty: 'COMPETITIVE', speed: 2, lengthMult: 0.5 };
    let masterSchedule = null;
    let uiCallback = null;
    
    // Heartbeat and Sync Intervals
    let heartbeatInterval = null;
    let syncInterval = null;
    let lastLatency = 0;

    let lastRoomCode = null; // Store for reconnect

    function getSessionId() {
        try {
            const existing = sessionStorage.getItem('velocity_mp_session');
            if (existing) {
                const parsed = JSON.parse(existing);
                if (parsed.sessionId) return parsed.sessionId;
            }
        } catch(e) {}
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function getPlayerId() {
        try {
            const existing = sessionStorage.getItem('velocity_mp_session');
            if (existing) {
                const parsed = JSON.parse(existing);
                if (parsed.playerId) return parsed.playerId;
            }
        } catch(e) {}
        return 'player_' + Math.random().toString(36).slice(2, 10);
    }

    function getCurrentRecoveryPayload() {
        if (typeof StateManager.captureLiveRaceState === 'function') StateManager.captureLiveRaceState();
        const currentScreen = typeof StateManager !== 'undefined' ? StateManager.get('currentScreen') : 'multiplayer';
        const career = typeof StateManager !== 'undefined' ? StateManager.get('career') : null;
        const race = typeof StateManager !== 'undefined' ? StateManager.get('race') : null;
        const weekendState = (typeof RaceWeekendScreen !== 'undefined' && RaceWeekendScreen.getRecoveryState)
            ? RaceWeekendScreen.getRecoveryState()
            : null;
        return {
            roomId: roomCode,
            roomCode,
            sessionId: getSessionId(),
            playerId: getPlayerId(),
            championshipId: career?.championshipId || career?.id || (career ? `champ_${career.season || 1}_${roomCode || 'local'}` : null),
            raceId: race?.raceId || (race ? `race_${race.trackId || race.track?.id || 'unknown'}_${career?.currentRound || 0}` : null),
            currentScreen,
            weekendStage: weekendState?.currentStage || null,
            weekendState,
            raceState: race,
            readyState: onlinePlayers,
            gameState: {
                mode: StateManager.get('mode'),
                profile: StateManager.get('profile'),
                career,
                race,
                settings: StateManager.get('settings')
            }
        };
    }

    function persistSession(extra = {}) {
        if (!roomCode && !extra.roomCode && !extra.roomId) return null;
        try {
            const existingRaw = sessionStorage.getItem('velocity_mp_session');
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            const recovery = getCurrentRecoveryPayload();
            if (existing.gameState && !recovery.gameState?.career && !recovery.gameState?.race) {
                recovery.gameState = existing.gameState;
                recovery.raceState = existing.raceState || existing.gameState.race;
            }
            if (existing.weekendState && !recovery.weekendState) recovery.weekendState = existing.weekendState;
            if (existing.readyState && (!recovery.readyState || recovery.readyState.length === 0)) recovery.readyState = existing.readyState;
            const payload = {
                ...existing,
                ...recovery,
                ...extra,
                roomCode: extra.roomCode || extra.roomId || roomCode || existing.roomCode,
                roomId: extra.roomId || extra.roomCode || roomCode || existing.roomId,
                isHost,
                username: myUsername,
                updatedAt: Date.now()
            };
            sessionStorage.setItem('velocity_mp_session', JSON.stringify(payload));
            return payload;
        } catch (e) {
            console.warn('[OnlineManager] Failed to persist MP session:', e);
            return null;
        }
    }

    function routeToRecoveredSession(payload = {}) {
        const currentRace = payload.currentRace || payload.raceState || payload.gameState?.race || StateManager.get('race');
        const weekendState = payload.weekendState || payload.gameState?.weekendState || null;
        if (weekendState && typeof RaceWeekendScreen !== 'undefined' && RaceWeekendScreen.restoreRecoveryState) {
            RaceWeekendScreen.restoreRecoveryState(weekendState);
        }
        let target = 'dashboard';
        if (currentRace?.isLiveRaceState && !currentRace.finished) target = 'race';
        else if (payload.currentScreen === 'race-weekend' || weekendState) target = 'race-weekend';
        else if (!payload.matchStarted && !payload.fullCareerSync && !payload.gameState?.career) target = isHost ? 'multiplayer' : 'multiplayer';
        console.log('[OnlineManager] Routing recovered session', { target, roomCode: payload.roomCode || roomCode, weekendStage: weekendState?.currentStage, liveRace: !!currentRace?.isLiveRaceState });
        if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: target, color: '#FF0033' });
        if (target === 'multiplayer' && typeof MultiplayerScreen !== 'undefined') {
            MultiplayerScreen.setLobbyView(isHost ? 'host_staging' : 'join_staging');
        }
    }

    function isReconnectSuppressedForRoom(code) {
        if (!code) return false;
        try {
            const sessionRaw = sessionStorage.getItem('velocity_mp_session');
            const sessionData = sessionRaw ? JSON.parse(sessionRaw) : null;
            if (sessionData?.roomCode === code && sessionData?.suppressReconnect) return true;
            const prefRaw = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = prefRaw ? JSON.parse(prefRaw) : {};
            return !!prefs?.[code]?.suppressReconnect;
        } catch(e) {
            return false;
        }
    }

    function init() {
        if (!myTeam && typeof TEAMS_DATA !== 'undefined') {
            myTeam = TEAMS_DATA[0];
        }
        
        try {
            // Restore session if possible
            const session = sessionStorage.getItem('velocity_mp_session');
            if (session) {
                const data = JSON.parse(session);
                myUsername = data.username || myUsername;
                console.log('[OnlineManager] Session restored for:', myUsername);
            }
        } catch(e) {
            console.warn('[OnlineManager] sessionStorage access failed');
        }
    }

    function createRoom(onReady, fixedCode = null) {
        cleanup();
        isHost = true;
        matchStarted = false;
        
        if (fixedCode) {
            roomCode = fixedCode;
        } else {
            const codeNum = Math.floor(1000 + Math.random() * 9000);
            const salt = Math.random().toString(36).substring(2, 5).toUpperCase();
            roomCode = codeNum.toString() + salt;
        }
        
        const fullId = 'VELOCITY-V1-' + roomCode;
        console.log('[OnlineManager] Creating room:', fullId);

        // Store role but preserve any saved gameState/weekendState for true host recovery.
        // Explicit host creation resets any previous offline preference for this room.
        try {
            const rawPrefs = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = rawPrefs ? JSON.parse(rawPrefs) : {};
            delete prefs[roomCode];
            sessionStorage.setItem('velocity_mp_reconnect_preferences', JSON.stringify(prefs));
        } catch(e) {}
        persistSession({ roomCode, roomId: roomCode, isHost: true, username: myUsername, suppressReconnect: false });

        try {
            peer = new Peer(fullId, {
                debug: 2
            });

            peer.on('open', (id) => {
                console.log('[OnlineManager] Host Peer ID:', id);
                Notifications.success('Master Online Room Created!', `Room Code: ${roomCode}`);
                startHeartbeat();
                
                // If this is a restore, reload state
                if (fixedCode) {
                    try {
                        const sessionStr = sessionStorage.getItem('velocity_mp_session');
                        const sessionData = sessionStr ? JSON.parse(sessionStr) : null;
                        if (sessionData?.gameState) {
                            console.log('[OnlineManager] Restoring Game State for Grid...', { roomCode, currentScreen: sessionData.currentScreen, weekendStage: sessionData.weekendStage });
                            const restoredCareer = sessionData.gameState.career;
                            if (restoredCareer && typeof CalendarService !== 'undefined') {
                                CalendarService.ensureCareerCalendar(restoredCareer, { seasonLength: restoredCareer.totalRounds || matchSettings.races || 5 });
                            }
                            if (restoredCareer) StateManager.set('career', restoredCareer);
                            if (sessionData.gameState.race) StateManager.set('race', sessionData.gameState.race);
                            if (sessionData.gameState.mode) StateManager.set('mode', sessionData.gameState.mode);
                            if (sessionData.readyState?.length) {
                                onlinePlayers = sessionData.readyState.map(p => p.isHost ? { ...p, connectionId: 'host' } : p);
                            } else if (restoredCareer?.allTeams) {
                                onlinePlayers = restoredCareer.allTeams
                                    .filter(t => t.isPlayer)
                                    .map(t => ({
                                        username: t.onlineUsername || (t.isLocalPlayer ? myUsername : 'Player'),
                                        team: t,
                                        drivers: t.drivers,
                                        isHost: t.isLocalPlayer,
                                        connectionId: t.isLocalPlayer ? 'host' : 'unknown',
                                        isReady: true,
                                        isReadyForWeekend: true
                                    }));
                            }
                            matchStarted = !!restoredCareer;
                            if (sessionData.gameState.race?.isLiveRaceState) startRaceSync();
                            setTimeout(() => routeToRecoveredSession(sessionData), 300);
                        } else if (sessionData?.readyState?.length) {
                            onlinePlayers = sessionData.readyState.map(p => p.isHost ? { ...p, connectionId: 'host' } : p);
                            matchStarted = false;
                            setTimeout(() => routeToRecoveredSession(sessionData), 300);
                        }
                    } catch(e) { console.error('[OnlineManager] State restore failed', e); }
                }

                // Ensure local host is in grid and ready
                const hostEntry = onlinePlayers.find(p => p.isHost);
                if (hostEntry) hostEntry.isReady = true;

                if (onReady) onReady();
                triggerRender();
            });

            peer.on('connection', (conn) => {
                console.log('[OnlineManager] Incoming connection from:', conn.peer);
                
                // --- MULTIPLAYER RECONNECT LOGIC ---
                // If match started, only allow connection if the peer was already part of the grid
                if (matchStarted) {
                    const isReturning = onlinePlayers.some(op => op.connectionId === conn.peer || op.username === conn.metadata?.username);
                    if (!isReturning) {
                        conn.on('open', () => {
                            conn.send({ type: 'ERROR', message: 'Championship Season has already started and you are not a registered constructor!' });
                            setTimeout(() => conn.close(), 1000);
                        });
                        return;
                    }
                    console.log('[OnlineManager] Permitting mid-game reconnection for peer:', conn.peer);
                }

                if (onlinePlayers.length >= 12 && !matchStarted) {
                    conn.on('open', () => {
                        conn.send({ type: 'ERROR', message: 'Room is completely full (12/12 Constructors joined)!' });
                        setTimeout(() => conn.close(), 1000);
                    });
                    return;
                }

                clientConnections.push(conn);
                setupHostConnectionListeners(conn);
            });

            peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    Notifications.error('Room Code Conflict', 'This code is already in use. Try creating again.');
                } else {
                    Notifications.error('Network Error', err.message || 'Failed to establish room');
                }
                console.error('[PeerJS Error]', err);
                triggerRender();
            });
        } catch (e) {
            Notifications.error('WebRTC Error', 'Please ensure PeerJS is loaded and active.');
            console.error('[OnlineManager]', e);
        }
    }

    function lockInHost(username, teamId, driver1Id, driver2Id, staff) {
        myUsername = username || myUsername;
        if (typeof getTeamById === 'function') myTeam = getTeamById(teamId);
        if (typeof getDriverById === 'function') {
            myDrivers = [getDriverById(driver1Id), getDriverById(driver2Id)].filter(Boolean);
        }

        // Logic check: ensure staff is an object
        if (typeof staff === 'object' && staff !== null) {
            myStaff = staff;
        } else {
            console.warn('[OnlineManager] lockInHost: Invalid staff object provided');
        }

        // Add Local Host to Master Roster
        const existingHost = onlinePlayers.find(op => op.isHost);
        if (existingHost) {
            Object.assign(existingHost, { username: myUsername, team: myTeam, drivers: myDrivers, staff: myStaff, isReady: true, pauseCredits: 999 });
        } else {
            onlinePlayers.push({
                isHost: true,
                connectionId: 'host',
                username: myUsername,
                team: myTeam,
                drivers: myDrivers,
                staff: myStaff,
                isReady: true,
                pauseCredits: 999
            });
        }

        Notifications.success('Host Constructor Locked!', 'Master Staging Active.');
        broadcastLobbyUpdate();
        triggerRender();
    }

    function broadcastLobbyUpdate() {
        clientConnections.forEach(c => {
            if (c && c.open) {
                c.send({
                    type: 'LOBBY_UPDATE',
                    onlinePlayers: onlinePlayers,
                    settings: matchSettings
                });
            }
        });
    }

    function startHeartbeat() {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            const msg = { type: 'PING', timestamp: Date.now() };
            if (isHost) {
                clientConnections.forEach(c => { if(c.open) c.send(msg); });
            } else if (myConnection && myConnection.open) {
                myConnection.send(msg);
            }
        }, 5000);
    }

    function triggerReady() {
        if (isHost) {
            const hostPlayer = onlinePlayers.find(p => p.isHost);
            if (hostPlayer) {
                hostPlayer.isReady = !hostPlayer.isReady;
                console.log('[OnlineManager] Host toggled ready:', hostPlayer.isReady);
            }
            broadcastLobbyUpdate();
        } else if (myConnection && myConnection.open) {
            myConnection.send({ type: 'CLIENT_TOGGLE_READY' });
        }
        triggerRender();
    }

    function setupHostConnectionListeners(conn) {
        conn.on('data', (data) => {
            if (!data || !data.type) return;

            if (data.type === 'PING') {
                conn.send({ type: 'PONG', timestamp: data.timestamp });
            } else if (data.type === 'PONG') {
                lastLatency = Date.now() - data.timestamp;
                triggerRender();
            } else if (data.type === 'CLIENT_TOGGLE_READY') {
                const player = onlinePlayers.find(op => op.connectionId === conn.peer);
                if (player) {
                    player.isReady = !player.isReady;
                    broadcastLobbyUpdate();
                    triggerRender();
                }
            } else if (data.type === 'CLIENT_TOGGLE_WEEKEND_READY') {
                const player = onlinePlayers.find(op => op.connectionId === conn.peer);
                if (player) {
                    player.isReadyForWeekend = !player.isReadyForWeekend;
                    broadcastLobbyUpdate();
                    if (typeof DashboardScreen !== 'undefined' && DashboardScreen.isPageActive()) {
                        DashboardScreen.render();
                    }
                }
            } else if (data.type === 'CLIENT_TOGGLE_WEEKEND_READY') {
                const player = onlinePlayers.find(op => op.connectionId === conn.peer);
                if (player) {
                    player.isReadyForWeekend = !player.isReadyForWeekend;
                    broadcastLobbyUpdate();
                    if (typeof DashboardScreen !== 'undefined' && DashboardScreen.isPageActive()) {
                        DashboardScreen.render();
                    }
                }
            } else if (data.type === 'CLIENT_CONNECTING') {
                Notifications.info('Constructor Connected!', `Uplink established with ${data.username || 'Challenger'}.`);
                
                // --- RECONNECT SYNC: Update connection ID for returning player ---
                if (matchStarted) {
                    const returning = onlinePlayers.find(op => op.username === data.username);
                    if (returning) returning.connectionId = conn.peer;
                }

                const recovery = getCurrentRecoveryPayload();
                const response = {
                    type: 'LOBBY_UPDATE',
                    onlinePlayers: onlinePlayers,
                    settings: matchSettings,
                    roomCode,
                    roomId: roomCode,
                    sessionId: recovery.sessionId,
                    currentScreen: recovery.currentScreen,
                    weekendStage: recovery.weekendStage,
                    weekendState: recovery.weekendState,
                    readyState: onlinePlayers,
                    matchStarted
                };

                // If mid-game, send the full career payload to resync the client
                if (matchStarted || recovery.gameState?.career) {
                    const career = StateManager.get('career');
                    response.fullCareerSync = career;
                    response.currentRace = StateManager.get('race');
                    response.currentStandings = career?.championship || null;
                    response.currentCalendar = career?.schedule || career?.seasonCalendar || null;
                }

                conn.send(response);
                triggerRender();
            } else if (data.type === 'CLIENT_LOCKED') {
                const existing = onlinePlayers.find(op => op.connectionId === conn.peer);
                if (existing) {
                    Object.assign(existing, { username: data.username, team: data.team, drivers: data.drivers, staff: data.staff, isReady: true, pauseCredits: 3 });
                } else {
                    onlinePlayers.push({
                        isHost: false,
                        connectionId: conn.peer,
                        username: data.username,
                        team: data.team,
                        drivers: data.drivers,
                        staff: data.staff,
                        isReady: true,
                        pauseCredits: 3
                    });
                }
                Notifications.success('Constructor Locked In!', `${data.username} locked in ${data.team?.name}`);
                broadcastLobbyUpdate();
                triggerRender();
            } else if (data.type === 'CHAT') {
                chatMessages.push({
                    sender: data.sender || 'Challenger',
                    text: data.text,
                    color: 'var(--yellow)'
                });
                // Relay chat to all other clients
                clientConnections.forEach(c => {
                    if (c && c.open && c.peer !== conn.peer) c.send(data);
                });
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('ui:notify', {
                        message: `💬 ${data.sender || 'Challenger'}: ${data.text}`,
                        type: 'info',
                        duration: 4000
                    });
                }
                triggerRender();
            } else if (data.type === 'LIVERY_UPDATE') {
                handleLiveryUpdate(conn.peer, data.livery);
            } else if (data.type === 'CONTRACT_SYNC' || data.type === 'FACILITY_SYNC' || data.type === 'SPONSOR_SYNC') {
                if (data.career) {
                    StateManager.set('career', data.career);
                    if (isHost) broadcastAction(data.type, { career: data.career });
                    triggerRender();
                }
            } else if (data.type === 'LIVE_ACTION') {
                // Relaying live action across the massive worldwide grid
                handleRemoteLiveAction(data.payload);
                clientConnections.forEach(c => {
                    if (c && c.open && c.peer !== conn.peer) c.send(data);
                });
            }
        });

        conn.on('close', () => {
            Notifications.warning('Opponent Disconnected', 'A constructor departed the grid.');
            onlinePlayers = onlinePlayers.filter(op => op.connectionId !== conn.peer);
            clientConnections = clientConnections.filter(c => c.peer !== conn.peer);
            broadcastLobbyUpdate();
            triggerRender();
        });
    }

    function connectAndReceiveHostLocked(code, onSuccess) {
        cleanup();
        isHost = false;
        matchStarted = false;
        roomCode = code.trim().toUpperCase();
        if (roomCode.startsWith('VELOCITY-V1-')) roomCode = roomCode.replace('VELOCITY-V1-', '');
        else if (roomCode.startsWith('VELOCITY-')) roomCode = roomCode.replace('VELOCITY-', '');

        Notifications.info('Seeking Host Broker...', `Connecting to Room ${roomCode}`);
        const targetId = 'VELOCITY-V1-' + roomCode;

        // Persist session. Explicit join resets any previous offline preference for this room.
        try {
            const rawPrefs = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = rawPrefs ? JSON.parse(rawPrefs) : {};
            delete prefs[roomCode];
            sessionStorage.setItem('velocity_mp_reconnect_preferences', JSON.stringify(prefs));
        } catch(e) {}
        persistSession({ roomCode, roomId: roomCode, isHost: false, username: myUsername, suppressReconnect: false });

        try {
            peer = new Peer();

            peer.on('open', (id) => {
                console.log('[OnlineManager] Client Peer ID:', id);
                myConnection = peer.connect(targetId, { 
                    reliable: true,
                    metadata: { username: myUsername } // Pass username for reconnect verification
                });

                myConnection.on('open', () => {
                    Notifications.success('Master Uplink Locked!', 'Retrieving Global Staging State...');
                    setupClientConnectionListeners(myConnection);
                    startHeartbeat();
                    myConnection.send({
                        type: 'CLIENT_CONNECTING',
                        username: myUsername
                    });
                    if (onSuccess) onSuccess();
                    triggerRender();
                });

                myConnection.on('error', (err) => {
                    Notifications.error('Connection Failed', err.message);
                    console.error('[Client Connection Error]', err);
                    triggerRender();
                });
            });

            peer.on('error', (err) => {
                if (err.type === 'peer-not-found') {
                    Notifications.error('Room Not Found', 'Could not find a Host with this code.');
                } else {
                    Notifications.error('Connection Error', err.message || 'Failed to connect');
                }
                console.error('[Client Peer Error]', err);
                triggerRender();
            });
        } catch (e) {
            Notifications.error('WebRTC Error', 'Failed to initiate connection.');
            console.error('[OnlineManager]', e);
        }
    }

    function setupClientConnectionListeners(conn) {
        conn.on('data', (data) => {
            if (!data || !data.type) return;

            if (data.type === 'PING') {
                conn.send({ type: 'PONG', timestamp: data.timestamp });
            } else if (data.type === 'PONG') {
                lastLatency = Date.now() - data.timestamp;
                triggerRender();
            } else if (data.type === 'LOBBY_UPDATE') {
                if (data.onlinePlayers) onlinePlayers = data.onlinePlayers;
                if (data.settings) {
                    matchSettings = data.settings;
                    // Update Race UI Speed if active
                    if (typeof PlayerControls !== 'undefined' && typeof RaceEngine !== 'undefined' && RaceEngine.getState()) {
                        PlayerControls.refresh();
                    }
                }

                // --- MID-GAME RECONNECT SYNC ---
                if (data.fullCareerSync) {
                    console.log('[OnlineManager] Reconnected: Syncing career state from Host');
                    if (typeof CalendarService !== 'undefined') {
                        CalendarService.ensureCareerCalendar(data.fullCareerSync, { seasonLength: data.fullCareerSync.totalRounds || matchSettings.races || 5 });
                    }
                    StateManager.set('career', data.fullCareerSync);
                }
                if (data.weekendState && typeof RaceWeekendScreen !== 'undefined' && RaceWeekendScreen.restoreRecoveryState) {
                    RaceWeekendScreen.restoreRecoveryState(data.weekendState);
                }
                if (data.currentRace) {
                    StateManager.set('race', data.currentRace);
                    matchStarted = true;
                }

                persistSession({
                    roomCode: data.roomCode || roomCode,
                    roomId: data.roomId || data.roomCode || roomCode,
                    currentScreen: data.currentScreen,
                    weekendStage: data.weekendStage,
                    weekendState: data.weekendState,
                    readyState: data.readyState || data.onlinePlayers,
                    gameState: {
                        mode: StateManager.get('mode'),
                        profile: StateManager.get('profile'),
                        career: StateManager.get('career'),
                        race: StateManager.get('race'),
                        settings: StateManager.get('settings')
                    }
                });

                // If reconnecting from Home/Multiplayer, return to exact host activity instead of an empty lobby.
                const curr = StateManager.get('currentScreen');
                if (data.matchStarted && (curr === 'home' || curr === 'multiplayer')) {
                    routeToRecoveredSession(data);
                }

                triggerRender();
            } else if (data.type === 'SETTINGS_UPDATE') {
                if (data.settings) matchSettings = data.settings;
                Notifications.info('Host updated championship calendar');
                triggerRender();
            } else if (data.type === 'CHAT') {
                chatMessages.push({
                    sender: data.sender || 'Opponent',
                    text: data.text,
                    color: data.sender === OnlineManager.getHostUsername() ? 'var(--blue)' : 'var(--yellow)'
                });
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('ui:notify', {
                        message: `💬 ${data.sender || 'Opponent'}: ${data.text}`,
                        type: 'info',
                        duration: 4000
                    });
                }
                triggerRender();
            } else if (data.type === 'START_MATCH') {
                handleRemoteStart(data);
            } else if (data.type === 'START_WEEKEND') {
                Notifications.success('Race Weekend Initiated', 'Entering the paddock...');
                if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'race-weekend', color: '#00FF41' });
            } else if (data.type === 'SKIP_VOTE_START') {
                handleSkipVote(data.requester);
            } else if (data.type === 'SKIP_VOTE_CONFIRM') {
                handleSkipVoteConfirm(data.voter);
            } else if (data.type === 'QUALI_SYNC') {
                handleQualiSync(data);
            } else if (data.type === 'RACE_PAUSE_TOGGLE') {
                if (typeof RaceEngine !== 'undefined') {
                    if (data.isPaused) RaceEngine.pause();
                    else RaceEngine.resume();
                    
                    if (data.requester && data.requester !== myUsername) {
                         Notifications.info('Race Paused', `${data.requester} used a credit.`);
                    }

                    if (typeof PlayerControls !== 'undefined') PlayerControls.refresh();
                }
            } else if (data.type === 'SESSION_PROGRESS_SYNC') {
                if (typeof RaceWeekendScreen !== 'undefined') RaceWeekendScreen.syncSession(data);
            } else if (data.type === 'SESSION_START') {
                if (typeof RaceWeekendScreen !== 'undefined') RaceWeekendScreen.remoteStartSession();
            } else if (data.type === 'SESSION_RESET') {
                if (typeof RaceWeekendScreen !== 'undefined') RaceWeekendScreen.remoteResetSession(data.session);
            } else if (data.type === 'CD_SYNC') {
                if (typeof RaceWeekendScreen !== 'undefined') RaceWeekendScreen.syncCD(data);
            } else if (data.type === 'PAUSE_REQUEST') {
                handlePauseRequest(data.requesterId);
            } else if (data.type === 'LIVERY_UPDATE') {
                handleLiveryUpdate(data.connectionId || conn.peer, data.livery);
            } else if (data.type === 'CONTRACT_SYNC' || data.type === 'FACILITY_SYNC' || data.type === 'SPONSOR_SYNC') {
                if (data.career) {
                    StateManager.set('career', data.career);
                    triggerRender();
                    if (typeof DashboardScreen !== 'undefined' && DashboardScreen.isPageActive()) DashboardScreen.render();
                }
            } else if (data.type === 'NAV_STAGE') {
                handleNavStage(data.stage);
            } else if (data.type === 'RACE_EVENT') {
                handleRemoteEvent(data.event);
            } else if (data.type === 'RACE_SYNC') {
                handleRaceSync(data);
            } else if (data.type === 'LIVE_ACTION') {
                handleRemoteLiveAction(data.payload);
            } else if (data.type === 'ERROR') {
                Notifications.error('Staging Broker Error', data.message);
                cleanup();
                triggerRender();
            }
        });

        conn.on('close', () => {
            const code = roomCode; // Keep local copy before cleanup
            const suppressed = isReconnectSuppressedForRoom(code);
            console.log('[OnlineManager] Host connection closed', { roomCode: code, suppressReconnect: suppressed });
            if (!suppressed) Notifications.warning('Host Disconnected', 'The master staging room was closed.');
            cleanup();
            if (typeof EventBus !== 'undefined') {
                if (!suppressed) EventBus.emit('multiplayer:disconnected', { roomCode: code, suppressReconnect: false });
                EventBus.emit('nav:home');
            }
        });
    }

    function lockInClient(username, teamId, driver1Id, driver2Id, staff) {
        myUsername = username || myUsername;
        if (typeof getTeamById === 'function') myTeam = getTeamById(teamId);
        if (typeof getDriverById === 'function') {
            myDrivers = [getDriverById(driver1Id), getDriverById(driver2Id)].filter(Boolean);
        }

        myStaff = staff;

        // Add/Update My Local Client in onlinePlayers
        const existing = onlinePlayers.find(op => op.connectionId === myConnection?.peer);
        if (existing) {
            Object.assign(existing, { username: myUsername, team: myTeam, drivers: myDrivers, staff: myStaff, isReady: true });
        } else {
            onlinePlayers.push({
                isHost: false,
                connectionId: myConnection?.peer,
                username: myUsername,
                team: myTeam,
                drivers: myDrivers,
                staff: myStaff,
                isReady: true
            });
        }

        Notifications.success('Challenger Package Locked!', 'Transmitting ready signal to Host...');
        if (myConnection && myConnection.open) {
            myConnection.send({
                type: 'CLIENT_LOCKED',
                username: myUsername,
                team: myTeam,
                drivers: myDrivers,
                staff: myStaff
            });
        }
        triggerRender();
    }

    function sendChat(text) {
        const clean = text.trim();
        if (!clean) return;

        const chatObj = {
            type: 'CHAT',
            sender: myUsername,
            text: clean
        };

        chatMessages.push({
            sender: myUsername,
            text: clean,
            color: 'var(--green)'
        });

        if (isHost) {
            clientConnections.forEach(c => {
                if (c && c.open) c.send(chatObj);
            });
        } else if (myConnection && myConnection.open) {
            myConnection.send(chatObj);
        }
        triggerRender();
    }

    function sendLiveAction(payload) {
        const actionMsg = {
            type: 'LIVE_ACTION',
            payload: payload
        };
        if (isHost) {
            clientConnections.forEach(c => {
                if (c && c.open) c.send(actionMsg);
            });
        } else if (myConnection && myConnection.open) {
            myConnection.send(actionMsg);
        }
    }

    function broadcastAction(type, payload) {
        const msg = { type: type, ...payload };
        if (isHost) {
            clientConnections.forEach(c => { if(c.open) c.send(msg); });
        } else if (myConnection && myConnection.open) {
            myConnection.send(msg);
        }
    }

    function handleRemoteLiveAction(payload) {
        if (!payload || typeof RaceEngine === 'undefined') return;

        if (payload.type === 'MODE') {
            RaceEngine.setDriverMode(payload.carId, payload.mode);
        } else if (payload.type === 'PIT') {
            RaceEngine.playerPitCall(payload.carId, payload.compound || null);
        } else if (payload.type === 'BOOST') {
            RaceEngine.activateOvertakeBoost(payload.carId);
        }
    }

    function handleRaceSync(data) {
        if (isHost || !data || typeof RaceEngine === 'undefined') return;
        
        const state = RaceEngine.getState();
        if (!state) return;
        
        if (data.status && state.status !== data.status) {
            state.status = data.status;
        }

        if (data.finished && !state.finished) {
            // Apply Host authoritative results
            RaceEngine.finishRace(data.results);
            return;
        }
        
        data.cars?.forEach(remoteCar => {
            const localCar = state.cars.find(c => c.id === remoteCar.id);
            if (localCar) {
                // Authority Check: Snap position and progress
                // Reduced threshold for more "Host Screen" feel
                if (Math.abs(localCar.trackProgress - remoteCar.prog) > 0.02) {
                    localCar.trackProgress = remoteCar.prog;
                }
                localCar.position = remoteCar.pos;
                localCar.lapCount = remoteCar.lap;
                
                // Authoritative DNF
                if (remoteCar.dnf && localCar.status !== 'DNF') {
                    localCar.status = 'DNF';
                    localCar.dnfReason = 'Terminal impact (Host Broadcast)';
                }
            }
        });
    }

    let skipVotes = new Set();
    function handleSkipVote(requester) {
        if (requester === myUsername) return;
        
        // Show notification that a vote started
        Notifications.info('Skip Vote Started', `${requester} initiated a vote to skip.`);

        Modals.confirm({
            title: 'Skip Race Vote',
            body: `${requester} wants to skip the rest of the race. Do you agree?`,
            confirmText: 'Agree (Skip)',
            cancelText: 'Decline',
            onConfirm: () => {
                broadcastAction('SKIP_VOTE_CONFIRM', { voter: myUsername });
                handleSkipVoteConfirm(myUsername);
            }
        });
    }

    function handleSkipVoteConfirm(voter) {
        skipVotes.add(voter);
        
        if (skipVotes.size >= onlinePlayers.length) {
            Notifications.success('Skip Vote Passed', 'Syncing authoritative results...');
            if (typeof RaceEngine !== 'undefined') RaceEngine.skipToEnd();
            skipVotes.clear();
        } else {
            Notifications.info('Vote Recorded', `${skipVotes.size}/${onlinePlayers.length} human constructors have agreed.`);
        }
    }

    function toggleWeekendReady() {
        if (isHost) {
            const me = onlinePlayers.find(p => p.isHost);
            if (me) me.isReadyForWeekend = !me.isReadyForWeekend;
            broadcastLobbyUpdate();
        } else if (myConnection && myConnection.open) {
            myConnection.send({ type: 'CLIENT_TOGGLE_WEEKEND_READY' });
        }
        // Force Dashboard Refresh
        if (typeof DashboardScreen !== 'undefined' && DashboardScreen.isPageActive()) {
            DashboardScreen.render();
        }
    }

    function handleNavStage(stage) {
        if (typeof RaceWeekendScreen !== 'undefined') {
            RaceWeekendScreen.setStage(stage);
        }
    }

    function handleRemoteEvent(event) {
        if (isHost || !event || typeof RaceEngine === 'undefined') return;
        
        const car = RaceEngine.getCar(event.carId);
        if (car) {
            EventSystem.applyEventEffects(car, event);
            
            // Re-emit for UI and Audio
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('race:incident', event);
            }
        }
    }

    function handleQualiSync(data) {
        if (typeof RaceWeekendScreen !== 'undefined') {
            RaceWeekendScreen.syncQuali(data);
        }
    }

    function handleLiveryUpdate(peerId, livery) {
        const player = onlinePlayers.find(op => op.connectionId === peerId);
        if (player) {
            player.livery = livery;
            if (isHost) broadcastLobbyUpdate();
            triggerRender();
        }
    }

    function handlePauseRequest(requesterId) {
        if (!isHost || typeof RaceEngine === 'undefined') return;

        const player = onlinePlayers.find(op => op.connectionId === requesterId);
        if (!player || player.pauseCredits <= 0) {
            const conn = clientConnections.find(c => c.peer === requesterId);
            if (conn) conn.send({ type: 'ERROR', message: 'No pause credits remaining!' });
            return;
        }

        // Toggle pause
        const targetPause = !RaceEngine.isCurrentlyPaused();
        
        if (targetPause) {
            player.pauseCredits--;
            RaceEngine.pause();
            Notifications.warning('Race Paused', `${player.username} used a pause credit (${player.pauseCredits} left)`);
        } else {
            RaceEngine.resume();
            Notifications.success('Race Resumed', `Host released the grid.`);
        }

        broadcastAction('RACE_PAUSE_TOGGLE', { isPaused: targetPause, creditsLeft: player.pauseCredits, requester: player.username });
        if (typeof PlayerControls !== 'undefined') PlayerControls.refresh();
        broadcastLobbyUpdate();
    }

    function updateSettings(newSettings) {
        matchSettings = { ...matchSettings, ...newSettings };
        if (isHost) {
            broadcastLobbyUpdate();
        }
    }

    function launchDuel() {
        if (!isHost) {
            Notifications.error('Host Exclusive', 'Only the Host can start the online season.');
            return;
        }

        // --- CHECK IF ALL PLAYERS ARE READY ---
        const unready = onlinePlayers.filter(p => !p.isReady);
        if (unready.length > 0) {
            Notifications.error('Grid Not Ready', `${unready.length} Constructors have not locked in their readiness.`);
            return;
        }

        // Multiplayer must not mutate global TEAMS_DATA / DRIVERS_DATA because those are also
        // used by Single Player. Use the current roster snapshot as-is for session isolation.

        // Authoritative multiplayer calendar from the shared CalendarService
        masterSchedule = (typeof CalendarService !== 'undefined')
            ? CalendarService.createCalendar({ seasonLength: matchSettings.races || 5, selectedTrackIds: matchSettings.selectedTrackIds || matchSettings.customCalendar, shuffle: !(matchSettings.selectedTrackIds || matchSettings.customCalendar) })
            : (typeof TRACKS_DATA !== 'undefined' ? [...TRACKS_DATA].map(t => t.id).sort(() => Math.random() - 0.5).slice(0, matchSettings.races || 5) : ['monaco','silverstone','spa','monza','suzuka'].slice(0, matchSettings.races || 5));
        matchStarted = true;
        persistSession({ championshipId: `champ_${roomCode}_${Date.now()}`, currentScreen: 'dashboard' });

        const startPackage = {
            type: 'START_MATCH',
            masterSchedule: masterSchedule,
            onlinePlayers: onlinePlayers,
            synchronizedTeams: TEAMS_DATA,
            synchronizedDrivers: DRIVERS_DATA,
            settings: matchSettings
        };

        clientConnections.forEach(c => {
            if (c && c.open) c.send(startPackage);
        });

        const pTeam = myTeam || (typeof TEAMS_DATA !== 'undefined' ? TEAMS_DATA[0] : null);
        const pDrivers = myDrivers?.length === 2 ? myDrivers : null;

        // Execute Host local Career initiation
        initSynchronizedMultiplayerCareer(pTeam, pDrivers, myStaff, matchSettings, { masterSchedule: masterSchedule, onlinePlayers: onlinePlayers });
        
        // Start Periodic Sync
        startRaceSync();
    }

    function startRaceSync() {
        if (!isHost) return;
        if (syncInterval) clearInterval(syncInterval);
        
        syncInterval = setInterval(() => {
            if (typeof RaceEngine === 'undefined' || !RaceEngine.getState()) return;
            const state = RaceEngine.getState();
            if (typeof StateManager.captureLiveRaceState === 'function') StateManager.captureLiveRaceState();
            persistSession();
            
            const syncData = {
                type: 'RACE_SYNC',
                lap: state.currentLap,
                status: state.status,
                finished: state.finished,
                results: state.finished ? state.results : null,
                cars: state.cars.map(c => ({
                    id: c.id,
                    pos: c.position,
                    prog: c.trackProgress,
                    lap: c.lapCount,
                    dnf: c.status === 'DNF'
                }))
            };
            
            clientConnections.forEach(c => {
                if (c && c.open) c.send(syncData);
            });
            
            if (state.finished) stopRaceSync();
        }, 1000); // Authority: 1s sync interval for "Host Screen" feel
    }

    function stopRaceSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    }

    function handleRemoteStart(data) {
        Notifications.success('Host Unleashed The Season!', 'Synchronizing global championship schedule & grid...');

        // Do not splice synchronized multiplayer data into global TEAMS_DATA / DRIVERS_DATA.
        // Those globals are shared with Single Player; multiplayer roster isolation is carried
        // by onlinePlayers and the multiplayer career snapshot.

        if (data.settings) matchSettings = data.settings;
        if (data.masterSchedule) {
            masterSchedule = (typeof CalendarService !== 'undefined')
                ? CalendarService.normalizeTrackIds(data.masterSchedule)
                : data.masterSchedule;
            if (typeof CalendarService !== 'undefined') {
                const validation = CalendarService.validateCalendar(masterSchedule);
                if (!validation.valid) console.error('[OnlineManager] Received invalid masterSchedule:', validation.errors, data.masterSchedule);
            }
        }
        if (data.onlinePlayers) onlinePlayers = data.onlinePlayers;

        const myLocalObj = onlinePlayers.find(op => op.connectionId === myConnection?.peer || op.username === myUsername || op.team?.id === myTeam?.id);

        setTimeout(() => {
            initSynchronizedMultiplayerCareer(myLocalObj?.team || myTeam, myLocalObj?.drivers || myDrivers, myLocalObj?.staff || myStaff, matchSettings, { masterSchedule: masterSchedule, onlinePlayers: onlinePlayers });
        }, 300);
    }

    function initSynchronizedMultiplayerCareer(localTeam, localDrivers, localStaff, settings, mpOptions) {
        const careerSettings = {
            seasonLength: settings.races || 5,
            difficulty: settings.difficulty || 'COMPETITIVE',
            speed: settings.speed || 2,
            lengthMult: settings.lengthMult || 0.5,
            isMultiplayer: true
        };

        StateManager.initCareer(localTeam, localDrivers, localStaff, careerSettings, mpOptions);
        StateManager.update('settings', { raceSpeed: settings.speed || 2, difficulty: settings.difficulty || 'COMPETITIVE' });

        const career = Safe.get(StateManager, 'get') ? StateManager.get('career') : null;
        if (career && Safe.getArray(career, 'schedule', []).length > 0) {
            if (typeof CalendarService !== 'undefined') {
                CalendarService.ensureCareerCalendar(career, { seasonLength: settings.races || 5 });
                StateManager.set('career', career);
            }
            const nextRace = typeof CalendarService !== 'undefined' ? CalendarService.getNextRace(career) : null;
            const track = nextRace?.track || (typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA[0] : { id: 't1', name: 'Track', laps: 57, baseLapTime: 90 });
            
            if (typeof RaceInitializer === 'undefined') throw new Error('RaceInitializer unavailable: cannot initialize multiplayer race');
            RaceInitializer.initializeRace({
                source: 'multiplayer-career',
                track: track,
                allTeams: Safe.getArray(career, 'allTeams', []),
                playerTeamId: Safe.get(career, 'team.id') || (localTeam && localTeam.id) || null,
                difficulty: career.difficulty || 'COMPETITIVE',
                speed: settings.speed || 2,
                strategy: { startingTire: 'MEDIUM', pitStops: 2, aggression: 5 },
                isCareerRace: true,
                isMultiplayerRace: true
            });
        }

        persistSession({ currentScreen: 'dashboard', readyState: onlinePlayers });

        if (typeof AudioManager !== 'undefined') AudioManager.engineRev();
        Notifications.success('Online Tournament Active!', `${mpOptions.onlinePlayers?.length || 2} Constructors locked in! Welcome to the Season Paddock Hub.`);

        setTimeout(() => {
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'dashboard', color: '#FF0033' });
        }, 600);
    }

    function setUICallback(cb) {
        uiCallback = cb;
    }

    function triggerRender() {
        if (uiCallback) uiCallback();
    }

    function cleanup(isManualExit = false) {
        stopRaceSync();
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        
        // Clear storage only if explicitly leaving or session finished
        if (isManualExit) {
            console.log('[OnlineManager] Manual exit: Clearing MP session storage');
            try {
                const code = roomCode;
                sessionStorage.removeItem('velocity_mp_session');
                if (code) {
                    const rawPrefs = sessionStorage.getItem('velocity_mp_reconnect_preferences');
                    const prefs = rawPrefs ? JSON.parse(rawPrefs) : {};
                    delete prefs[code];
                    sessionStorage.setItem('velocity_mp_reconnect_preferences', JSON.stringify(prefs));
                }
            } catch(e) {}
        }
        
        clientConnections.forEach(c => { try{c.close();}catch(e){} });
        clientConnections = [];
        if (myConnection) {
            try { myConnection.close(); } catch(e){}
            myConnection = null;
        }
        if (peer) {
            try { peer.destroy(); } catch(e){}
            peer = null;
        }
        onlinePlayers = [];
        roomCode = null;
        chatMessages = [];
        matchStarted = false;
    }

    function isConnected() { return isHost || (myConnection && myConnection.open); }
    function getRoomCode() { return roomCode; }
    function getMyUsername() { return myUsername; }
    function getMyConnectionId() { return isHost ? 'host' : myConnection?.peer; }
    function getMyTeam() { return myTeam; }
    function getMyDrivers() { return myDrivers; }
    function getMyStaff() { return myStaff; }
    function getOnlinePlayers() { return onlinePlayers; }
    function getChatMessages() { return chatMessages; }
    function getSettings() { return matchSettings; }
    function getLatency() { return lastLatency; }
    function getHostUsername() {
        const h = onlinePlayers.find(op => op.isHost);
        return h ? h.username : 'Host';
    }

    return {
        init,
        createRoom,
        lockInHost,
        connectAndReceiveHostLocked,
        lockInClient,
        sendChat,
        sendLiveAction,
        broadcastAction,
        triggerReady,
        toggleWeekendReady,
        launchDuel,
        updateSettings,
        setUICallback,
        persistSession,
        cleanup,
        handleSkipVoteConfirm,
        isHost: () => isHost,
        isConnected,
        getRoomCode,
        getMyUsername,
        getMyConnectionId,
        getMyTeam,
        getMyDrivers,
        getMyStaff,
        getOnlinePlayers,
        getChatMessages,
        getSettings,
        getLatency,
        getHostUsername
    };
})();

/* ============================================
   VELOCITY — MULTIPLAYER LOBBY SCREEN CONTROLLER
   Multi-Client elite staging flow
   ============================================ */
const MultiplayerScreen = (() => {
    let container = null;
    let isActive = false;
    let currentLobbyView = 'menu'; // 'menu' | 'host_setup' | 'host_staging' | 'join_enter_code' | 'join_select_package' | 'join_staging'

    function init() {
        console.log('[MultiplayerScreen] Initializing UI container...');
        container = document.getElementById('mp-content');
        if (!container) {
            console.error('[MultiplayerScreen] mp-content element missing');
            return;
        }
        
        if (typeof OnlineManager !== 'undefined') {
            OnlineManager.init();
        } else {
            console.error('[MultiplayerScreen] OnlineManager not found');
        }
        
        attachListeners();
    }

    function render() {
        if (!container) return;

        try {
            console.log('[MultiplayerScreen] Rendering view:', currentLobbyView);
            if (currentLobbyView === 'menu') {
                renderMenuView();
            } else if (currentLobbyView === 'host_setup') {
                renderHostSetupView();
            } else if (currentLobbyView === 'host_staging') {
                renderHostStagingView();
            } else if (currentLobbyView === 'join_enter_code') {
                renderJoinEnterCodeView();
            } else if (currentLobbyView === 'join_select_package') {
                renderJoinSelectPackageView();
            } else if (currentLobbyView === 'join_staging') {
                renderJoinStagingView();
            } else {
                renderMenuView(); // Fallback
            }
            attachUIListeners();
        } catch (err) {
            console.error('[MultiplayerScreen] Render crash:', err);
            container.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; color: var(--red); font-family: Orbitron; background: #050505; height: 100vh;">
                    <div style="font-size: 80px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="letter-spacing: 4px;">ARENA LINK FAILURE</h2>
                    <p style="color: var(--gray-400); font-family: Rajdhani; font-size: 18px; max-width: 600px; margin: 0 auto 30px;">
                        A critical error occurred while rendering the cockpit interface. This is likely due to a synchronization glitch in the serverless WebRTC tunnel.
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn btn-glow" onclick="location.reload()" style="border-color: var(--red); color: var(--red); padding: 15px 30px;">REBOOT SYSTEM</button>
                        <button class="btn" id="err-back-home" style="padding: 15px 30px;">RETURN HOME</button>
                    </div>
                    <div style="margin-top: 40px; color: var(--gray-700); font-size: 11px; font-family: monospace;">
                        ERROR_TRACE: ${escapeHTML(err.message)}
                    </div>
                </div>
            `;
            container.querySelector('#err-back-home')?.addEventListener('click', () => {
                if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
            });
        }
    }

    function renderMenuView() {
        if (!container) return;
        
        let myName = 'RACER';
        try {
            if (typeof OnlineManager !== 'undefined' && OnlineManager.getMyUsername) {
                myName = OnlineManager.getMyUsername();
            }
        } catch(e) { console.error('myName fetch error'); }

        container.innerHTML = `
            <div class="lobby-container" style="justify-content: center; align-items: center; background: radial-gradient(circle at center, #1a0505 0%, #000 100%);">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header" style="border: none; text-align: center; flex-direction: column; gap: 10px;">
                    <h1 class="lobby-title" style="font-size: 60px; color: #FFF; text-shadow: 0 0 30px rgba(255,255,255,0.2);">GLOBAL <span style="color: var(--red);">ARENA</span></h1>
                    <div class="lobby-tagline" style="font-size: 14px; letter-spacing: 8px;">WORLDWIDE MULTIPLAYER INFRASTRUCTURE</div>
                </div>

                <div style="font-family: Orbitron; font-size: 11px; color: var(--gray-500); margin-bottom: 20px;">CALLSIGN: <span style="color: var(--blue);">${escapeHTML(myName)}</span></div>

                <div class="lobby-grid" style="max-width: 1000px; width: 100%; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <!-- HOST CARD -->
                    <div class="quick-action-card" id="btn-menu-host" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.2); transition: all 0.3s ease; padding: 40px; cursor: pointer;">
                        <div style="font-size: 60px; margin-bottom: 20px;">🏟️</div>
                        <h2 style="font-family: Orbitron; color: var(--yellow); margin-bottom: 15px; letter-spacing: 2px;">CREATE LOBBY</h2>
                        <p style="font-family: Rajdhani; color: var(--gray-400); line-height: 1.6; font-size: 16px;">Host a custom championship season. Control the calendar, AI difficulty, and invite up to 11 human competitors via secure WebRTC tunnel.</p>
                        <div style="margin-top: 30px; color: var(--yellow); font-family: Orbitron; font-weight: 800; font-size: 12px; letter-spacing: 2px;">ESTABLISH MASTER BROKER →</div>
                    </div>

                    <!-- JOIN CARD -->
                    <div class="quick-action-card" id="btn-menu-join" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(0,128,255,0.2); transition: all 0.3s ease; padding: 40px; cursor: pointer;">
                        <div style="font-size: 60px; margin-bottom: 20px;">📡</div>
                        <h2 style="font-family: Orbitron; color: var(--blue); margin-bottom: 15px; letter-spacing: 2px;">JOIN LOBBY</h2>
                        <p style="font-family: Rajdhani; color: var(--gray-400); line-height: 1.6; font-size: 16px;">Enter a Master Room Code to join an existing session. Pick from the available teams and drivers to challenge the grid in real-time.</p>
                        <div style="margin-top: 30px; color: var(--blue); font-family: Orbitron; font-weight: 800; font-size: 12px; letter-spacing: 2px;">SEEK ACTIVE UPLINK →</div>
                    </div>
                </div>

                <div style="margin-top: 50px; display: flex; align-items: center; gap: 15px; background: rgba(0,255,65,0.05); padding: 12px 25px; border-radius: 50px; border: 1px solid rgba(0,255,65,0.2);">
                    <span class="lobby-online-dot" style="background: var(--green);"></span>
                    <span style="font-family: Orbitron; font-size: 11px; color: var(--green); font-weight: 800; letter-spacing: 2px;">SERVERLESS P2P PROTOCOL V1.2 ONLINE</span>
                </div>
            </div>
        `;
    }

    function renderHostSetupView() {
        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--yellow);">HOST STAGING • STEP 1</h1>
                        <div class="lobby-tagline">Select & Lock In your elite Constructor package</div>
                    </div>
                    <div>
                        <button class="btn" id="btn-back-menu">← BACK TO ARENA</button>
                    </div>
                </div>

                <div class="create-room-panel" style="max-width: 800px; margin: 0 auto; width: 100%;">
                    <div class="panel-title" style="color: var(--yellow);">
                        <span class="panel-title-icon">🏎️</span>
                        <span>CONSTRUCTOR SETUP</span>
                    </div>

                    <div class="create-room-form">
                        <div class="form-group">
                            <label class="form-label">Your Host Username</label>
                            <input type="text" class="input" id="hs-user" value="${OnlineManager.getMyUsername()}" style="font-family: Orbitron; font-weight: 700; font-size: 18px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Select Constructor Team</label>
                            <select class="select" id="hs-team">
                                ${TEAMS_DATA.map(t => `<option value="${t.id}">${t.flag} ${t.name} (${t.shortName})</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Select Driver 1</label>
                                <select class="select" id="hs-driver1">
                                    ${DRIVERS_DATA.slice(0, Math.floor(DRIVERS_DATA.length/2)).map(d => `<option value="${d.id}">Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Select Driver 2</label>
                                <select class="select" id="hs-driver2">
                                    ${DRIVERS_DATA.slice(Math.floor(DRIVERS_DATA.length/2)).map(d => `<option value="${d.id}">Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">TECHNICAL DIRECTOR</label>
                            <select class="select" id="hs-staff-techdir">
                                ${STAFF_DATA?.technicalDirectors?.map(s => `<option value="${s.id}">Skill ${s.skill || 85} • ${s.name} (${s.specialty})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">CHIEF STRATEGIST</label>
                            <select class="select" id="hs-staff-strategist">
                                ${STAFF_DATA?.chiefStrategists?.map(s => `<option value="${s.id}">Skill ${s.skill || 80} • ${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">PIT CREW SQUAD</label>
                            <select class="select" id="hs-staff-pitcrew">
                                ${STAFF_DATA?.pitCrews?.map(s => `<option value="${s.id}">Efficiency ${s.skill || 80} • ${s.name}</option>`).join('')}
                            </select>
                        </div>

                        <button class="btn btn-create-room" id="btn-lock-host" style="margin-top: 32px; border-color: var(--yellow); color: var(--yellow); box-shadow: 0 0 25px rgba(255,215,0,0.3); font-family: Orbitron; font-weight: 900;">
                            🔒 LOCK IN CONSTRUCTOR & OPEN MASTER LOBBY
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderHostStagingView() {
        if (!container) return;
        
        const team = typeof OnlineManager !== 'undefined' ? OnlineManager.getMyTeam() : null;
        const onlinePlayers = typeof OnlineManager !== 'undefined' ? OnlineManager.getOnlinePlayers() : [];
        const settings = typeof OnlineManager !== 'undefined' ? OnlineManager.getSettings() : { races: 5, speed: 2, difficulty: 'COMPETITIVE' };
        const latency = typeof OnlineManager !== 'undefined' ? OnlineManager.getLatency() : 0;

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--yellow); text-shadow: 0 0 20px rgba(255,215,0,0.3);">CONSTRUCTOR COMMAND CENTER</h1>
                        <div class="lobby-tagline">Master Host Broker • Active Staging</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="font-family: Orbitron; font-size: 10px; color: ${latency < 100 ? 'var(--green)' : 'var(--yellow)'};">🛰️ ${latency}ms</div>
                        <div class="lobby-online-count" style="background: rgba(255,215,0,0.1); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--yellow); display: flex; align-items: center; gap: 10px;">
                            <span class="lobby-online-dot" style="background: var(--yellow);"></span>
                            <span style="color: var(--yellow); font-family: Orbitron; font-weight: 800; font-size: 12px;">LOBBY CODE: ${OnlineManager.getRoomCode()}</span>
                            <button class="btn btn-glow" id="btn-copy-code" style="font-size: 9px; padding: 4px 8px; border-color: var(--yellow); color: var(--yellow);">COPY</button>
                        </div>
                    </div>
                </div>

                <div class="room-waiting" style="grid-template-columns: 1fr 1.2fr 0.8fr; height: calc(100vh - 180px);">
                    <!-- COL 1: GRID & LAUNCH -->
                    <div style="display: flex; flex-direction: column; gap: 20px; overflow-y: auto; padding-right: 10px;">
                        <div class="create-room-panel" style="border-color: var(--yellow);">
                            <div class="panel-title" style="color: var(--yellow);">
                                <span class="panel-title-icon">🏎️</span>
                                <span>ONLINE GRID (${onlinePlayers.length}/12)</span>
                            </div>
                            <div class="room-player-list">
                                ${onlinePlayers.map(op => `
                                    <div class="room-player-item" style="border-left: 4px solid ${op.team?.color || 'var(--yellow)'}; background: rgba(20,20,20,0.8); cursor: ${op.username === OnlineManager.getMyUsername() ? 'pointer' : 'default'}" 
                                        ${op.username === OnlineManager.getMyUsername() ? 'id="toggle-my-ready"' : ''}>
                                        <div class="player-avatar" style="background: ${op.team?.color || '#333'}; color: white; font-family: Orbitron; font-weight: 900; box-shadow: 0 0 10px ${op.team?.color}44;">
                                            ${op.team?.shortName || 'V'}
                                        </div>
                                        <div class="player-name">
                                            <div style="font-weight: 800; font-size: 15px; color: #FFF;">${escapeHTML(op.username)} ${op.isHost ? '<span class="player-host-badge">HOST</span>' : ''}</div>
                                            <div style="font-size: 11px; color: var(--gray-400); font-family: Orbitron;">${escapeHTML(op.team?.name || 'Managing AI Team')}</div>
                                        </div>
                                        <div class="player-ready ${op.isReady ? 'is-ready' : ''}">
                                            ${op.isReady ? '✓' : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                ${onlinePlayers.length < 12 ? `<div style="padding: 16px; border: 1px dashed var(--gray-700); border-radius: 8px; text-align: center; color: var(--gray-600); font-family: Rajdhani; font-size: 13px;">Awaiting more challengers...</div>` : ''}
                            </div>
                        </div>

                        <div style="font-family: Rajdhani; font-size: 12px; color: var(--gray-500); text-align: center;">Tip: Click your card above to toggle READY status</div>

                        <button class="btn btn-create-room" id="btn-execute-launch" 
                            style="margin-top: auto; padding: 24px; font-size: 20px; border-color: var(--green); color: var(--green); box-shadow: 0 0 30px rgba(0,255,65,0.4); animation: pulse-green 2s infinite; ${onlinePlayers.every(p => p.isReady) ? '' : 'opacity: 0.5; filter: grayscale(1);'}">
                            ${onlinePlayers.every(p => p.isReady) ? '🚀 LAUNCH WORLD CHAMPIONSHIP' : '⌛ WAITING FOR CONSTRUCTORS...'}
                        </button>
                    </div>

                    <!-- COL 2: SEASON CALENDAR & AI CONFIG -->
                    <div style="display: flex; flex-direction: column; gap: 20px; overflow-y: auto; padding-right: 10px;">
                        <div class="create-room-panel">
                            <div class="panel-title" style="color: var(--blue);">
                                <span class="panel-title-icon">⚙️</span>
                                <span>SEASON CONFIGURATION</span>
                            </div>
                            <div class="create-room-form">
                                <div class="form-group">
                                    <label class="form-label">Number of Rounds</label>
                                    <select class="select" id="h-races-sel">
                                        <option value="1" ${settings.races === 1 ? 'selected' : ''}>1 Race (Sudden Death)</option>
                                        <option value="3" ${settings.races === 3 ? 'selected' : ''}>3 Races (Sprint Series)</option>
                                        <option value="5" ${settings.races === 5 ? 'selected' : ''}>5 Races (Standard Cup)</option>
                                        <option value="10" ${settings.races === 10 ? 'selected' : ''}>10 Races (Full Season)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">AI Difficulty Level</label>
                                    <select class="select" id="h-diff-sel">
                                        <option value="CASUAL" ${settings.difficulty === 'CASUAL' ? 'selected' : ''}>Casual (For Fun)</option>
                                        <option value="COMPETITIVE" ${settings.difficulty === 'COMPETITIVE' ? 'selected' : ''}>Competitive (Pro)</option>
                                        <option value="ELITE" ${settings.difficulty === 'ELITE' ? 'selected' : ''}>Elite (Hardcore)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Race Pace (Simulation Speed)</label>
                                    <select class="select" id="h-speed-sel">
                                        <option value="1" ${settings.speed === 1 ? 'selected' : ''}>1X (Real Time)</option>
                                        <option value="2" ${settings.speed === 2 ? 'selected' : ''}>2X (Standard)</option>
                                        <option value="5" ${settings.speed === 5 ? 'selected' : ''}>5X (Strategic)</option>
                                        <option value="10" ${settings.speed === 10 ? 'selected' : ''}>10X (Fast)</option>
                                        <option value="30" ${settings.speed === 30 ? 'selected' : ''}>30X (Blitz)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="create-room-panel" style="background: rgba(0,0,0,0.3);">
                            <div class="panel-title" style="color: var(--gray-400); font-size: 14px;">
                                <span class="panel-title-icon">🏁</span>
                                <span>SYNCHRONIZED TRACK POOL</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                ${TRACKS_DATA.slice(0, 6).map(t => `<div style="font-family: Rajdhani; font-size: 12px; color: var(--gray-500); padding: 4px; background: rgba(255,255,255,0.03); border-radius: 4px;">${t.flag} ${t.name}</div>`).join('')}
                                <div style="font-family: Rajdhani; font-size: 12px; color: var(--blue); padding: 4px; text-align: center; grid-column: span 2;">+ RANDOM TRACKS POOLED</div>
                            </div>
                        </div>
                    </div>

                    <!-- COL 3: COMMS & BROKER STATUS -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="room-chat" style="flex: 1;">
                            <div class="room-chat-header">PADDOCK RADIO</div>
                            <div class="room-chat-messages" id="staging-chat-messages">
                                ${OnlineManager.getChatMessages().map(m => `<div class="chat-message" style="border-left: 2px solid ${m.color}88;"><span class="chat-sender" style="color: ${m.color}">${m.sender}:</span><span>${escapeHTML(m.text)}</span></div>`).join('')}
                            </div>
                            <div class="room-chat-input">
                                <input type="text" class="input" id="staging-chat-input" placeholder="Message paddock...">
                                <button class="btn btn-glow" id="btn-staging-send-chat">SEND</button>
                            </div>
                        </div>
                        
                        <div class="create-room-panel" style="padding: 16px; background: rgba(0,0,0,0.5);">
                            <div style="font-family: Orbitron; font-size: 10px; color: var(--gray-500); text-align: center; letter-spacing: 2px;">WEBRTC BROKER STATUS: <span style="color: var(--green);">OPERATIONAL</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinEnterCodeView() {
        if (!container) return;

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--blue);">JOIN MASTER LOBBY • STEP 1</h1>
                        <div class="lobby-tagline">Enter Host's 4-Digit Master Room Code to lock in uplink</div>
                    </div>
                    <div>
                        <button class="btn" id="btn-back-menu">← BACK TO ARENA</button>
                    </div>
                </div>

                <div class="create-room-panel" style="max-width: 600px; margin: var(--space-3xl) auto; width: 100%; border-color: var(--blue); text-align: center; padding: 48px 32px;">
                    <div style="font-size: 64px; margin-bottom: 24px;">📡</div>
                    <div class="panel-title" style="color: var(--blue); justify-content: center; font-size: 24px;">
                        <span>ENTER MASTER ROOM CODE</span>
                    </div>

                    <div class="create-room-form" style="margin-top: 24px;">
                        <input type="text" class="input" id="js-code-box" placeholder="e.g. 8492" style="font-family: Orbitron; font-size: 40px; font-weight: 900; text-align: center; letter-spacing: 12px; padding: 24px; border: 2px solid var(--blue); color: var(--blue); max-width: 350px; margin: 0 auto; box-shadow: 0 0 25px rgba(0,128,255,0.3); text-transform: uppercase;">
                        <div style="font-size: 13px; color: var(--gray-400); margin-top: 12px;">Ask the Host for their unique SALT-based Code to establish an immediate WebRTC data uplink.</div>

                        <button class="btn btn-create-room" id="btn-execute-seek" style="margin-top: 36px; border-color: var(--blue); color: var(--blue); box-shadow: 0 0 30px rgba(0,128,255,0.3); font-family: Orbitron; font-weight: 900; font-size: 18px; padding: 20px;">
                            ⚡ SEEK HOST & CONNECT UPLINK
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinSelectPackageView() {
        if (!container) return;
        
        const players = typeof OnlineManager !== 'undefined' ? OnlineManager.getOnlinePlayers() : [];
        const myName = typeof OnlineManager !== 'undefined' ? OnlineManager.getMyUsername() : 'CHALLENGER';

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--blue);">JOIN STAGING • CONSTRUCTOR CONFIG</h1>
                        <div class="lobby-tagline">Uplink Stable • Select your unique season roster</div>
                    </div>
                    <div>
                        <span class="badge" style="background: var(--blue); color: white; font-family: Orbitron; font-weight: 900; padding: 8px 16px; box-shadow: 0 0 15px rgba(0,128,255,0.4);">UPLINK ACTIVE 📡</span>
                    </div>
                </div>

                <div class="create-room-panel" style="max-width: 900px; margin: 0 auto; width: 100%; border-color: var(--blue); background: rgba(0,0,0,0.4);">
                    <div class="panel-title" style="color: var(--blue); border-bottom: 1px solid rgba(0,128,255,0.2); padding-bottom: 15px;">
                        <span class="panel-title-icon">⚔️</span>
                        <span>CHALLENGER PACKAGE SETUP</span>
                    </div>

                    <div class="create-room-form" style="margin-top: 20px;">
                        <div class="form-group">
                            <label class="form-label">CHALLENGER CALLSIGN</label>
                            <input type="text" class="input" id="jsp-user" value="${escapeHTML(myName)}" style="font-family: Orbitron; font-weight: 900; font-size: 20px; color: var(--blue);">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 10px;">
                            <div class="form-group">
                                <label class="form-label">CONSTRUCTOR TEAM</label>
                                <select class="select" id="jsp-team" style="height: 50px;">
                                    ${(typeof TEAMS_DATA !== 'undefined' ? TEAMS_DATA : []).map(t => {
                                        const takenBy = players.find(op => op.team?.id === t.id);
                                        return `<option value="${t.id}" ${takenBy ? 'disabled' : ''}>${t.flag} ${t.name} ${takenBy ? `(TAKEN BY ${takenBy.username})` : ''}</option>`;
                                    }).join('')}
                                </select>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div class="form-group">
                                    <label class="form-label">LEAD DRIVER</label>
                                    <select class="select" id="jsp-driver1">
                                        ${(typeof DRIVERS_DATA !== 'undefined' ? DRIVERS_DATA : []).map(d => {
                                            const takenBy = players.find(op => op.drivers?.some(od => od.id === d.id));
                                            return `<option value="${d.id}" ${takenBy ? 'disabled' : ''}>Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name} ${takenBy ? `(SIGNED BY ${takenBy.username})` : ''}</option>`;
                                        }).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">SECONDARY DRIVER</label>
                                    <select class="select" id="jsp-driver2">
                                        ${(typeof DRIVERS_DATA !== 'undefined' ? DRIVERS_DATA : []).map(d => {
                                            const takenBy = players.find(op => op.drivers?.some(od => od.id === d.id));
                                            return `<option value="${d.id}" ${takenBy ? 'disabled' : ''}>Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name} ${takenBy ? `(SIGNED BY ${takenBy.username})` : ''}</option>`;
                                        }).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">TECHNICAL DIRECTOR</label>
                            <select class="select" id="jsp-staff-techdir">
                                ${(STAFF_DATA?.technicalDirectors || []).map(s => {
                                    const takenBy = players.find(op => op.staff?.techDirector?.id === s.id);
                                    return `<option value="${s.id}" ${takenBy ? 'disabled' : ''}>Skill ${s.skill || 85} • ${s.name} ${takenBy ? `(SIGNED BY ${takenBy.username})` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">CHIEF STRATEGIST</label>
                            <select class="select" id="jsp-staff-strategist">
                                ${(STAFF_DATA?.chiefStrategists || []).map(s => {
                                    const takenBy = players.find(op => op.staff?.strategist?.id === s.id);
                                    return `<option value="${s.id}" ${takenBy ? 'disabled' : ''}>Skill ${s.skill || 80} • ${s.name} ${takenBy ? `(SIGNED BY ${takenBy.username})` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-group" style="margin-top: 15px;">
                            <label class="form-label">PIT CREW SQUAD</label>
                            <select class="select" id="jsp-staff-pitcrew">
                                ${(STAFF_DATA?.pitCrews || []).map(s => {
                                    const takenBy = players.find(op => op.staff?.pitCrew?.id === s.id);
                                    return `<option value="${s.id}" ${takenBy ? 'disabled' : ''}>Efficiency ${s.skill || 80} • ${s.name} ${takenBy ? `(SIGNED BY ${takenBy.username})` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <button class="btn btn-create-room" id="btn-lock-client-final" style="margin-top: 40px; border-color: var(--blue); color: var(--blue); box-shadow: 0 0 25px rgba(0,128,255,0.3); font-family: Orbitron; font-weight: 900; font-size: 18px;">
                            🔒 TRANSMIT READY SIGNAL TO HOST
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinStagingView() {
        if (!container) return;
        
        const team = typeof OnlineManager !== 'undefined' ? OnlineManager.getMyTeam() : null;
        const onlinePlayers = typeof OnlineManager !== 'undefined' ? OnlineManager.getOnlinePlayers() : [];
        const settings = typeof OnlineManager !== 'undefined' ? OnlineManager.getSettings() : { races: 5, speed: 2, difficulty: 'COMPETITIVE' };
        const hostName = typeof OnlineManager !== 'undefined' ? OnlineManager.getHostUsername() : 'Host';
        const latency = typeof OnlineManager !== 'undefined' ? OnlineManager.getLatency() : 0;

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--blue); text-shadow: 0 0 20px rgba(0,128,255,0.3);">CHALLENGER UPLINK ACTIVE</h1>
                        <div class="lobby-tagline">Connected to Master Broker • Staging Package Locked</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="font-family: Orbitron; font-size: 10px; color: ${latency < 100 ? 'var(--green)' : 'var(--yellow)'};">🛰️ ${latency}ms</div>
                        <span class="badge" style="background: var(--green); color: var(--black); font-family: Orbitron; font-weight: 900; padding: 8px 16px;">PACKAGE READY 🏁</span>
                    </div>
                </div>

                <div class="lobby-grid">
                    <!-- LEFT: ONLINE CONSTRUCTORS GRID -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="create-room-panel" style="border-color: var(--blue); background: rgba(0,128,255,0.02);">
                            <div class="panel-title" style="color: var(--blue);">
                                <span class="panel-title-icon">🏎️</span>
                                <span>ONLINE CONSTRUCTORS GRID (${onlinePlayers.length}/12 JOINED)</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 6px;">
                                ${onlinePlayers.map(op => `
                                    <div class="room-player-item" 
                                        ${op.username === OnlineManager.getMyUsername() ? 'id="toggle-my-ready"' : ''} 
                                        style="border-left: 4px solid ${op.team?.color || 'var(--blue)'}; background: rgba(20,20,20,0.8); cursor: ${op.username === OnlineManager.getMyUsername() ? 'pointer' : 'default'}">
                                        <div class="player-avatar" style="background: ${op.team?.color || '#333'}; color: white; font-family: Orbitron; font-weight: 900; box-shadow: 0 0 10px ${op.team?.color}44;">
                                            ${op.team?.shortName || 'V'}
                                        </div>
                                        <div class="player-name">
                                            <div style="font-weight: 800; font-size: 15px; color: #FFF;">${escapeHTML(op.username)} ${op.isHost ? '<span class="player-host-badge">HOST</span>' : ''} ${op.username === OnlineManager.getMyUsername() ? '<span style="color:var(--blue); font-size:10px;">(YOU)</span>' : ''}</div>
                                            <div style="font-size: 11px; color: var(--gray-400); font-family: Orbitron;">${escapeHTML(op.team?.name || 'Managing AI Team')}</div>
                                        </div>
                                        <div class="player-ready ${op.isReady ? 'is-ready' : ''}">
                                            ${op.isReady ? '✓' : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div style="font-family: Rajdhani; font-size: 12px; color: var(--gray-500); text-align: center;">Tip: Click your card above to toggle READY status</div>

                        <!-- MATCH STATUS & HOST SETTINGS -->
                        <div class="room-browser-panel" style="padding: 20px; border-color: var(--green); background: rgba(0,255,65,0.05); margin-top: auto;">
                            <div class="panel-title" style="color: var(--green);">
                                <span class="panel-title-icon">👑</span>
                                <span>HOST SETTINGS (${escapeHTML(hostName)})</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; background: rgba(0,0,0,0.5); padding: 12px; border-radius: var(--radius-md); font-size: 14px; text-align: center;">
                                <div style="color: var(--yellow)"><b>${settings.races}</b> Rounds</div>
                                <div style="color: var(--yellow)"><b>${settings.difficulty}</b> Grid</div>
                                <div style="color: var(--yellow)"><b>${settings.speed}X</b> Simulation</div>
                            </div>
                        </div>
                    </div>

                    <!-- COL 2: COMMMS & SYSTEM STATUS -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="room-chat" style="flex: 1;">
                            <div class="room-chat-header">PADDOCK RADIO</div>
                            <div class="room-chat-messages" id="staging-chat-messages">
                                ${OnlineManager.getChatMessages().map(m => `<div class="chat-message" style="border-left: 2px solid ${m.color}88;"><span class="chat-sender" style="color: ${m.color}">${m.sender}:</span><span>${escapeHTML(m.text)}</span></div>`).join('')}
                            </div>
                            <div class="room-chat-input">
                                <input type="text" class="input" id="staging-chat-input" placeholder="Message paddock...">
                                <button class="btn btn-glow" id="btn-staging-send-chat">SEND</button>
                            </div>
                        </div>

                        <div style="padding: 20px; background: rgba(0,128,255,0.1); border: 1px solid var(--blue); border-radius: var(--radius-md); color: var(--blue); font-family: Rajdhani; font-size: 15px; font-weight: 700; text-align: center; line-height: 1.5; box-shadow: 0 0 20px rgba(0,128,255,0.2);">
                            🏁 Challenger uplink established. Waiting for Host to release the grid...
                        </div>
                    </div>

                    <!-- COL 3: UPLINK MONITOR -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="create-room-panel" style="border-color: var(--blue); text-align: center; padding: 30px;">
                            <div style="font-size: 40px; margin-bottom: 15px;">📡</div>
                            <div style="font-family: Orbitron; font-weight: 900; color: var(--blue); margin-bottom: 10px;">UPLINK STATUS</div>
                            <div style="display: flex; flex-direction: column; gap: 10px; background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: Orbitron;">
                                    <span style="color: var(--gray-500);">LATENCY:</span>
                                    <span style="color: ${latency < 100 ? 'var(--green)' : 'var(--yellow)'};">${latency}ms</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: Orbitron;">
                                    <span style="color: var(--gray-500);">PACKET DROP:</span>
                                    <span style="color: var(--green);">0%</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: Orbitron;">
                                    <span style="color: var(--gray-500);">ENCRYPTION:</span>
                                    <span style="color: var(--blue);">P2P-AES</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:multiplayer:enter', () => {
            isActive = true;
            currentLobbyView = 'menu';
            // Runtime isolation: preserve single-player career before entering multiplayer context.
            const activeCareer = StateManager.get('career');
            if (activeCareer && !activeCareer.isMultiplayer) {
                StateManager.saveGame?.();
                StateManager.set('career', null);
                StateManager.set('race', null);
                StateManager.set('mode', 'MENU');
            }
            OnlineManager.setUICallback(render);
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'multiplayer') isActive = false;
        });
    }

    function attachUIListeners() {
        if (!container) return;

        container.querySelector('#mp-home-btn')?.addEventListener('click', () => {
            try {
                if (typeof OnlineManager !== 'undefined') OnlineManager.cleanup(true);
            } catch (err) { console.error('[Multiplayer] Cleanup Error:', err); }
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
        });

        container.querySelector('#btn-back-menu')?.addEventListener('click', () => {
            try {
                if (typeof OnlineManager !== 'undefined') OnlineManager.cleanup(true);
            } catch (err) { console.error('[Multiplayer] Cleanup Error:', err); }
            currentLobbyView = 'menu';
            render();
        });

        // Menu navigation
        container.querySelector('#btn-menu-host')?.addEventListener('click', () => {
            currentLobbyView = 'host_setup';
            OnlineManager.createRoom(() => {
                render();
            });
            render();
        });

        container.querySelector('#btn-menu-join')?.addEventListener('click', () => {
            currentLobbyView = 'join_enter_code';
            render();
        });

        // Host Setup Lock In
        container.querySelector('#btn-lock-host')?.addEventListener('click', () => {
            const user = container.querySelector('#hs-user')?.value;
            const team = container.querySelector('#hs-team')?.value;
            const d1 = container.querySelector('#hs-driver1')?.value;
            const d2 = container.querySelector('#hs-driver2')?.value;
        const staffTechDirId = container.querySelector('#hs-staff-techdir')?.value;
        const staffStrategistId = container.querySelector('#hs-staff-strategist')?.value;
        const staffPitCrewId = container.querySelector('#hs-staff-pitcrew')?.value;

        if (d1 === d2) {
            Notifications.error('Please select two distinct drivers.');
            return;
        }

        const staff = {
            techDirector: STAFF_DATA.technicalDirectors?.find(s => s.id === staffTechDirId),
            strategist: STAFF_DATA.chiefStrategists?.find(s => s.id === staffStrategistId),
            pitCrew: STAFF_DATA.pitCrews?.find(s => s.id === staffPitCrewId)
        };

        OnlineManager.lockInHost(user, team, d1, d2, staff);
            currentLobbyView = 'host_staging';
            render();
        });

        // Join Enter Code Hitting "SEEK"
        container.querySelector('#btn-execute-seek')?.addEventListener('click', () => {
            const code = container.querySelector('#js-code-box')?.value;
            if (!code) {
                Notifications.error('Please enter the Host\'s Master Room Code.');
                return;
            }
            OnlineManager.connectAndReceiveHostLocked(code, () => {
                currentLobbyView = 'join_select_package';
                render();
            });
        });

        // Join Package Lock In
        container.querySelector('#btn-lock-client-final')?.addEventListener('click', () => {
            const user = container.querySelector('#jsp-user')?.value;
            const team = container.querySelector('#jsp-team')?.value;
            const d1 = container.querySelector('#jsp-driver1')?.value;
            const d2 = container.querySelector('#jsp-driver2')?.value;
        const staffStrategistId = container.querySelector('#jsp-staff-strategist')?.value;
        const staffPitCrewId = container.querySelector('#jsp-staff-pitcrew')?.value;
        const staffTechDirId = container.querySelector('#jsp-staff-techdir')?.value;

        if (d1 === d2) {
            Notifications.error('Please select two distinct drivers.');
            return;
        }

        const staff = {
            techDirector: STAFF_DATA.technicalDirectors?.find(s => s.id === staffTechDirId),
            strategist: STAFF_DATA.chiefStrategists?.find(s => s.id === staffStrategistId),
            pitCrew: STAFF_DATA.pitCrews?.find(s => s.id === staffPitCrewId)
        };

        OnlineManager.lockInClient(user, team, d1, d2, staff);
            currentLobbyView = 'join_staging';
            render();
        });

        // Host Exclusives Settings Changes
        container.querySelector('#h-races-sel')?.addEventListener('change', (e) => {
            OnlineManager.updateSettings({ races: parseInt(e.target.value) || 5 });
        });
        container.querySelector('#h-diff-sel')?.addEventListener('change', (e) => {
            OnlineManager.updateSettings({ difficulty: e.target.value || 'COMPETITIVE' });
        });
        container.querySelector('#h-speed-sel')?.addEventListener('change', (e) => {
            OnlineManager.updateSettings({ speed: parseFloat(e.target.value) || 2 });
        });

        // Host Execute Launch
        container.querySelector('#btn-execute-launch')?.addEventListener('click', () => {
            OnlineManager.launchDuel();
        });

        // Copy Code
        container.querySelector('#btn-copy-code')?.addEventListener('click', () => {
            navigator.clipboard?.writeText(OnlineManager.getRoomCode());
            Notifications.success('Lobby Code copied to clipboard!');
        });

        // Toggle Ready Status
        container.querySelector('#toggle-my-ready')?.addEventListener('click', () => {
            if (typeof OnlineManager !== 'undefined') OnlineManager.triggerReady();
        });

        // Chat Sending
        const chatInput = container.querySelector('#staging-chat-input');
        container.querySelector('#btn-staging-send-chat')?.addEventListener('click', () => {
            if (chatInput) OnlineManager.sendChat(chatInput.value);
            if (chatInput) chatInput.value = '';
        });
        chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                OnlineManager.sendChat(chatInput.value);
                chatInput.value = '';
            }
        });

        // Auto-scroll chat
        const chatBox = container.querySelector('#staging-chat-messages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }

    function destroy() {
        isActive = false;
    }

    function setLobbyView(view) {
        currentLobbyView = view;
        if (isActive) render();
    }

    return { init, render, setLobbyView, destroy };
})();