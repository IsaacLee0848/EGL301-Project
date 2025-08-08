const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    screeningId: { type: mongoose.Schema.Types.ObjectId},
    userId: {type: mongoose.Schema.Types.ObjectId},
    seats: [String]
});

module.exports = mongoose.model('bookings',bookingSchema);