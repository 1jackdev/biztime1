const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//checks if a code is in the db
async function checkCode(code) {
  const codeCheck = await db.query(
    `SELECT code, name, description FROM companies WHERE code=$1`,
    [code]
  );
  if (codeCheck.rowCount === 0) {
    const err = new ExpressError("Company Not Found", 404);
    return err;
  }
}

//get all company data
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies;");
    return res.json({ companies: results.rows });
  } catch (error) {
    return next(error);
  }
});

//get one company's data
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const codecheckErr = await checkCode(code);
    if (codecheckErr) {
      return next(codecheckErr);
    }
    const compResults = await db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`,
      [code]
    );
    const invResults = await db.query(
      `SELECT * FROM invoices WHERE comp_code=$1`,
      [code]
    );
    compResults.rows[0].invoices = invResults.rows
    return res.json({ company: compResults.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// create new row in db
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING *`,
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//edit existing company
router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const codecheckErr = await checkCode(code);
    if (codecheckErr) {
      return next(codecheckErr);
    }

    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$2, description=$3 WHERE code=$1 RETURNING *`,
      [code, name, description]
    );
    return res.status(200).json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//delete company
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const codecheckErr = await checkCode(code);
    if (codecheckErr) {
      return next(codecheckErr);
    }

    const results = await db.query(`DELETE FROM companies WHERE code=$1`, [
      code,
    ]);
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
