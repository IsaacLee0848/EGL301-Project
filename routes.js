const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = require("./services/dbservice.js");
const crypto = require("crypto");
const { z } = require("zod");
const bcrypt = require("bcrypt");
const saltRounds = 10;

db.connect()
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error.message);
  });

router.use(
  express.urlencoded({
    extended: true,
  })
);

router.use(express.json());

function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ message: "No tokens are provided." });
  } else {
    db.checkToken(token)
      .then(function (response) {
        if (response) {
          res.locals.userId = response._id;
          next();
        } else {
          res.status(401).json({ message: "Invalid token provided." });
        }
      })
      .catch(function (error) {
        res.status(500).json({ message: error.message });
      });
  }
}

const UserRegistrationRequestSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  dob: z.string().transform((val) => new Date(val)),
});

const UserLoginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const MovieSearchRequestSchema = z.object({
  movieName: z.string(),
});

const AddBookingRequestSchema = z.object({
  screeningId: z.string(),
  seats: z.string(),
});

const BookingUpdateRequestSchema = z.object({
  seats: z.string(),
});

router.post("/api/users/register", function (req, res) {
  let result = UserRegistrationRequestSchema.safeParse(req.body);
  if (result.error) {
    res.status(400).json({
      message: result.error.message,
    });
    return;
  }

  const data = result.data;

  bcrypt.genSalt(saltRounds, function (err, salt) {

    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }

    bcrypt.hash(data.password, salt, function (err, hash) {
      if (err) {
        res.status(500).json({ message: err.message });
        return;
      }
      db.registerUser(data.name, data.email, hash, {
        day: data.dob.getDate(),
        month: data.dob.getMonth() + 1,
        year: data.dob.getFullYear(),
      })
        .then(function (response) {
          res.status(200).json(response);
        })
        .catch(function (error) {
          res.status(500).json({ message: error.message });
        });
    });

  });
});

router.post("/api/users", function (req, res) {
  let result = UserLoginRequestSchema.safeParse(req.body);
  if (result.error) {
    res.status(400).json({
      message: result.error.message,
    });
    return;
  }

  const data = result.data;

  db.getUserByEmail(data.email)
    .then(function (response) {
      if (!response) {
        res
          .status(401)
          .json({ message: "Login unsuccessful. Please try again later." });
      } else {
        bcrypt.compare(data.password, response.password, function (err, result) {
          if (err) {
            res.status(500).json({ message: err.message });
            return;
          }
          if (!result) {
            res
              .status(401)
              .json({ message: "Login unsuccessful. Please try again later." });
            return;
          }
          let strToHash = response.name + Date.now();
          let token = crypto.createHash("md5").update(strToHash).digest("hex");
          db.updateToken(response._id, token)
            .then(function () {
              res
                .status(200)
                .json({ message: "Login successful", token: token });
            })
            .catch(function (error) {
              res.status(500).json({ message: error.message });
            });
        });
      }
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.get("/api/users/logout", authenticate, function (req, res) {
  let id = res.locals.userId;
  db.removeToken(id)
    .then(function (response) {
      res.status(200).json({ message: "Logout successful" });
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.post("/api/movies/search", function (req, res) {
  let result = MovieSearchRequestSchema.safeParse(req.body);
  if (result.error) {
    res.status(400).json({
      message: result.error.message,
    });
  }

  const data = result.data;

  db.searchMovies(data.movieName)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.post("/api/bookings", authenticate, function (req, res) {
  const userId = res.locals.userId;
  let result = AddBookingRequestSchema.safeParse(req.body);
  if (result.error) {
    res.status(400).json({
      message: result.error.message,
    });
  }

  const data = result.data;

  db.addBooking(data.screeningId, userId, data.seats)
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.get("/api/movies/:id", function (req, res) {
  let id = req.params.id;
  db.getMovieByMovieId(id)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.get("/api/movies/:id/screenings", function (req, res) {
  let id = req.params.id;
  db.searchScreeningsByMovieId(id)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.get(
  "/api/screenings/:screeningId/bookings",
  authenticate,
  function (req, res) {
    let screeningId = req.params.screeningId;
    const userId = res.locals.userId;
    db.getBooking({
      screeningId: new mongoose.Types.ObjectId(screeningId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .then(function (response) {
        console.log(response);
        res.status(200).json(response);
      })
      .catch(function (error) {
        res.status(500).json({ message: error.message });
      });
  }
);

router.get("/api/screenings/:id", function (req, res) {
  let id = req.params.id;
  db.getScreeningById(id)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.get("/api/users/:id/bookings", authenticate, function (req, res) {
  let id = req.params.id;
  db.getBooking({ userId: new mongoose.Types.ObjectId(id) })
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.put("/api/bookings/:id", authenticate, function (req, res) {
  let result = BookingUpdateRequestSchema.safeParse(req.body);
  if (result.error) {
    res.status(400).json({
      message: result.error.message,
    });
  }

  let id = req.params.id;

  const data = result.data;

  db.updateBookingById(id, { seats: data.seats.split(",") })
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

router.delete("/api/bookings/:id", authenticate, function (req, res) {
  let id = req.params.id;
  db.deleteBookingById(id)
    .then(function (response) {
      res.status(200).json({ message: response });
    })
    .catch(function (error) {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
