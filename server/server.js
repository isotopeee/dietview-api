var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// configure middlewares

var helmet = require('helmet');
var bodyParser = require('body-parser');
app.use(helmet());
app.use(bodyParser.json()); // parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded

// Passport configurators..
const loopbackPassport = require('loopback-component-passport');
const PassportConfigurator = loopbackPassport.PassportConfigurator;
const passportConfigurator = new PassportConfigurator(app);


// boot scripts mount components like REST API
boot(app, __dirname);

// Load the provider configurations
let config = {};
try {
  config = require('../providers.json');
} catch (err) {
  console.error('Please configure your passport strategy in `providers.json`.');
  console.error('Copy `providers.json.template` to `providers.json` and replace the clientID/clientSecret values with your own.');
  process.exit(1);
}

// Initialize passport
passportConfigurator.init();


// Set up related models
passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential
});
// Configure passport strategies for third party auth providers
for (var s in config) {
  var c = config[s];
  c.session = c.session !== false;
  c.profileToUser = customProfileToUser;
  passportConfigurator.configureProvider(s, c);
}


app.start = function () {
  // start the web server
  return app.listen(process.env.PORT || 3000, function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}

function customProfileToUser(provider, {_json}, options) {

  var userInfo = {
    username: _json.email,
    password: 'secret',
    email: _json.email,
    account: {
      profile: {
        firstName: _json.first_name,
        lastName: _json.last_name
      },
      vitals: {

      },
      role: 'customer'
    },
    realm: 'dietview',
    status: 'active'
  };
  console.log('JSON');
  console.log(_json)
  return userInfo;
}