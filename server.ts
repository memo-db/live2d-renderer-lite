import path from "path"
import cors from "cors"
import fs from "fs"
import express from "express"
import dotenv from "dotenv"
const __dirname = path.resolve()

dotenv.config()
const app = express()
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")
app.set("trust proxy", true)

app.use(express.static(path.join(__dirname, "./dist"), {index: false}))
app.use("/models", express.static(path.join(__dirname, "./models")))

app.get("/*", function(req, res, next) {
    const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
    res.status(200).send(document)
})

const run = async () => {
  app.listen(process.env.PORT || 8090, () => console.log("Started the website server!"))
}

run()