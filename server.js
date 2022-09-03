'use strict';
const log = console.log;

const express = require('express');
const app = express();

// mongoose and mongo connection
const { mongoose } = require('./db/mongoose');
mongoose.set('useFindAndModify', false); // for some deprecation issues

const { Session } = require('./models/session');
const { User } = require("./models/user");

// to validate object IDs
const { ObjectID } = require('mongodb')

// body-parser: middleware for parsing HTTP JSON body into a usable object
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const session = require("express-session"); 
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

/*** Session handling **************************************/
// Create a session cookie
app.use(
    session({
        secret: "fsdjhkjhjhk",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 1800000,
            httpOnly: true
        }
    })
);

// Middleware for authentication of resources
// Taken from class express-authentication example
const authenticate = (req, res, next) => {
	if (req.session.user) {
		User.findById(req.session.user).then((user) => {
			if (!user) {
				return Promise.reject()
			} else {
				req.user = user
				next()
			}
		}).catch((error) => {
			res.status(401).send("Unauthorized")
		})
	} else {
		res.status(401).send("Unauthorized")
	}
}

// A route to login and create a session
app.post("/users/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Use the static method on the User model to find a user
    // by their email and password
    User.findByUsernamePassword(username, password)
        .then(user => {
            // Add the user's id to the session cookie.
            // We can check later if this exists to ensure we are logged in.
            req.session.user = user._id;
            req.session.username = user.username;
            res.send(user);
        })
        .catch(error => {
            res.status(400).send()
        });
});

// A route to logout a user
app.get("/users/logout", (req, res) => {
    // Remove the session
    req.session.destroy(error => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send()
        }
    });
});

// A route to check if a use is logged in on the session cookie
app.get("/users/check-session", (req, res) => {
    if (req.session.user) {
        res.send({ currentUser: req.session.username });
    } else {
        res.status(401).send();
    }
});
app.get("/users/curruser", (req, res) => {
  User.findById(req.session.user).then(user => {
      res.json({currentUser: user});
  }).catch((error)=>{
      console.log('====================================');
      console.log(error);
      console.log('====================================');
  })
});
app.get('/users', (req, res) => {
    User.find().then((users) => {
        const filteredUsers = []
        for (let i = 0; i < users.length; i++) {
            const filteredUser = {
                username: users[i].username,
            }
            filteredUsers.push(filteredUser)
        }
        res.send(filteredUsers) // can wrap in object if want to add more properties
    }, (error) => {
        res.status(500).send(error) // server error
    })
});

app.get('/sessions', authenticate, (req, res) => {
    var docs=[];
    Session.find().then((sessions) => {
        
        sessions.map(session=>{
            docs.push({ 
                "id":session._id,
                "content":session.description
            })
        })
        console.log(docs)
        res.send(sessions) // can wrap in object if want to add more properties
    }, (error) => {
        res.status(500).send(error) // server error
    })
});

app.post('/sessions/create', authenticate, (req, res) => {
    const session = new Session(req.body);

    session.save().then((result) => {
        res.send(result)
    }, (error) => {
        res.status(400).send(error) // 400 for bad request
    })
});

app.patch('/sessions/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const session = req.body;

    if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
    }

    // Update the session by its id.
    Session.findOneAndUpdate({_id: id}, {$set: session}, {new: true}).then((updatedSession) => {
        if (!updatedSession) {
            res.status(404).send()
        } else {
            res.send(updatedSession)
        }
    }).catch((error) => {
        res.status(400).send() // bad request for changing the session.
    })
});

app.post('/sessions/member/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const username = req.body.username;

    if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
    }

    // Add member to session
    Session.findOneAndUpdate({_id: id}, {$push: {members: username}}, {new: true}).then((updatedSession) => {
        if (!updatedSession) {
            res.status(404).send()
        } else {
            res.send(updatedSession)
        }
    }).catch((error) => {
        res.status(400).send() // bad request for adding member.
    })
});

app.delete('/sessions/member/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const username = req.body.username;

    if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
    }

    // Add member to session
    Session.findOneAndUpdate({_id: id}, {$pullAll: {members: [username]}}, {new: true}).then((updatedSession) => {
        if (!updatedSession) {
            res.status(404).send()
        } else {
            res.send(updatedSession)
        }
    }).catch((error) => {
        res.status(400).send() // bad request for changing the session.
    })
});

app.patch('/users', (req, res) => {

    const username = req.body.username
    const newpassword = req.body.newpassword

    User.findOneAndUpdate({username : username}, {$set: {password : newpassword}}, {new: true}).then((updatedUser) => {
        if (!updatedUser) {
            res.status(404).send()
        } else {
            res.send(updatedUser)
        } 
    }).catch((error) => {
        log(error)
        res.status(400).send() // bad request for changing the session.
    })
})

app.patch('/users/:username', authenticate, (req, res) => {
    const username = req.params.username
    const newRating = req.body.newRating

    User.findOneAndUpdate({username: username}, {$set: {rating: newRating}}, {new: true})
        .then((user) => {
            if (!user) {
                res.status(404).send()
            } else {
                res.send(user)
            }
        })
        .catch((error) => {
            log(error)
            res.status(400).send()
        })
})

app.get('/users/:username', (req, res) => {
    const username = req.params.username

    User.findOne({username: username})
        .then((user) => {
            if (!user) {
                res.status(404).send()
            } else {
                const filteredUser = {
                    username: user.username,
                    rating: user.rating
                }
    
                res.send(filteredUser)
            }
        })
        .catch((error) => {
            log(error)
            res.status(400).send(error)
        })
});

app.delete('/sessions/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
    }

    // Delete the session by its id.
    Session.findByIdAndDelete(id).then((session) => {
        if (!session) {
            res.status(404).send()
        } else {
            res.send(session)
        }
    }).catch((error) => {
        res.status(400).send() 
    })
});

/** User routes below **/
// Set up a POST route to *create* a user of your web app (*not* a student).
app.post("/users", (req, res) => {
    // Create a new user
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // Save the user
    user.save().then(
        user => {
            res.send(user);
        },
        error => {
            res.status(400).send(error); // 400 for bad request
        }
    );
});


/*** Webpage routes below **********************************/
// Serve the build
app.use(express.static(__dirname + '/client/public'));

// All routes other than above will go to index.html
app.get("*", (req, res) => {
    res.sendFile(__dirname + '/client/public/index.html');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    log(`Listening on port ${port}...`)
});


