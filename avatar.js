
window.AvatarSystem = (function () {
    const avatars = [
        {
            id: 'walker-1',
            name: 'Casual Walker',
            src: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIyMCIgZmlsbD0iIzM4YmRmOCIvPjxyZWN0IHg9IjMwIiB5PSI2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjcwIiByeD0iMTAiIGZpbGw9IiNmOGZhZmMiLz48cmVjdCB4PSIzNSIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTAiIGZpbGw9IiM5NGEzYjgiLz48cmVjdCB4PSI1MyIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTAiIGZpbGw9IiM5NGEzYjgiLz48L3N2Zz4=`
        },
        {
            id: 'walker-2',
            name: 'Sporty Walker',
            src: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIyMCIgZmlsbD0iI2VmNDQ0NCIvPjxyZWN0IHg9IjMwIiB5PSI2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjcwIiByeD0iMTAiIGZpbGw9IiNmOGZhZmMiLz48cmVjdCB4PSIzNSIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTAiIGZpbGw9IiM5NGEzYjgiLz48cmVjdCB4PSI1MyIgeT0iMTQwIiB3aWR0aD0iMTIiIGhlaWdodD0iNTAiIGZpbGw9IiM5NGEzYjgiLz48cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2VmNDQ0NCIvPjxyZWN0IHg9IjcwIiB5PSI3MCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZWY0NDQ0Ii8+PC9zdmc+`
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
