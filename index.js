import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Add session to remember current user
app.use(session({
  secret: "maplytics-secret-key",
  resave: false,
  saveUninitialized: false,
}));

let users = [];

async function getUsers() {
  const result = await db.query("SELECT * FROM users ORDER BY id ASC");
  users = result.rows;
}

function getCurrentUserId(req) {
  return req.session.userId;
}

function getCurrentUser(req) {
  return users.find((user) => user.id === getCurrentUserId(req));
}

async function checkVisited(req) {
  const userId = getCurrentUserId(req);
  if (!userId) return [];
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id = $1",
    [userId]
  );
  return result.rows.map((row) => row.country_code);
}

app.get("/", async (req, res) => {
  await getUsers();
  const userId = getCurrentUserId(req);

  // Handle deleted user by assigning first available user
  if (!users.find(u => u.id === userId)) {
    req.session.userId = users.length > 0 ? users[0].id : null;
  }

  const currentUser = getCurrentUser(req);
  const countries = await checkVisited(req);

  res.render("index.ejs", {
    countries,
    total: countries.length,
    users,
    color: currentUser?.color || "gray",
    error: null
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const action = req.body.action;
  const currentUserId = getCurrentUserId(req);

  if (!currentUserId) return res.redirect("/");

  if (action === "delete-user") {
    await db.query("DELETE FROM visited_countries WHERE user_id = $1;", [currentUserId]);
    await db.query("DELETE FROM users WHERE id = $1;", [currentUserId]);
    await getUsers();
    req.session.userId = users.length > 0 ? users[0].id : null;
    return res.redirect("/");
  }

  try {
    let result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1;",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      result = await db.query(
        "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
        [input.toLowerCase()]
      );
    }

    if (result.rows.length === 0 || result.rows.length > 1) {
      return res.render("index.ejs", {
        countries: await checkVisited(req),
        total: (await checkVisited(req)).length,
        users,
        color: getCurrentUser(req)?.color || "gray",
        error: result.rows.length === 0
          ? "Country not found."
          : "Multiple countries match your input. Please be more specific."
      });
    }

    const countryCode = result.rows[0].country_code;

    if (action === "add") {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2);",
        [countryCode, currentUserId]
      );
    } else if (action === "delete") {
      await db.query(
        "DELETE FROM visited_countries WHERE country_code = $1 AND user_id = $2;",
        [countryCode, currentUserId]
      );
    }

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding/deleting country.");
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    await getUsers();
    const userId = getCurrentUserId(req);
    const currentUser = users.find((u) => u.id === userId);
    return res.render("new.ejs", {
      users: users,
      color: currentUser?.color || "gray"
    });
  } else {
    req.session.userId = parseInt(req.body.user);
    return res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id;",
    [name, color]
  );

  req.session.userId = result.rows[0].id;
  res.redirect("/");
});

app.set("view engine", "ejs");

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
