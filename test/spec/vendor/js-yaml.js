var yaml = require('js-yaml');
var cm = require('codemirror');

describe('Js-yaml coverage', function () {
  it('deals with quotes around booleans', function () {
    var quotes = 'quotes: "false"\nnoquotes: false';
    var loaded = yaml.safeLoad(quotes);
    expect(loaded.quotes).equal('false');
    expect(loaded.noquotes).not.ok;

    var dumped = yaml.safeDump(loaded);
    expect(/quotes: 'false'/.test(dumped)).ok;
    expect(/noquotes: false/.test(dumped)).ok;
  });

  it('has behavior w/r/t semicolons', function () {
    expect(yaml.safeLoad('ok: whatever')).deep.equal({ok: 'whatever'});
    expect(yaml.safeLoad('ok&58; whatever')).equal('ok&58; whatever');
  })
});
