'use strict';

module.exports = [{
  method: 'GET',
  url: 'sso/metadata',
  controller: function($req, $res, SSOService) {
    $res.writeHead(200, {
      'Content-Type': 'application/xml'
    });
    $res.end(SSOService.providerMetadataXML(), 'binary');
  }
}, {
  method: 'GET',
  url: 'sso/signin',
  controller: function($req, $res, $next, SSOService) {
    SSOService.authenticate($req, $res, $next, function(err, user) {
      if (err || !user || !user.email) {
        return $next(err || (!user.email ? 'no email' : 'no user'));
      }

      $res.send({
        success: true
      });
    });
  }
}, {
  method: ['GET', 'POST'],
  url: 'sso/callback',
  controller: function($req, $res, $next, SSOService) {
    var path = require('path'),
        token = $req.query.token;

    if (!token) {
      return $res.redirect('/');
    }

    SSOService.authenticate($req, $res, $next, null, function(err, user) {
      if (err || !user || !user.email) {
        return $next(err || (!user.email ? 'no email' : 'no user'));
      }

      $req.logIn(user, function(err) {
        if (err) {
          return $next(err);
        }

        SSOService.signUser($req, $res, $req.signedCookies.session, user, function() {
          $res.sendFile(path.resolve(__dirname, '../views/html/sso-callback.html'));
        });
      });
    });
  }
}, {
  method: ['GET', 'POST'],
  url: 'sso/callback-logout',
  controller: function($res) {
    $res.redirect('/');
  }
}];
