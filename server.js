import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import autoIncrement from "mongoose-auto-increment";
// autoIncrement = require("mongoose-auto-increment")
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
// import Joi from "Joi"
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// app.use(express.urlencoded())
app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// mongodb+srv://root:root@cluster0.fyysi.mongodb.net/pcsLMS
// mongodb+srv://pcs_lms_admin:pcs123@pcslmsdb.ooc5r.mongodb.net/pcsLMS?retryWrites=true&w=majority

app.use(bodyParser.json());

const jwtKey = "PCS SECRET KEY";
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);
mongoose.connect(
  "mongodb+srv://root:root@cluster0.fyysi.mongodb.net/pcsLMS",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("DB Connected");
  }
);

//Employee Schema
const employeeSchema = new mongoose.Schema({
  FirstName: { type: String, required: false },
  MiddleName: { type: String, required: false },
  LastName: { type: String, required: false },
  Email: { type: String, required: false, unique: false },
  Password: { type: String, required: false },
  Gender: { type: String, required: false },
  DOB: { type: Date, required: false },
  ContactNo: { type: String, required: false },
  Account: { type: Number, required: false, default: 3 },
  leaveApplication: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LeaveApplication" },
  ],
  leaveBalance: { type: Number, default: 0 },
});
autoIncrement.initialize(mongoose.connection);
employeeSchema.plugin(autoIncrement.plugin, {
  model: "Employee",
  field: "EmployeeID",
});

const employees = new mongoose.model("Employee", employeeSchema);

//Leave Application Schema

