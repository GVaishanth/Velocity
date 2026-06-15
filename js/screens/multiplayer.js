/* ============================================
   VELOCITY — ONLINE MULTIPLAYER SCREEN & MANAGER
   WebRTC Peer-to-Peer Star Topology Multi-Client Broker
   Supports up to 12 Online Human Constructors!
   ============================================ */

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

    function init() {
        if (!myTeam && typeof TEAMS_DATA !== 'undefined') {
            myTeam = TEAMS_DATA[0];
        }
    }

    function createRoom(onReady) {
        cleanup();
        isHost = true;
        matchStarted = false;
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        roomCode = codeNum.toString();
        const fullId = 'VELOCITY-' + roomCode;

        try {
            peer = new Peer(fullId);

            peer.on('open', (id) => {
                Notifications.success('Master Online Room Created!', `Room Code: ${roomCode}`);
                if (onReady) onReady();
                triggerRender();
            });

            peer.on('connection', (conn) => {
                if (onlinePlayers.length >= 12) {
                    conn.send({ type: 'ERROR', message: 'Room is completely full (12/12 Constructors joined)!' });
                    setTimeout(() => conn.close(), 500);
                    return;
                }
                if (matchStarted) {
                    conn.send({ type: 'ERROR', message: 'Championship Season has already started!' });
                    setTimeout(() => conn.close(), 500);
                    return;
                }

                clientConnections.push(conn);
                setupHostConnectionListeners(conn);
            });

            peer.on('error', (err) => {
                Notifications.error('Network Error', err.message || 'Failed to establish room');
                console.error('[PeerJS Error]', err);
                triggerRender();
            });
        } catch (e) {
            Notifications.error('WebRTC Error', 'Please ensure PeerJS is loaded and active.');
            console.error('[OnlineManager]', e);
        }
    }

    function lockInHost(username, teamId, driver1Id, driver2Id, staffId) {
        myUsername = username || myUsername;
        if (typeof getTeamById === 'function') myTeam = getTeamById(teamId);
        if (typeof getDriverById === 'function') {
            myDrivers = [getDriverById(driver1Id), getDriverById(driver2Id)].filter(Boolean);
        }

        if (typeof STAFF_DATA !== 'undefined') {
            myStaff = {
                techDirector: STAFF_DATA.technicalDirectors?.find(s => s.id === staffId) || STAFF_DATA.technicalDirectors?.[0],
                strategist: STAFF_DATA.chiefStrategists?.[0],
                pitCrew: STAFF_DATA.pitCrews?.[0]
            };
        }

        // Add Local Host to Master Roster
        const existingHost = onlinePlayers.find(op => op.isHost);
        if (existingHost) {
            Object.assign(existingHost, { username: myUsername, team: myTeam, drivers: myDrivers, staff: myStaff, isReady: true });
        } else {
            onlinePlayers.push({
                isHost: true,
                connectionId: 'host',
                username: myUsername,
                team: myTeam,
                drivers: myDrivers,
                staff: myStaff,
                isReady: true
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

    function setupHostConnectionListeners(conn) {
        conn.on('data', (data) => {
            if (!data || !data.type) return;

            if (data.type === 'CLIENT_CONNECTING') {
                Notifications.info('New Constructor Connected!', `Challenger ${data.username || ''} joined waiting room.`);
                conn.send({
                    type: 'LOBBY_UPDATE',
                    onlinePlayers: onlinePlayers,
                    settings: matchSettings
                });
                triggerRender();
            } else if (data.type === 'CLIENT_LOCKED') {
                const existing = onlinePlayers.find(op => op.connectionId === conn.peer);
                if (existing) {
                    Object.assign(existing, { username: data.username, team: data.team, drivers: data.drivers, staff: data.staff, isReady: true });
                } else {
                    onlinePlayers.push({
                        isHost: false,
                        connectionId: conn.peer,
                        username: data.username,
                        team: data.team,
                        drivers: data.drivers,
                        staff: data.staff,
                        isReady: true
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
        roomCode = code.trim();
        if (roomCode.startsWith('VELOCITY-')) roomCode = roomCode.replace('VELOCITY-', '');

        Notifications.info('Seeking Host Broker...', `Connecting to Room ${roomCode}`);
        const targetId = 'VELOCITY-' + roomCode;

        try {
            peer = new Peer();

            peer.on('open', (id) => {
                myConnection = peer.connect(targetId, { reliable: true });

                myConnection.on('open', () => {
                    Notifications.success('Master Uplink Locked!', 'Retrieving Global Staging State...');
                    setupClientConnectionListeners(myConnection);
                    myConnection.send({
                        type: 'CLIENT_CONNECTING',
                        username: myUsername
                    });
                    if (onSuccess) onSuccess();
                    triggerRender();
                });

                myConnection.on('error', (err) => {
                    Notifications.error('Connection Failed', err.message);
                    triggerRender();
                });
            });

            peer.on('error', (err) => {
                Notifications.error('Connection Error', 'Could not reach Host. Verify Room Code.');
                triggerRender();
            });
        } catch (e) {
            Notifications.error('WebRTC Error', 'Failed to initiate connection.');
        }
    }

    function setupClientConnectionListeners(conn) {
        conn.on('data', (data) => {
            if (!data || !data.type) return;

            if (data.type === 'LOBBY_UPDATE') {
                if (data.onlinePlayers) onlinePlayers = data.onlinePlayers;
                if (data.settings) matchSettings = data.settings;
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
            } else if (data.type === 'LIVE_ACTION') {
                handleRemoteLiveAction(data.payload);
            } else if (data.type === 'ERROR') {
                Notifications.error('Staging Broker Error', data.message);
                cleanup();
                triggerRender();
            }
        });

        conn.on('close', () => {
            Notifications.warning('Host Disconnected', 'The master staging room was closed.');
            cleanup();
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
        });
    }

    function lockInClient(username, teamId, driver1Id, driver2Id, staffId) {
        myUsername = username || myUsername;
        if (typeof getTeamById === 'function') myTeam = getTeamById(teamId);
        if (typeof getDriverById === 'function') {
            myDrivers = [getDriverById(driver1Id), getDriverById(driver2Id)].filter(Boolean);
        }

        if (typeof STAFF_DATA !== 'undefined') {
            myStaff = {
                techDirector: STAFF_DATA.technicalDirectors?.find(s => s.id === staffId) || STAFF_DATA.technicalDirectors?.[0],
                strategist: STAFF_DATA.chiefStrategists?.[0],
                pitCrew: STAFF_DATA.pitCrews?.[0]
            };
        }

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

        if (typeof StateManager !== 'undefined' && StateManager.randomizeGameData) {
            StateManager.randomizeGameData();
        }

        // Definitive Master Schedule generation — Forces perfect track synchronization using 100% valid universe IDs
        masterSchedule = typeof TRACKS_DATA !== 'undefined' ? [...TRACKS_DATA].map(t => t.id).sort(() => Math.random() - 0.5).slice(0, matchSettings.races || 5) : ['royal_park', 'crimson_bay', 'mountain_pass', 'ocean_drive', 'northern_lights'].slice(0, matchSettings.races || 5);
        matchStarted = true;

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
    }

    function handleRemoteStart(data) {
        Notifications.success('Host Unleashed The Season!', 'Synchronizing global championship schedule & grid...');

        if (data.synchronizedTeams && typeof TEAMS_DATA !== 'undefined') {
            TEAMS_DATA.splice(0, TEAMS_DATA.length, ...data.synchronizedTeams);
        }
        if (data.synchronizedDrivers && typeof DRIVERS_DATA !== 'undefined') {
            DRIVERS_DATA.splice(0, DRIVERS_DATA.length, ...data.synchronizedDrivers);
        }

        if (data.settings) matchSettings = data.settings;
        if (data.masterSchedule) masterSchedule = data.masterSchedule;
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

        const career = StateManager.get('career');
        if (career && career.schedule?.[0]) {
            const trackId = career.schedule[0];
            const track = typeof getTrackById === 'function' ? getTrackById(trackId) : (typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA[0] : { id: 't1', name: 'Track', laps: 57, baseLapTime: 90 });
            
            StateManager.set('race', {
                track: track,
                allTeams: career.allTeams,
                playerTeamId: career.team?.id || localTeam?.id,
                difficulty: career.difficulty || 'COMPETITIVE',
                speed: settings.speed || 2,
                strategy: { startingTire: 'MEDIUM', pitStops: 2, aggression: 5 },
                isCareerRace: true,
                isMultiplayerRace: true
            });
        }

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

    function cleanup() {
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
    function getMyTeam() { return myTeam; }
    function getMyDrivers() { return myDrivers; }
    function getMyStaff() { return myStaff; }
    function getOnlinePlayers() { return onlinePlayers; }
    function getChatMessages() { return chatMessages; }
    function getSettings() { return matchSettings; }
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
        launchDuel,
        updateSettings,
        setUICallback,
        isConnected,
        getRoomCode,
        getMyUsername,
        getMyTeam,
        getMyDrivers,
        getMyStaff,
        getOnlinePlayers,
        getChatMessages,
        getSettings,
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
        container = document.getElementById('mp-content');
        if (!container) return;
        OnlineManager.init();
        attachListeners();
    }

    function render() {
        if (!container) return;

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
        }
        attachUIListeners();
    }

    function renderMenuView() {
        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: #00FF41; text-shadow: 0 0 20px rgba(0,255,65,0.4);">GLOBAL ARENA</h1>
                        <div class="lobby-tagline">WebRTC Peer-to-Peer Multi-Client Worldwide Online Racing</div>
                    </div>
                    <div class="lobby-online-count">
                        <span class="lobby-online-dot" style="background: #00FF41; box-shadow: 0 0 10px #00FF41;"></span>
                        <span style="color: #00FF41; font-weight: 700;">FULL GRID SERVERLESS MODE (UP TO 12 PLAYERS)</span>
                    </div>
                </div>

                <div class="lobby-grid" style="margin-top: var(--space-xl);">
                    <!-- HOST CARD -->
                    <div class="create-room-panel quick-action-card" style="border: 2px solid rgba(255,215,0,0.3); display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="quick-action-icon" style="font-size: 48px; margin-bottom: 24px;">👑</div>
                            <div class="quick-action-title" style="color: var(--yellow); font-size: 22px; font-weight: 900;">HOST MASTER CHAMPIONSHIP</div>
                            <div class="quick-action-desc" style="font-size: 15px; margin-top: 12px; line-height: 1.5;">
                                Generate an instant Master Room Code. Hand-pick your Constructor Team, lock in your Drivers and Crew, configure Master Track Calendar settings, and host up to 11 human online challengers.
                            </div>
                        </div>
                        <button class="btn btn-glow" id="btn-menu-host" style="margin-top: var(--space-xl); width: 100%; border-color: var(--yellow); color: var(--yellow); font-size: 16px; font-weight: 700; padding: 16px;">
                            ⚡ CREATE MASTER LOBBY
                        </button>
                    </div>

                    <!-- JOIN CARD -->
                    <div class="room-browser-panel quick-action-card" style="border: 2px solid rgba(0,128,255,0.3); display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="quick-action-icon" style="font-size: 48px; margin-bottom: 24px;">⚔️</div>
                            <div class="quick-action-title" style="color: var(--blue); font-size: 22px; font-weight: 900;">JOIN MASTER LOBBY</div>
                            <div class="quick-action-desc" style="font-size: 15px; margin-top: 12px; line-height: 1.5;">
                                Enter an active Master Room Code. Choose your distinct Challenger Constructor Team from the exclusive dynamic pool and race head-to-head in a massive 24-car field.
                            </div>
                        </div>
                        <button class="btn btn-glow" id="btn-menu-join" style="margin-top: var(--space-xl); width: 100%; border-color: var(--blue); color: var(--blue); font-size: 16px; font-weight: 700; padding: 16px;">
                            🚀 ENTER ROOM CODE
                        </button>
                    </div>
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

                        <div class="form-group">
                            <label class="form-label">Select Pit Crew / Technical Director</label>
                            <select class="select" id="hs-staff">
                                ${STAFF_DATA?.technicalDirectors?.map(s => `<option value="${s.id}">Skill ${s.skill || 85} • ${s.name} (${s.specialty})</option>`).join('') || '<option value="s1">Elite Pit Crew</option>'}
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
        const team = OnlineManager.getMyTeam();
        const onlinePlayers = OnlineManager.getOnlinePlayers();
        const settings = OnlineManager.getSettings();

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--green);">HOST LOBBY • MASTER STAGING</h1>
                        <div class="lobby-tagline">Constructor Locked! Ready for up to 12 Human Constructors</div>
                    </div>
                    <div>
                        <span class="badge" style="background: var(--green); color: var(--black); font-family: Orbitron; font-weight: 900; padding: 8px 16px;">TEAM LOCKED 🔒</span>
                    </div>
                </div>

                <div class="lobby-grid">
                    <!-- LEFT: ONLINE CONSTRUCTORS GRID & START SEASON -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="create-room-panel" style="border-color: var(--green); background: rgba(0,255,65,0.02);">
                            <div class="panel-title" style="color: var(--green);">
                                <span class="panel-title-icon">🏎️</span>
                                <span>ONLINE CONSTRUCTORS GRID (${onlinePlayers.length}/12 JOINED)</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 6px;">
                                ${onlinePlayers.map(op => `
                                    <div class="room-player-item" style="background: rgba(0,0,0,0.6); border: 1px solid var(--green);">
                                        <div class="player-avatar" style="background: ${op.team?.color || '#111'}; color: white; font-family: Orbitron; font-weight: 900; font-size: 16px;">
                                            ${op.team?.shortName || 'V'}
                                        </div>
                                        <div class="player-name" style="font-family: Rajdhani; font-size: 16px;">
                                            <b style="color: white">${escapeHTML(op.username)}</b> • <span style="color: var(--green); font-family: Orbitron; font-size: 13px;">${escapeHTML(op.team?.name)}</span>
                                            <div style="font-size: 11px; color: var(--yellow);">Drivers: ${op.drivers?.map(d => d.name).join(' & ') || 'Elite Roster'}</div>
                                        </div>
                                        <span class="badge" style="background: var(--green); color: black; font-family: Orbitron; font-weight: 900; padding: 4px 10px; font-size: 10px;">
                                            ${op.isHost ? '👑 HOST READY' : '🏁 READY'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- MATCH CALENDAR SETTINGS (HOST EXCLUSIVES) -->
                        <div class="create-room-panel">
                            <div class="panel-title" style="color: var(--yellow);">
                                <span class="panel-title-icon">⚙️</span>
                                <span>CHAMPIONSHIP CALENDAR (HOST EXCLUSIVES)</span>
                            </div>

                            <div class="create-room-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Season Races</label>
                                        <select class="select" id="h-races-sel">
                                            <option value="1" ${settings.races === 1 ? 'selected' : ''}>1 Race (Sprint Duel)</option>
                                            <option value="3" ${settings.races === 3 ? 'selected' : ''}>3 Races (Mini Cup)</option>
                                            <option value="5" ${settings.races === 5 ? 'selected' : ''}>5 Races (Short Season)</option>
                                            <option value="10" ${settings.races === 10 ? 'selected' : ''}>10 Races (Half Season)</option>
                                            <option value="16" ${settings.races === 16 ? 'selected' : ''}>16 Races (Full Season)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">AI Grid Difficulty</label>
                                        <select class="select" id="h-diff-sel">
                                            <option value="CASUAL" ${settings.difficulty === 'CASUAL' ? 'selected' : ''}>Rookie AI</option>
                                            <option value="COMPETITIVE" ${settings.difficulty === 'COMPETITIVE' ? 'selected' : ''}>Pro AI</option>
                                            <option value="ELITE" ${settings.difficulty === 'ELITE' ? 'selected' : ''}>Legendary AI</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Simulation Pace</label>
                                        <select class="select" id="h-speed-sel">
                                            <option value="1" ${settings.speed === 1 ? 'selected' : ''}>1s/lap (Fast)</option>
                                            <option value="2" ${settings.speed === 2 ? 'selected' : ''}>2s/lap (Standard)</option>
                                            <option value="5" ${settings.speed === 5 ? 'selected' : ''}>5s/lap (Strategic)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- START SEASON BUTTON -->
                        <button class="btn btn-create-room" id="btn-execute-launch" style="padding: 20px; font-size: 18px; font-family: Orbitron; font-weight: 900; border-color: var(--green); color: var(--green); box-shadow: 0 0 30px rgba(0,255,65,0.3); cursor: pointer;">
                            ${onlinePlayers.length >= 2 ? '🚀 START GLOBAL CHAMPIONSHIP SEASON (' + onlinePlayers.length + ' JOINED)' : '🚀 START CHAMPIONSHIP SEASON (VS AI GRID)'}
                        </button>
                    </div>

                    <!-- RIGHT: ROOM CODE & LIVE CHAT -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <!-- ROOM CODE BOX -->
                        <div class="room-browser-panel" style="padding: 20px;">
                            <div class="panel-title" style="color: #00FF41; justify-content: center;">📻 MASTER ROOM CODE</div>
                            <div class="join-code-section" style="justify-content: center; background: rgba(0,255,65,0.05); border: 2px dashed #00FF41; margin-top: 4px; padding: 16px;">
                                <div class="input" style="font-size: 42px; font-weight: 900; color: #00FF41; user-select: all; cursor: pointer; border: none; background: transparent; text-shadow: 0 0 15px #00FF41;" id="display-room-code" title="Click to copy Code">
                                    ${OnlineManager.getRoomCode() || 'GENERATING...'}
                                </div>
                            </div>
                            <div style="text-align: center; font-size: 12px; color: var(--gray-400); margin-top: 8px;">Share this 4-Digit Code with challengers to invite up to 12 Constructors!</div>
                        </div>

                        <!-- LIVE CHAT -->
                        <div class="room-chat" style="flex: 1; min-height: 220px; display: flex; flex-direction: column;">
                            <div class="room-chat-header" style="background: var(--surface-2);">STAGING CHAT & EMOJIS</div>
                            <div class="room-chat-messages" id="staging-chat-messages" style="flex: 1; overflow-y: auto;">
                                ${OnlineManager.getChatMessages().map(m => `<div class="chat-message"><span class="chat-sender" style="color: ${m.color}">${m.sender}:</span><span>${escapeHTML(m.text)}</span></div>`).join('')}
                            </div>
                            <div class="room-chat-input">
                                <input type="text" class="input" style="flex: 1; padding: 12px;" id="staging-chat-input" placeholder="Send message / emojis...">
                                <button class="btn btn-glow" id="btn-staging-send-chat" style="padding: 0 20px;">💬</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinEnterCodeView() {
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
                        <input type="text" class="input" id="js-code-box" placeholder="e.g. 8492" style="font-family: Orbitron; font-size: 40px; font-weight: 900; text-align: center; letter-spacing: 12px; padding: 24px; border: 2px solid var(--blue); color: var(--blue); max-width: 350px; margin: 0 auto; box-shadow: 0 0 25px rgba(0,128,255,0.3);">
                        <div style="font-size: 13px; color: var(--gray-400); margin-top: 12px;">Ask the Host for their 4-Digit Code to establish an immediate WebRTC data uplink.</div>

                        <button class="btn btn-create-room" id="btn-execute-seek" style="margin-top: 36px; border-color: var(--blue); color: var(--blue); box-shadow: 0 0 30px rgba(0,128,255,0.3); font-family: Orbitron; font-weight: 900; font-size: 18px; padding: 20px;">
                            ⚡ SEEK HOST & CONNECT UPLINK
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinSelectPackageView() {
        const onlinePlayers = OnlineManager.getOnlinePlayers();
        const takenTeamIds = onlinePlayers.map(op => op.team?.id).filter(Boolean);
        const takenDriverIds = [];
        onlinePlayers.forEach(op => op.drivers?.forEach(d => takenDriverIds.push(d.id)));

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--blue);">JOIN MASTER STAGING • STEP 2</h1>
                        <div class="lobby-tagline">Connected to Master Broker! Select your distinct Challenger package</div>
                    </div>
                    <div>
                        <span class="badge" style="background: #00FF41; color: black; font-family: Orbitron; font-weight: 900; padding: 8px 16px;">UPLINK ACTIVE 📡</span>
                    </div>
                </div>

                <div class="create-room-panel" style="max-width: 800px; margin: 0 auto; width: 100%; border-color: var(--blue);">
                    <div class="panel-title" style="color: var(--blue);">
                        <span class="panel-title-icon">⚔️</span>
                        <span>CHALLENGER SETUP (TAKEN TEAMS & DRIVERS EXCLUDED)</span>
                    </div>

                    <div class="create-room-form">
                        <div class="form-group">
                            <label class="form-label">Your Challenger Username</label>
                            <input type="text" class="input" id="jsp-user" value="${OnlineManager.getMyUsername()}" style="font-family: Orbitron; font-weight: 700; font-size: 18px;">
                        </div>

                        <!-- Team Selection GUI (Exactly like Single Player #quick-team-select) -->
                        <div class="form-group">
                            <label class="form-label">Select Distinct Challenger Constructor Team</label>
                            <select class="select" id="jsp-team">
                                ${TEAMS_DATA.map(t => {
                                    const takenBy = onlinePlayers.find(op => op.team?.id === t.id);
                                    return `<option value="${t.id}" ${takenBy ? 'disabled' : ''}>${t.flag} ${t.name} ${takenBy ? `🛑 [TAKEN BY ${takenBy.username}]` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Select Distinct Driver 1</label>
                                <select class="select" id="jsp-driver1">
                                    ${DRIVERS_DATA.slice(0, Math.floor(DRIVERS_DATA.length/2)).map(d => {
                                        const takenBy = onlinePlayers.find(op => op.drivers?.some(od => od.id === d.id));
                                        return `<option value="${d.id}" ${takenBy ? 'disabled' : ''}>Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name} ${takenBy ? `🛑 [SIGNED BY ${takenBy.username}]` : ''}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Select Distinct Driver 2</label>
                                <select class="select" id="jsp-driver2">
                                    ${DRIVERS_DATA.slice(Math.floor(DRIVERS_DATA.length/2)).map(d => {
                                        const takenBy = onlinePlayers.find(op => op.drivers?.some(od => od.id === d.id));
                                        return `<option value="${d.id}" ${takenBy ? 'disabled' : ''}>Pace ${d.stats?.pace || 80} • ${d.flag || ''} ${d.name} ${takenBy ? `🛑 [SIGNED BY ${takenBy.username}]` : ''}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Select Pit Crew / Technical Director</label>
                            <select class="select" id="jsp-staff">
                                ${STAFF_DATA?.technicalDirectors?.map(s => `<option value="${s.id}">Skill ${s.skill || 85} • ${s.name} (${s.specialty})</option>`).join('') || '<option value="s1">Elite Pit Crew</option>'}
                            </select>
                        </div>

                        <button class="btn btn-create-room" id="btn-lock-client-final" style="margin-top: 32px; border-color: var(--blue); color: var(--blue); box-shadow: 0 0 25px rgba(0,128,255,0.3); font-family: Orbitron; font-weight: 900;">
                            🔒 LOCK IN CONSTRUCTOR & OPEN MASTER READY UPLINK
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderJoinStagingView() {
        const team = OnlineManager.getMyTeam();
        const onlinePlayers = OnlineManager.getOnlinePlayers();
        const settings = OnlineManager.getSettings();
        const hostName = OnlineManager.getHostUsername();

        container.innerHTML = `
            <div class="lobby-container">
                <button class="home-btn" id="mp-home-btn" title="Back to Home">⌂</button>

                <div class="lobby-header">
                    <div>
                        <h1 class="lobby-title" style="color: var(--blue);">JOIN LOBBY • MASTER STAGING</h1>
                        <div class="lobby-tagline">Constructor Locked! Waiting for Host to Launch The Global Season</div>
                    </div>
                    <div>
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
                                    <div class="room-player-item" style="background: rgba(0,0,0,0.6); border: 1px solid ${op.username === OnlineManager.getMyUsername() ? 'var(--blue)' : 'var(--green)'};">
                                        <div class="player-avatar" style="background: ${op.team?.color || '#111'}; color: white; font-family: Orbitron; font-weight: 900; font-size: 16px;">
                                            ${op.team?.shortName || 'V'}
                                        </div>
                                        <div class="player-name" style="font-family: Rajdhani; font-size: 16px;">
                                            <b style="color: white">${escapeHTML(op.username)}</b> ${op.username === OnlineManager.getMyUsername() ? '<span style="color:var(--blue)">(You)</span>' : ''} • <span style="color: var(--green); font-family: Orbitron; font-size: 13px;">${escapeHTML(op.team?.name)}</span>
                                            <div style="font-size: 11px; color: var(--yellow);">Drivers: ${op.drivers?.map(d => d.name).join(' & ') || 'Elite Roster'}</div>
                                        </div>
                                        <span class="badge" style="background: var(--green); color: black; font-family: Orbitron; font-weight: 900; padding: 4px 10px; font-size: 10px;">
                                            ${op.isHost ? '👑 HOST READY' : '🏁 READY'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- MATCH STATUS & HOST SETTINGS -->
                        <div class="room-browser-panel" style="padding: 20px; border-color: var(--green); background: rgba(0,255,65,0.05);">
                            <div class="panel-title" style="color: var(--green);">
                                <span class="panel-title-icon">👑</span>
                                <span>HOST SETTINGS (${escapeHTML(hostName)})</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; background: rgba(0,0,0,0.5); padding: 12px; border-radius: var(--radius-md); font-size: 14px; text-align: center;">
                                <div style="color: var(--yellow)"><b>${settings.races}</b> Races</div>
                                <div style="color: var(--yellow)"><b>${settings.difficulty}</b> AI</div>
                                <div style="color: var(--yellow)"><b>${settings.speed}s</b> / lap</div>
                            </div>
                        </div>

                        <!-- MATCH STATUS HINT -->
                        <div style="padding: 20px; background: rgba(0,255,65,0.1); border: 1px solid var(--green); border-radius: var(--radius-md); color: var(--green); font-family: Rajdhani; font-size: 15px; font-weight: 700; text-align: center; line-height: 1.5; box-shadow: 0 0 20px rgba(0,255,65,0.2);">
                            🏁 Distinct Constructor package locked successfully! Connected to Master Lobby. Waiting for Host to launch the season...
                        </div>
                    </div>

                    <!-- RIGHT: LIVE CHAT -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="room-chat" style="flex: 1; min-height: 250px; display: flex; flex-direction: column;">
                            <div class="room-chat-header" style="background: var(--surface-2);">STAGING CHAT & EMOJIS</div>
                            <div class="room-chat-messages" id="staging-chat-messages" style="flex: 1; overflow-y: auto;">
                                ${OnlineManager.getChatMessages().map(m => `<div class="chat-message"><span class="chat-sender" style="color: ${m.color}">${m.sender}:</span><span>${escapeHTML(m.text)}</span></div>`).join('')}
                            </div>
                            <div class="room-chat-input">
                                <input type="text" class="input" style="flex: 1; padding: 12px;" id="staging-chat-input" placeholder="Send message / emojis...">
                                <button class="btn btn-glow" id="btn-staging-send-chat" style="padding: 0 20px;">💬</button>
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
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
        });

        container.querySelector('#btn-back-menu')?.addEventListener('click', () => {
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
            const staff = container.querySelector('#hs-staff')?.value;
            if (d1 === d2) {
                Notifications.error('Please select two distinct drivers.');
                return;
            }
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
            const staff = container.querySelector('#jsp-staff')?.value;

            if (d1 === d2) {
                Notifications.error('Please select two distinct drivers.');
                return;
            }

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
        container.querySelector('#display-room-code')?.addEventListener('click', () => {
            navigator.clipboard?.writeText(OnlineManager.getRoomCode());
            Notifications.success('Room Code copied to clipboard!');
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

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function destroy() {
        isActive = false;
    }

    return { init, render, destroy };
})();