/* =============================================
   INDEX.JS — Main page logic
   Loads events from Firebase, renders featured/rail,
   upcoming events, announcement banner.
   ============================================= */

/* ===== EVENTS DATA — FROM FIREBASE ===== */
let events = [];
let currentIndex = 0;
let autoTimer = null;
let eventsLoaded = false;

/* ===== LOAD EVENTS FROM FIREBASE ===== */
function initEventsFromFirebase() {
    const arena = document.querySelector('.events-arena');
    const statsBar = document.querySelector('.events-stats-bar');

    // Show loading state
    if (arena) {
        arena.innerHTML = `
            <div class="events-loading" style="width:100%;">
                <i class='bx bx-loader-alt'></i>
                <p>Loading events...</p>
            </div>
        `;
    }

    function handleEvents(data) {
        if (!data) {
            events = [];
        } else {
            const arr = Array.isArray(data) ? data : Object.values(data);
            // Map Firebase event objects to display format
            events = arr.map((ev, i) => ({
                img: ev.posterUrl || ev.img || './img/2026.jpeg',
                title: ev.name || ev.title || 'Untitled Event',
                tag: ev.tag || (ev.status === 'Completed' ? 'Past' : 'Upcoming'),
                date: ev.date || '',
                badge: ev.badge || ev.status || 'EVENT',
                num: String(i + 1).padStart(2, '0'),
                stat1: ev.stat1 || '—',
                stat1Label: ev.stat1Label || 'Info',
                stat2: ev.stat2 || '—',
                stat2Label: ev.stat2Label || 'Info',
                desc: ev.description || ev.desc || ''
            }));
        }

        if (events.length === 0) {
            // Show empty state
            if (arena) {
                arena.innerHTML = `
                    <div class="events-empty" style="width:100%;">
                        <i class='bx bx-calendar-x'></i>
                        <p>No events yet. Check back soon!</p>
                    </div>
                `;
            }
            if (statsBar) statsBar.style.display = 'none';
            return;
        }

        if (statsBar) statsBar.style.display = '';

        // Restore the arena HTML structure
        if (arena) {
            arena.innerHTML = `
                <div class="event-featured" id="featuredCard">
                    <div class="event-featured-img-wrap">
                        <img id="featuredImg" src="./img/2026.jpeg" alt="Event" loading="lazy">
                        <div class="event-featured-badge" id="featuredBadge">FEATURED</div>
                        <div class="event-featured-overlay">
                            <span class="event-featured-num" id="featuredNum">01</span>
                        </div>
                    </div>
                    <div class="event-featured-info">
                        <div class="event-meta-row">
                            <span class="event-tag" id="featuredTag">Technical</span>
                            <span class="event-date" id="featuredDate">2026</span>
                        </div>
                        <h3 class="event-featured-title" id="featuredTitle">Loading...</h3>
                        <p class="event-featured-desc" id="featuredDesc"></p>
                        <div class="event-featured-footer">
                            <div class="event-stat">
                                <span class="stat-num" id="featuredStat">—</span>
                                <span class="stat-label" id="featuredStatLabel">Info</span>
                            </div>
                            <div class="event-stat">
                                <span class="stat-num" id="featuredStat2">—</span>
                                <span class="stat-label" id="featuredStat2Label">Info</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="events-rail">
                    <div class="rail-label">ALL EVENTS</div>
                    <div class="rail-cards" id="railCards"></div>
                    <div class="rail-nav">
                        <button class="rail-btn" id="prevBtn" onclick="prevEvent()">&#8592;</button>
                        <div class="rail-progress" id="railProgress"></div>
                        <button class="rail-btn" id="nextBtn" onclick="nextEvent()">&#8594;</button>
                    </div>
                </div>
            `;
        }

        currentIndex = 0;
        buildRail();
        updateFeatured(false);

        // Setup autoplay
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(nextEvent, 5000);
        const arenaEl = document.querySelector('.events-arena');
        if (arenaEl) {
            arenaEl.onmouseenter = () => clearInterval(autoTimer);
            arenaEl.onmouseleave = () => {
                clearInterval(autoTimer);
                autoTimer = setInterval(nextEvent, 5000);
            };
        }

        eventsLoaded = true;

        // Also render upcoming events with countdown timers
        renderUpcomingEvents(data);
    }

    if (window._firebaseReady) {
        fbListen('rmc_events', handleEvents);
    } else {
        window.addEventListener('firebaseReady', () => {
            fbListen('rmc_events', handleEvents);
        });
    }
}

