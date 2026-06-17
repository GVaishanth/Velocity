/* ============================================
   VELOCITY — NOTIFICATIONS
   Toast notification system with priority queue
   Auto-dismissing alerts for game events
   ============================================ */

window.Notifications = (() => {

    let container = null;
    const MAX_VISIBLE = 5;
    const DEFAULT_DURATION = 3000;
    let notificationCounter = 0;

    /**
     * Initialize the notification system
     */
    function init() {
        container = document.getElementById('notification-area');
        if (!container) {
            console.warn('[Notifications] notification-area element not found');
            return;
        }

        attachListeners();
    }

    /**
     * Attach event listeners
     */
    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('ui:notify', show);

        // Achievement unlocks
        EventBus.on('achievement:unlocked', (achievement) => {
            show({
                message: `Achievement Unlocked: ${achievement.name}`,
                description: achievement.description,
                type: 'achievement',
                duration: 5000,
                icon: achievement.icon
            });
        });

        // Race events
        EventBus.on('race:fastest_lap', (event) => {
            const car = RaceEngine.getCar(event.carId);
            if (car && car.isPlayer) {
                show({
                    message: 'Fastest Lap!',
                    description: `${car.driver.name} - ${formatLapTime(event.time)}`,
                    type: 'success',
                    duration: 3500
                });
            }
        });

        EventBus.on('race:victory', (car) => {
            show({
                message: 'VICTORY!',
                description: `${car.driver.name} wins the race!`,
                type: 'success',
                duration: 6000,
                icon: '🏆'
            });
        });
    }

    /**
     * Show a notification
     * @param {Object} options
     *   message: string (required)
     *   description: string (optional)
     *   type: 'info'|'success'|'warning'|'error'|'achievement'
     *   duration: ms
     *   icon: emoji string
     */
    function show(options) {
        if (!container) return null;
        if (!options || !options.message) return null;

        const config = {
            message: options.message,
            description: options.description || '',
            type: options.type || 'info',
            duration: options.duration || DEFAULT_DURATION,
            icon: options.icon || getDefaultIcon(options.type)
        };

        // Trim if too many visible
        while (container.children.length >= MAX_VISIBLE) {
            container.removeChild(container.firstChild);
        }

        const id = `notif-${++notificationCounter}`;
        const notif = buildNotification(id, config);
        container.appendChild(notif);

        // Auto-remove after duration
        if (config.duration > 0) {
            setTimeout(() => dismiss(id), config.duration);
        }

        // Play sound
        playNotificationSound(config.type);

        return id;
    }

    /**
     * Build notification DOM element
     */
    function buildNotification(id, config) {
        const notif = document.createElement('div');
        notif.className = `notification ${config.type}`;
        notif.id = id;

        notif.innerHTML = `
            ${config.icon ? `<span class="notification-icon">${config.icon}</span>` : ''}
            <div class="notification-content">
                <div class="notification-message">${escapeHTML(config.message)}</div>
                ${config.description ? `<div class="notification-description">${escapeHTML(config.description)}</div>` : ''}
            </div>
            <button class="notification-close" aria-label="Close">×</button>
        `;

        // Close button
        notif.querySelector('.notification-close')?.addEventListener('click', () => {
            dismiss(id);
        });

        return notif;
    }

    /**
     * Dismiss a specific notification
     */
    function dismiss(id) {
        const notif = document.getElementById(id);
        if (!notif) return;

        notif.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        }, 400);
    }

    /**
     * Clear all notifications
     */
    function clear() {
        if (!container) return;
        container.innerHTML = '';
    }

    /**
     * Get default icon for notification type
     */
    function getDefaultIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✓',
            warning: '⚠️',
            error: '✗',
            achievement: '🏆'
        };
        return icons[type] || '';
    }

    /**
     * Play sound for notification type
     */
    function playNotificationSound(type) {
        if (typeof AudioManager === 'undefined') return;
        switch (type) {
            case 'success':
                AudioManager.uiConfirm();
                break;
            case 'error':
                AudioManager.uiError();
                break;
            case 'achievement':
                AudioManager.achievementUnlock();
                break;
            default:
                AudioManager.uiNotify();
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Convenience methods
     */
    function info(message, description) {
        return show({ message, description, type: 'info' });
    }

    function success(message, description) {
        return show({ message, description, type: 'success' });
    }

    function warning(message, description) {
        return show({ message, description, type: 'warning' });
    }

    function error(message, description) {
        return show({ message, description, type: 'error' });
    }

    function achievement(message, description) {
        return show({
            message,
            description,
            type: 'achievement',
            duration: 5000
        });
    }

    return {
        init,
        show,
        dismiss,
        clear,
        info,
        success,
        warning,
        error,
        achievement
    };
})();