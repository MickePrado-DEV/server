const mongoose = require('mongoose');
const connectionString = process.env.MONGO_DB_URI;

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('conexion exitosa');
  })
  .catch((err) => {
    console.error(err);
  });

process.on('uncaughtException', () => {
  mongoose.connections.disconnect();
});
