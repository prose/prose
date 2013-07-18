function tryParse(obj) {
  try {
    return JSON.parse(obj);
  } catch(e) {}

  return obj;
}

function tryStringify(obj) {
  if (typeof obj !== 'object' || !JSON.stringify) return obj;
  return JSON.stringify(obj);
}

var cookie = {};

cookie.set = function(name, value, expires, path, domain) {
  var pair = escape(name) + '=' + escape(tryStringify(value));

  if (!!expires) {
    if (expires.constructor === Number) pair += ';max-age=' + expires;
    else if (expires.constructor === String) pair += ';expires=' + expires;
    else if (expires.constructor === Date)  pair += ';expires=' + expires.toUTCString();
  }

  pair += ';path=' + ((!!path) ? path : '/');
  if(!!domain) pair += ';domain=' + domain;

  document.cookie = pair;
  return cookie;
};

cookie.setObject = function(object, expire, path, domain) {
  for(var key in object) cookie.set(key, object[key], expires, path, domain);
  return cookie;
};

cookie.get = function(name) {
  var obj = cookie.getObject();
  return obj[name];
};

cookie.getObject = function() {
  var pairs = document.cookie.split(/;\s?/i);
  var object = {};
  var pair;

  for (var i in pairs) {
    if (typeof pairs[i] === 'string') {
      pair = pairs[i].split('=');
      if (pair.length <= 1) continue;
      object[unescape(pair[0])] = tryParse(unescape(pair[1]));
    }
  }

  return object;
};

cookie.unset = function(name) {
  var date = new Date(0);
  document.cookie = name + '=; expires=' + date.toUTCString();
  return cookie;
};

cookie.clear = function() {
  var obj = cookie.getObject();
  for(var key in obj) cookie.unset(key);
  return object;
};

module.exports = cookie;
