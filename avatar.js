
window.AvatarSystem = (function () {
    const avatars = [
        {
            id: 'walker-red',
            name: '女の子 (赤)',
            src: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIyMiIgZmlsbD0iI2Y4NzE3MSIvPjxwYXRoIGQ9Ik0zMCw2MCBMNzAsNjAgTDgwLDEzMCBMMTAsMTMwIFoiIGZpbGw9IiNmO2ZhZmMiLz48cmVjdCB4PSIyMCIgeT0iNjUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2VmNDQ0NCIvPjxyZWN0IHg9IjM1IiB5PSIxMzAiIHdpZHRoPSIxMiIgaGVpZ2h0PSI2MCIgZmlsbD0iIzY0NzQ4YiIvPjxyZWN0IHg9IjUzIiB5PSIxMzAiIHdpZHRoPSIxMiIgaGVpZ2h0PSI2MCIgZmlsbD0iIzY0NzQ4YiIvPjwvc3ZnPg==`
        },
        {
            id: 'walker-blue',
            name: '男の子 (青)',
            src: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIyMCIgZmlsbD0iIzM4YmRmOCIvPjxyZWN0IHg9IjMwIiB5PSI2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjcyIiByeD0iMTIiIGZpbGw9IiM2MDhhZjgiLz48cmVjdCB4PSIzNSIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTUiIGZpbGw9IiM0NzU1NjkiLz48cmVjdCB4PSI1MyIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTUiIGZpbGw9IiM0NzU1NjkiLz48L3N2Zz4=`
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
