'use strict';

var _ = require('lodash');
var logger = require('log4js').getLogger();
var auth = require('../index.js');

var config = {
	logger: logger,
	auth: {
    facebook: {
      id: "FacebookId",
      secret: "FacebookSecret",
      callback: "FacebookCallback"
		},
		google: {
      id: "GoogleId",
      secret: "GoogleSecret",
      callback: "GoogleCallback"
		},
		instagram: {
      id: "InstagramId",
      secret: "InstagramSecret",
      callback: "InstagramCallback"
		}
	}
}

describe('Auth', function(){
	it('Should initialize strategies given in config', function() {
		
	});
});