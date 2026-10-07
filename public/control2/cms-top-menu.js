(function () {
    'use strict';

    function getContainer(container) {
        if (container) return container;
        return document.getElementById('cms-shortcuts');
    }

    function createMenuLink(item, isActive) {
        const a = document.createElement('a');
        if(item.form_file) {
            a.href = 'cms-list.html?form_file=' + encodeURIComponent(item.form_file || '');
        } else {
            a.href = 'cms-list.html?table=' + encodeURIComponent(item.table_name || '');
        }
        a.className = 'nav-link cms-topmenu-link' + (isActive ? ' active' : '') + (item.pinned ? ' pinned' : '');
        a.textContent = item.table_php_name || item.table_name || 'Untitled';
        return a;
    }

    async function renderCmsTopMenu(container) {
        const target = getContainer(container);
        if (!target) return;

        const token = localStorage.getItem('cms_token');
        if (!token) return;

        target.innerHTML = '';
        target.className = (target.className || '').replace(/\bcms-shortcuts-menu\b/g, '').trim();
        target.classList.add('cms-shortcuts-menu');

        try {
            const res = await fetch('/api/generic.php?action=get_top_menus', {
                headers: { Authorization: 'Bearer ' + token }
            });
            if (!res || !res.ok) return;

            const data = await res.json();
            const tableTypes = Array.isArray(data && data.table_types) ? data.table_types : [];
            const tableNames = Array.isArray(data && data.table_php_name) ? data.table_php_name : data.table_names || [];
            if (!tableTypes.length) return;

            const currentTable = String(new URLSearchParams(window.location.search).get('table') || '').trim();
            const byType = {};
            tableNames.forEach(item => {
                const typeId = item && item.table_type_id;
                if (!typeId) return;
                if (!byType[typeId]) byType[typeId] = [];
                byType[typeId].push(item);
            });

            tableTypes.forEach(type => {
                const childItems = byType[type.table_type_id] || [];
                if (!childItems.length) return;

                const group = document.createElement('div');
                group.className = 'cms-topmenu-group';
                group.dataset.typeId = type.table_type_id || '';

                const trigger = document.createElement('button');
                trigger.type = 'button';
                trigger.className = 'cms-topmenu-trigger';
                trigger.textContent = type.table_type_name || 'Menu';
                group.appendChild(trigger);

                const menuBody = document.createElement('div');
                menuBody.className = 'cms-topmenu-children';

                childItems.forEach(item => {
                    /*
                    item.table_php_name = item.pinned ? item.table_php_name + ' 📌' : item.table_php_name;
                    */
                    const link = createMenuLink(item, currentTable && currentTable === item.table_name);
                    menuBody.appendChild(link);
                });

                group.appendChild(menuBody);

                group.addEventListener('mouseover', () => {
                    group.classList.add('open');
                });
                group.addEventListener('mouseout', (ev) => {
                    const next = ev.relatedTarget;
                    if (!next || !group.contains(next)) {
                        group.classList.remove('open');
                    }
                });

                target.appendChild(group);
            });
        } catch (e) {
            // Ignore and keep the container empty
        }
    }

    window.renderCmsTopMenu = renderCmsTopMenu;
})();
