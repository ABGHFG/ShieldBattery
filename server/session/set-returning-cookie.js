module.exports = function(ctx) {
  ctx.cookies.set('returning', 'true', { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 })
}
