var patch = require('../../../vendor/liquid.patch');
var mocks = require('./liquid.patch.mockFiles');
var expect = require('chai').expect;

describe('liquid.patch', function() {
  patch.apply(this);
  mocks.apply(this);

  describe('includeTag', function() {
    it('should accept valid syntax', function() {
      var render = function () {
        return Liquid.parse("{% include test.html variable='test' %}").render();
      }
      expect(render).to.not.throw();
    })

    it('should throw obviously invalid syntax', function() {
      var render = function () {
        return Liquid.parse("{{ include test.html variable='test' %}").render();
      }
      expect(render).to.throw();
    })

    it('should evaluate an argument', function() {
      var render = function () {
        return Liquid.parse("{% include test.html var1='test1' %}").render();
      }
      expect(render()).to.equal("test1\n\n\n");
    })

    it('should evaluate a few arguments', function() {
      var render = function () {
        return Liquid.parse("{% include test.html var1='test1' var2='test2' var3='test3' %}").render();
      }
      expect(render()).to.equal("test1\ntest2\ntest3\n");
    })

    it('should interpret variables in arguments', function() {
      var render = function () {
        return Liquid.parse("{% include test.html var1=shoe var2= shoe var3=shoe %}").render({ shoe: 'box'});
      }
      expect(render()).to.equal("box\nbox\nbox\n");
    })
  });
});
