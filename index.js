const express = require('express');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const { check, validationResult } = require('express-validator');

const cors = require('cors');
app.use(cors());


const mysql = require('promise-mysql');
mysql 
    .createPool({
        connectionLimit: 10,
        user: 'root',
        host: 'localhost',
        port : 3306,
        password: '',
        database: 'proj2022',
    })
    .then((p) => {
        pool = p;
        })
.catch((e) => {
    console.log(e);
});

app.set('view engine', 'ejs')
const mongoose = require('mongoose');
const urlmongo = "mongodb+srv://anthony:zFMcv2X1ldoJeHbZ@cluster0.z7tflo3.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(urlmongo, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error:'));
let employeesDB = db.useDb("employeesDB")
const employeeSchema = new mongoose.Schema({
    _id: String,
    phone: String,
    email: String,
});
const EmployeeModel = employeesDB.model("employees", employeeSchema);
app.listen(port, () => 
{
    console.log(`Example app listening at http://localhost:${port}`)
})


//home
app.get('/', (req, res) =>
{
   res.render("home", {errors: "undefined"})
})



//employees
app.get('/employees', (req, res) =>
{
    pool.query("select * from employee").then((d) =>
    {
        res.render("employees", { employees: d })
    }).catch((e) =>
    {
        res.redirect("/")
     
    })
});

//edit
app.get('/employees/edit/:eid',(req, res) =>
    {
        pool.query("select * from employee where eid = ?", [req.params.eid]).then((d) =>
        {
            res.render("employee", { employee: d[0], errors: "undefined" })
        }).catch((e) =>
        {
            res.redirect("/employees")
        })
    }
);

app.post('/employees/edit/:eid', 
[
   check("ename").isLength({ min: 5 }).withMessage("Name must be 5 letters long")
],
[
    check("role").isIn([ "Manager","Employee"]).withMessage("Role should be Manager or Employee")
],
[
    check("salary").isFloat({gt:0}).withMessage("Salary should be > 0")
],
(req, res) => 
{
const errors = validationResult(req);
let data={};
data.eid = req.params.eid;
data.name = req.body.name;
data.role = req.body.role;
data.salary = req.body.salary;

if (!errors.isEmpty()) 
{
    res.render("employee", { employee: data, errors: errors.array() })
}
else
{
    pool.query(`UPDATE employee SET ename='${req.body.ename}', role='${req.body.role}', salary='${req.body.salary}' WHERE eid = '${req.params.eid}'`).then((d) =>
    {
        res.redirect("/employees")
    }).catch((e) =>
    {
        res.redirect("/employees")
    })
}
});

//departments

app.get('/depts', (req, res) =>
{
    pool.query("select * from dept").then((d) =>
    {
        res.render("depts", { depts: d })
    }).catch((e) =>
    {
        res.redirect("/")
    })
});
//departments delete
app.get('/depts/delete/:did', (req, res) =>
{
    pool.query("delete from depts where did = ?", [req.params.did]).then((d) =>
    {
        res.redirect("/depts")
    }).catch((e) =>
    {
        res.status(500).send(
            `<div>
            <h1>Error Message</h1>
            <h2>${req.params.did} has employees in it and can not be deleted</h2>
            <a href="/depts">Home</a>
        </div>`)
    })
});


// Employees (Mongodb) page


app.get('/employeesMongoDB' , async (req, res) =>
{
    let result = await EmployeeModel.find({})
   
    res.render("Mongodb/mongoemployees", { employees: result });
});



app.get('/Mongodb/add', async (req, res) =>
{
    res.render("Mongodb/add", { errors: undefined });
});

// Employees (Mongodb) page add

app.post('/Mongodb/add',
[
    check("_id").isLength({ max: 4 }).withMessage("name must be 5 letters long")
],
[
    check("phone").isLength({ gt: 5 }).withMessage("Phone must be 10 Phone number must be > 5" )
],
[
    check("email").isEmail().withMessage("Email must be valid")
],
(req, res) =>
{
    const errors = validationResult(req);
    let data = {};
    data._id = req.body._id;
    data.phone = req.body.phone;
    data.email = req.body.email;

    if (!errors.isEmpty())
    {
        res.render("Mongodb/add", { employee: data, errors: errors.array() })
    }
    else
    {
        let newEmployee = new EmployeeModel(data);
        newEmployee.save();
        res.redirect("/employeesMongoDB")
    }
});
