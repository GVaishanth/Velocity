/* ============================================
   VELOCITY — GLOBAL ERROR BOUNDARY
   Prevents black screens / silent failures
   Provides recovery UI + diagnostics
   ============================================ */

window.ErrorBoundary = (() => {
    let errorCount = 0;
    let lastError = null;

    function init() {
        // Global uncaught errors
        window.addEventListener('error', (event) => {
            handleError(event.error || new Error(event.message), 'window.onerror', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            handleError(event.reason || new Error('Unhandled promise rejection'), 'unhandledrejection');
        });

        // Wrap critical global functions if possible
        wrapCriticalFunctions();

        console.log('[ErrorBoundary] Global error protection active');
    }

    function wrapCriticalFunctions() {
        // Wrap EventBus.emit to catch navigation/render errors
        if (typeof EventBus !== 'undefined' && EventBus.emit) {
            const originalEmit = EventBus.emit;
            EventBus.emit = function(event, data) {
                try {
                    return originalEmit.apply(this, arguments);
                } catch (err) {
                    handleError(err, `EventBus.emit(${event})`, { data });
                    return false;
                }
            };
        }
    }

    function handleError(error, source = 'unknown', context = {}) {
        errorCount++;
        lastError = {
            error: error,
            source,
            context,
            timestamp: Date.now(),
            stack: error?.stack || 'No stack'
        };

        console.error(`[ErrorBoundary] CRITICAL ERROR #${errorCount} from ${source}:`, error, context);

        // Attempt recovery UI immediately
        showErrorRecoveryUI(error, source, context);

        // Notify user
        if (typeof Notifications !== 'undefined') {
            try {
                Notifications.error('Something went wrong', 'The game encountered an error. See recovery options.');
            } catch (e) {}
        }
    }

    function showErrorRecoveryUI(error, source, context) {
        // Remove any loading overlay if stuck
        const loading = document.getElementById('loading-screen');
        if (loading) loading.style.display = 'none';

        // Find or create error container (overlay)
        let container = document.getElementById('global-error-boundary');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-error-boundary';
            container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.95); z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Rajdhani', sans-serif; color: #fff;
            `;
            document.body.appendChild(container);
        }

        const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127');
        const errorMsg = error?.message || 'Unknown error';
        const stackPreview = (error?.stack || '').split('\n').slice(0, 6).join('\n');

        container.innerHTML = `
            <div style="max-width: 620px; width: 92%; background: #111; border: 2px solid #FF0033; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 0 60px rgba(255,0,51,0.3);">
                <div style="font-size: 64px; margin-bottom: 12px;">⚠️</div>
                <h1 style="font-family: 'Orbitron', sans-serif; color: #FF0033; margin: 0 0 8px; font-size: 28px; letter-spacing: 2px;">SOMETHING WENT WRONG</h1>
                <p style="color: #aaa; margin-bottom: 24px; font-size: 15px;">The game encountered a critical error and could not continue rendering.</p>

                <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 24px; font-size: 13px; font-family: monospace; color: #ffcc00; white-space: pre-wrap; max-height: 140px; overflow: auto;">
                    ${escapeHTML(errorMsg)}
                    ${isDev ? `\n\nSource: ${source}\n\n${escapeHTML(stackPreview)}` : ''}
                </div>

                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button id="eb-retry" class="btn btn-glow" style="padding: 14px 32px; font-family: Orbitron; font-weight: 700; background: #00FF41; color: #000; border: none; border-radius: 8px;">TRY AGAIN</button>
                    
                    <button id="eb-home" class="btn" style="padding: 14px 32px; font-family: Orbitron; font-weight: 700;">RETURN TO MENU</button>
                    
                    <button id="eb-reset" class="btn btn-danger" style="padding: 14px 24px;">RESET GAME STATE</button>
                </div>

                ${isDev ? `
                <div style="margin-top: 20px; font-size: 11px; color: #666; text-align: left;">
                    <strong>Diagnostics:</strong><br>
                    Source: ${escapeHTML(source)}<br>
                    Time: ${new Date().toISOString()}<br>
                    Error count: ${errorCount}<br>
                    Last context: ${JSON.stringify(context, null, 0).slice(0, 120)}
                </div>` : ''}
            </div>
        `;

        // Attach recovery buttons
        setTimeout(() => {
            const retryBtn = document.getElementById('eb-retry');
            const homeBtn = document.getElementById('eb-home');
            const resetBtn = document.getElementById('eb-reset');

            if (retryBtn) {
                retryBtn.onclick = () => {
                    container.remove();
                    // Try to recover current flow
                    try {
                        const current = (typeof GameEngine !== 'undefined') ? GameEngine.getCurrentScreen() : 'home';
                        if (current && current !== 'home') {
                            if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: current });
                        } else {
                            location.reload();
                        }
                    } catch (e) {
                        location.reload();
                    }
                };
            }

            if (homeBtn) {
                homeBtn.onclick = () => {
                    container.remove();
                    try {
                        if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
                        else location.reload();
                    } catch (e) { location.reload(); }
                };
            }

            if (resetBtn) {
                resetBtn.onclick = () => {
                    container.remove();
                    try {
                        if (typeof StateManager !== 'undefined') {
                            StateManager.reset?.();
                            if (typeof SaveSystem !== 'undefined') SaveSystem.remove?.('gamestate');
                        }
                        location.reload();
                    } catch (e) { location.reload(); }
                };
            }
        }, 50);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getLastError() {
        return lastError;
    }

    function clear() {
        const el = document.getElementById('global-error-boundary');
        if (el) el.remove();
    }

    return {
        init,
        handleError,
        showErrorRecoveryUI,
        getLastError,
        clear
    };
})();