const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//checks if an id is in the db
async function checkCode(id) {
  const codeCheck = await db.query(
    `SELECT id,comp_Code, amt, paid, paid_date FROM invoices WHERE id=$1`,
    [id]
  );
  if (codeCheck.rowCount === 0) {
    const err = new ExpressError("Invoice Not Found", 404);
    return err;
  }
}

//get all invoice data
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM invoices;");
    return res.json({ invoices: results.rows });
  } catch (error) {
    return next(error);
  }
});

//get one invoice's data
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const codecheckErr = await checkCode(id);
    if (codecheckErr) {
      return next(codecheckErr);
    }
    // handle invoice query
    const invResults = await db.query(`SELECT * FROM invoices WHERE id=$1`, [
      id,
    ]);
    let companyCode = invResults.rows[0].comp_code;
    // handle related company query
    const compResults = await db.query(
      `SELECT * FROM companies WHERE code=$1`,
      [companyCode]
    );
    delete invResults.rows[0].comp_code;
    invResults.rows[0].company = compResults.rows[0];
    return res.json({ invoice: invResults.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// create new invoice in db
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//edit existing invoice
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const codecheckErr = await checkCode(id);
    if (codecheckErr) {
      return next(codecheckErr);
    }
    const { amt, paid } = req.body;
    const invResults = await db.query(`SELECT * FROM invoices WHERE id=$1`, [
      id,
    ]);
    // update invoice depending on paid value
    let results;
    if (invResults.rows[0].paid === true && paid === false) {
      results = await db.query(
        `UPDATE invoices SET amt=$2, paid=$3, paid_date=null WHERE id=$1 RETURNING *`,
        [id, amt, paid]
      );
    } else if (invResults.rows[0].paid === false && paid === true) {
      results = await db.query(
        `UPDATE invoices SET amt=$2, paid=$3, paid_date=NOW() WHERE id=$1 RETURNING *`,
        [id, amt, paid]
      );
    } else {
      results = await db.query(
        `UPDATE invoices SET amt=$2 WHERE id=$1 RETURNING *`,
        [id, amt]
      );
    }
    return res.status(200).json({ invoice: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//delete invoice
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const codecheckErr = await checkCode(id);
    if (codecheckErr) {
      return next(codecheckErr);
    }

    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
