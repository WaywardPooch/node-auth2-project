const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  checkUsernameExists,
  validateRoleName
} = require('./auth-middleware');
const User = require("./../users/users-model");
const { JWT_SECRET } = require("./../secrets"); // use this secret!
const { BCRYPT_ROUNDS } = require("./../../config");

router.post("/register",
  validateRoleName,
  async (req, res, next) => {
    /**
      [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

      response:
      status 201
      {
        "user"_id: 3,
        "username": "anna",
        "role_name": "angel"
      }
     */
    try {
      let user = req.body;
      const hash = bcrypt.hashSync(user.password, BCRYPT_ROUNDS);
      user.role_name = req.role_name;
      user.password = hash;

      const newUser = await User.add(user);

      return newUser;
    } catch (err) {
      next(err);
    }
  }
);


router.post("/login",
  checkUsernameExists,
  async (req, res, next) => {
    /**
      [POST] /api/auth/login { "username": "sue", "password": "1234" }

      response:
      status 200
      {
        "message": "sue is back!",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
      }

      The token must expire in one day, and must provide the following information
      in its payload:

      {
        "subject"  : 1       // the user_id of the authenticated user
        "username" : "bob"   // the username of the authenticated user
        "role_name": "admin" // the role of the authenticated user
      }
     */
    try {
      const { username, password } = req.body;
      const user = await User.findBy({ username });
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({
          subject: user.user_id,
          username: user.username,
          role: user.role_name
        },
          JWT_SECRET,
          { expiresIn: "1d" });
        res.status(200).json({
          message: `${username} is back!`,
          token: token
        });
      } else {
        next({
          status: 401,
          message: "Invalid credentials"
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
