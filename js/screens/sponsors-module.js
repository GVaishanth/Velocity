/* ============================================
   VELOCITY — SPONSORS MODULE
   Sponsors UI extracted from dashboard ownership
   ============================================ */

window.SponsorsModule = (() => {
    function showSponsorsStudioModal() {
        const career = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
        if (!career || typeof SponsorService === 'undefined') return;
        SponsorService.ensureSponsors(career);

        Modals.open({
            title: `🤝 SPONSORS & PARTNERSHIPS — REPUTATION ${Math.round(career.teamReputation || 50)}`,
            className: 'modal-xl',
            body: `
                <div style="display:flex;flex-direction:column;gap:18px;font-family:Rajdhani;">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                        <div class="info-card"><b>Main Sponsor</b><br>${escapeHTML(career.activeSponsor?.name || 'None')}</div>
                        <div class="info-card"><b>Season Income</b><br>$${formatMoney(career.sponsorIncomeThisSeason || 0)}</div>
                        <div class="info-card"><b>Active Deals</b><br>${career.sponsorContracts?.length || 0}</div>
                        <div class="info-card"><b>Offers</b><br>${career.sponsorOffers?.length || 0}</div>
                    </div>

                    <div>
                        <h3 style="font-family:Orbitron;color:#FFD700;font-size:13px;">ACTIVE CONTRACTS</h3>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                            ${(career.sponsorContracts || []).map(sp => `
                                <div style="background:var(--surface-1);border:1px solid rgba(255,215,0,.35);border-radius:12px;padding:14px;">
                                    <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-family:Orbitron;color:white;">${escapeHTML(sp.name)}</b><span style="color:#FFD700;font-family:Orbitron;">${sp.type}</span></div>
                                    <div style="font-size:12px;color:var(--gray-300);margin-top:6px;">${sp.contractLength} years left • Risk ${sp.riskLevel} • Req Rep ${sp.reputationRequirement}</div>
                                    <div style="font-size:12px;color:#00FF41;">Base $${formatMoney(sp.basePayment)} • Race Bonus $${formatMoney(sp.raceBonus)} • Championship $${formatMoney(sp.championshipBonus)}</div>
                                    <div style="font-size:12px;color:#FFD700;">Goal: ${escapeHTML(sp.objective?.label || sp.objective?.type || 'Objective')}</div>
                                    <div style="margin-top:8px;display:flex;gap:6px;">
                                        <button class="btn btn-glow sponsor-renew" data-id="${sp.id}" style="font-size:9px;">RENEW</button>
                                        <button class="btn btn-danger sponsor-terminate" data-id="${sp.id}" style="font-size:9px;">TERMINATE</button>
                                    </div>
                                </div>
                            `).join('') || '<div style="color:var(--gray-500);">No active sponsors.</div>'}
                        </div>
                    </div>

                    <div>
                        <h3 style="font-family:Orbitron;color:#00BFFF;font-size:13px;">AVAILABLE OFFERS</h3>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                            ${(career.sponsorOffers || []).map(sp => {
                                const can = SponsorService.canSign(career, sp);
                                return `
                                    <div style="background:linear-gradient(135deg,rgba(20,20,30,.9),rgba(8,8,14,.95));border:1px solid ${can.ok ? '#0080FF' : '#555'};border-radius:12px;padding:14px;${can.ok ? '' : 'opacity:.6;'}">
                                        <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-family:Orbitron;color:white;">${escapeHTML(sp.name)}</b><span style="color:#FFD700;font-family:Orbitron;">${sp.type}</span></div>
                                        <div style="font-size:12px;color:var(--gray-300);margin-top:6px;">${sp.contractLength} years • Risk ${sp.riskLevel} • Rep Required ${sp.reputationRequirement}</div>
                                        <div style="font-size:12px;color:#00FF41;">Upfront $${formatMoney(sp.upfrontPayment)} • Base $${formatMoney(sp.basePayment)} • Race $${formatMoney(sp.raceBonus)}</div>
                                        <div style="font-size:12px;color:#FFD700;">Goal: ${escapeHTML(sp.objective?.label || sp.objective?.type)}</div>
                                        <div style="margin-top:8px;display:flex;gap:6px;">
                                            <button class="btn btn-glow sponsor-accept" data-id="${sp.id}" ${can.ok ? '' : 'disabled'} style="font-size:9px;">ACCEPT</button>
                                            <button class="btn sponsor-counter" data-id="${sp.id}" ${can.ok ? '' : 'disabled'} style="font-size:9px;">COUNTER +15%</button>
                                            <button class="btn btn-danger sponsor-reject" data-id="${sp.id}" style="font-size:9px;">REJECT</button>
                                        </div>
                                        ${can.ok ? '' : `<div style="font-size:11px;color:var(--red);margin-top:6px;">${escapeHTML(can.reason)}</div>`}
                                    </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `,
            actions: [{ label: 'RETURN TO DASHBOARD', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.sponsor-accept').forEach(btn => btn.addEventListener('click', () => {
                    const res = SponsorService.acceptOffer(career, btn.dataset.id);
                    if (!res.ok) { Notifications.error('Sponsor Rejected', res.reason); return; }
                    StateManager.set('career', career); StateManager.saveGame?.();
                    if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('SPONSOR_SYNC', { career });
                    Notifications.success('Sponsor Signed', `${res.sponsor.name} pays $${formatMoney(res.upfrontPayment)} upfront.`);
                    Modals.close(); if (window.DashboardScreen?.render) window.DashboardScreen.render();
                }));
                document.querySelectorAll('.sponsor-reject').forEach(btn => btn.addEventListener('click', () => { SponsorService.rejectOffer(career, btn.dataset.id); StateManager.set('career', career); StateManager.saveGame?.(); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-counter').forEach(btn => btn.addEventListener('click', () => { const r = SponsorService.counterOffer(career, btn.dataset.id, 1.15); StateManager.set('career', career); StateManager.saveGame?.(); Notifications.info('Counter Offer', r.accepted ? 'Sponsor accepted improved terms.' : 'Sponsor walked away.'); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-terminate').forEach(btn => btn.addEventListener('click', () => { const r = SponsorService.terminateContract(career, btn.dataset.id); if (!r.ok) return; StateManager.set('career', career); StateManager.saveGame?.(); Notifications.warning('Sponsor Terminated', `Penalty $${formatMoney(r.penalty)} paid.`); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-renew').forEach(btn => btn.addEventListener('click', () => { const sp = career.sponsorContracts.find(s => s.id === btn.dataset.id); if (sp) { sp.contractLength += 1; sp.basePayment = Math.round(sp.basePayment * 1.05); StateManager.set('career', career); StateManager.saveGame?.(); Notifications.success('Sponsor Renewed', `${sp.name} extended by 1 year.`); Modals.close(); showSponsorsStudioModal(); } }));
            }
        });
    }


    function formatMoney(n) {
        if (typeof n !== 'number') return '0';
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return n.toString();
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { open: showSponsorsStudioModal };
})();
