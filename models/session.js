const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    username: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    startDate: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    startTime: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    endDate: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    endTime: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    size: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    members: {
        type: [String],
        required: true,
    }
});

const Session = mongoose.model('session', SessionSchema);
module.exports = { Session };