/* ===== BUILD RAIL CARDS ===== */
function buildRail() {
    const rail = document.getElementById('railCards');
    const progress = document.getElementById('railProgress');
    if (!rail || !progress) return;
    rail.innerHTML = '';
    progress.innerHTML = '';

    events.forEach((ev, i) => {
        const card = document.createElement('div');
        card.className = 'rail-card' + (i === currentIndex ? ' active' : '');
        card.innerHTML = `
            <div class="rail-card-img"><img src="${escapeHtmlAttr(ev.img)}" alt="${escapeHtmlAttr(ev.title)}" onerror="this.src='./img/2026.jpeg'"></div>
            <div class="rail-card-info">
                <span class="rail-card-tag">${escapeHtmlPublic(ev.tag)}</span>
                <span class="rail-card-title">${escapeHtmlPublic(ev.title)}</span>
                <span class="rail-card-date">${escapeHtmlPublic(ev.date)}</span>
            </div>
        `;
        card.onclick = () => goToEvent(i);
        rail.appendChild(card);

        const dot = document.createElement('div');
        dot.className = 'progress-dot' + (i === currentIndex ? ' active' : '');
        dot.onclick = () => goToEvent(i);
        progress.appendChild(dot);
    });
}

/* ===== UPDATE FEATURED ===== */
function updateFeatured(animate = true) {
    if (events.length === 0) return;
    const ev = events[currentIndex];
    const featured = document.getElementById('featuredCard');
    if (!featured) return;

    if (animate) {
        featured.classList.add('transitioning');
        setTimeout(() => featured.classList.remove('transitioning'), 450);
    }

    const featImg = document.getElementById('featuredImg');
    if (featImg) {
        featImg.src = ev.img;
        featImg.onerror = function(){ this.src='./img/2026.jpeg'; };
    }
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('featuredBadge', ev.badge);
    el('featuredNum', ev.num);
    el('featuredTag', ev.tag);
    el('featuredDate', ev.date);
    el('featuredTitle', ev.title);
    el('featuredDesc', ev.desc);
    el('featuredStat', ev.stat1);
    el('featuredStat2', ev.stat2);

    // Also update stat labels
    const sl1 = document.getElementById('featuredStatLabel');
    if (sl1) sl1.textContent = ev.stat1Label;
    const sl2 = document.getElementById('featuredStat2Label');
    if (sl2) sl2.textContent = ev.stat2Label;

    document.querySelectorAll('.rail-card').forEach((c, i) => {
        c.classList.toggle('active', i === currentIndex);
    });
    document.querySelectorAll('.progress-dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentIndex);
    });

    const ticker = document.getElementById('tickerText');
    if (ticker) ticker.textContent = `NOW VIEWING: ${ev.title.toUpperCase()} — ${ev.tag.toUpperCase()} EVENT — ${ev.date}`;
}

function goToEvent(i) {
    currentIndex = i;
    updateFeatured(true);
}

function nextEvent() {
    if (events.length === 0) return;
    currentIndex = (currentIndex + 1) % events.length;
    updateFeatured(true);
}

function prevEvent() {
    if (events.length === 0) return;
    currentIndex = (currentIndex - 1 + events.length) % events.length;
    updateFeatured(true);
}

/* ===== INIT EVENTS ===== */
initEventsFromFirebase();

/* ===== KEYBOARD NAV ===== */
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') nextEvent();
    if (e.key === 'ArrowLeft') prevEvent();
});

/* ===== MENU TOGGLE ===== */
function toggleMenu() {
    document.getElementById("sideMenu").classList.toggle("active");
}