const leaveApplicationSchema = new mongoose.Schema({
  EmployeeName: { type: String },
  Leavetype: { type: String, required: false },
  FromDate: { type: Date, required: false },
  ToDate: { type: Date, required: false },
  Reasonforleave: { type: String, required: false },
  Status: { type: String, required: false },
  employee: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
});
leaveApplicationSchema.plugin(autoIncrement.plugin, {
  model: "LeaveApplication",
  field: "LeaveApplicationID",
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

// const EmployeeValidation = Joi.object().keys({

//   FirstName: Joi.string()
//     .max(200)
//     .required(),
//   MiddleName: Joi.string()
//     .max(200)
//     .required(),
//   LastName: Joi.string()
//     .max(200)
//     .required(),
//   Email: Joi.string()
//     .max(200)
//     .required(),
//   Password: Joi.string()
//     .max(100)
//     .required(),
//   Gender: Joi.string()
//     .max(100)
//     .required(),
//   DOB: Joi.date().required(),

//   ContactNo: Joi.string()
//     .max(20)
//     .required(),

//   Account: Joi.number()
//     .max(3)
//     .required()
// });

//Routes

//getting all employees details for HR module

app.get("/hr/all-emp-details", (req, res) => {
  // {
  //   "Account":3
  // },
  console.log("called");
  employees.find(
    {
      Account: 3,
    },
    function (error, allEmp) {
      if (error) {
        res.send(error);
      } else {
        console.log(allEmp);
        res.send(allEmp);
      }
    }
  );
});

//adding employees (removed verifyHR ,JOI,  EmployeeValidation functions)
app.post("/employee", (req, res) => {
  // console.log("here the data")
  // console.log(req.body.FirstName)
  let newEmployee;
  newEmployee = {
    FirstName: req.body.FirstName,
    MiddleName: req.body.MiddleName,
    LastName: req.body.LastName,
    Email: req.body.Email,
    Password: req.body.Password,
    Gender: req.body.Gender,
    DOB: req.body.DOB,
    ContactNo: req.body.ContactNo,
    Account: req.body.Account,
  };

  employees.create(newEmployee, function (err, employee) {
    if (err) {
      // console.log(err);
      res.send(err);
    } else {
      res.send(employee);

      // console.log("new employee Saved");
    }
  });
  // console.log(req.body);
});

//Login Route
app.post("/login", (req, res) => {
  // console.log("here it is")
  // console.log(req.body.userMail)
  // console.log(req.body.userPass)

  employees.findOne(
    { Email: req.body.userMail },
    "Password _id Account FirstName LastName",
    function (err, employees) {
      if (err || employees == null) {
        // console.log("first if part")
        res.send("false");
      } else {
        if (employees.Password == req.body.userPass) {
          // console.log("passed the function")
          const emp = {
            _id: employees._id,
            Account: employees.Account,
            FirstName: employees.FirstName,
            LastName: employees.LastName,
          };
          // var token = jwt.sign(emp, jwtKey)

          res.send(emp);
        } else {
          // console.log("else part")
          res.sendStatus(400);
        }
      }
    }
  );
});

//Getting Employee Information to load table in Leave Application
app.get("/leave-application-emp/:id", (req, res) => {
  // console.log(req.params.id);
  employees
    .findById(req.params.id)
    .populate({
      path: "leaveApplication",
    })
    .select("FirstName LastName MiddleName")
    .exec(function (err, employee) {
      if (err) {
        // console.log(err);
        res.send("error");
      } else {
        // console.log("successfully retrieved")
        console.log(typeof employee);
        res.send(employee);
      }
    });
});

//Adding leave applciation (removed verifyEmployee, Joi)
app.post("/leave-application-emp/:id", (req, res) => {
  employees.findById(req.params.id, function (err, employee) {
    if (err) {
      console.log(err);
      res.send("err");
    } else {
      let newLeaveApplication;
      newLeaveApplication = {
        EmployeeName: req.body.Name,
        Leavetype: req.body.Leavetype,
        FromDate: req.body.FromDate,
        ToDate: req.body.ToDate,
        Reasonforleave: req.body.Reasonforleave,
        Status: req.body.Status,
        employee: req.params.id,
      };
      // console.log(newLeaveApplication)

      LeaveApplication.create(
        newLeaveApplication,
        function (err, leaveApplication) {
          if (err) {
            // console.log(err);
            res.send("error");
          } else {
            employee.leaveApplication.push(leaveApplication);
            employee.save(function (err, data) {
              if (err) {
                // console.log(err);
                res.send("err");
              } else {
                // console.log(data);
                res.send(leaveApplication);
                // console.log(leaveApplication)
              }
            });
            // console.log("new leaveApplication Saved");
          }
        }
      );
      // console.log(req.body);
    }
  });
});

//Updating LeaveBalance in employee Record

app.put("/leave-application-emp/:id/leave-balance/", (req, res) => {
  employees.findByIdAndUpdate(
    req.params.id,
    { $set: { leaveBalance: req.body.leaveBalance } },
    function (err, response) {
      res.send(response);
    }
  );
  // res.send(employees.leaveBalance)
});

//getting employee information for profile module
app.get("/employee/:id/profile", (req, res) => {
  employees.findById({ _id: req.params.id }, function (err, employee) {
    if (err) {
      res.send(err);
    } else {
      res.send(employee);
    }
  });
});

//Getting Leave balance from employee record to display

app.get("/leave-application-emp/:id/leave-balance", (req, res) => {
  employees.findById({ _id: req.params.id }, function (err, employee) {
    if (err) {
      res.send("error");
      // console.log(err)
    } else {
      // console.log(employee.leaveBalance)
      res.send(employee);
    }
  });
});

//Deleting Leave Application by Employee
app.delete("/leave-application-emp/:id/:id2", (req, res) => {
  employees.findById({ _id: req.params.id }, function (err, employee) {
    if (err) {
      res.send("error");
      // console.log(err);
    } else {
      LeaveApplication.findByIdAndRemove(
        { _id: req.params.id2 },
        function (err, leaveApplication) {
          if (!err) {
            // console.log("LeaveApplication deleted");
            employees.update(
              { _id: req.params.id },
              { $pull: { leaveApplication: req.params.id2 } },
              function (err, numberAffected) {
                // console.log(numberAffected);
                res.send(leaveApplication);
              }
            );
          } else {
            // console.log(err);
            res.send("error");
          }
        }
      );
      // console.log("delete");
      // console.log(req.params.id);
    }
  });
});

//Updating Leave Application by employee

app.put("/leave-application-emp/:id", (req, res) => {
  // console.log(req.params.id)
  console.log("api called");
  let newLeaveApplication;
  newLeaveApplication = {
    Leavetype: req.body.Leavetype,
    FromDate: req.body.FromDate,
    ToDate: req.body.ToDate,
    Reasonforleave: req.body.Reasonforleave,
    Status: req.body.Status,
    employee: req.params.id,
  };
  console.log("newLeave", newLeaveApplication);
  LeaveApplication.findByIdAndUpdate(
    req.params.id,
    newLeaveApplication,
    function (err, leaveApplication) {
      if (err) {
        res.send("error");
      } else {
        console.log("leaveApplication", leaveApplication);
        res.send(leaveApplication);
      }
    }
  );

  // console.log("put");
  // console.log(req.body);
});

//approving leave application by HR

app.put("/leave-application-hr/:id", (req, res) => {
  let newLeaveApplication;

  newLeaveApplication = {
    Status: req.body.Status,
  };
  LeaveApplication.findByIdAndUpdate(
    req.params.id,
    {
      $set: newLeaveApplication,
    },
    function (err, numberAffected) {
      // console.log(numberAffected);
      res.send(newLeaveApplication);
    }
  );
});

//HR GET ALL LEAVE REQUESTS

app.get("/leave-application-hr", (req, res) => {
  LeaveApplication.find()
    .populate({
      path: "employee",
    })
    .exec(function (err, leaveApplication) {
      if (err) {
        // console.log(err);
        res.send("error");
      } else {
        console.log("leaveApplication", leaveApplication);
        res.send(leaveApplication);
      }
    });
});

//HR APPROVAL of EMPLOYEE
app.put("/leave-application-hr/:id", (req, res) => {
  let newLeaveApplication;

  newLeaveApplication = {
    Status: req.body.Status,
  };
  LeaveApplication.findByIdAndUpdate(
    req.params.id,
    {
      $set: newLeaveApplication,
    },
    function (err, numberAffected) {
      // console.log(numberAffected);
      res.send(newLeaveApplication);
    }
  );
});

//HR DELETE LEAVE REQUEST

app.delete("/leave-application-hr/:id/:id2", (req, res) => {
  employees.findById({ _id: req.params.id }, function (err, employee) {
    if (err) {
      res.send("error");
      // console.log(err);
    } else {
      LeaveApplication.findByIdAndRemove(
        { _id: req.params.id2 },
        function (err, leaveApplication) {
          if (!err) {
            // console.log("LeaveApplication deleted");
            employees.update(
              { _id: req.params.id },
              { $pull: { leaveApplication: req.params.id2 } },
              function (err, numberAffected) {
                // console.log(numberAffected);
                res.send(leaveApplication);
              }
            );
          } else {
            // console.log(err);
            res.send("error");
          }
        }
      );
      // console.log("delete");
      // console.log(req.params.id);
    }
  });
});

//for nodemailer to send mail

app.get("/leave-application-hr/:id/status-mail/", (req, res) => {
  LeaveApplication.findById(req.params.id).exec(function (err, employee) {
    if (err) {
      res.send(err);
      // console.log(err)
    } else {
      // to get mail id from employee db
      const employee_id = employee.employee[0];
      employees.findById(employee_id).exec(function (e, emp) {
        if (e) {
          // console.log(e)
        } else {
          res.send(emp.Email);
        }
      });
    }
  });
});
app.listen(process.env.PORT || 9002, () => {
  console.log("BE started at port 9002");
});
