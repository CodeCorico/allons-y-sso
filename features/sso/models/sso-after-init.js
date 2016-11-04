'use strict';

module.exports = function($done) {
  if (!process.env.SSO_ENABLE || process.env.SOCKETIO == 'false') {
    return $done();
  }

  if (!process.env.SSO_PREVENT_SIGNUP_DOMAINS) {
    return $done();
  }

  var UserModel = DependencyInjection.injector.controller.get('UserModel'),
      domains = process.env.SSO_PREVENT_SIGNUP_DOMAINS.split(';');

  function canSignCondition(args, callback) {
    if (!args.email) {
      return callback(null);
    }

    for (var i = 0; i < domains.length; i++) {
      if (args.email.match(new RegExp('@' + domains[i] + '$', 'g'))) {
        return callback('Please use the SSO button for this email address.');
      }
    }

    return callback(null);
  }

  UserModel.canSigninCondition(canSignCondition);
  UserModel.canSignupCondition(canSignCondition);

  $done();
};
