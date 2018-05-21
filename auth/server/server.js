const https = require('https');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const passwordHash = require('password-hash');
const bodyParser = require('body-parser');
const fs = require('fs');
var sslDir;
var inPort;
var authTimeout;
const app = express();
const PORT = 443;
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const MOVED_PERMANENTLY = 301;
const FOUND = 302;
const SEE_OTHER = 303;
const NOT_MODIFIED = 303;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

// source (hashing): https://www.npmjs.com/package/password-hash)
// source (auth): https://auth0.com/learn/token-based-authentication-made-easy/

function serve(model, options) {
  const app = express();
	app.locals.model = model;
  app.locals.port = options.port;
	sslDir = options.sslDir;
	authTimeout = options.authTimeout;
	setupRoutes(app);
	https.createServer({
	  key: fs.readFileSync(sslDir +'/key.pem'),
	  cert: fs.readFileSync(sslDir + '/cert.pem'),
	}, app).listen(options.port);
}

function setupRoutes(app) {
  app.use('/users/:id', bodyParser.json());
  app.use('/users/:id', cacheUser(app));
	app.put('/users/:id', regUser(app));
  app.put('/users/:id/auth', authUser(app));
  app.get('/users/:id', getUser(app));
}

module.exports = {
  serve: serve
}

function getUser(app) {
  return function(request, response) {
    if (!request.user) {
      response.status(NOT_FOUND).send({ "status": "ERROR_NOT_FOUND",
	  "info": `user ${request.user.id} not found`
	})
	}
    else {
      var tokenB = request.headers.authorization;
			var token = tokenB.slice(7);
  		jwt.verify(token, 'supersecret', function(err, decoded){
    	if(!err){
				var myObj = request.user
				delete myObj.pw
      	response.json(myObj);
    } else {
      	response.status(401).send({ "status": "ERROR_UNAUTHORIZED",
	  "info": `/users/${request.user.id} requires a bearer authentication header`
	})
    }
  })
    }
}
}

function regUser(app) {
  return function(request, response) {
    const userInfo = request.body;
    const id = request.params.id;
		const pw = request.query.pw;
    if (typeof userInfo === 'undefined') {
      console.error(`missing body`);
      response.sendStatus(BAD_REQUEST);
    }
    else if (request.user) {
			response.status(SEE_OTHER).send({ "status": "EXISTS",
	  "info": `user ${request.params.id} already exists`
	})	
	then(function(id) {
	  response.sendStatus(NO_CONTENT);
	}).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(SERVER_ERROR);
	});
    }
    else {
			userInfo.pw = passwordHash.generate(pw)
      request.app.locals.model.users.newUser(id, userInfo).
	then(function(id) {
			var token = jwt.sign({id:id}, 'supersecret',{expiresIn: authTimeout});
      response.status(CREATED).send({ "status": "CREATED",
	  	"authToken": token
			});
	}).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(SERVER_ERROR);
	});
    }
  };
}

function cacheUser(app) {
  return function(request, response, next) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.getUser(id, false).
	then(function(user) {
	  request.user = user;
	  next();
	}).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(SERVER_ERROR);
	});
    }
  }
}

function authUser(app) {
  return function(request, response) {
			if (!request.user) {
				response.status(NOT_FOUND).send({ "status": "ERROR_NOT_FOUND",
	  "info": `user ${request.params.id} not found`
	})	
    }
    else {
			if(passwordHash.verify(request.body.pw, request.user.pw)) {
				const id = request.params.id;
    		var token = jwt.sign({id:id}, 'supersecret',{expiresIn: authTimeout});
      	response.json({ "status": "OK",
        "authToken": token, 				
      });
			}
			else {
				response.status(401).send({ "status": "ERROR_UNAUTHORIZED",
	  "info": `/users/${request.params.id}/auth requires a valid 'pw' password query parameter`
	})	
			}
    }
  };
}

//Should not be necessary but could not get relative URLs to work
//Should not be necessary but could not get relative URLs to work
//in redirect().
function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
