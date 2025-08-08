const mongoose = require('mongoose');

const screeningSchema = mongoose.Schema({
    datetime: {
        start: Date,
        end: Date
    },
    cinema: String,
    theatre: String,
    seats: [String],
    movieId: {type: mongoose.Schema.Types.ObjectId}
});

module.exports = mongoose.model('screenings',screeningSchema);