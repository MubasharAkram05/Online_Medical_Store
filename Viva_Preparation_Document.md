# Viva Preparation - Online Medical Store Management System

## Project Overview
This is an Online Medical Store Management System built with:
- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: React.js
- **Database**: MySQL with relational schema
- **Features**: User management, prescription upload, medicine ordering, payment processing, admin dashboard

## Detailed Answers to Questions

### 2: Send the Request
In the application, sending a request typically refers to making API calls from the frontend to the backend. For example:

```javascript
// Example from medicineService.js
getMedicinesByIds: (ids) => api.get('/medicines', { params: { ids: ids.join(',') } })
```

The request flow:
1. User action triggers frontend function
2. Axios/Fetch API sends HTTP request to backend endpoint
3. Backend processes request and returns response
4. Frontend updates UI based on response

### 3: Show the Page Where Status Updated
Status updates occur in several places:
- **Prescription Status**: In prescription upload page, status changes from 'pending' to 'approved'/'rejected'
- **Order Status**: In orders page, status updates from 'pending' to 'confirmed', 'processing', 'shipped', 'delivered'
- **Admin Dashboard**: Admin can update prescription and order statuses

The status update page shows:
- Current status with color coding
- Status history/timeline
- Update timestamp
- Action buttons for status changes

### 4: Change the Button Color
To change button color in React:
```css
/* In CSS file */
.btn-primary {
  background-color: #007bff; /* Change this */
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #0056b3; /* Change hover color */
}
```

Or using inline styles:
```jsx
<button style={{ backgroundColor: '#007bff', color: 'white' }}>
  Button Text
</button>
```

### 5: Add the Button at Home Page
To add a button to the home page:

1. Locate `HomePage.js` in `frontend/src/pages/`
2. Add the button in the JSX return statement
3. Add click handler function
4. Style the button appropriately

Example:
```jsx
const HomePage = () => {
  const handleButtonClick = () => {
    // Button functionality
  };

  return (
    <div className="home-page">
      {/* Existing content */}
      <button 
        className="btn btn-primary"
        onClick={handleButtonClick}
      >
        New Button
      </button>
    </div>
  );
};
```

### 6: Open Notification Center
The notification center would typically:
- Show system notifications
- Display order updates
- Prescription approval/rejection alerts
- Payment confirmations
- Medicine availability alerts

Implementation would involve:
- State management for notifications
- Modal/sidebar component
- API endpoints for fetching notifications
- Real-time updates using WebSockets or polling

### 7: Present Your Presentation
**Project Presentation Structure:**

1. **Introduction**
   - Problem statement: Need for online medical store with prescription management
   - Solution: Comprehensive web application

2. **System Architecture**
   - Frontend: React.js SPA
   - Backend: Node.js/Express API
   - Database: MySQL relational database
   - File storage: Local uploads directory

3. **Key Features**
   - User registration/authentication
   - Prescription upload and verification
   - Medicine catalog with search/filter
   - Shopping cart and checkout
   - Payment processing
   - Order tracking
   - Admin dashboard for management

4. **Database Design**
   - Entity-Relationship diagram
   - Tables: users, medicines, orders, prescriptions, etc.
   - Relationships and constraints

5. **Technical Implementation**
   - API endpoints
   - Authentication middleware
   - File upload handling
   - Data validation

6. **Demo**
   - Live demonstration of key features

### 8: Explain Use Case and Sequence Diagram

#### Use Case Diagram
A use case diagram shows the interactions between actors and the system.

**Actors in our system:**
- Patient/Customer
- Doctor
- Pharmacist
- Admin

**Key Use Cases:**
- Register/Login
- Upload Prescription
- Browse Medicines
- Add to Cart
- Place Order
- Make Payment
- Track Order
- Verify Prescription (Pharmacist/Admin)
- Manage Medicines (Admin)
- Generate Reports (Admin)

**Include vs Exclude:**
- **Include**: Relationships where one use case always includes another
- **Extend**: Optional functionality that may be included

#### Sequence Diagram
Shows the sequence of interactions between objects over time.

Example: Order Placement Sequence
1. User browses medicines
2. User adds items to cart
3. User proceeds to checkout
4. System validates prescription requirement
5. User uploads prescription if required
6. System processes payment
7. System creates order
8. System sends confirmation

