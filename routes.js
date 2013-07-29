var browserify = require('browserify-middleware')
  , path = require('path')
  , fs = require('fs')
  , constants = require('./util/constants')

var jsFileMatcher = RegExp.prototype.test.bind(/\.js$/)

function send404(req, res) {
  res.send(404)
}

function applyRoutes(app) {
  // client script (browserified)
  browserify.settings({ transform: [ 'browserify-ngmin' ] })
  app.get('/scripts/client.js', browserify(require.resolve('./client/index.js')))

  // api methods (through HTTP, which should be few, since most stuff is done through websockets)
  var apiFiles = fs.readdirSync(path.join(__dirname, 'api'))
    , baseApiPath = '/api/1/'
  apiFiles.filter(jsFileMatcher).forEach(function(filename) {
    var f = require('./api/' + filename)
    f(app, baseApiPath)
  })
  // error out on any API URIs that haven't been explicitly handled, so that we don't end up
  // sending back HTML due to the wildcard rule below
  app.get('/api/*', send404)
    .post('/api/*', send404)
    .put('/api/*', send404)
    .delete('/api/*', send404)

  // partials
  app.get('/partials/:name', function(req, res) {
    var partialPath = path.join('partials', req.params.name)
      , templateData = { constants: constants }
    res.render(partialPath, templateData, function (err, html) {
      if (err) {
        send404(req, res)
      }

      res.end(html)
    })
  })

  // common requests that we don't want to return the regular page for
  // TODO(tec27): we should probably do something based on expected content type as well
  app.get('/robots.txt', send404)

  // catch-all for the remainder, renders the index and expects angular to handle routing clientside
  app.get('*', function(req, res) {
    res.render('index')
  })
}

module.exports = applyRoutes
