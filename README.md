# izi-auth

Simple authentication management module for izisoft web application.

## Installation

```
$ npm install izi-auth
```

## Requirements
Module operates on provided mongoose user model that should realize following schema:
```node
User: {
    _id: ObjectId,
    provider: String,
    email: String,
    password: String,
    id: String,
    token: String
    name: String,
    generateHash: function(password),
    verifyPassword: function(password),
    initialize: function(request || undefined)
}
```

To initialize strategies module reads given izi-config object which should contain:
```
Config: {
    logger: Object,
    auth: {
        url: {
            success: String || "/",
            login: String,
            signup: String
        },
        flash: Boolean || true,
        oauth: {
            facebook: {
                id: String,
                secret: String,
                url: String,
                opts: Object
            },
            google: {
                id: String,
                secret: String,
                url: String,
                opts: Object
            },
            twitter: {
                id: String,
                secret: String,
                url: String,
                opts: Object || {}
            }
        }
    }
}
```

## Usage

```node
var auth = require('izi-auth');
auth.init(UserModel, config);
auth.use(app);
```
