import dbConnect from "./db/dbConnection.js";
import app from "./app.js";

const PORT = process.env.PORT;

dbConnect()
    .then(() => {

        app.listen(PORT, (req, res) => {
            console.log(`Server runing on http://localhost:${PORT}`);
        })
    })
    .catch((err) => {
        console.error("Something went wrong while connecting to the Database!", err);
    })


