import path from "path"
import cors from "cors"
import fs from "fs"
import express from "express"
import webpack from "webpack"
import config from "../webpack.config.js"
import middleware from "webpack-dev-middleware"
import hot from "webpack-hot-middleware"
import dotenv from "dotenv"
const __dirname = path.resolve()

dotenv.config()
const app = express()
let compiler = webpack(config as any)
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")
app.set("trust proxy", true)

if (process.env.TESTING === "yes") {
  app.use(middleware(compiler, {
    index: false,
    serverSideRender: false,
    writeToDisk: false,
  }))
  app.use(hot(compiler))
}

app.use(express.static(path.join(__dirname, "./dist"), {index: false}))
app.use("/assets", express.static(path.join(__dirname, "./assets")))
app.use("/models", express.static(path.join(__dirname, "./models")))

app.get("/*", function(req, res, next) {
    const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
    res.status(200).send(document)
})

const run = async () => {
  let port = process.env.PORT || 8090
  app.listen(port, () => console.log(`Started the webserver at http://localhost:${port}`))
}

run()