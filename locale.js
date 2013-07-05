window.locale = { _current: 'en' };

locale.current = function(_) {
    if (!arguments.length) return locale._current;
    if (locale[_] !== undefined) locale._current = _;
    else if (locale[_.split('-')[0]]) locale._current = _.split('-')[0];
    return locale;
};

function t(s, o, loc) {
    if (!arguments.length) return;
    loc = loc || locale._current;

    var path = s.split('.').reverse(),
        rep = locale[loc];

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    } else {
        function missing() {
            var missing = 'Missing ' + loc + ' translation: ' + s;
            if (typeof console !== "undefined") console.error(missing);
            return missing;
        }

        if (loc !== 'en') {
            missing();
            return t(s, o, 'en');
        }

        if (o && 'default' in o) {
            return o['default'];
        }

        return missing();
    }
}
