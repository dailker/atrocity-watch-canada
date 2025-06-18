const mongoose = require('mongoose');

const pressReleaseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: Date,
    author: {
        name: String,
        email: String
    },
    content: String,
    tags: [String],
    organization: String,
    url: String,
    type: { type: String, default: 'press_release' },
    published: { type: Boolean, default: true },
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PressRelease', pressReleaseSchema);
