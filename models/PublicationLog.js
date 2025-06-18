const mongoose = require('mongoose');

const publicationLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    refType: { type: String, enum: ['publication', 'press_release'], required: true },
    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    action: { type: String, enum: ['add', 'edit', 'delete'] },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicationLog', publicationLogSchema);
