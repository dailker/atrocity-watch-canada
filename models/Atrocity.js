const mongoose = require('mongoose');

const heatmapPointSchema = new mongoose.Schema({
    long: Number,
    lat: Number,
    affected: Number
}, { _id: false });

const atrocitySchema = new mongoose.Schema({
    title: String,
    description: String,
    location: [Number], // [lat, long]
    severity: String,
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'AtrocityType' },
    affected: String,
    status: String,
    updated: Date,
    detailedDescription: String,
    heatmap: [heatmapPointSchema]
});

module.exports = mongoose.model('Atrocity', atrocitySchema);
