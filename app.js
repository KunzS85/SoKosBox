const path = require('path');
require("dotenv").config();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const express = require('express');
const bodyParser = require('body-parser')

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI = 'mongodb+srv://sokosbox:PassAufImInternet@cluster0.ybtnjia.mongodb.net/sokosDB?retryWrites=true&w=majority';

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
  secret: 'PassAufImInternet24x7',
  resave: false,
  saveUnitialized: false,
  store: store
}));


//DB
const mongoAtlasUri = "mongodb+srv://sokosbox:PassAufImInternet@cluster0.ybtnjia.mongodb.net/sokosDB?retryWrites=true&w=majority";
mongoose.set('strictQuery', true);
mongoose.connect(mongoAtlasUri, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  username: String,
  email: String,
  password: String,

});

const User = mongoose.model("User", userSchema);

//bcrypt
const saltRounds = 10;

//Routes
app.get("/", (req, res) => {
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
              console.log(JSON.stringify(session));
              res.redirect(req.session.path);
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
    req.session.path = "/blog";
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
    req.session.path = "/snomast";
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
    req.session.path = "/todo";
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
    req.session.path = "/wichtelfee";
    const session = req.session;
    console.log(JSON.stringify(req.session));

    if (session.isLoggedIn) {
      res.render("wichtelfee", { sessionInfo: session.isLoggedIn });
    } else {
      res.render("login", { sessionInfo: session.isLoggedIn });
    }

  });

//-Kontakt
app.route("/contact")
  .get((req, res) => {
    req.session.path = "/contact";
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

