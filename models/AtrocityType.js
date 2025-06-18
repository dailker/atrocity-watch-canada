const mongoose = require('mongoose');

const atrocityTypeSchema = new mongoose.Schema({
    image: { type: String, required: true },
    type:  { type: String, required: true, unique: true }
});

module.exports = mongoose.model('AtrocityType', atrocityTypeSchema);
