const mongoose = require('mongoose');

const atrocityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    atrocity: { type: mongoose.Schema.Types.ObjectId, ref: 'Atrocity' },
    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    action: { type: String, enum: ['add', 'edit'] },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AtrocityLog', atrocityLogSchema);
