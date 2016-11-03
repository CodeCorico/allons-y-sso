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

    console.log('callback');
  }
}];
