'use strict';

var _ = require('lodash');

var strategies = {
		google: require('passport-google-oauth').OAuth2Strategy,
		facebook: require('passport-facebook').Strategy,
		twitter: require('passport-twitter').Strategy
}

/**
 * 
 */
function Auth() {
	this.passport = require('passport');
}

Auth.prototype.verify = function(req, res, next) {
	return req.isAuthenticated() ? next() : res.redirect('/');
};

Auth.prototype.require = function(req, res, next) {
	return req.isAuthenticated() ? next() : res.json(403,{status:'unauthorized'});
};

/**
 * 
 * @param model
 */
Auth.prototype._setupModel = function(model) {
	this.model = model;
	this.passport.serializeUser( function(user, done) {
		done(null, user._id);
	});
	this.passport.deserializeUser( function(id, done){
		model.findById(id, function(err, user) {
			done(err, user);
		});
	});
}

/**
 * 
 * @param model
 */
Auth.prototype._setupLocal = function(model) {
	var LocalStrategy = require('passport-local').Strategy;
	
	var opts = { usernameField: 'email', passwordField: 'password', passReqToCallback: true }; 
	
	this.passport.use('local-signup', new LocalStrategy(opts, function(req, email, password, done) {
		model.findOne({'email' : email, 'provider' : 'local'}, function(err, user) {
			if(err) {
				return done(err);
			}
			if(user) {
				return done(null, false, req.flash('passport', {type: 'signup', fail: 1, email: email}));
			} 
			var newUser = new model();
			newUser.initialize(req);
			newUser.provider = 'local';
			newUser.email = email;
			newUser.password = newUser.generateHash(password);
			
			newUser.save( function(err) {
				if(err) {
					return done(null, false, req.flash('passport', {type: 'signup', fail: 2, email: email}));
				}
				return done(null, newUser);
			});
		});
	}));
	
	this.passport.use('local-login', new LocalStrategy(opts, function(req, email, password, done){
		model.findOne({'email' : email, 'provider' : 'local'}, function(err, user) {
			if(err) {
				return done(err);
			}
			if(!user) {
				return done(null, false, req.flash('passport', {type: 'login', fail: 1, email: email}));
			}
			if(!user.validPassword(password)) {
				return done(null, false, req.flash('passport', {type: 'login', fail: 2, email: email}));
			}
			return done(null, user);
		});
	}));
}

/**
 * 
 * @param strategy
 * @param opts
 * @param model
 * @param provider
 */
Auth.prototype._setupOauth = function(strategy, opts, model, provider) {
	var that = this;
	this.passport.use(new strategy(opts, function(token, refreshToken, profile, done) {
		model.findOne({'id' : profile.id, 'provider': provider}, function(err, user) {
			that.logger.debug(profile);
			if(err) {
				return done(err);
			}
			if(user) {
				return done(null, user);
			} else {
				var newUser = new model();
				newUser.initialize();
				newUser.provider = provider;
				newUser.id = profile.id;
				newUser.token = token;
				newUser.name = profile.displayName;
				if(profile.emails && (profile.emails.length > 0)) {
					newUser.email = profile.emails[0].value;	
				}
				
				newUser.save( function(err) {
					if(err) {
						return done(err);
					}
					return done(null, newUser);
				});
			}
		});
	}));
}

/**
 * 
 * @param model
 * @param config
 */
Auth.prototype.init = function(model, config) {
	var self = this;
	
	this.logger = config.logger;
	this._setupModel(model);
	this._setupLocal(model);
	
	_.forEach(config.auth.oauth, function(conf, key) {
		var strategy = strategies[key];
		if(strategy !== 'undefined') {
			var opts = { callbackURL: conf.url + '/callback' }
			if(key === 'twitter') {
				opts.consumerKey = conf.id;
				opts.consumerSecret = conf.secret;
			} else {
				opts.clientID = conf.id;
				opts.clientSecret = conf.secret;
			}
			self._setupOauth(strategy, opts, model, key);
		}
	});
}

/**
 * 
 * @param app
 */
Auth.prototype.use = function(app) {
	app.use(this.passport.initialize());
	app.use(this.passport.session());
}

/**
 *
 * @param config
 */
Auth.prototype.router = function(config) {
	var self = this;
	var router = require('express').Router();
	
	const opts = {
		successRedirect: config.auth.url.success || '/',
		failureRedirect: config.auth.url.login,
		failureFlash: config.auth.flash || true
	};
	
	router.post(config.auth.url.login, this.passport.authenticate('local-login', opts));
	router.post(config.auth.url.signup, this.passport.authenticate('local-signup', opts));
	
	_.forEach(config.auth.oauth, function(conf, key) {
		router.get(conf.url, self.passport.authenticate(key, conf.opts || {}));
		router.get(conf.url + '/callback', self.passport.authenticate(key, opts));
	});
	
	return router;
}

module.exports = new Auth();