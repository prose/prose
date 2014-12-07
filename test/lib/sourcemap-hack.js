
/**
A little hack to make failing test errors get logged to console (instead of
just displayed by mocha reporter), so that Chrome will show correct file/line
numbers.  (Requires running opening test/index.html in Chrome rather than 
using the command line test.)
*/

module.exports = function(base) {
  return function SourcemapReporter(runner) {
    runner.on('test end', ontestend);
    base.apply(this, Array.prototype.slice.call(arguments));
  };
}

function ontestend() {
  if(this.test.state !== 'failed') { 
    return; 
  }
  if(this.test.err)
    console.log(this.test.err.stack);
  else
    console.log(this.test.state, this.test);
};
