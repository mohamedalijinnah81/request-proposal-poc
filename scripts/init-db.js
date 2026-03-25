// scripts/init-db.js
// Run with: node scripts/init-db.js

const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

async function initDb() {
  const connection = await mysql.createConnection(dbConfig);
  console.log("Connected to database");

  // Users table (customers and experts)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('customer', 'expert') NOT NULL,
      domain VARCHAR(255) DEFAULT NULL,
      identifier VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Created users table");

  // Requests table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      budget VARCHAR(255) NOT NULL,
      timeframe VARCHAR(255) NOT NULL,
      notes TEXT DEFAULT NULL,
      status ENUM('created', 'sent', 'completed') NOT NULL DEFAULT 'created',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id)
    )
  `);
  console.log("Created requests table");

  // Request-expert assignments
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS request_experts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      expert_id INT NOT NULL,
      status ENUM('requested', 'proposal_received', 'under_refinement', 'updated_proposal_received', 'proposal_accepted', 'not_selected') NOT NULL DEFAULT 'requested',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(id),
      FOREIGN KEY (expert_id) REFERENCES users(id),
      UNIQUE KEY unique_request_expert (request_id, expert_id)
    )
  `);
  console.log("Created request_experts table");

  // Proposals table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      expert_id INT NOT NULL,
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      price VARCHAR(255) NOT NULL,
      attachment_name VARCHAR(255) DEFAULT NULL,
      status ENUM('requested', 'proposal_received', 'under_refinement', 'updated_proposal_received', 'proposal_accepted', 'not_selected') NOT NULL DEFAULT 'proposal_received',
      version INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(id),
      FOREIGN KEY (expert_id) REFERENCES users(id)
    )
  `);
  console.log("Created proposals table");

  // Events/audit log table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT DEFAULT NULL,
      type VARCHAR(100) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
    )
  `);
  console.log("Created events table");

  // Seed users
  const users = [
    ["Demo Customer", "customer@demo.local", "demo123", "customer", null, "customer-1"],
    ["Dr. Anna Weber", "anna@demo.local", "demo123", "expert", "Market Research", "expert-1"],
    ["Julian Kaya", "julian@demo.local", "demo123", "expert", "Competitive Analysis", "expert-2"],
    ["Mira Hansen", "mira@demo.local", "demo123", "expert", "Regulatory Assessment", "expert-3"],
    ["Thomas Brandt", "thomas@demo.local", "demo123", "expert", "Financial Analysis", "expert-4"],
    ["Sophie Müller", "sophie@demo.local", "demo123", "expert", "Strategy Consulting", "expert-5"],
  ];

  for (const [name, email, password, role, domain, identifier] of users) {
    await connection.execute(
      `INSERT IGNORE INTO users (name, email, password_hash, role, domain, identifier) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, role, domain, identifier]
    );
  }
  console.log("Seeded users");

  await connection.end();
  console.log("Database initialization complete!");
  console.log("\nTest accounts:");
  console.log("  Customer: customer@demo.local / demo123");
  console.log("  Expert 1: anna@demo.local / demo123");
  console.log("  Expert 2: julian@demo.local / demo123");
  console.log("  Expert 3: mira@demo.local / demo123");
  console.log("  Expert 4: thomas@demo.local / demo123");
  console.log("  Expert 5: sophie@demo.local / demo123");
}

initDb().catch(console.error);