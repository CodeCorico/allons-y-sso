(function() {
  'use strict';

  window.Ractive.controllerInjection('sso-sign', [
    '$component', '$data', '$done',
  function ssoSignContext(
    $component, $data, $done
  ) {
    var SsoSignContext = $component({
          data: $data
        }),
        _$el = {
          layout: $(SsoSignContext.el)
        };

    SsoSignContext.parentRequire.set('cls', 'hide');

    SsoSignContext.on('goSSO', function() {
      window.Cookies.set('sso.referer', window.location.href, {
        expires: 1,
        path: '/'
      });

      window.location.replace('/api/sso/signin');
    });

    SsoSignContext.on('togglesso', function() {
      var openSso = SsoSignContext.parentRequire.get('cls') != 'hide';

      if (openSso) {
        SsoSignContext.parentRequire.set('cls', 'hide-sb-1');
        SsoSignContext.set('hideSB', 'show-sb-1');

        setTimeout(function() {
          SsoSignContext.parentRequire.set('cls', 'hide');
          SsoSignContext.set('hideSB', null);
        }, 350);
      }
      else {
        SsoSignContext.parentRequire.set('cls', 'show-sb-1');
        SsoSignContext.set('hideSB', 'hide-sb-1');

        setTimeout(function() {
          SsoSignContext.parentRequire.set('cls', 'show-sb-2');
          SsoSignContext.set('hideSB', 'hide-sb-2');
        }, 350);
      }
    });

    SsoSignContext.on('teardown', function() {
      SsoSignContext = null;
      _$el = null;
    });

    SsoSignContext.require().then($done);

  }]);

})();