const sections = document.querySelectorAll('.about-section, .events-section');
window.addEventListener('scroll', () => {
    sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        const vh = window.innerHeight;
        let visible = 1 - Math.abs(rect.top - vh / 2) / vh;
        visible = Math.min(Math.max(visible, 0), 1);
        const blur = 6 + visible * 6;
        sec.style.setProperty('--blur', blur + 'px');
    });
});

/* ===== HTML Escape Helpers ===== */
function escapeHtmlPublic(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function escapeHtmlAttr(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ===== ANNOUNCEMENT BANNER — Public Renderer (Firebase Real-time) ===== */
function renderAnnouncementBanner(data) {
    const banner = document.getElementById('announcementBanner');
    const content = document.getElementById('announcementContent');
    if (!banner || !content) return;

    if (sessionStorage.getItem('rmc_banner_dismissed') === 'true') {
        banner.style.display = 'none';
        return;
    }

    if (!data || !data.active || !data.message) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'flex';
    banner.style.background = data.color || '#c9a84c';

    if (data.scrolling) {
        content.innerHTML = '<span class="announcement-scroll-text" style="color:' +
            (data.textColor || '#000000') + ';">' +
            escapeHtmlPublic(data.message) + '</span>';
    } else {
        content.innerHTML = '<span class="announcement-static-text" style="color:' +
            (data.textColor || '#000000') + ';">' +
            escapeHtmlPublic(data.message) + '</span>';
    }
}

function dismissBanner() {
    sessionStorage.setItem('rmc_banner_dismissed', 'true');
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.style.animation = 'bannerSlideUp 0.3s ease forwards';
        setTimeout(() => { banner.style.display = 'none'; }, 300);
    }
}

function initAnnouncementBanner() {
    if (window._firebaseReady) {
        fbListen('rmc_announcement', renderAnnouncementBanner);
    } else {
        window.addEventListener('firebaseReady', () => {
            fbListen('rmc_announcement', renderAnnouncementBanner);
        });
    }
}
initAnnouncementBanner();

/* ===== MEMBERS PREVIEW — Public Renderer (Firebase Real-time) ===== */
function renderMembersPreview(members) {
    const grid = document.getElementById('membersPreviewGrid');
    if (!grid) return;

    if (!members) members = [];
    if (!Array.isArray(members)) members = Object.values(members);

    if (members.length === 0) {
        grid.innerHTML = '';
        return;
    }

    const typeOrder = { 'Faculty Advisor': 0, 'Core Committee': 1, 'General Member': 2 };
    members.sort((a, b) => {
        const orderA = typeOrder[a.memberType] !== undefined ? typeOrder[a.memberType] : 3;
        const orderB = typeOrder[b.memberType] !== undefined ? typeOrder[b.memberType] : 3;
        return orderA - orderB;
    });

    const preview = members.slice(0, 10);

    grid.innerHTML = preview.map(m => {
        const photo = (m.photoData && m.photoData.trim())
            ? m.photoData
            : (m.photoUrl && m.photoUrl.trim())
            ? m.photoUrl
            : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name) +
              '&background=c9a84c&color=0a0a0a&size=128&bold=true';

        let subtitleHtml = '';
        if (m.qualification && m.qualification.trim()) {
            subtitleHtml = '<p class="mp-card-qualification">' + escapeHtmlPublic(m.qualification) + '</p>';
        } else {
            const parts = [m.year, m.department].filter(Boolean);
            if (parts.length > 0) {
                subtitleHtml = '<p class="mp-card-detail">' + escapeHtmlPublic(parts.join(' • ')) + '</p>';
            }
        }

        const typeBadge = m.memberType === 'Faculty Advisor'
            ? '<span class="mp-card-badge">Faculty</span>' : '';

        return `
            <div class="mp-card">
                ${typeBadge}
                <img src="${escapeHtmlAttr(photo)}" alt="${escapeHtmlAttr(m.name)}" class="mp-card-photo"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=c9a84c&color=0a0a0a&size=128'">
                <h4 class="mp-card-name">${escapeHtmlPublic(m.name)}</h4>
                <p class="mp-card-role">${escapeHtmlPublic(m.role)}</p>
                ${subtitleHtml}
            </div>
        `;
    }).join('');
}

// renderMembersPreview(); // Disabled - members only show on members.html after clicking VIEW ALL MEMBERS button

