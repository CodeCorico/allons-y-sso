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
    SSOService.authenticate($req, $res, $next, function(err, user) {
      if (err || !user || !user.email) {
        return $next(err || (user && !user.email ? 'no email' : 'no user'));
      }

      $req.logIn(user, function(err) {
        if (err) {
          return $next(err);
        }

        SSOService.signUser($req, $res, user, function() {
          var cookies = $req.cookies || {},
              referer = cookies['sso.referer'] || '/';

          $res.clearCookie('sso.referer');

          $res.redirect(referer);
        });
      });
    });
  }
}, {
  method: ['GET', 'POST'],
  url: 'sso/logout',
  controller: function($res) {
    $res.redirect('/');
  }
}];
