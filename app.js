
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
const port = 3000;

// Replace these values with your actual MySQL database configuration
const sequelize = new Sequelize("nodeproject1", "root", "Rohith@3112", {
  host: "localhost",
  dialect: "mysql",
});


// Define the Field model
const Field = sequelize.define("Field", {
  field_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  field_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["string", "integer", "text"]],
    },
  },
});

// Define the Data model
const Data = sequelize.define("Data", {
  // Include columns for each type of field (you may need to adjust this based on your specific requirements)
  string_field: {
    type: DataTypes.STRING,
  },
  integer_field: {
    type: DataTypes.INTEGER,
  },
  text_field: {
    type: DataTypes.TEXT,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/tables", async (req, res) => {
  try {
    const tables = await Field.findAll({
      attributes: ["tableName"],
      group: ["tableName"],
    });
    const tableNames = tables.map((field) => field.tableName);

    res.json({ tableNames });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ error: "Error fetching tables" });
  }
});

app.get("/table/:tableName", async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const fields = await Field.findAll({ where: { tableName } });

    res.render("table", { tableName, fields });
  } catch (error) {
    console.error("Error fetching table fields:", error);
    res.send("Error fetching table fields");
  }
});

app.post("/insert_data/:tableName", async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const fields = await Field.findAll({ where: { tableName } });

    // Extract data from the form submission
    const data = {};
    fields.forEach((field) => {
      data[field.field_name] = req.body[field.field_name];
    });

    // Insert data into the corresponding table
    await Data.create(data);

    console.log("Data inserted successfully");
    res.redirect(`/table/${tableName}`);
  } catch (error) {
    console.error("Error inserting data:", error);
    res.send("Error inserting data");
  }
});

app.post("/create_table", async (req, res) => {
  try {
    const tableName = req.body.table_name;
    const fieldNames = req.body.field_names;

    // Generate a random table name to avoid conflicts
    const randomTableName = `table_${Date.now()}`;

    // Create the table
    await sequelize.query(
      `CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY)`,
      { raw: true }
    );

    // Create the fields
    const fieldsData = fieldNames.map((fieldName, index) => ({
      field_name: fieldName,
      field_type: req.body.field_types[index],
      tableName, // associate the field with the table
    }));
    await Field.bulkCreate(fieldsData);

    console.log("Table and fields created successfully");
    res.send("Table and fields created successfully");
  } catch (error) {
    console.error("Error creating table and fields:", error);
    res.send("Error creating table and fields");
  }
});

app.post("/delete_table/:tableName", async (req, res) => {
  try {
    const tableName = req.params.tableName;

    // Delete the table and associated fields
    await sequelize.query(`DROP TABLE IF EXISTS ${tableName}`, { raw: true });
    await Field.destroy({ where: { tableName } });

    console.log("Table deleted successfully");
    res.redirect("/tables");
  } catch (error) {
    console.error("Error deleting table:", error);
    res.send("Error deleting table");
  }
});

// ... (rest of the previous code)

// Sync the models with the database
sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error syncing models:", error);
  });
