OAuth2.adapter('wrike', {

  authorizationCodeURL: function(config) {
    return ('https://www.wrike.com/oauth2/authorize?response_type=code&' +
      'client_id={{CLIENT_ID}}')
        .replace('{{CLIENT_ID}}', config.clientId)
  },

  redirectURL: function(config) {
    return 'https://www.wrike.com/robots.txt';
  },
  parseAuthorizationCode: function(url) {
    // TODO: Error handling (URL may have ?error=foo_bar&error_code=43 etc).
    return url.match(/[&\?]code=([^&]+)/)[1];
  },

  accessTokenURL: function() {
    return 'https://www.wrike.com/oauth2/token';
  },

  accessTokenMethod: function() {
    return 'POST';
  },

  accessTokenParams: function(authorizationCode, config) {
    return {
      code: authorizationCode,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code'
    };
  },

  parseAccessToken: function(response) {
    var parsedResponse = JSON.parse(response);
    return {
      accessToken: parsedResponse.access_token,
      refreshToken: parsedResponse.refresh_token,
      expiresIn: parsedResponse.expires_in
    };
  }

});
