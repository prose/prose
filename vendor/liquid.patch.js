module.exports = function() {
  Liquid.readTemplateFile = (function(path) {
    var file = this.collection.findWhere({ path: '_includes/' + path });
    if (file) {
      return file.getContentSync().responseText;
    } else {
      throw ("File Not Found:" + path);
    }
  }).bind(this);

  // This is the include tag from Jekyll see: http://git.io/PsVGwg
  Liquid.Template.registerTag( 'include', Liquid.Tag.extend({

    paramSyntax: /([\w-]+)\s*=\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w\.-]+))/,

    init: function(tag, markup, tokens) {
      var fileParamMatches = (markup || '').strip().split(/\s+(.+)?/);
      if (fileParamMatches) {
        this.templateName = fileParamMatches[0];
        this.rawParams = fileParamMatches[1];
      } else {
        throw ("Error in tag 'include " + markup + "' - Valid syntax: {% include file.ext param='value' param2='value' %}");
      }
      this._super(tag, markup, tokens);
    },

    render: function(context) {
      var resolvedName = this.retrieve_variable(this.templateName, context) || this.templateName;
      var targetTemplate = Liquid.readTemplateFile(resolvedName);
      var partial = Liquid.parse(targetTemplate);

      // Load context with parameters
      var params = this.parseParams(this.rawParams, context);
      context.set('include', params);

      var output = partial.render(context);
      output = [output].flatten().join('');
      return output;
    },

    // Test for the possibility of {{variable}} and check the context
    retrieve_variable: function(possiblePath, context) {
      var match = possiblePath.match(/\{\{([\w\-\.]+)\}\}/);
      if (match) {
        var variable = context.get(match[1]);
        if (variable) {
          return variable;
        } else {
          throw ("No variable " + match[1] + "was found in include tag");
        }
      }
    },

    parseParams: function(rawParams, context) {
      var params = {};
      var markup = rawParams || '';
      var match;
      while ((match = markup.match(this.paramSyntax))) {
        // Cut off current parameter
        markup = markup.substr(match[0].length);

        var value;
        if (match[2]) {
          value = match[2].replace(/\\"/g, '"');
        } else if (match[3]) {
          value = match[3].replace(/\\'/g, "'");
        } else if (match[4]) {
          value = context.get(match[4]); // Its a variable most likely
         }
        params[match[1]] = value;
      }
      return params;
    }
  }));


  Liquid.Block.prototype.renderAll = function(list, context) {
    return (list || []).map(function(token, i){
      var output = '';
      try { // hmmm... feels a little heavy
        output = ( token['render'] ) ? token.render(context) : token;
      } catch(e) {
        console.log(context.handleError(e));
      }
      return output;
    });
  };

  Liquid.Template.registerTag( 'highlight', Liquid.Block.extend({
    tagSyntax: /(\w+)/,

    init: function(tagName, markup, tokens) {
      var parts = markup.match(this.tagSyntax);
      if( parts ) {
        this.to = parts[1];
      } else {
        throw ("Syntax error in 'highlight' - Valid syntax: hightlight [language]");
      }
      this._super(tagName, markup, tokens);
    },
    render: function(context) {
      var output = this._super(context);
      return '<pre>' + output[0] + '</pre>';
    }
  }));

  // Unless tag wasn't properly returning output
  Liquid.Template.registerTag( 'unless', Liquid.Template.tags['if'].extend({

    render: function(context) {
      var self = this,
          output = '';
      context.stack(function(){
        var block = self.blocks[0];
        if( !block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
        for (var i=1; i < self.blocks.length; i++) {
          var block = self.blocks[i];
          if( block.evaluate(context) ) {
            output = self.renderAll(block.attachment, context);
            return;
          }
        };
      });
      return [output].flatten().join('');
    }
  }));

  Liquid.Block.prototype.unknownTag = function(tag, params, tokens) {
    switch(tag) {
      case 'else': console.log(this.blockName +" tag does not expect else tag"); break;
      case 'end':  console.log("'end' is not a valid delimiter for "+ this.blockName +" tags. use "+ this.blockDelimiter); break;
      default:     console.log("Unknown tag: "+ tag);
    }
  };

  // Contains should work with strings or arrays
  Liquid.Condition.operators.contains = function(l,r) {
    if (typeof l === 'object') {
      return l.include(r);
    } else {
      return (l.indexOf(r) !== -1);
    }
  }

  // Don't use regex for replace functions. Messes up '.'
  Liquid.Template.registerFilter({
    replace: function(input, string, replacement) {
      replacement = replacement || '';
      return input.toString().split(string).join(replacement);
    },

    replace_first: function(input, string, replacement) {
      replacement = replacement || '';
      return input.toString().replace(string, replacement);
    }
  });
}
