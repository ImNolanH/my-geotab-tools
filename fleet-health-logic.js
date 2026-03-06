// This function is triggered by your loader.html
window.initFleetHealth = function(api, state, callback) {
    var _groupMap = {};
    var _debugData = {};
    var MAX_RENDER = 150;

    // Helper: Determine colors based on inactivity
    function getSoftColor(days) {
        if (days <= 14) return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Healthy' };
        if (days <= 29) return { bg: '#fffbeb', text: '#92400e', border: '#fef3c7', label: 'Warning' };
        if (days <= 59) return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Critical' };
        return { bg: '#fee2e2', text: '#7f1d1d', border: '#fca5a5', label: 'Escalated' };
    }

    // Helper: Check if a group is a child of another
    function isChildOf(childId, parentId) {
        if (childId === parentId) return true;
        var current = _groupMap[childId];
        var safety = 0;
        while (current && current.parent && current.parent.id && safety < 50) {
            if (current.parent.id === parentId) return true;
            current = _groupMap[current.parent.id];
            safety++;
        }
        return false;
    }

    // The main data fetching function
    window.fetchData = function() {
        var selectedGroupId = document.getElementById('group-select').value;
        var threshold = parseInt(document.getElementById('status-select').value, 10);
        var devDiv = document.getElementById('devices-container');
        var usrDiv = document.getElementById('users-container');
        
        devDiv.innerHTML = '<div style="padding:30px;text-align:center;color:#64748b;">Syncing assets...</div>';
        usrDiv.innerHTML = '<div style="padding:30px;text-align:center;color:#64748b;">Syncing drivers...</div>';

        api.multiCall([
            ['Get', { typeName: 'Device' }],
            ['Get', { typeName: 'DeviceStatusInfo' }],
            ['Get', { typeName: 'User', search: { isDriver: true } }]
        ], function(results) {
            var now = new Date();
            var devices = results[0];
            var statuses = results[1];
            var users = results[2];

            var statusMap = {};
            statuses.forEach(function(s) { statusMap[s.device.id] = s; });

            // Logic for filtering by groups and activity...
            var filteredDevs = devices.filter(function(d) {
                if (d.activeTo && new Date(d.activeTo) < now) return false;
                if (selectedGroupId === 'all') return true;
                return (d.groups || []).some(function(g) { return isChildOf(g.id, selectedGroupId); });
            });

            // (Note: Simplified rendering logic for speed - we can expand this!)
            devDiv.innerHTML = '';
            filteredDevs.slice(0, MAX_RENDER).forEach(function(d) {
                var st = statusMap[d.id];
                var days = st ? Math.floor((now - new Date(st.dateTime)) / 86400000) : 999;
                var colors = getSoftColor(days);
                var row = document.createElement('div');
                row.style.cssText = 'padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;';
                row.innerHTML = '<b>' + (d.name || d.id) + '</b> <span style="background:'+colors.bg+'; padding:2px 8px; border-radius:10px;">' + days + 'd</span>';
                devDiv.appendChild(row);
            });
            
            usrDiv.innerHTML = '<div style="padding:20px; color:#999;">Driver sync complete.</div>';
        });
    };

    // Run the initial group load
    api.call('Get', { typeName: 'Group' }, function(groups) {
        groups.forEach(function(g) { _groupMap[g.id] = g; });
        var select = document.getElementById('group-select');
        select.innerHTML = '<option value="all">All Groups</option>';
        groups.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); }).forEach(function(g) {
            var opt = document.createElement('option');
            opt.value = g.id; opt.textContent = g.name || g.id;
            select.appendChild(opt);
        });
        window.fetchData();
    });

    callback();
};
