import "dotenv/config"
import express from "express"
import cors from "cors"
import { router } from "./routes/index.js"

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())
app.use("/api", router)

app.get("/health", (_req, res) => {
  res.json({ status: "ok", project: "krone" })
})

app.listen(PORT, () => {
  console.log(`Krone API running on port ${PORT}`)
})

export default app