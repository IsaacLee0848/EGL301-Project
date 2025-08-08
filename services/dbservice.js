const mongoose = require("mongoose");
const booking = require("../models/booking.js");
const movie = require("../models/movie.js");
const screening = require("../models/screening.js");
const user = require("../models/user.js");

let db = {
  async connect() {
    try {
      await mongoose.connect(
        "mongodb://127.0.0.1:27017/absoluteCinemaDB"
      );
      return "Connected to Mongo DB";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error connecting to Mongo DB");
    }
  },
  async registerUser(name, email, password, dob) {
    try {
      await user.create({
        name: name,
        email: email,
        password: password,
        dob: dob,
        role: "Customer",
      });
      return `A new registration for ${name} has been created`;
    } catch (e) {
      console.log(e.message);
      throw new Error(`The registration for ${name} could not be made.`);
    }
  },
  async updateToken(id, token) {
    try {
      await user.findByIdAndUpdate(id, { token: token });
      return;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error at the server. Please try again later.");
    }
  },
  async getUserByEmail(email) {
    try {
      let result = await user.findOne({ email: email });
      return result;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error retrieving login credentials");
    }
  },
  async searchMovies(movieName) {
    try {
      let results = await movie.find({ name: new RegExp(movieName, "i") });
      if (!results) return [];
      if (results.length == 0) return [];
      return results;
    } catch (e) {
      console.log(e.message);
      throw new Error(`Unable to retrieve records for ${movieName}`);
    }
  },
  async addBooking(screeningId, userId, seats) {
    let currentScreening = null;
    try {
      currentScreening = await screening.findOne({ _id: screeningId });
    } catch (e) {
      console.log(e.message);
      throw new Error(`Screening ${screeningId} not found`);
    }
    if (!currentScreening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    for (let seat of seats.split(",")) {
      // Check if seat is available in current screening OR
      // If not, throw an error.
      if (!currentScreening.seats.includes(seat)) {
        throw new Error(`Seat ${seat} is already booked`);
      }
    }

    try {
      await screening.updateOne(
        { _id: screeningId },
        { $pullAll: { seats: seats.split(",") } }
      );
      await booking.create({
        screeningId: new mongoose.Types.ObjectId(screeningId),
        userId: new mongoose.Types.ObjectId(userId),
        seats: seats.split(","),
      });
      return `A new booking for ${seats} has been created`;
    } catch (e) {
      console.log(e.message);
      throw new Error(`The booking for ${seats} could not be made.`);
    }
  },
  async getMovieByMovieId(id) {
    try {
      let results = await movie.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "screenings",
            localField: "_id",
            foreignField: "movieId",
            as: "screenings",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            release: 1,
            runtime: 1,
            language: 1,
            screenings: {
              $map: {
                input: "$screenings",
                as: "s",
                in: {
                  id: "$$s._id",
                  datetime: "$$s.datetime",
                  cinema: "$$s.cinema",
                  theatre: "$$s.theatre",
                  movieId: "$$s.movieId",
                },
              },
            },
          },
        },
      ]);
      return results[0] || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  async getScreeningById(id) {
    try {
      let result = await screening.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "movies",
            localField: "movieId",
            foreignField: "_id",
            as: "movie",
          },
        },
        { $unwind: "$movie" },
        {
          $project: {
            _id: 1,
            datetime: 1,
            cinema: 1,
            theatre: 1,
            seats: 1,
            movie: { _id: 1, name: 1, release: 1, runtime: 1, language: 1 },
          },
        },
      ]);
      return result[0] || null;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error retrieving screening");
    }
  },
  async searchScreeningsByMovieId(movieId) {
    try {
      let results = await screening.find({ movieId: movieId });
      if (!results) return [];
      if (results.length == 0) return [];
      return results;
    } catch (e) {
      console.log(e.message);
      throw new Error(`Unable to retrieve records for ${movieId}`);
    }
  },
  async getBooking(conditions) {
    try {
      let results = await booking.find(conditions);
      return results[0] || null;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error retrieving booking");
    }
  },
  async updateBookingById(id, updates) {
    let currentScreening = null;
    try {
      currentScreening = await screening.findOne({
        _id: result.screeningId,
      });
    } catch (e) {
      console.log(e.message);
      throw new Error(`Screening ${result.screeningId} not found`);
    }
    if (!currentScreening) {
      throw new Error(`Screening ${result.screeningId} not found`);
    }

    try {
      let result = await booking.findById(id);
      if (!result) return "Unable to find a booking to update.";
      let toDeleteFromBooking = [];
      let toAddToBookings = [];
      for (let seat of result.seats) {
        if (!updates.seats.includes(seat)) {
          toDeleteFromBooking.push(seat);
        }
      }
      for (let seat of updates.seats) {
        if (!result.seats.includes(seat)) {
          toAddToBookings.push(seat);
        }
      }

      for (let seat of updates.seats) {
        // Check if seat is available in current screening OR
        // if the current booking has the seat.
        // If not, throw an error.
        if (
          !(
            currentScreening.seats.includes(seat) || result.seats.includes(seat)
          )
        ) {
          throw new Error(`Seat ${seat} is already booked`);
        }
      }

      await screening.updateOne(
        { _id: result.screeningId },
        {
          $push: { seats: { $each: toAddToBookings } },
        }
      );
      await screening.updateOne(
        { _id: result.screeningId },
        {
          $pullAll: { seats: toDeleteFromBooking },
        }
      );
      await booking.findByIdAndUpdate(id, updates);
      return "Booking is updated!";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error updating booking");
    }
  },
  async deleteBookingById(id) {
    try {
      let result = await booking.findById(id);
      if (!result) return "Unable to find a booking to delete.";
      await screening.updateOne(
        { _id: result.screeningId },
        { $push: { seats: result.seats } }
      );
      await booking.findByIdAndDelete(id);
      return "Booking is deleted!";
    } catch (e) {
      console.log(e.message);
      throw new Error("Error deleting booking");
    }
  },
  async checkToken(token) {
    try {
      let result = await user.findOne({ token: token });
      return result;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error at the server. Please try again later.");
    }
  },
  async removeToken(id) {
    try {
      await user.findByIdAndUpdate(id, { $unset: { token: 1 } });
      return;
    } catch (e) {
      console.log(e.message);
      throw new Error("Error at the server. Please try again later.");
    }
  },
};

module.exports = db;
