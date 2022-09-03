const mongoose = require('mongoose');

/* Connnect to our database */
// Get the URI of the local database, or the one specified on deployment.
const mongoURI =  'mongodb+srv://username:gtJiBv0vT0npVFiR@cluster0.0ifux9g.mongodb.net/?retryWrites=true&w=majority';
//gtJiBv0vT0npVFiR
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true},()=>{
    console.log("Connected to Database");
});

module.exports = { mongoose };