/* ============================================
   VELOCITY — APPLICATION STARTUP VALIDATOR
   Verifies critical data and systems before user interaction
   Prevents silent black-screen failures
   ============================================ */

window.StartupValidator = (() => {
    const results = {
        tracks: false,
        drivers: false,
        teams: false,
        staff: false,
        state: false,
        save: false,
        screens: false,
        apis: false,
        errors: []
    };

    function run() {
        console.log('%c[StartupValidator] Running application health check...', 'color:#888');
        results.errors = [];
        results.apis = false;

        // 1. Data
        try {
            results.tracks = typeof TRACKS_DATA !== 'undefined' && TRACKS_DATA.length > 0;
            if (!results.tracks) throw new Error('TRACKS_DATA missing or empty');
            console.log(`  ✓ Tracks: ${TRACKS_DATA.length}`);
        } catch (e) { results.errors.push('Tracks: ' + e.message); }

        try {
            results.drivers = typeof DRIVERS_DATA !== 'undefined' && DRIVERS_DATA.length > 0;
            if (!results.drivers) throw new Error('DRIVERS_DATA missing or empty');
            console.log(`  ✓ Drivers: ${DRIVERS_DATA.length}`);
        } catch (e) { results.errors.push('Drivers: ' + e.message); }

        try {
            results.teams = typeof TEAMS_DATA !== 'undefined' && TEAMS_DATA.length > 0;
            if (!results.teams) throw new Error('TEAMS_DATA missing or empty');
            console.log(`  ✓ Teams: ${TEAMS_DATA.length}`);
        } catch (e) { results.errors.push('Teams: ' + e.message); }

        try {
            results.staff = typeof STAFF_DATA !== 'undefined' && 
                           STAFF_DATA.technicalDirectors && STAFF_DATA.technicalDirectors.length > 0;
            if (!results.staff) throw new Error('STAFF_DATA missing');
            console.log(`  ✓ Staff loaded`);
        } catch (e) { results.errors.push('Staff: ' + e.message); }

        // 2. Core
        try {
            results.state = typeof StateManager !== 'undefined' && typeof StateManager.get === 'function';
            if (!results.state) throw new Error('StateManager not available');
            console.log('  ✓ StateManager');
        } catch (e) { results.errors.push('State: ' + e.message); }

        try {
            results.save = typeof SaveSystem !== 'undefined' && typeof SaveSystem.load === 'function';
            if (!results.save) throw new Error('SaveSystem not available');
            ['loadBackup', 'autoSave', 'validateAndRepairSaveData', 'validateAndRepairRace'].forEach(method => {
                if (typeof SaveSystem[method] !== 'function') throw new Error(`SaveSystem.${method} missing`);
            });
            if (typeof StorageCleanupService === 'undefined' || typeof StorageCleanupService.getStorageReport !== 'function') {
                throw new Error('StorageCleanupService missing');
            }
            console.log('  ✓ SaveSystem');
        } catch (e) { results.errors.push('Save: ' + e.message); }

        // 3. Screens (basic presence)
        const screens = [
            'SinglePlayerScreen', 'TeamSetupScreen', 'DashboardScreen',
            'RaceWeekendScreen', 'RaceScreen', 'ResultsScreen'
        ];
        results.screens = true;
        screens.forEach(name => {
            if (typeof window[name] === 'undefined' || typeof window[name].init !== 'function') {
                results.screens = false;
                results.errors.push(`Screen ${name} not properly loaded`);
            }
        });
        if (results.screens) console.log('  ✓ Core screens registered');

        // 4. Helpers
        if (typeof getTeamById !== 'function' || typeof getDriverById !== 'function' || typeof getTrackById !== 'function') {
            results.errors.push('Missing data helper functions (get*ById)');
        } else {
            console.log('  ✓ Data helpers present');
        }

        try {
            if (typeof StateManager === 'undefined' || typeof StateManager.captureLiveRaceState !== 'function') {
                results.errors.push('StateManager.captureLiveRaceState() missing');
            }
        } catch(e) { results.errors.push('StateManager live race capture validation failed'); }

        // 5. Public runtime API contracts used across screens/systems
        validatePublicApis();

        // Report
        const failed = results.errors.length;
        if (failed > 0) {
            console.error(`[StartupValidator] ${failed} issues detected:`, results.errors);
            if (typeof Notifications !== 'undefined') {
                Notifications.warning('Game startup issues', `${failed} systems had problems. Check console.`);
            }
        } else {
            console.log('%c[StartupValidator] All critical systems healthy ✓', 'color:#00FF41');
        }

        return results;
    }

    function validatePublicApis() {
        const contracts = {
            StateManager: [
                'getState', 'get', 'set', 'update', 'initCareer', 'generateAllTeams', 'saveGame',
                'captureLiveRaceState', 'loadFromSave', 'loadMultiplayerSave', 'loadProfile', 'saveProfile'
            ],
            RaceEngine: [
                'initRace', 'start', 'update', 'finishRace', 'skipToEnd',
                'getState', 'getSerializableState', 'restoreRace', 'getPositionDebugData', 'getCars', 'getCar', 'getPlayerCars', 'getLocalPlayerCars',
                'setDriverMode', 'playerPitCall', 'activateOvertakeBoost',
                'setSpeed', 'getSpeed', 'pause', 'resume', 'togglePause',
                'isCurrentlyPaused', 'destroy'
            ],
            OnlineManager: [
                'init', 'createRoom', 'connectAndReceiveHostLocked',
                'lockInHost', 'lockInClient', 'cleanup', 'triggerReady',
                'toggleWeekendReady', 'broadcastAction', 'sendLiveAction', 'sendChat',
                'launchDuel', 'updateSettings', 'persistSession', 'getSettings', 'isHost',
                'getOnlinePlayers', 'getMyUsername', 'getMyConnectionId',
                'handleSkipVoteConfirm', 'setUICallback'
            ],
            CalendarService: [
                'createCalendar', 'validateCalendar', 'validateCareerCalendar',
                'createNextSeasonCalendar', 'generateNextSeason', 'ensureCareerCalendar',
                'applyCalendar', 'saveCalendar', 'loadCalendar', 'advanceRound',
                'getCareerCalendar', 'getNextRace', 'isSeasonComplete', 'normalizeTrackIds', 'getTrack'
            ],
            DriverDevelopmentService: [
                'ensureDriverDevelopment', 'developDriver', 'processSeasonEnd',
                'generateRookie', 'updateRetirementRisk', 'retireDriver'
            ],
            ContractService: [
                'ensureCareerContracts', 'processSeasonEnd', 'renewDriver', 'renewStaff',
                'releaseDriver', 'withDriverContract', 'withStaffContract', 'annualPersonnelCost'
            ],
            AcademyService: [
                'generateYouthDriver', 'ensureCareerAcademies', 'scoutRegion', 'signProspect',
                'processSeasonEnd', 'promoteToReserve', 'promoteToMainTeam', 'releaseAcademyDriver'
            ],
            FacilityService: [
                'ensureCareerFacilities', 'requestUpgrade', 'processConstruction', 'processAI',
                'processSeasonEnd', 'calculateBenefits', 'upgradeCost', 'upgradeWeeks', 'maintenanceCost'
            ],
            SponsorService: [
                'ensureSponsors', 'createOffer', 'acceptOffer', 'rejectOffer', 'counterOffer',
                'terminateContract', 'evaluateRace', 'updateReputation', 'processSeasonEnd', 'processAI'
            ],
            RaceInitializer: [
                'initializeRace', 'initializeCareerRace',
                'validateRaceConfig', 'validateGrid', 'validateTeams', 'generateGrid'
            ]
        };

        results.apis = true;
        Object.entries(contracts).forEach(([globalName, methods]) => {
            const api = window[globalName];
            if (!api) {
                results.apis = false;
                results.errors.push(`Public API ${globalName} missing`);
                return;
            }
            methods.forEach(method => {
                if (typeof api[method] !== 'function') {
                    results.apis = false;
                    results.errors.push(`Public API ${globalName}.${method}() missing`);
                }
            });
        });

        if (results.apis) console.log('  ✓ Runtime public API contracts');
    }

    function isHealthy() {
        return results.errors.length === 0 && results.tracks && results.drivers && results.teams && results.apis;
    }

    function getReport() {
        return { ...results };
    }

    return { run, isHealthy, getReport };
})();