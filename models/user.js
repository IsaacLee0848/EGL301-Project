const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    password: String,
    dob: {
        day: Number,
        month: Number,
        year: Number
    },
    role: String,
    token: String
});

module.exports = mongoose.model('users',userSchema);