const path = require('path');
require("dotenv").config();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const express = require('express');
const bodyParser = require('body-parser')

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUnitialized: false,
  store: store
}));

//DB

mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  username: String,
  email: String,
  password: String,

});
const User = mongoose.model("User", userSchema);

const wichtelsessionSchema = new mongoose.Schema({
  sessionName: String,
  einladungen: [{
    name: String,
    email: String
  }],
  wichtel: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User
    },
    wichtelVon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User
    },
    wishes: String
  }]
});
const Wichtelsession = mongoose.model("Wichtelsession", wichtelsessionSchema);

const wichtelgruppeSchema = new mongoose.Schema({
  wgName: String,
  wgOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: Wichtelsession
  }]
});
const Wichtelgruppe = mongoose.model("Wichtelgruppe", wichtelgruppeSchema);


//bcrypt
const saltRounds = 10;

/*TODO's:
- Prüfen ob lodash genutz werden muss bei Inputfelder
*/

//Routes

//Home
app.get("/", (req, res) => {
  req.session.path = "/";
  res.render("home", { sessionInfo: req.session.isLoggedIn });
});

//-Login
app.route("/login")
  .get((req, res) => {
    res.render("login", { sessionInfo: req.session.isLoggedIn });
  })
  .post((req, res) => {
    const { userName, password } = req.body

    User.findOne({ username: userName }, (err, foundUser) => {
      if (err) {
        console.log(err)
      } else {
        if (foundUser) {
          bcrypt.compare(password, foundUser.password, (err, result) => {
            if (err) {
              console.log(err);
            }
            else if (result) {
              req.session.isLoggedIn = true;
              req.session.userID = foundUser._id;
              res.redirect(req.session.path)
            }
            else if (!result) {
              res.redirect("login");
            }
          });
        } else {
          console.log("no User");
          res.redirect("login");
        }
      }
    });
  });

//-Logout
app.route("/logout")
  .get((req, res) => {
    req.session.destroy(() => {
      console.log(JSON.stringify(req.session))
      res.redirect("/");
    })
  })

//-Register
app.route("/register")
  .get((req, res) => {
    res.render("register", { sessionInfo: req.session.isLoggedIn });
  })
  .post((req, res) => {
    const { fName, lName, userName, email, password } = req.body

    User.findOne({ username: userName }, (er, foundUser) => {
      if (er) {
        console.log(er)
      }
      if (foundUser) {
        console.log("User besteht bereits");
        // Meldung an User
        res.redirect("register");
      } else {
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (!err) {
            const newUser = new User({
              fName: fName,
              lName: lName,
              username: userName,
              email: email,
              password: hash
            });
            newUser.save((error) => {
              if (!error) {
                res.render("login", { sessionInfo: req.session.isLoggedIn });
              }
            });
          }
        });
      }
    });
  });

// -Blog
app.route("/blog")
  .get((req, res) => {
    req.session.path = "blog";

    if (req.session.isLoggedIn) {
      res.render("blog", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }
  });

//-Snomast
app.route("/snomast")
  .get((req, res) => {
    req.session.path = "snomast";

    if (req.session.isLoggedIn) {
      res.render("snomast", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }
  });

//-To Do's
app.route("/todo")
  .get((req, res) => {
    req.session.path = "todo";

    if (req.session.isLoggedIn) {
      res.render("todo", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }

  });

//-Wichtel Fee
app.route("/wichtelfee")
  .get((req, res) => {
    req.session.path = "wichtelfee";

    if (req.session.isLoggedIn) {
      res.render("wichtelfee", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }
  });

app.route("/wichtelHRoffice")
  .get((req, res) => {
    req.session.path = "wichtelHRoffice";

    if (req.session.isLoggedIn) {
      res.render("wichtelhroffice", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }
  })
  .post((req, res) => {
    const { gruppenName } = req.body;
    const owner = req.session.userID;

    User.findById(owner, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("wichtelsession", {
            sessionInfo: req.session.isLoggedIn,
            gruppenName: gruppenName,
            ownerName: foundUser.fName
          });
        } else {
          console.log("kein User");
        }
      }
    });
  });


app.route("/wichtelsession")
  .post((req, res) => {
    const { gruppenName, wichtelsessionName } = req.body;
    const recipients = eval(req.body.recipients)
    const owner = req.session.userID;

    const newSession = new Wichtelsession({
      sessionName: wichtelsessionName,
      einladungen: recipients,
      wichtel: [{
        user: owner
      }]
    });

    newSession.save((error) => {
      if (!error) {
        const newGroup = new Wichtelgruppe({
          wgName: gruppenName,
          wgOwner: owner,
          sessions: newSession._id
        });
        newGroup.save((error) => {
          if (!error) {
            req.session.path = "wichtelunterschlupf";
            res.redirect("wichtelunterschlupf");
          }
        });
      }
    });
  });


app.route("/wichtelunterschlupf")
  .get((req, res) => {
    req.session.path = "wichtelunterschlupf";

    if (req.session.isLoggedIn) {
      Wichtelsession.find({ 'wichtel.user': req.session.userID }, (err, foundSessions) => {
        if (err) {
          console.log(err);
        } else {
          if (foundSessions) {
            foundSessions.forEach(elem => {
              Wichtelgruppe.find({ 'sessions.0': elem._id }, (err, foundGroup) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundGroup) {
                    const allInfos = [];
                    foundGroup.forEach(el => {
                      allInfos.push({
                        groupName: el.wgName,
                        groupID: el._id,
                        sessionName: elem.sessionName,
                        sessionID: elem._id
                      })
                    });
                    console.log(foundSessions);
                    console.log(foundGroup);
                    console.log(allInfos);
                    res.render("wichtelunterschlupf", { sessionInfo: req.session.isLoggedIn });
                  } else {
                    res.render("wichtelunterschlupf", { sessionInfo: req.session.isLoggedIn });
                  }
                }
              })
            });
          } else {
            res.render("wichtelunterschlupf", { sessionInfo: req.session.isLoggedIn });
          }
        }
      });
    } else {
      res.redirect("login");
    }
  });

//-Kontakt
app.route("/contact")
  .get((req, res) => {
    req.session.path = "contact";

    if (req.session.isLoggedIn) {
      res.render("contact", { sessionInfo: req.session.isLoggedIn });
    } else {
      res.redirect("login");
    }

  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

