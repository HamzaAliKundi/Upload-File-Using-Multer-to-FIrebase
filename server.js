const express = require("express");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 3000;
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/image", require("./routes/userImageRoute"));

app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server started at : ${port}`);
});
