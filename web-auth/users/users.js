'use strict';

const axios = require('axios');
const options = require('../options').options;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const WS_URL = options.ws_url;

function Users() {
  this.baseUrl = WS_URL;
}

//All action functions return promises.

Users.prototype.login = function(username, password) {
  return axios.put(`${this.baseUrl}/users/${username}/auth`, {
    pw: password
  })
    .then((response) => response.data)
		.catch((error) => error.data);
}

Users.prototype.register = function(username, password, firstname, lastname) {
  return axios.put(`${this.baseUrl}/users/${username}?pw=${password}`, {
    emailaddress: username,
		firstname: firstname,
		lastname: lastname
  })
    .then((response) => response.data)
		.catch((error) => error.data);
}

Users.prototype.access = function(username, authToken) {
	const AuthStr = 'Bearer '.concat(authToken); 
  return axios.get(`${this.baseUrl}/users/${username}`, { 
		headers: { Authorization: AuthStr } 
	})
    .then((response) => response.data)
		.catch((error) => error.data);
}

module.exports = new Users();

/*
.then((retObj) => {
				console.log("retObj: " + JSON.stringify(retObj))
				let name = retobj.firstname + retObj.lastname;
				console.log(name);
				res.send(doMustache(app, 'account', {name}));
			})	
      .catch((err) => console.error(err));
      })
			*/