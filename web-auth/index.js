#!/usr/bin/env nodejs

'use strict';

//nodejs dependencies
const fs = require('fs');
const process = require('process');

//external dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mustache = require('mustache');

//local dependencies
const users = require('./users/users');
const options = require('./options').options;

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

const USER_COOKIE = 'username';
const AUTH_COOKIE = 'authToken';

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', rootRedirectHandler(app));
  app.get('/login.html', getLoginPage(app));
	app.post('/login.html', sendLoginPage(app));
  app.get('/register.html', getRegistrationPage(app));
  app.post('/register.html', sendRegistrationPage(app));
	app.get('/account.html', getAccountPage(app))
	app.get('/logout.html', logout(app))
}

function rootRedirectHandler(app) {
  return function(req, res) {
		const userCookie = req.cookies[USER_COOKIE];
		const authCookie = req.cookies[AUTH_COOKIE]
  if (typeof userCookie === 'undefined' || typeof authCookie === 'undefined') {
		    res.send(doMustache(app, 'login', {}));
  }
  else {
    app.users.access(userCookie, authCookie)
					.then((retObj) => {
						if (typeof retObj !== 'undefined') {
							let name = retObj.firstname + " " + retObj.lastname;
							res.send(doMustache(app, 'account', {name}));
						}
						else {
							const qError = "You have timed out"
							res.send(doMustache(app, 'login', {qError}));
						}
				})
					.catch((err) => console.error(err));
  }
  };
}


function getLoginPage(app) {
  return function(req, res) {
      res.send(doMustache(app, 'login', {}));
    }
}

function logout(app) {
  return function(req, res) {
			res.clearCookie(AUTH_COOKIE);
			res.clearCookie(USER_COOKIE);
			const qError = "You have been logged out"
      res.send(doMustache(app, 'login', {qError}));
    }
}

function sendLoginPage(app) {
  return function(req, res) {
		const username = req.body.username;
		const password = req.body.password;
		const m = username.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
		// Source: http://emailregex.com/
		if (typeof username === 'undefined' || username.trim().length === 0 || !m) {
			const qError = 'Please provide a valid Email Address'
			res.send(doMustache(app, 'login', {qError}));
		}
		if (typeof password === 'undefined' || password.trim().length === 0) {
			const qError = 'Please provide a valid password';
			res.send(doMustache(app, 'login', {qError, username}));
		}
		app.users.login(username, password)
			.then((valObj) =>	{
			if (typeof valObj !== 'undefined') {
				const authToken = valObj.authToken;
				res.cookie(USER_COOKIE, username, { maxAge: 86400*1000 });
				res.cookie(AUTH_COOKIE, authToken, { maxAge: 86400*1000 });
				app.users.access(username, authToken)
					.then((retObj) => {
						if (typeof retObj !== 'undefined') {
							let name = retObj.firstname + " " + retObj.lastname;
							res.send(doMustache(app, 'account', {name}));
						}
						else {
							const qError = "You have timed out"
							res.send(doMustache(app, 'login', {qError}));
						}
				})
					.catch((err) => console.error(err));
			}
			else {
				const qError = 'Incorrect username or password';
				res.send(doMustache(app, 'login', {qError, username}));
			}
    })
			.catch((err) => console.log("err " + err));
  };
}

function validateLogin (app, valObj, username) {
  	if (typeof valObj !== 'undefined') {
			res.redirect('account.html');
		}
		else {
			const qError = 'Incorrect username or password';
			res.send(doMustache(app, 'login', {qError, username}));
		}
}

function getRegistrationPage(app) {
  return function(req, res) {
      res.send(doMustache(app, 'register', {}));
    }
}

function getAccountPage(app) {
  return function(req, res) {
		const userCookie = req.cookies[USER_COOKIE];
		const authCookie = req.cookies[AUTH_COOKIE]
  if (typeof userCookie === 'undefined' || typeof authCookie === 'undefined') {
		    res.send(doMustache(app, 'login', {}));
  }
  else {
    app.users.access(userCookie, authCookie)
					.then((retObj) => {
						if (typeof retObj !== 'undefined') {
							let name = retObj.firstname + " " + retObj.lastname;
							res.send(doMustache(app, 'account', {name}));
						}
						else {
							const qError = "No valid login session"
							res.send(doMustache(app, 'login', {qError}));
						}
				})
					.catch((err) => console.error(err));
  }
    }
}

function sendRegistrationPage(app) {
  return function(req, res) {
		const firstname = req.body.firstname;
		const lastname = req.body.lastname;
		const username = req.body.username;
		const password = req.body.password;
		const confpassword = req.body.confpassword;
		
		if (typeof firstname === 'undefined' || firstname.trim().length === 0) {
			const qError = 'Please provide a valid first name'
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}
		if (typeof lastname === 'undefined' || lastname.trim().length === 0) {
			const qError = 'Please provide a valid last name';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}
		
		const m = username.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
		
		if (typeof username === 'undefined' || username.trim().length === 0 || !m) {
			const qError = 'Please provide a valid email address'
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}
	
		if (typeof password === 'undefined' || password.trim().length === 0) {
			const qError = 'Please provide a valid password';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}
	
		const g = password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/);
	
		if (!g) {
			const qError = 'Password must be at least 8 characters and contain at least one number';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}

		if (typeof confpassword === 'undefined' || confpassword.trim().length === 0) {
			const qError = 'Please provide a valid password confirmation';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}

		if (password !== confpassword) {
			const qError = 'Please make sure your passwords match';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}

		app.users.register(username, password, firstname, lastname)
			.then((valObj) =>	{
			if (typeof valObj !== 'undefined') {
			const authToken = valObj.authToken;
			res.cookie(USER_COOKIE, username, { maxAge: 86400*1000 });
			res.cookie(AUTH_COOKIE, authToken, { maxAge: 86400*1000 });
			app.users.access(username, authToken)
					.then((retObj) => {
						if (typeof retObj !== 'undefined') {
							let name = retObj.firstname + " " + retObj.lastname;
							res.send(doMustache(app, 'account', {name}));
						}
						else {
							const qError = "You have timed out"
							res.send(doMustache(app, 'login', {qError}));
						}
				})
					.catch((err) => console.error(err));
		}
		else {
			const qError = 'This account already exists';
			res.send(doMustache(app, 'register', {qError, firstname, lastname, username}));
		}
    })
			.catch((err) => console.log("err " + err));
  };
}

/************************ Utility functions ****************************/

function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}

function errorPage(app, errors, res) {
  if (!Array.isArray(errors)) errors = [ errors ];
  const html = doMustache(app, 'errors', { errors: errors });
  res.send(html);
}
  
/*************************** Initialization ****************************/

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

function setup() {
  process.chdir(__dirname);
  const port = options.port;
  const app = express();
  app.use(cookieParser());
  setupTemplates(app);
  app.users = users;
  app.use(express.static(STATIC_DIR));
  app.use(bodyParser.urlencoded({extended: true}));
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

setup();
