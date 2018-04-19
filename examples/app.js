var express = require('express')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')
  , IBMCloudOAuth2Strategy = require('../lib')
  , errorHandler = require('express-error-handler')
  , ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat',
				  resave: false,
				  saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

app.get('/account',
	  ensureLoggedIn('/login'),
	  function(req, res) {
	    res.send('Hello ' + req.user.username);
	  });

app.get('/',
		  ensureLoggedIn('/login'),
		  function(req, res) {
		    res.send('Hello');
		  });

app.get('/login',
	  function(req, res) {
	    res.send('<html><body><a href="/auth/ibm">Sign in with IBM ID</a></body></html>');
	  });


var client_id = "<your client id>";
var client_secret = "<your client id>";

passport.use('bluemix', new IBMCloudOAuth2Strategy({
	authorizationURL : 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize',
	tokenURL : 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token',
	clientID : client_id,
	scope: 'profile',
	grant_type: 'authorization_code',
	clientSecret : client_secret,
	callbackURL : 'http://localhost:3000/auth/ibm/callback',
	profileURL: 'https://idaas.ng.bluemix.net/idaas/resources/profile.jsp'
}, function(accessToken, refreshToken, profile, done) {
	profile.accessToken = accessToken;
	profile.refreshToken = refreshToken;
	return done(null, profile);
}));


app.get('/auth/ibm', passport.authenticate('bluemix', {requestedAuthnPolicy: 'http://www.ibm.com/idaas/authnpolicy/basic'}));
app.get('/auth/ibm/callback',
				passport.authenticate('bluemix'),
				function(req, res) {
				res.send(req.session);
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