### 9: Difference Between DB & DBMS

**Database (DB):**
- Collection of organized data
- Stored in a structured format
- Contains tables, records, fields
- Passive entity - just data storage

**Database Management System (DBMS):**
- Software system that manages databases
- Provides interface to interact with database
- Handles data storage, retrieval, update, delete
- Examples: MySQL, PostgreSQL, MongoDB
- Active entity - manages the database

**Key Differences:**
- DB is data, DBMS is software
- DB is passive, DBMS is active
- DB stores data, DBMS manages data
- DB can exist without DBMS, but DBMS needs DB to manage

### 10: What is JOIN in SQL
JOIN is a SQL operation that combines rows from two or more tables based on a related column between them.

**How JOIN Works:**
1. Takes two tables as input
2. Matches rows based on join condition (usually foreign key relationship)
3. Returns combined result set
4. Can include all rows or only matching rows depending on join type

### 11: Types of JOINs Used in Project
From the codebase analysis, the project uses:

1. **INNER JOIN**: Returns only matching rows from both tables
   ```sql
   JOIN orders o ON o.id = oi.order_id
   JOIN users u ON u.id = o.user_id
   JOIN medicines m ON m.id = oi.medicine_id
   ```

2. **LEFT JOIN**: Returns all rows from left table and matching rows from right table
   ```sql
   LEFT JOIN prescriptions p ON p.id = oi.prescription_id
   ```

## Database Concepts

### What is Database Management System
A Database Management System (DBMS) is software that enables users to create, maintain, and manipulate databases. It provides:

- **Data Definition**: Create, modify database structure
- **Data Manipulation**: Insert, update, delete, query data
- **Data Control**: Security, access control, concurrency
- **Data Administration**: Backup, recovery, performance tuning

**Examples:** MySQL, PostgreSQL, Oracle, SQL Server

### What is Primary Key
A Primary Key is a column or set of columns that uniquely identifies each row in a table.

**Characteristics:**
- Must contain unique values
- Cannot be NULL
- Only one primary key per table
- Can be single column or composite

