'use strict'
let shouldLog = (process.env.NODE_DEBUG || '').split(',').indexOf('expectsrv') >= 0

module.exports = function () {
  if (shouldLog) {
    console.log.apply(console, ['EXPECT-SRV'].concat(Array.prototype.slice.call(arguments)))
  }
}
