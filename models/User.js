const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email:    { type: String, unique: true, required: true },
    password: { type: String, required: true },
    logs:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'AtrocityLog' }],
    permissions: [{ type: String }]
});

module.exports = mongoose.model('User', userSchema);
