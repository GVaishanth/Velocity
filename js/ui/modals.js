/* ============================================
   VELOCITY — MODALS
   Modal dialog system for confirmations,
   alerts, custom content
   ============================================ */

window.Modals = (() => {

    let overlay = null;
    let modalBox = null;
    let headerEl = null;
    let bodyEl = null;
    let footerEl = null;

    let currentModal = null;
    let modalStack = [];

    /**
     * Initialize the modal system
     */
    function init() {
        overlay = document.getElementById('modal-overlay');
        modalBox = document.getElementById('modal-box');
        headerEl = document.getElementById('modal-header');
        bodyEl = document.getElementById('modal-body');
        footerEl = document.getElementById('modal-footer');

        if (!overlay) {
            console.warn('[Modals] modal-overlay element not found');
            return;
        }

        // Close on overlay click (if dismissible)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && currentModal?.dismissible !== false) {
                close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen() && currentModal?.dismissible !== false) {
                close();
            }
        });

        // Listen for events
        if (typeof EventBus !== 'undefined') {
            EventBus.on('ui:modal_open', open);
            EventBus.on('ui:modal_close', close);
        }
    }

    /**
     * Open a modal
     * @param {Object} options
     *   title: string
     *   body: string (HTML)
     *   actions: Array of { label, onClick, type, dismiss }
     *   dismissible: boolean
     *   onOpen, onClose: callbacks
     */
    function open(options) {
        if (!overlay) return;

        const config = {
            title: options.title || '',
            body: options.body || '',
            actions: options.actions || [],
            dismissible: options.dismissible !== false,
            onOpen: options.onOpen,
            onClose: options.onClose,
            className: options.className || ''
        };

        // Stack support with strict deduplication parity
        if (currentModal && currentModal.title !== config.title) {
            modalStack.push(currentModal);
        }
        currentModal = config;

        // Set content
        if (headerEl) headerEl.innerHTML = config.title;
        if (bodyEl) bodyEl.innerHTML = config.body;
        renderActions(config.actions);

        modalBox.className = config.className || '';

        // Show
        overlay.classList.remove('hidden');
        overlay.classList.add('fade-in');

        // Sound
        if (typeof AudioManager !== 'undefined') AudioManager.uiNotify();

        // Callback
        if (config.onOpen) config.onOpen();
    }

    /**
     * Render action buttons in footer
     */
    function renderActions(actions) {
        if (!footerEl) return;

        if (actions.length === 0) {
            footerEl.innerHTML = '';
            footerEl.style.display = 'none';
            return;
        }

        footerEl.style.display = 'flex';
        footerEl.innerHTML = '';

        actions.forEach((action, idx) => {
            const btn = document.createElement('button');
            btn.className = `btn ${action.type ? 'btn-' + action.type : ''}`;
            btn.textContent = action.label;

            btn.addEventListener('click', () => {
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick();

                if (action.onClick) {
                    const result = action.onClick();
                    if (result === false) return; // prevent close
                }

                if (action.dismiss !== false) {
                    close();
                }
            });

            footerEl.appendChild(btn);
        });
    }

    /**
     * Close the current modal
     */
    function close() {
        if (!overlay || !currentModal) return;

        const closingModal = currentModal;

        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('fade-in', 'fade-out');

            // Restore stacked modal
            if (modalStack.length > 0) {
                currentModal = modalStack.pop();
                if (headerEl) headerEl.innerHTML = currentModal.title;
                if (bodyEl) bodyEl.innerHTML = currentModal.body;
                modalBox.className = currentModal.className || '';
                renderActions(currentModal.actions);
                overlay.classList.remove('hidden');
            } else {
                currentModal = null;
                modalBox.className = '';
            }
        }, 300);

        if (closingModal.onClose) closingModal.onClose();
    }

    /**
     * Check if modal is open
     */
    function isOpen() {
        return overlay && !overlay.classList.contains('hidden');
    }

    /**
     * Show confirmation modal
     */
    function confirm(options) {
        return new Promise((resolve) => {
            open({
                title: options.title || 'Confirm',
                body: `<div class="modal-confirm-body">${options.body || 'Are you sure?'}</div>`,
                dismissible: options.dismissible !== false,
                actions: [
                    {
                        label: options.cancelText || 'Cancel',
                        type: 'secondary',
                        onClick: () => {
                            if (options.onCancel) options.onCancel();
                            resolve(false);
                        }
                    },
                    {
                        label: options.confirmText || 'Confirm',
                        type: options.confirmType || 'primary',
                        onClick: () => {
                            if (options.onConfirm) options.onConfirm();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    /**
     * Show alert modal
     */
    function alert(options) {
        return new Promise((resolve) => {
            const config = typeof options === 'string' ? { body: options } : options;
            open({
                title: config.title || 'Notice',
                body: `<div class="modal-alert-body">${config.body || ''}</div>`,
                actions: [
                    {
                        label: config.okText || 'OK',
                        type: 'primary',
                        onClick: () => resolve(true)
                    }
                ]
            });
        });
    }

    /**
     * Show prompt modal (text input)
     */
    function prompt(options) {
        return new Promise((resolve) => {
            const inputId = `prompt-input-${Date.now()}`;
            const body = `
                <div class="modal-prompt-body">
                    ${options.body ? `<p>${options.body}</p>` : ''}
                    <input type="text" class="input" id="${inputId}"
                           value="${options.defaultValue || ''}"
                           placeholder="${options.placeholder || ''}">
                </div>
            `;

            open({
                title: options.title || 'Input',
                body: body,
                actions: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        onClick: () => resolve(null)
                    },
                    {
                        label: 'OK',
                        type: 'primary',
                        onClick: () => {
                            const input = document.getElementById(inputId);
                            resolve(input?.value || '');
                        }
                    }
                ],
                onOpen: () => {
                    setTimeout(() => {
                        const input = document.getElementById(inputId);
                        if (input) input.focus();
                    }, 100);
                }
            });
        });
    }

    /**
     * Show custom modal with raw HTML
     */
    function show(title, html, actions = []) {
        open({ title, body: html, actions });
    }

    return {
        init,
        open,
        close,
        isOpen,
        confirm,
        alert,
        prompt,
        show
    };
})();