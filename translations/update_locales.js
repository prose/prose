/* Downloads the latest translations from Transifex */
var request = require('request');
var yaml = require('js-yaml');
var fs = require('fs');
var _ = require('underscore');

var api = 'http://www.transifex.com/api/2/';
var auth = JSON.parse(fs.readFileSync('./translations/transifex.auth', 'utf8'));
var project = api + 'project/prose/';

/*
 * Transifex oddly doesn't allow anonymous downloading
 * auth is stored in transifex.auth in a json object:
 *  {
 *      "user": "username",
 *      "pass": "password"
 *  }
 */
asyncMap(['application'], getResource, function(err, locales) {
    if (err) return console.log(err);
    var locale = yaml.load(fs.readFileSync('./translations/application.yaml', 'utf8'));

    locales.forEach(function(l) {
        locale = _.extend(locale, l);
    });

    for (var i in locale) {
        fs.writeFileSync('./translations/locales/' + i + '.json', JSON.stringify(locale[i], null, 4));
    }
});

function getResource(resource, callback) {
    resource = project + 'resource/' + resource + '/';
    getLanguages(resource, function(err, lang) {
        if (err) return callback(err);

        asyncMap(lang, getLanguage(resource), function(err, results) {
            if (err) return callback(err);
            var locale = {};

            results.forEach(function(result, i) {
                locale[lang[i].code] = yaml.load(result)[lang[i].code];
            });

            callback(null, locale);
        });

        fs.writeFileSync('translations/locales.js', '// Automatically Generated\n\nmodule.exports = ' + JSON.stringify(lang) + ';');
    });
}

function getLanguage(resource) {
    return function(lang, callback) {
        request.get(resource + 'translation/' + lang.code, { auth : auth },
            function(err, resp, body) {
            if (err) return callback(err);
            callback(null, JSON.parse(body).content);
        });
    };
}

function getLanguages(resource, callback) {
    request.get(resource + '?details', { auth: auth },
        function(err, resp, body) {
        if (err) return callback(err);
        callback(null, JSON.parse(body).available_languages.map(function(d) {
            return {
              name: d.name,
              code: d.code.replace(/_/g, '-')
            }
        }).filter(function(d) {
            return d !== 'en';
        }));
    });
}

function asyncMap(inputs, func, callback) {
    var remaining = inputs.length,
        results = [],
        error;

    inputs.forEach(function(d, i) {
        func(d, function done(err, data) {
            if (err) error = err;
            results[i] = data;
            remaining --;
            if (!remaining) callback(error, results);
        });
    });
}
