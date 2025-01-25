/**
 * @file Node.js client for QuickBooks V3 API
 * @name node-quickbooks
 * @author Michael Cohen <michael_cohen@intuit.com>
 * @license ISC
 * @copyright 2014 Michael Cohen
 */

var request   = require('request'),
    uuid      = require('uuid'),
    debug     = require('request-debug'),
    util      = require('util'),
    formatISO = require('date-fns/fp/formatISO'),
    _         = require('underscore'),
    Promise   = require('bluebird'),
    version   = require('./package.json').version,
    xmlParser = new (require('fast-xml-parser').XMLParser)();

module.exports = QuickBooks

QuickBooks.APP_CENTER_BASE = 'https://appcenter.intuit.com';
QuickBooks.V3_ENDPOINT_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com'; //'https://sandbox-quickbooks.api.intuit.com/v3/company/' 'https://quickbooks.api.intuit.com';
QuickBooks.QUERY_OPERATORS = ['=', 'IN', '<', '>', '<=', '>=', 'LIKE'];
QuickBooks.TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
QuickBooks.REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

var OAUTH_ENDPOINTS = {
  '1.0a': function (callback) {
    callback({
      REQUEST_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_request_token',
      ACCESS_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_access_token',
      APP_CENTER_URL: QuickBooks.APP_CENTER_BASE + '/Connect/Begin?oauth_token=',
      RECONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/reconnect',
      DISCONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/disconnect'
    });
  },

  '2.0': function (callback, discoveryUrl) {
    var NEW_ENDPOINT_CONFIGURATION = {};
    request({
      url: discoveryUrl,
      headers: {
        Accept: 'application/json'
      }
    }, function (err, res) {
      if (err) {
        console.log(err);
        return err;
      }

      var json;
      try {
          json = JSON.parse(res.body);
      } catch (error) {
          console.log(error);
          return error;
      }
      NEW_ENDPOINT_CONFIGURATION.AUTHORIZATION_URL = json.authorization_endpoint;;
      NEW_ENDPOINT_CONFIGURATION.TOKEN_URL = json.token_endpoint;
      NEW_ENDPOINT_CONFIGURATION.USER_INFO_URL = json.userinfo_endpoint;
      NEW_ENDPOINT_CONFIGURATION.REVOKE_URL = json.revocation_endpoint;
      callback(NEW_ENDPOINT_CONFIGURATION);
    });
  }
};

OAUTH_ENDPOINTS['1.0'] = OAUTH_ENDPOINTS['1.0a'];

/**
 * Sets endpoints per OAuth version
 *
 * @param version - 1.0 for OAuth 1.0a, 2.0 for OAuth 2.0
 * @param useSandbox - true to use the OAuth 2.0 sandbox discovery document, false (or unspecified, for backward compatibility) to use the prod discovery document.
 */
QuickBooks.setOauthVersion = function (version, useSandbox) {
  version = (typeof version === 'number') ? version.toFixed(1) : version;
  QuickBooks.version = version;
  var discoveryUrl = useSandbox ? 'https://developer.intuit.com/.well-known/openid_sandbox_configuration/' : 'https://developer.api.intuit.com/.well-known/openid_configuration/';
  OAUTH_ENDPOINTS[version](function (endpoints) {
    for (var k in endpoints) {
      QuickBooks[k] = endpoints[k];
    }
  }, discoveryUrl);
};

QuickBooks.setOauthVersion('1.0');

/**
 * Node.js client encapsulating access to the QuickBooks V3 Rest API. An instance
 * of this class should be instantiated on behalf of each user accessing the api.
 *
 * @param consumerKey - application key
 * @param consumerSecret  - application password
 * @param token - the OAuth generated user-specific key
 * @param tokenSecret - the OAuth generated user-specific password
 * @param realmId - QuickBooks companyId, returned as a request parameter when the user is redirected to the provided callback URL following authentication
 * @param useSandbox - boolean - See https://developer.intuit.com/v2/blog/2014/10/24/intuit-developer-now-offers-quickbooks-sandboxes
 * @param debug - boolean flag to turn on logging of HTTP requests, including headers and body
 * @param minorversion - integer to set minorversion in request
 * @constructor
 */
function QuickBooks(consumerKey, consumerSecret, token, tokenSecret, realmId, useSandbox, debug, minorversion, oauthversion, refreshToken) {
  var prefix = _.isObject(consumerKey) ? 'consumerKey.' : '';
  this.consumerKey = eval(prefix + 'consumerKey');
  this.consumerSecret = eval(prefix + 'consumerSecret');
  this.token = eval(prefix + 'token');
  this.tokenSecret = eval(prefix + 'tokenSecret');
  this.realmId = eval(prefix + 'realmId');
  this.useSandbox = eval(prefix + 'useSandbox');
  this.debug = eval(prefix + 'debug');
  this.endpoint = this.useSandbox
    ? 'https://sandbox-quickbooks.api.intuit.com'  // Use sandbox URL
    : 'https://quickbooks.api.intuit.com';         // Use production URL
  this.minorversion = eval(prefix + 'minorversion') || 75;
  this.oauthversion = eval(prefix + 'oauthversion') || '1.0a';
  this.refreshToken = eval(prefix + 'refreshToken') || null;
  if (!eval(prefix + 'tokenSecret') && this.oauthversion !== '2.0') {
    throw new Error('tokenSecret not defined');
  }
}

/**
 *
 * Use the refresh token to obtain a new access token.
 *
 *
 */

QuickBooks.prototype.refreshAccessToken = function(callback) {
    var auth = (Buffer.from(this.consumerKey + ':' + this.consumerSecret).toString('base64'));

    var postBody = {
        url: QuickBooks.TOKEN_URL,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + auth,
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
        }
    };

    request.post(postBody, (function (e, r, data) {
        if (r && r.body && r.error!=="invalid_grant") {
            var refreshResponse = JSON.parse(r.body);
            this.refreshToken = refreshResponse.refresh_token;
            this.token = refreshResponse.access_token;
            if (callback) callback(e, refreshResponse);
        } else {
            if (callback) callback(e, r, data);
        }
    }).bind(this));
};

/**
 * Use either refresh token or access token to revoke access (OAuth2).
 *
 * @param useRefresh - boolean - Indicates which token to use: true to use the refresh token, false to use the access token.
 * @param {function} callback - Callback function to call with error/response/data results.
 */
QuickBooks.prototype.revokeAccess = function(useRefresh, callback) {
    var auth = (Buffer.from(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
    var revokeToken = useRefresh ? this.refreshToken : this.token;
    var postBody = {
        url: QuickBooks.REVOKE_URL,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + auth,
        },
        form: {
            token: revokeToken
        }
    };

    request.post(postBody, (function(e, r, data) {
        if (r && r.statusCode === 200) {
            this.refreshToken = null;
            this.token = null;
            this.realmId = null;
        }
        if (callback) callback(e, r, data);
    }).bind(this));
};