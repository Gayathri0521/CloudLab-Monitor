
// Cognito OIDC configuration for react-oidc-context
// Region: us-east-1  |  User Pool: us-east-1_iott3QKSm

const COGNITO_DOMAIN = "https://us-east-1iott3qksm.auth.us-east-1.amazoncognito.com";
const CLIENT_ID      = "2j2hr93hl2veptaa5ju06caoic";
const REDIRECT_URI   = "http://localhost:5174";

export const cognitoAuthConfig = {
  // OIDC authority — used for .well-known/openid-configuration discovery
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_iott3QKSm",

  client_id: CLIENT_ID,

  // Must match a Callback URL registered in the Cognito App Client settings
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: "openid email",

  // Cognito publishes issuer metadata at the user-pool issuer URL, while its
  // authorization and logout endpoints are served by the hosted-UI domain.
  metadata: {
    issuer:
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_iott3QKSm",
    authorization_endpoint: `${COGNITO_DOMAIN}/oauth2/authorize`,
    token_endpoint:         `${COGNITO_DOMAIN}/oauth2/token`,
    userinfo_endpoint:      `${COGNITO_DOMAIN}/oauth2/userInfo`,
    end_session_endpoint:   `${COGNITO_DOMAIN}/logout`,
    jwks_uri:
      `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_iott3QKSm/.well-known/jwks.json`,
  },
};

// Cognito's hosted logout endpoint accepts client_id and logout_uri.
export const cognitoLogoutUrl = (() => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: REDIRECT_URI,
  });

  return `${COGNITO_DOMAIN}/logout?${params.toString()}`;
})();
