// /industry/industry-hud.js
document.addEventListener('DOMContentLoaded', async () => {
    const bellIcon = document.getElementById('bellIcon');
    const bellBadge = document.getElementById('bellBadge');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
    const notificationListWrapper = document.getElementById('notificationListWrapper');

    let employerId = 3; // Default recruiter ID (Sarah Jenkins @ Google)
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.id) employerId = user.id;
    } catch(e) {}

    // Fetch live employer notifications from DB
    try {
        // Clean dynamic fetch from DB
        const res = await fetch(`http://localhost:5000/api/notifications/${employerId}`);
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
            const unreadCount = data.notifications.filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0').length;
            if (bellBadge && unreadCount > 0) {
                bellBadge.style.display = 'inline-block';
                bellBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else if (bellBadge) {
                bellBadge.style.display = 'none';
            }
            
            if (notificationListWrapper) {
                notificationListWrapper.innerHTML = data.notifications.slice(0, 5).map(n => {
                    const isRead = n.is_read && n.is_read !== 0 && n.is_read !== '0';
                    return `
                        <a href="${n.link || 'notifications.html'}" class="notif-item" style="display:block; text-decoration:none; padding: 12px 18px; border-bottom: 1px solid #f8fafc; font-size: 12px; color: #334155; ${!isRead ? 'background:#f0f9ff;' : ''}">
                            <div style="font-weight: 600; color: #0d1b5e; margin-bottom: 2px;">${n.title}</div>
                            <div>${n.description || ''}</div>
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${!isRead ? '🔵 Unread' : '🕒 Received'}</div>
                        </a>
                    `;
                }).join('') + `
                    <div style="padding: 10px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <a href="notifications.html" style="font-size: 12px; font-weight: 600; color: #1e3a8a; text-decoration: none;">View All Notifications Hub →</a>
                    </div>
                `;
            }
        } else {
            if (bellBadge) bellBadge.style.display = 'none';
            if (notificationListWrapper) {
                notificationListWrapper.innerHTML = `
                    <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 13px;">
                        📭 No new notifications logs.
                    </div>
                `;
            }
        }
        });
    }

    if (clearNotificationsBtn && notificationListWrapper) {
        clearNotificationsBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // localStorage.setItem("all_notifications_read_" + employerId, 'true');
            // localStorage.setItem("notifications_cleared_" + employerId, 'true');
            notificationListWrapper.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 13px;">
                    📭 No new recruiter notifications logs.
                </div>
            `;
            if (bellBadge) bellBadge.style.display = 'none';
            try {
                await fetch(`http://localhost:5000/api/notifications/clear/${employerId}`, { method: 'DELETE' });
            } catch(e) {}
        });
    }

    
    if (bellIcon && notificationDropdown) {
        bellIcon.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isVisible = notificationDropdown.style.display === 'block';
            notificationDropdown.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                if (bellBadge) bellBadge.style.display = 'none';
                if (notificationListWrapper) {
                    notificationListWrapper.querySelectorAll('a, .notif-item').forEach(el => {
                        el.style.background = 'transparent';
                        const dot = el.querySelector('div:last-child');
                        if (dot && dot.textContent.includes('Unread')) dot.textContent = '🕒 Received';
                    });
                }
                try {
                    await fetch(`http://localhost:5000/api/notifications/mark-read/${employerId}`, { method: 'PUT' });
                } catch(err) {}
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== bellIcon) {
            notificationDropdown.style.display = 'none';
        }
    });

    // Real-Time WebSocket Notification Synchronization
    if (typeof io !== 'undefined') {
        initSocketHub(employerId);
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        script.onload = () => initSocketHub(employerId);
        document.head.appendChild(script);
    }

    function initSocketHub(uid) {
        try {
            const socket = io('http://localhost:5000');
            socket.on('connect', () => {
                socket.emit('join_user', uid);
            });
            socket.on('new_notification', (notif) => {
                if (bellBadge) {
                    bellBadge.style.display = 'inline-block';
                    let curr = parseInt(bellBadge.textContent || '0', 10) || 0;
                    bellBadge.textContent = (curr + 1) > 9 ? '9+' : (curr + 1);
                }
                if (notificationListWrapper) {
                    const emptyEl = notificationListWrapper.querySelector('div');
                    if (emptyEl && emptyEl.textContent.includes('No new')) {
                        notificationListWrapper.innerHTML = '';
                    }
                    const itemHtml = `
                        <a href="${notif.link || 'notifications.html'}" class="notif-item" style="display:block; text-decoration:none; padding: 12px 18px; border-bottom: 1px solid #f8fafc; font-size: 12px; color: #334155; background:#f0f9ff;">
                            <div style="font-weight: 600; color: #0d1b5e; margin-bottom: 2px;">${notif.title}</div>
                            <div>${notif.description || ''}</div>
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">🔵 Live Just Now</div>
                        </a>
                    `;
                    notificationListWrapper.insertAdjacentHTML('afterbegin', itemHtml);
                }
            });
        } catch(e) {}
    }

    // Automatically bind profile click on header avatar or profile box across all industry portal pages
    const avatarBox = document.querySelector('.profile-box');
    const avatarEl = document.querySelector('.avatar');
    const profileEl = document.querySelector('.profile');
    const avatarDisplay = document.getElementById('avatarDisplay');
    [avatarBox, avatarEl, profileEl, avatarDisplay].forEach(el => {
        if (el && !el.getAttribute('onclick')) {
            el.style.cursor = 'pointer';
            el.title = 'View Employer Verified Profile';
            el.addEventListener('click', (e) => {
                if (e.target.closest('.bell-container')) return;
                window.location.href = 'industry_profile.html';
            });
        }
    });
});