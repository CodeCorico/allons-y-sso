'use strict';

module.exports = function($server) {
  if (!process.env.SSO_ENABLE || process.env.SOCKETIO == 'false') {
    return;
  }

  var path = require('path'),
      fs = require('fs-extra'),
      passport = require('passport'),
      sourcePatch = path.resolve(__dirname, 'saml-patch/saml.js');

  if (fs.existsSync('./node_modules/passport-saml')) {
    fs.copySync(sourcePatch, './node_modules/passport-saml/lib/passport-saml/saml.js');
  }
  if (fs.existsSync(path.resolve(__dirname, '../../node_modules/passport-saml'))) {
    fs.copySync(sourcePatch, path.resolve(__dirname, '../../node_modules/passport-saml/lib/passport-saml/saml.js'));
  }

  $server.use(passport.initialize());

  require(path.resolve(__dirname, 'models/sso-service-back.js'))();
};
