module.exports = function() {
  'use strict';

  DependencyInjection.service('SSOService', function($AbstractService, $serverUrl) {

    var SSO_CALLBACK_PATH = '/api/sso/callback',
        SSO_STRATEGY = 'saml',
        SSO_NAMEID_FORMAT = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

        fs = require('fs'),
        path = require('path'),
        passport = require('passport'),
        SamlStrategy = require('passport-saml').Strategy;

    return new (function SSOService() {

      $AbstractService.call(this);

      var _this = this,
          _privateCertFile = path.resolve('./sso.crt'),
          _decryptionPvkFile = path.resolve('./sso.key'),
          _destinationPvkFile = path.resolve('./sso-destination.crt'),
          _providerMetadatXML = null;

      try {
        fs.statSync(_privateCertFile);
        fs.statSync(_destinationPvkFile);
        fs.statSync(_decryptionPvkFile);
      }
      catch (err) {
        throw new Error('Please ensure that the "sso.crt", "sso.key" and "sso-destination.crt" files are in the root path of the project.');
      }

      var _privateCert = fs.readFileSync(_privateCertFile, 'utf-8'),
          _decryptionPvk = fs.readFileSync(_decryptionPvkFile, 'utf-8'),
          _destinationPvk = fs.readFileSync(_destinationPvkFile, 'utf-8');

      _destinationPvk = _destinationPvk
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '')
        .trim();

      this.privateCert = function() {
        return _privateCert;
      };

      this.decryptionPvk = function() {
        return _decryptionPvk;
      };

      this.authenticate = function(req, res, next, callback) {
        passport.authenticate(SSO_STRATEGY, {}, callback)(req, res, next);
      };

      this.strategy = function(full) {
        var config = {
          path: SSO_CALLBACK_PATH,
          entryPoint: process.env.SSO_SERVICE_URL,
          logoutUrl: process.env.SSO_SERVICE_LOGOUT_URL,
          issuer: $serverUrl,
          validateInResponseTo: true,
          decryptionPvk: _decryptionPvk,
          cert: _destinationPvk,
          acceptedClockSkewMs: 3600,
          callbackUrl: $serverUrl + '/api/sso/callback',
          logoutCallbackUrl: $serverUrl + '/api/sso/logout',
          authnRequestsSigned: false,
          wantAssertionsSigned: false,
          disableRequestedAuthnContext: true
        };

        if (full) {
          config.identifierFormat = SSO_NAMEID_FORMAT;
          config.protocol = 'https';
          config.privateCert = _privateCert;
        }

        return new SamlStrategy(config, function(profile, done) {
          profile = profile || {};

          return done(null, {
            id: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/samAccountName'] || null,
            email: (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '').toLowerCase(),
            identifier: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null,
            userName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || null,
            firstName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || null,
            lastName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || null
          });
        });
      };

      this.providerMetadataXML = function() {
        if (_providerMetadatXML) {
          return _providerMetadatXML;
        }

        _providerMetadatXML = _this.strategy(true).generateServiceProviderMetadata(_privateCert);

        return _providerMetadatXML;
      };

      this.signUser = function(req, res, user, callback) {
        var UserModel = DependencyInjection.injector.service.get('UserModel');

        user.firstname = user.firstName || '';
        user.lastname = user.lastName || '';
        user.username = user.userName || '';

        UserModel.createUser(user, function(err, newUser, session) {
          if (err && err == 'exists') {
            return UserModel.signin(user.email, null, function(err, user, session) {
              if (err || !session) {
                return callback();
              }

              res.cookie('session', session.session, {
                maxAge: session.duration,
                signed: true
              });

              callback();
            }, true);
          }
          else if (err || !session) {
            return callback();
          }

          res.cookie('session', session.session, {
            maxAge: session.duration,
            signed: true
          });

          if (!process.env.SSO_DIRECT_GROUPS) {
            return callback();
          }

          var async = require('async'),
              GroupModel = DependencyInjection.injector.model.get('GroupModel'),
              groupsUrls = process.env.SSO_DIRECT_GROUPS.split(';');

          async.eachSeries(groupsUrls, function(groupUrl, nextGroup) {

            GroupModel
              .findOne({
                url: groupUrl
              })
              .exec(function(err, group) {
                if (err || !group) {
                  return nextGroup();
                }

                group.addMember(newUser, true, function() {
                  GroupModel.refreshGroup(group);
                  UserModel.refreshUsersGroupMembers(group.id);

                  nextGroup();
                });
              });
          }, function() {
            callback();
          });
        }, true);
      };

      this.logout = function(req, callback) {
        if (!req || !req.user || !req.user.ssoIdentifier) {
          return callback(null, null);
        }

        _this.strategy().logout({
          user: {
            nameIDFormat: SSO_NAMEID_FORMAT,
            nameID: req.user.ssoIdentifier
          }
        }, callback);
      };

      passport.serializeUser(function(user, done) {
        done(null, user);
      });

      passport.deserializeUser(function(user, done) {
        done(null, user);
      });

      passport.use(_this.strategy());
    })();
  });
};
