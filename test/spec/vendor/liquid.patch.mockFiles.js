module.exports = function() {
  Liquid.readTemplateFile = (function(path) {
    return "{{ include.var1 }}\n" +
           "{{ include.var2 }}\n" +
           "{{ include.var3 }}\n";
  }).bind(this);
}
