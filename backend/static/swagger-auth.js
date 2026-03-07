window.addEventListener('load', function() {
  var token = localStorage.getItem('swagger_access_token');
  if (!token) {
    return;
  }
  var swaggerUi = window.ui;
  if (swaggerUi) {
    swaggerUi.preauthorizeApiKey('OAuth2PasswordBearer', 'Bearer ' + token);
  }
});