/* =============================================
   UPCOMING EVENTS + COUNTDOWN TIMER
   ============================================= */

function renderUpcomingEvents(data) {
    const container = document.getElementById('upcomingCards');
    if (!container) return;

    if (!data) {
        container.innerHTML = '<p class="no-events" style="text-align:center;color:#888;padding:40px;">No upcoming events at the moment. Stay tuned!</p>';
        return;
    }

    const arr = Array.isArray(data) ? data : Object.values(data);


    // Filter to upcoming/open events only
    const upcoming = arr.filter(ev =>
        ev.status === 'Registration Open' ||
        (ev.eventDateTime && new Date(ev.eventDateTime) > new Date())
    );

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="no-events" style="text-align:center;color:#888;padding:40px;">No upcoming events at the moment. Stay tuned!</p>';
        return;
    }

    container.innerHTML = upcoming.map(ev => {
        const hasDateTime = ev.eventDateTime && new Date(ev.eventDateTime) > new Date();
        const evId = ev.id || Math.random().toString(36).slice(2, 8);
        return `
        <div class="upcoming-card">
            <div class="upcoming-card-header">
                <span class="upcoming-tag">${escapeHtmlPublic(ev.tag || 'Event')}</span>
                <span class="upcoming-status">${escapeHtmlPublic(ev.status || 'Coming Soon')}</span>
            </div>
            <h3 class="upcoming-title">${escapeHtmlPublic(ev.name || ev.title || 'Event')}</h3>
            <p class="upcoming-desc">${escapeHtmlPublic(ev.description || '')}</p>
            ${hasDateTime ? `
            <div class="countdown-box" data-target="${ev.eventDateTime}">
                <div class="countdown-label">⏳ Starts in</div>
                <div class="countdown-units">
                    <div class="cdu"><span class="cdu-num" id="cd-days-${evId}">--</span><span class="cdu-label">Days</span></div>
                    <div class="cdu-sep">:</div>
                    <div class="cdu"><span class="cdu-num" id="cd-hrs-${evId}">--</span><span class="cdu-label">Hours</span></div>
                    <div class="cdu-sep">:</div>
                    <div class="cdu"><span class="cdu-num" id="cd-min-${evId}">--</span><span class="cdu-label">Mins</span></div>
                    <div class="cdu-sep">:</div>
                    <div class="cdu"><span class="cdu-num" id="cd-sec-${evId}">--</span><span class="cdu-label">Secs</span></div>
                </div>
            </div>` : `<div class="countdown-box upcoming-soon">📅 Date to be announced</div>`}
            ${ev.registrationLink ? `
            <a href="${escapeHtmlAttr(ev.registrationLink)}" class="upcoming-reg-btn" target="_blank">Register Now →</a>` :
            (ev.status === 'Registration Open' ? `
            <a href="ragister.html?event=${encodeURIComponent(ev.id || '')}" class="upcoming-reg-btn">Register Now →</a>` : '')}
        </div>
        `;
    }).join('');

    // Start countdown timers
    startAllCountdowns();
}

function startAllCountdowns() {
    if (window._countdownInterval) clearInterval(window._countdownInterval);

    window._countdownInterval = setInterval(() => {
        document.querySelectorAll('.countdown-box[data-target]').forEach(box => {
            const target = new Date(box.dataset.target);
            const now = new Date();
            const diff = target - now;

            const daysEl = box.querySelector('[id^="cd-days-"]');
            if (!daysEl) return;
            const evId = daysEl.id.replace('cd-days-', '');

            if (diff <= 0) {
                box.innerHTML = '<div class="countdown-live">🔴 LIVE NOW!</div>';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const pad = n => String(n).padStart(2, '0');
            const d = document.getElementById('cd-days-' + evId);
            const h = document.getElementById('cd-hrs-' + evId);
            const m = document.getElementById('cd-min-' + evId);
            const s = document.getElementById('cd-sec-' + evId);
            if (d) d.textContent = pad(days);
            if (h) h.textContent = pad(hrs);
            if (m) m.textContent = pad(mins);
            if (s) s.textContent = pad(secs);
        });
    }, 1000);
}
