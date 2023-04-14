const express = require("express");
const app = express();
const port = 3004;
const mysql = require("./connection");



// CONFIGURATION
app.set("view engine", "hbs")
app.set("views", "./view");
app.use(express.static(__dirname + "/public"))


// ROUTES
app.get("/", (req, res) => {
    mysql.query(`SELECT  e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
    c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
    c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
    FROM employee e
    JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
        SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
        )
        JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
            SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            ORDER BY e.EmpId ASC`, (err, results) => {
        const currentPage = req.params.page || 1;
        const totalPages = Math.ceil(results.length / 4);

        let prevPage = parseInt(currentPage) - 1;
        if (prevPage < 1) {
            prevPage = 1;
        }

        let nextPage = parseInt(currentPage) + 1;
        if (nextPage > totalPages) {
            nextPage = totalPages;
        }
        let qry = ` SELECT  e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
            c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
            c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
            FROM employee e
            JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
             SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
             SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            ORDER BY e.EmpId ASC
            LIMIT 4
            OFFSET ${(parseInt(currentPage) - 1) * 4};`;
        mysql.query(qry, (err, results) => {

            res.render("index", { results, currentPage, prevPage, nextPage });
        });
    })
});

app.get("/add", (req, res) => { res.render("add") });

app.get("/search", (req, res) => { res.render("search") });

app.get("/update", (req, res) => { res.render("update") });

app.get("/delete", (req, res) => { res.render("delete") });

app.get("/addEmployee", (req, res) => {
    // fetching data from form
    const { name, job, phone, email, adress, city, state, c1name, c1phone, c1relation, c2name, c2phone, c2relation } = req.query;

    let qry = "SELECT * FROM employee WHERE Email=? or Phone=? or adress=?";
    mysql.query(qry, [email, phone, adress], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.render("add", { checkmesg: true });
        } else {
            let lastEmployeeId;
            qry = `INSERT INTO employee (EmpName,JobTitle,Phone,Email,adress,city,state) VALUES (?,?,?,?,?,?,?)`;
            mysql.query(qry, [name, job, phone, email, adress, city, state], (err, results) => {
                if (err) {
                    throw err;
                }
                lastEmployeeId = results.insertId;
                qry = `INSERT INTO contact (Name, phone, Relationship, EmpId) VALUES (?,?,?,?),(?,?,?,?)`;
                mysql.query(qry, [c1name, c1phone, c1relation, lastEmployeeId, c2name, c2phone, c2relation, lastEmployeeId], (err, results) => {
                    if (err) {
                        throw err;
                    }
                });
                res.render("add", { msg: true });
            });

        }
    })
});
// CREATE SERVER
app.listen(port, (error) => {
    if (error) {
        throw error;
    }
    console.log(`the app is running on ${port}`);
});
app.get("/searchdata", (req, res) => {
    const { name, phone } = req.query;
    let qry = ` SELECT  e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
    c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
    c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
FROM employee e
JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
 SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
)
JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
 SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
)
 WHERE e.EmpName = '${name}' AND e.Phone = '${phone}'`;
    mysql.query(qry, (err, results) => {
        if (err) throw err;
        if (results.length < 1) {
            res.render("search", { checkmesg: true });
        }
        res.render("search", { results });
    })

});
app.get("/deteledata", (req, res) => {
    const { name, phone } = req.query;
    let qry = ` SELECT  e.EmpId
            FROM employee e
            JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
             SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
             SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
            )
             WHERE e.EmpName = '${name}' AND e.Phone = '${phone}'`;
    mysql.query(qry, (err, results) => {
        if (err) throw err;
        if (results.length < 1) {
            res.render("delete", { checkmesg: true })
        } else {
            const id = results[0].EmpId;
            qry = `DELETE FROM contact
                WHERE EmpId = ${id};`
            mysql.query(qry, (err, results) => {
                if (err) throw err;
                qry = `DELETE FROM employee
                    WHERE EmpId = ${id};`
                mysql.query(qry, (err, results) => {
                    if (err) throw err;
                    console.log(results);
                    res.render("delete", { msg: true })
                })
            })
        }

    })
});
app.get("/updatedata", (req, res) => {
    const { name, phone } = req.query;
    let qry = ` SELECT e.EmpId, e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
    c1.contactId as c1,c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
    c2.contactId as c2,c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
        FROM employee e
        JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
         SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
        )
        JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
         SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
        )
         WHERE e.EmpName = '${name}' AND e.Phone = '${phone}'`;
    mysql.query(qry, (err, results) => {
        if (err) throw err;
        if (results.length < 1) {
            res.render("update", { checkmesg: true })
        } else {
            console.log(results);
            res.render("update", { results });
        }

    })
});
app.get("/updateAddEmployee", (req, res) => {
    // fetching data from form
    const { id, c1, c2, name, job, phone, email, adress, city, state, c1name, c1phone, c1relation, c2name, c2phone, c2relation } = req.query;
    console.log(id, c1, c2);
    qry = `UPDATE employee 
                SET EmpName = "${name}",JobTitle="${job}",Phone="${phone}",Email="${email}",adress="${adress}",city="${city}",state="${state}" 
                WHERE EmpId="${id}"`;
    mysql.query(qry, (err, results) => {
        if (err) {
            throw err;
        }
        qry = ` UPDATE contact
                SET Name="${c1name}", phone="${c1phone}", Relationship="${c1relation}"
                WHERE contactId="${c1}"`;
        mysql.query(qry, (err, results) => {
            if (err) {
                throw err;
            }
        });
        qry = ` UPDATE contact
                SET Name="${c2name}", phone="${c2phone}", Relationship="${c2relation}"
                WHERE contactId="${c2}"`;
        mysql.query(qry, (err, results) => {
            if (err) {
                throw err;
            }
        });
        res.render("update", { msg: true });
    });
});


app.get("/:page", (req, res) => {
    const currentPage = req.params.page || 1;
    mysql.query(`SELECT  e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
            c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
            c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
            FROM employee e
            JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
             SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
             SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            ORDER BY e.EmpId ASC`, (err, results) => {
        const totalPages = Math.ceil(results.length / 4);
        let prevPage = parseInt(currentPage) - 1;
        if (prevPage < 1) {
            prevPage = 1;
        }

        let nextPage = parseInt(currentPage) + 1;
        if (nextPage > totalPages) {
            nextPage = totalPages;
        }
        let qry = ` SELECT  e.EmpName, e.JobTitle,e.Phone, e.Email,e.adress,e.city,e.state,
            c1.Name as Name1, c1.Phone as Phone1, c1.Relationship as Relationship1,
            c2.Name as Name2, c2.Phone as Phone2, c2.Relationship as Relationship2
            FROM employee e
            JOIN contact c1 ON e.EmpId = c1.EmpId AND c1.contactId = (
             SELECT MIN(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            JOIN contact c2 ON e.EmpId = c2.EmpId AND c2.contactId = (
             SELECT MAX(contactId) FROM contact WHERE EmpId = e.EmpId
            )
            ORDER BY e.EmpId ASC
            LIMIT 4
            OFFSET ${(parseInt(currentPage) - 1) * 4};`;
        mysql.query(qry, (err, results) => {

            res.render("index", { results, currentPage, prevPage, nextPage });
        });
    })

});
