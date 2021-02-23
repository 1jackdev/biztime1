const express = require("express");
const router = express.Router();
const { Client } = require("pg");

//get all invoice data
router.get("/", async (req,res, next)=>{
    try {
        const result = await 
    } catch (error) {
        return next(error)
    }
})

module.exports = router;