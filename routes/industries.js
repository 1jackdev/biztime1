const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

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

// create new industry in db
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    const code = slugify(name);
    const results = await db.query(
      `INSERT INTO industries (code, name) VALUES ($1,$2) RETURNING *`,
      [code, name]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//get one industry's data
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const industryResults = await db.query(
      "SELECT i.code, i.name, c.code AS company FROM industries AS i LEFT JOIN industries_companies AS ic ON i.code = ic.industry_code LEFT JOIN companies AS c ON c.code = ic.company_code WHERE i.code=$1",
      [code]
    );
    const { indCode, name } = industryResults.rows[0];
    const companiesArr = industryResults.rows.map((r) => r.company);
    const companies = [...new Set(companiesArr)];
    return res.json({ industries: { indCode, name, companies } });
  } catch (error) {
    return next(error);
  }
});

// create new industry_company relationship
router.post("/:code", async (req, res, next) => {
  try {
    const { company } = req.body;
    const results = await db.query(
      `INSERT INTO industries_companies (industry_code, company_code) VALUES ($1,$2) RETURNING *`,
      [req.params.code, company]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});


module.exports = router;
