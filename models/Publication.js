const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authors: [{
        name: String,
        affiliation: String
    }],
    abstract: String,
    journal: String,
    doi: String,
    date_published: Date,
    keywords: [String],
    citations: Number,
    pdf_link: String,
    type: { type: String, default: 'scientific_publication' },
    published: { type: Boolean, default: true },
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Publication', publicationSchema);
