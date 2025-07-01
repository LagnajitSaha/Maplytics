⚫ Maplytics

Maplytics is a family travel tracker web app that allows multiple users to visually mark the countries they've visited on an interactive SVG world map. Each user is color-coded, can add or remove visited countries, and easily switch between profiles — with all data stored persistently in PostgreSQL.

⚫ Features
• Add new users with color theme  
• Mark/unmark countries visited  
• Visualize visited countries on a world map  
• Switch between existing users  
• Remove users (with visited countries)  
• Persistent database storage  
• User data is fully isolated  
• Responsive layout (mobile/tablet friendly)

⚫ Tech Stack
- **Frontend:** EJS, HTML, CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Other:** Sessions, dotenv for environment config.
⚫ Project Structure
-  Maplytics/
├── views/
│ ├── index.ejs # Main map + user UI
│ ├── new.ejs # New user creation page
├── public/
│ └── styles/
│ ├── main.css # Global styling
│ └── new.css # Styles for new user form
├── .env # Environment variables (excluded from Git)
├── index.js # Main server file
├── README.md # Project documentation
├── package.json # NPM config

⚫ Database Schema

Ensure the following PostgreSQL tables exist:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL
);

CREATE TABLE visited_countries (
  id SERIAL PRIMARY KEY,
  country_code TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id)
);

⚫ Getting Started
1. Clone the repository
git clone https://github.com/your-username/maplytics.git
cd maplytics

2. Install dependencies
npm install

3. Set up your PostgreSQL database
Ensure you have PostgreSQL installed and running. Then, create a database named world, and import your country data into the countries table.

4. Create a .env file
Do not commit .env to version control.

5. Run the app
node index.js
Visit: http://localhost:3000

For feedback or contributions, reach out at [arpitasaha3000@gmail.com]

