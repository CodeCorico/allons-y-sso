'use strict';

module.exports = function() {
  if (!process.env.SSO_ENABLE || process.env.SOCKETIO == 'false') {
    return;
  }

  var path = require('path');

  require(path.resolve(__dirname, 'models/sso-service-back.js'))();
};
