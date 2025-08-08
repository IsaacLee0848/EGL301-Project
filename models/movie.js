const mongoose = require('mongoose');

const movieSchema = mongoose.Schema({
    name: String,
    release: Date,
    runtime: Number,
    language: String
});

module.exports = mongoose.model('movies',movieSchema);