require("dotenv").config()

const express = require("express")
const cors = require("cors")
const fs = require("fs-extra")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const SECRET = process.env.WEBHOOK_SECRET

const DATABASE = path.join(__dirname, "donations.json")

// =========================
// LOAD DATABASE
// =========================

let donations = []

async function loadDonations() {
    try {
        donations = await fs.readJson(DATABASE)
    } catch (err) {
        donations = []
    }
}

async function saveDonations() {
    await fs.writeJson(DATABASE, donations, {
        spaces: 2
    })
}

loadDonations()

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
    res.json({
        status: "ONLINE",
        message: "Saweria Roblox Backend Running"
    })
})

// =========================
// WEBHOOK SAWERIA
// =========================

app.post("/webhook", async (req, res) => {

    try {

        const secret = req.headers["x-secret-key"]

        if (secret !== SECRET) {
            return res.status(403).json({
                error: "Invalid Secret"
            })
        }

        const body = req.body

        const donation = {
            id: Date.now() + Math.floor(Math.random() * 999999),
            username: body.donator_name || "Unknown",
            amount: body.amount_raw || 0,
            message: body.message || "",
            createdAt: Date.now(),
            claimed: false
        }

        donations.push(donation)

        await saveDonations()

        console.log("DONASI BARU")
        console.log(donation)

        return res.status(200).json({
            success: true
        })

    } catch (err) {

        console.log(err)

        return res.status(500).json({
            error: "Internal Server Error"
        })
    }
})

// =========================
// GET DONATIONS
// =========================

app.get("/donations", (req, res) => {

    const unclaimed = donations.filter(d => !d.claimed)

    res.json(unclaimed)

})

// =========================
// CLAIM DONATION
// =========================

app.post("/claim/:id", async (req, res) => {

    try {

        const id = Number(req.params.id)

        const donation = donations.find(d => d.id === id)

        if (!donation) {
            return res.status(404).json({
                error: "Donation Not Found"
            })
        }

        donation.claimed = true

        await saveDonations()

        return res.json({
            success: true
        })

    } catch (err) {

        console.log(err)

        return res.status(500).json({
            error: "Internal Server Error"
        })
    }
})

// =========================
// CLEANUP
// =========================

app.post("/cleanup", async (req, res) => {

    donations = donations.filter(d => !d.claimed)

    await saveDonations()

    return res.json({
        success: true
    })

})

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})