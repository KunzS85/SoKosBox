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
  req.session.path = "home";
  const session = req.session;
  console.log(JSON.stringify(session));
  res.render("home", { sessionInfo: session.isLoggedIn });
});

//-Login
app.route("/login")
  .get((req, res) => {
    const session = req.session;
    console.log(JSON.stringify(session));
    res.render("login", { sessionInfo: session.isLoggedIn });
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
              const session = req.session;
              console.log(JSON.stringify(session));
              res.render(req.session.path, {
                sessionInfo: session.isLoggedIn
              });
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
    const session = req.session;
    console.log(JSON.stringify(req.session))
    req.session.destroy(() => {
      console.log(JSON.stringify(req.session))
      res.redirect("/");
    })
  })

//-Register
app.route("/register")
  .get((req, res) => {
    const session = req.session;
    console.log(JSON.stringify(req.session))
    res.render("register", { sessionInfo: session.isLoggedIn });
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
                res.render("login", { sessionInfo: session.isLoggedIn });
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
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("blog", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  });

//-Snomast
app.route("/snomast")
  .get((req, res) => {
    req.session.path = "snomast";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("snomast", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  });

//-To Do's
app.route("/todo")
  .get((req, res) => {
    req.session.path = "todo";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("todo", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }

  });

//-Wichtel Fee
app.route("/wichtelfee")
  .get((req, res) => {
    req.session.path = "wichtelfee";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("wichtelfee", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  });

app.route("/wichtelHRoffice")
  .get((req, res) => {
    req.session.path = "wichtelHRoffice";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("wichtelhroffice", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  })
  .post((req, res) => {
    const { gruppenName } = req.body;
    const owner = req.session.userID;

    Wichtelgruppe.findOne({ wgName: gruppenName }, (err, foundGroup) => {
      if (err) {
        console.log(err)
      }
      if (foundGroup) {
        console.log("Gruppe besteht bereits")
        // Meldung an User
        res.redirect("wichtelhroffice");
      } else {
        const newGroup = new Wichtelgruppe({
          wgName: gruppenName,
          wgOwner: owner
        });
        newGroup.save((error) => {
          if (!error) {
            req.session.path = "wichtelsession";
            const session = req.session;
            console.log(JSON.stringify(req.session));
            res.render("wichtelsession", { 
              sessionInfo: session.isLoggedIn,
              gruppenName: gruppenName,

            });
          }
        });
      }
    });
  });

app.route("/wichtelunterschlupf")
  .get((req, res) => {
    req.session.path = "wichtelunterschlupf";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("wichtelunterschlupf", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  });

app.route("/wichtelsession")
  .get((req, res) => {
    req.session.path = "wichtelsession";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      const { gruppenName } = req.body;
      const { wichtelsession } = req.body;

      res.render("wichtelsession", { 
        sessionInfo: session.isLoggedIn,
        gruppenName: gruppenName,
        wichtelsessionName: wichtelsessionName,
        
      });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }
  })
  .post((req, res) => {

  });


//-Kontakt
app.route("/contact")
  .get((req, res) => {
    req.session.path = "contact";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("contact", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }

  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

