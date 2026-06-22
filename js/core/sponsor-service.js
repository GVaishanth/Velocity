/* ============================================
   VELOCITY — SPONSOR / PARTNERSHIP SERVICE
   Dynamic sponsor offers, objectives, reputation, AI sponsor logic
   ============================================ */

window.SponsorService = (() => {
    const TYPES = ['TITLE', 'TECHNICAL_PARTNER', 'OFFICIAL_SUPPLIER', 'MINOR', 'LOCAL'];
    const SPONSOR_POOL = [
        { name: 'Apex Global', type: 'TITLE', rep: 82, risk: 'HIGH', base: 9000000 },
        { name: 'AWS Subspace Matrix', type: 'TECHNICAL_PARTNER', rep: 76, risk: 'MEDIUM', base: 5500000 },
        { name: 'Petronas Synthetic Core', type: 'TITLE', rep: 86, risk: 'HIGH', base: 10500000 },
        { name: 'Monster Energy Slingshot', type: 'MINOR', rep: 68, risk: 'MEDIUM', base: 3500000 },
        { name: 'Red Bull Esport Transcendent', type: 'TITLE', rep: 90, risk: 'HIGH', base: 12500000 },
        { name: 'Pirelli Quantum Supply', type: 'OFFICIAL_SUPPLIER', rep: 65, risk: 'LOW', base: 2500000 },
        { name: 'NexTech Aero Systems', type: 'TECHNICAL_PARTNER', rep: 72, risk: 'MEDIUM', base: 4500000 },
        { name: 'VoltEdge Batteries', type: 'OFFICIAL_SUPPLIER', rep: 58, risk: 'LOW', base: 1800000 },
        { name: 'Atlas Local Bank', type: 'LOCAL', rep: 45, risk: 'LOW', base: 900000 },
        { name: 'Zenith Cloud Compute', type: 'TECHNICAL_PARTNER', rep: 70, risk: 'MEDIUM', base: 3800000 },
        { name: 'Hyperion Hospitality', type: 'MINOR', rep: 52, risk: 'LOW', base: 1400000 },
        { name: 'Titan Manufacturing Group', type: 'OFFICIAL_SUPPLIER', rep: 60, risk: 'LOW', base: 2200000 }
    ];
    const OBJECTIVES = [
        { id: 'top10', label: 'Finish Top 10', type: 'TOP_10', target: 1 },
        { id: 'doubleTop10', label: 'Double Top-10 Finish', type: 'DOUBLE_TOP_10', target: 2 },
        { id: 'points15', label: 'Score 15 Points', type: 'POINTS', target: 15 },
        { id: 'q3', label: 'Reach Q3', type: 'Q3', target: 1 },
        { id: 'podium', label: 'Podium Finish', type: 'PODIUM', target: 1 },
        { id: 'win', label: 'Win Race', type: 'WIN', target: 1 },
        { id: 'beatRival', label: 'Beat Rival Team', type: 'BEAT_RIVAL', target: 1 }
    ];

    function money(n) { return Math.max(100000, Math.round((n || 0) / 100000) * 100000); }
    function teamRep(careerOrTeam) { return careerOrTeam?.teamReputation || careerOrTeam?.reputation || careerOrTeam?.fanPopularity || careerOrTeam?.team?.reputation || careerOrTeam?.team?.fanPopularity || 55; }
    function riskMult(risk) { return risk === 'HIGH' ? 1.45 : risk === 'MEDIUM' ? 1.15 : 0.9; }
    function typeSlots(type) { return type === 'TITLE' ? 1 : type === 'TECHNICAL_PARTNER' ? 2 : type === 'OFFICIAL_SUPPLIER' ? 2 : type === 'MINOR' ? 3 : 4; }

    function makeObjective(rep, risk) {
        let pool = OBJECTIVES.filter(o => {
            if (rep < 55) return ['TOP_10','POINTS'].includes(o.type);
            if (rep < 75) return !['WIN'].includes(o.type);
            return true;
        });
        if (risk === 'LOW') pool = pool.filter(o => !['WIN','DOUBLE_TOP_10'].includes(o.type));
        return { ...pool[Math.floor(Math.random() * pool.length)], met: false };
    }

    function createOffer(teamOrCareer, sponsor = null) {
        const rep = teamRep(teamOrCareer);
        const eligible = SPONSOR_POOL.filter(s => rep + 8 >= s.rep);
        const baseSponsor = sponsor || (eligible.length ? eligible : SPONSOR_POOL).sort(() => Math.random() - 0.5)[0];
        const quality = Math.max(0.55, Math.min(1.85, rep / Math.max(45, baseSponsor.rep)));
        const risk = baseSponsor.risk;
        const contractLength = 2 + Math.floor(Math.random() * 3);
        const basePayment = money(baseSponsor.base * quality * riskMult(risk));
        const upfrontPayment = money(basePayment * (0.35 + Math.random() * 0.35));
        const raceBonus = money(basePayment * (0.18 + Math.random() * 0.18));
        const championshipBonus = money(basePayment * (0.8 + Math.random() * 0.8));
        return {
            id: `sponsor_${baseSponsor.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`,
            name: baseSponsor.name,
            type: baseSponsor.type,
            contractLength,
            basePayment,
            upfrontPayment,
            raceBonus,
            championshipBonus,
            reputationRequirement: baseSponsor.rep,
            riskLevel: risk,
            objective: makeObjective(rep, risk),
            status: 'OFFER',
            signedAtSeason: null,
            expiresAtSeason: null,
            totalPaid: 0
        };
    }

    function ensureSponsors(career) {
        if (!career) return career;
        career.teamReputation = Number.isFinite(career.teamReputation) ? career.teamReputation : (career.fanPopularity || career.team?.fanPopularity || 55);
        career.sponsorContracts = Array.isArray(career.sponsorContracts) ? career.sponsorContracts : [];
        career.sponsorOffers = Array.isArray(career.sponsorOffers) ? career.sponsorOffers : [];
        career.sponsorHistory = Array.isArray(career.sponsorHistory) ? career.sponsorHistory : [];
        career.sponsorIncomeThisSeason = career.sponsorIncomeThisSeason || 0;
        career.sponsorsEnabled = true;
        if (career.activeSponsor && !career.sponsorContracts.some(s => s.id === career.activeSponsor.id)) {
            const legacy = normalizeLegacySponsor(career.activeSponsor, career);
            career.sponsorContracts.push(legacy);
            career.activeSponsor = legacy;
        }
        while (career.sponsorOffers.length < 4) career.sponsorOffers.push(createOffer(career));
        return career;
    }

    function normalizeLegacySponsor(sp, career) {
        return {
            id: sp.id || `legacy_${Date.now()}`,
            name: sp.name,
            type: sp.type || 'TITLE',
            contractLength: sp.contractLength || 2,
            basePayment: sp.basePayment || sp.payout || 2500000,
            upfrontPayment: sp.upfrontPayment || sp.basePayment || 1000000,
            raceBonus: sp.raceBonus || sp.payout || 2500000,
            championshipBonus: sp.championshipBonus || (sp.payout || 2500000) * 4,
            reputationRequirement: sp.reputationRequirement || 50,
            riskLevel: sp.riskLevel || 'MEDIUM',
            objective: sp.objective || { type: sp.id === 'sp4' ? 'DOUBLE_TOP_10' : 'TOP_10', label: sp.goal || 'Finish Top 10', target: 1, met: false },
            status: 'ACTIVE',
            signedAtSeason: career?.season || 1,
            expiresAtSeason: (career?.season || 1) + (sp.contractLength || 2),
            totalPaid: 0
        };
    }

    function activeByType(career, type) { return (career.sponsorContracts || []).filter(s => s.status === 'ACTIVE' && s.type === type); }
    function canSign(career, offer) {
        ensureSponsors(career);
        if ((career.teamReputation || 0) < (offer.reputationRequirement || 0)) return { ok: false, reason: 'Team reputation too low' };
        if (activeByType(career, offer.type).length >= typeSlots(offer.type)) return { ok: false, reason: `${offer.type} sponsor slots full` };
        return { ok: true };
    }

    function acceptOffer(career, offerId) {
        ensureSponsors(career);
        const offer = career.sponsorOffers.find(o => o.id === offerId);
        if (!offer) return { ok: false, reason: 'Offer not found' };
        const eligible = canSign(career, offer);
        if (!eligible.ok) return eligible;
        offer.status = 'ACTIVE';
        offer.signedAtSeason = career.season || 1;
        offer.expiresAtSeason = (career.season || 1) + offer.contractLength;
        offer.totalPaid = (offer.totalPaid || 0) + offer.upfrontPayment;
        career.budget = (career.budget || 0) + offer.upfrontPayment;
        career.sponsorIncomeThisSeason = (career.sponsorIncomeThisSeason || 0) + offer.upfrontPayment;
        career.sponsorContracts.push(offer);
        career.activeSponsor = career.sponsorContracts.find(s => s.type === 'TITLE') || offer;
        career.sponsorOffers = career.sponsorOffers.filter(o => o.id !== offerId);
        while (career.sponsorOffers.length < 4) career.sponsorOffers.push(createOffer(career));
        return { ok: true, sponsor: offer, upfrontPayment: offer.upfrontPayment };
    }

    function rejectOffer(career, offerId) {
        ensureSponsors(career);
        career.sponsorOffers = career.sponsorOffers.filter(o => o.id !== offerId);
        career.sponsorOffers.push(createOffer(career));
        return { ok: true };
    }

    function counterOffer(career, offerId, multiplier = 1.15) {
        ensureSponsors(career);
        const offer = career.sponsorOffers.find(o => o.id === offerId);
        if (!offer) return { ok: false, reason: 'Offer not found' };
        const rep = career.teamReputation || 50;
        const acceptChance = Math.max(0.15, Math.min(0.85, rep / (offer.reputationRequirement + 35) - (multiplier - 1) * 0.9));
        if (Math.random() < acceptChance) {
            offer.basePayment = money(offer.basePayment * multiplier);
            offer.upfrontPayment = money(offer.upfrontPayment * multiplier);
            offer.raceBonus = money(offer.raceBonus * multiplier);
            offer.championshipBonus = money(offer.championshipBonus * multiplier);
            offer.countered = true;
            return { ok: true, accepted: true, offer };
        }
        career.sponsorOffers = career.sponsorOffers.filter(o => o.id !== offerId);
        return { ok: true, accepted: false };
    }

    function terminateContract(career, sponsorId) {
        ensureSponsors(career);
        const contract = career.sponsorContracts.find(s => s.id === sponsorId);
        if (!contract) return { ok: false, reason: 'Contract not found' };
        const penalty = money((contract.basePayment || 0) * 0.35);
        career.budget = Math.max(0, (career.budget || 0) - penalty);
        contract.status = 'TERMINATED';
        contract.terminatedAtSeason = career.season || 1;
        career.sponsorHistory.push(contract);
        career.sponsorContracts = career.sponsorContracts.filter(s => s.id !== sponsorId);
        career.activeSponsor = career.sponsorContracts.find(s => s.type === 'TITLE') || career.sponsorContracts[0] || null;
        return { ok: true, penalty };
    }

    function evaluateObjective(objective, results, career, race) {
        const playerResults = (results || []).filter(r => r.team?.id === career.team?.id).sort((a,b)=>(a.position||99)-(b.position||99));
        const points = playerResults.reduce((s,r)=>s+(r.points||0)+(r.fastestLapBonus||0),0);
        switch (objective?.type) {
            case 'TOP_10': return playerResults.some(r => r.position <= 10);
            case 'DOUBLE_TOP_10': return playerResults.filter(r => r.position <= 10).length >= 2;
            case 'POINTS': return points >= (objective.target || 1);
            case 'PODIUM': return playerResults.some(r => r.position <= 3);
            case 'WIN': return playerResults.some(r => r.position === 1);
            case 'Q3': return true; // tracked as race-weekend objective later; do not punish for now
            case 'BEAT_RIVAL': {
                const rivalId = career.rivalTeamId || (career.championship?.constructorStandings || []).find(c => c.teamId !== career.team?.id)?.teamId;
                if (!rivalId) return true;
                const playerBest = playerResults[0]?.position || 99;
                const rivalBest = (results || []).filter(r => r.team?.id === rivalId).sort((a,b)=>(a.position||99)-(b.position||99))[0]?.position || 99;
                return playerBest < rivalBest;
            }
            default: return false;
        }
    }

    function evaluateRace(career, results, race) {
        ensureSponsors(career);
        const outcomes = [];
        (career.sponsorContracts || []).filter(s => s.status === 'ACTIVE').forEach(contract => {
            const met = evaluateObjective(contract.objective, results, career, race);
            const amount = met ? contract.raceBonus : -Math.round((contract.raceBonus || 0) * (contract.riskLevel === 'HIGH' ? 0.45 : contract.riskLevel === 'MEDIUM' ? 0.25 : 0.1));
            career.budget = Math.max(0, (career.budget || 0) + amount);
            contract.totalPaid = (contract.totalPaid || 0) + Math.max(0, amount);
            contract.objective.met = met;
            contract.lastOutcome = { met, amount, raceId: race?.trackId || race?.track?.id, season: career.season || 1 };
            outcomes.push({ sponsorId: contract.id, name: contract.name, type: contract.type, met, amount: Math.abs(amount), netAmount: amount, objective: contract.objective.label || contract.objective.type });
        });
        career._lastSponsorOutcome = outcomes[0] || null;
        career._lastSponsorOutcomes = outcomes;
        career.sponsorIncomeThisSeason = (career.sponsorIncomeThisSeason || 0) + outcomes.reduce((s,o)=>s+Math.max(0,o.amount),0);
        updateReputation(career, results);
        return outcomes;
    }

    function updateReputation(career, results = []) {
        const playerResults = results.filter(r => r.team?.id === career.team?.id);
        const points = playerResults.reduce((s,r)=>s+(r.points||0),0);
        const best = Math.min(...playerResults.map(r => r.position || 99), 99);
        let delta = points * 0.08;
        if (best === 1) delta += 3;
        else if (best <= 3) delta += 1.5;
        else if (best <= 10) delta += 0.5;
        career.teamReputation = Math.max(10, Math.min(99, (career.teamReputation || career.fanPopularity || 55) + delta));
        career.fanPopularity = Math.max(10, Math.min(100, (career.fanPopularity || 50) + delta * 0.7));
        return career.teamReputation;
    }

    function processSeasonEnd(career) {
        ensureSponsors(career);
        const expired = [];
        career.sponsorContracts.forEach(c => c.contractLength = Math.max(0, (c.contractLength || 1) - 1));
        career.sponsorContracts = career.sponsorContracts.filter(c => {
            if (c.contractLength <= 0) {
                c.status = 'EXPIRED';
                expired.push(c);
                career.sponsorHistory.push(c);
                return false;
            }
            return true;
        });
        career.activeSponsor = career.sponsorContracts.find(s => s.type === 'TITLE') || career.sponsorContracts[0] || null;
        while (career.sponsorOffers.length < 4) career.sponsorOffers.push(createOffer(career));
        career.sponsorSeasonExpired = expired;
        career.sponsorIncomeThisSeason = 0;
        return { expired };
    }

    function processAI(career) {
        (career.allTeams || []).filter(t => !t.isLocalPlayer).forEach(team => {
            team.sponsors = Array.isArray(team.sponsors) ? team.sponsors : [];
            team.teamReputation = team.teamReputation || team.reputation || team.fanPopularity || 55;
            team.sponsors = team.sponsors.filter(s => (s.contractLength || 0) > 0);
            while (team.sponsors.length < 2) {
                const offer = createOffer(team);
                offer.status = 'ACTIVE';
                team.sponsors.push(offer);
            }
        });
    }

    return { TYPES, SPONSOR_POOL, OBJECTIVES, ensureSponsors, createOffer, acceptOffer, rejectOffer, counterOffer, terminateContract, evaluateRace, updateReputation, processSeasonEnd, processAI, canSign };
})();
