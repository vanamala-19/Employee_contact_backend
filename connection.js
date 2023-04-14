const mysql = require("mysql2");
const con = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "admin@605429",
    database: "employee_details",
    port: 3306
});

con.connect((err) => {
    if(err){
        throw err
    }
    console.log("connection created...!!");
});

module.exports = con;