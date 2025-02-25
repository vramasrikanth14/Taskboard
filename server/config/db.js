<<<<<<< HEAD
//db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://meenakumarimaligeli:Meena%40123@cluster0.ba469xs.mongodb.net/taskBoard', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
=======
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://meenakumarimaligeli:Meena%40123@cluster0.ba469xs.mongodb.net/taskBoard', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
>>>>>>> 8153153255c5360b0a271a54212e5094728a3356
};

module.exports = connectDB;