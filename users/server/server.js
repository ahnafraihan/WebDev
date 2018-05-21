// Ahnaf Raihan
// server.js

const express = require('express');
const bodyParser = require('body-parser');


const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(port, model) {
  const app = express();
  app.locals.model = model;
  app.locals.port = port;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

function setupRoutes(app) {
    app.use(bodyParser.json());
    app.put('/users/:id', newUser(app));
    app.post('/users/:id', updateUser(app));
    app.get('/users/:id', getUser(app));
    app.delete('/users/:id', deleteUser(app));
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
  
module.exports = {
  serve: serve
}

function getUser(app) {
  return function(request, response) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.getUser(id).then((results) => response.json(results)).
      catch((err) => {
	       console.error(err);
	       response.sendStatus(NOT_FOUND); 
      });
    }
  };
}
    
function deleteUser(app) {
  return function(request, response) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.deleteUser(id).
	then(() => response.end()).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

function newUser(app) {
    return function(request, response) {
        const id = request.params.id;
        const body = request.body;
        if (typeof id === 'undefined') {
            response.sendStatus(BAD_REQUEST);
        }
        else {
            request.app.locals.model.users.newUser(id, body).
            then(function(count) {
                if (count === 0) {
                    response.append('Location', requestUrl(request) + '/' + id);
                    response.sendStatus(CREATED);
                }
                else  {
                    response.sendStatus(NO_CONTENT);
                }
                
            }).
            catch((err) => {
                console.error(err);
                response.sendStatus(SERVER_ERROR);
            });
        }
    };
}

function updateUser(app) {
    return function(request, response) {
        const id = request.params.id;
        const body = request.body;
        if (typeof id === 'undefined') {
            response.sendStatus(BAD_REQUEST);
        }
        else {
            request.app.locals.model.users.updateUser(id,body).then((results) => response.json(results)).
            catch((err) => {
                console.error(err);
                response.sendStatus(NOT_FOUND); 
            });
        }
    };
}