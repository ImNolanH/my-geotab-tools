// This function will be called by our loader
window.initFleetHealth = function(api, state, callback) {
    var _groupMap = {};
    var MAX_RENDER = 150;

    // ... All your helper functions (getSoftColor, isChildOf, fetchData) go here ...
    // Note: Use the exact logic from the previous script, 
    // but we wrap the initialize/focus/blur inside this function.

    // Example of the setup:
    api.call('Get', { typeName: 'Group' }, function(groups) {
        groups.forEach(function(g) { _groupMap[g.id] = g; });
        var select = document.getElementById('group-select');
        select.innerHTML = '<option value="all">All Groups</option>';
        groups.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); }).forEach(function(g) {
            var opt = document.createElement('option');
            opt.value = g.id; opt.textContent = g.name || g.id;
            select.appendChild(opt);
        });
        window.fetchData(api, _groupMap); // Pass API ref
    });
    
    callback();
};
