
window.AvatarSystem = (function () {
    const avatars = [
        {
            id: 'walker-1',
            name: 'Casual Walker',
            src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><circle cx="50" cy="30" r="20" fill="%2338bdf8"/><rect x="30" y="60" width="40" height="70" rx="10" fill="%23f8fafc"/><rect x="35" y="140" width="12" height="50" fill="%2394a3b8"/><rect x="53" y="140" width="12" height="50" fill="%2394a3b8"/></svg>`
        },
        {
            id: 'walker-2',
            name: 'Sporty Walker',
            src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><circle cx="50" cy="30" r="20" fill="%23ef4444"/><rect x="30" y="60" width="40" height="70" rx="10" fill="%23f8fafc"/><rect x="35" y="140" width="12" height="50" fill="%2394a3b8"/><rect x="53" y="140" width="12" height="50" fill="%2394a3b8"/><rect x="20" y="70" width="10" height="40" fill="%23ef4444"/><rect x="70" y="70" width="10" height="40" fill="%23ef4444"/></svg>`
        }
    ];

    function renderAvatars(containerId, onSelect, currentId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        avatars.forEach(avatar => {
            const div = document.createElement('div');
            div.className = `avatar-option ${avatar.id === currentId ? 'selected' : ''}`;
            div.onclick = () => onSelect(avatar.id);

            const img = document.createElement('img');
            img.src = avatar.src;
            img.alt = avatar.name;

            div.appendChild(img);
            container.appendChild(div);
        });
    }

    function updateAvatarOverlay(overlayId, avatarId, isWalking = false) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        const avatar = avatars.find(a => a.id === avatarId) || avatars[0];

        overlay.innerHTML = `<img src="${avatar.src}" alt="Avatar" style="width:100%; height:auto;">`;

        if (isWalking) {
            overlay.classList.add('walking-anim');
        } else {
            overlay.classList.remove('walking-anim');
        }
    }

    return {
        avatars,
        renderAvatars,
        updateAvatarOverlay
    };
})();