**Example in our schema:**
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  -- other columns
);
```

### What is Normalization
Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.

**Goals:**
- Eliminate redundant data
- Ensure data dependencies make sense
- Protect data integrity

**Normal Forms:**
1. **1NF**: Eliminate repeating groups
2. **2NF**: Remove partial dependencies
3. **3NF**: Remove transitive dependencies
4. **BCNF**: Boyce-Codd Normal Form
5. **4NF**: Multi-valued dependencies
6. **5NF**: Join dependencies

### Name Any Four SQL Queries
1. **SELECT**: Retrieve data from tables
   ```sql
   SELECT name, price FROM medicines WHERE stock > 0;
   ```

2. **INSERT**: Add new records
   ```sql
   INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
   ```

3. **UPDATE**: Modify existing records
   ```sql
   UPDATE medicines SET stock = stock - 1 WHERE id = 123;
   ```

4. **DELETE**: Remove records
   ```sql
   DELETE FROM orders WHERE status = 'cancelled';
   ```

### What is DDL
DDL stands for Data Definition Language. It includes SQL commands that define or modify database structure:

- **CREATE**: Create tables, indexes, views
- **ALTER**: Modify table structure
- **DROP**: Delete tables, indexes
- **TRUNCATE**: Remove all data from table

### What is JOIN and How It Works
JOIN combines rows from two or more tables based on related columns.

**How it works:**
1. Identify related columns (usually primary-foreign key relationship)
2. Match rows where join condition is true
3. Include columns from both tables in result
4. Handle unmatched rows based on join type

**Example:**
```sql
SELECT u.name, o.order_number
FROM users u
JOIN orders o ON u.id = o.user_id;
```

### Table vs Tuple
- **Table**: Collection of related data organized in rows and columns
- **Tuple**: Single row/record in a table (also called record)

### Normalization (Detailed)
**1NF (First Normal Form):**
- No repeating groups
- Atomic values only
- Each column contains indivisible values

**2NF (Second Normal Form):**
- Must be in 1NF
- No partial dependencies
- Non-key attributes depend on entire primary key

**3NF (Third Normal Form):**
- Must be in 2NF
- No transitive dependencies
- Non-key attributes depend only on primary key

### Types of JOINs
1. **INNER JOIN**: Only matching rows
2. **LEFT JOIN**: All rows from left table + matching from right
3. **RIGHT JOIN**: All rows from right table + matching from left
4. **FULL OUTER JOIN**: All rows from both tables
5. **CROSS JOIN**: Cartesian product
6. **SELF JOIN**: Join table with itself

## Viva Questions from Registration Page

### Backend Questions
**Inheritance:**
- OOP concept where child class inherits properties/methods from parent class
- In JavaScript: Prototypal inheritance
- In our Node.js code: Classes extend base classes

**Protected void:**
- Java concept (not directly applicable to JS)
- Protected: Accessible within class and subclasses
- Void: Method returns no value

**Query Explanation:**
- SQL queries in our code use prepared statements
- Example: `SELECT * FROM users WHERE email = ?`
- Parameters prevent SQL injection

**Parameters:**
- Values passed to functions/methods
- In SQL: Parameterized queries use placeholders
- In our code: req.params, req.body, req.query

**Code Explanation:**
- Backend uses Express.js framework
- Middleware for authentication, validation
- Controllers handle business logic
- Models interact with database

## UML Diagrams Explanation

### Use Case Diagram Details
**Include vs Exclude:**
- **Include**: Mandatory relationship (use case always includes another)
- **Extend**: Optional relationship (use case may include another)

**Optional vs Mandatory:**
- **Mandatory**: Must be performed (e.g., login before ordering)
- **Optional**: May be performed (e.g., upload prescription)

**Users and Use Case Interactions:**
- Patient: Register, login, browse medicines, place orders
- Doctor: May upload prescriptions for patients
- Pharmacist: Verify prescriptions, manage inventory
- Admin: Manage users, medicines, orders, reports

### Entities and Attributes
**Main Entities:**
- User (id, name, email, phone, role)
- Medicine (id, name, price, stock, category)
- Order (id, user_id, status, total_amount)
- Prescription (id, user_id, file_path, status)

### Aggregation vs Composition
**Aggregation:** "Has-a" relationship, parts can exist independently
- Example: Order has medicines (medicines exist without order)

**Composition:** Strong "owns" relationship, parts cannot exist without whole
- Example: Order details are part of order (cannot exist without order)

### Cardinality Types
- **1:1**: One to one (User has one profile)
- **1:N**: One to many (User has many orders)
- **N:1**: Many to one (Orders belong to one user)
- **N:M**: Many to many (Medicines can be in many orders, orders can have many medicines)

## Database-Specific Questions

### Primary Key
- Uniquely identifies each record in table
- Cannot be NULL
- Only one per table
- Can be natural or surrogate

### Candidate Key
- Column or set of columns that can uniquely identify records
- Could potentially be primary key
- All candidate keys are unique and minimal

### Join Types in Project
- **INNER JOIN**: Used for orders with users, medicines
- **LEFT JOIN**: Used for prescriptions (optional relationship)

### Normalization Types
1. **1NF**: Atomic values, no repeating groups
2. **2NF**: No partial dependencies
3. **3NF**: No transitive dependencies
4. **BCNF**: Every determinant is a candidate key

### Anomalies
**Problems solved by normalization:**
- **Insert Anomaly**: Cannot insert data without other data
- **Update Anomaly**: Updating data in multiple places
- **Delete Anomaly**: Deleting data removes other needed data

### DBMS (Database Management System)
- Software for creating and managing databases
- Provides interface between users/applications and database
- Handles data storage, retrieval, security
- Examples: MySQL (used in project), PostgreSQL, MongoDB

## Question 1: Primary Key Kya Hai
Primary Key woh column ya columns ka set hai jo table mein har row ko uniquely identify karta hai.

**Features:**
- Unique values
- Not NULL
- One per table
- Can be single or composite

## Question 2: Normalization Kya Hai
Normalization woh process hai jisme database ko organize kiya jata hai taake redundancy kam ho aur data integrity maintain ho.

**Benefits:**
- Reduces data redundancy
- Improves data integrity
- Makes database more efficient
- Easier maintenance

**Normal Forms:**
- 1NF: Atomic values
- 2NF: No partial dependencies  
- 3NF: No transitive dependencies