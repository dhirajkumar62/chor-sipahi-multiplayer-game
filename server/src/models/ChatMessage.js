const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUsername: { type: String, trim: true, default: '' },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  replyToMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
  replyToUsername: { type: String, trim: true, default: '' },
  replyToMessage: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

chatMessageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
