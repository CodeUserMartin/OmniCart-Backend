# OmniCart Backend 🛒

*The backend API for OmniCart, a full-stack e-commerce platform built to support product discovery, seller management, shopping carts, and the complete purchase flow.*

*OmniCart follows a **MERN-based architecture**, providing RESTful APIs for authentication, product management, cart operations, checkout, and order processing.*

**The backend is designed to support both customers and product sellers, with authorization and ownership checks applied to protect user and seller operations.**

---

## OmniCart allows users to:

```
- Create and manage their accounts
- Authenticate securely
- Browse products
- View individual product details
- Add products to their cart
- Update cart quantities
- Remove products from their cart
- Manage delivery addresses
- Buy products directly
- Checkout their cart
- Select a shipping address
- Select a payment method
- Place orders
```

**Sellers can manage their products while the backend ensures that users cannot perform unauthorized operations on resources they do not own.**

---

# ✨ Core Features
### 🔐 Authentication & Authorization

**The backend provides authenticated user functionality to protect private resources.**

Authentication-related functionality includes:


```
- User registration
- User login
- Authenticated requests
- User identity verification
- Protected API operations
- Authorization checks
```

***The backend uses authentication mechanisms to ensure that protected operations are only accessible to authenticated users.***

***Authorization is also applied to ownership-sensitive operations.***

***For example, a seller should not be able to modify or delete another seller's product.***

---

# 👤 User Management

**The backend supports user-related operations required by the OmniCart platform.**

User functionality includes:
```
- Account creation
- User authentication
- Authenticated user access
- User-related data management
```

User information is used throughout the application to associate:

- Products with sellers
- Cart data with users
- Orders with customers
- Addresses with users

---

# 🛍️ Product Management

**Products are the core resources of OmniCart.**

The backend supports product operations required for the marketplace.

```
- Create products
- Retrieve products
- Retrieve individual product details
- Update products
- Delete products
- Filter products
- Manage seller-owned products
```

Products are associated with their respective sellers, allowing the system to enforce product ownership.


----

# 🛒 Cart System

*OmniCart provides a persistent shopping cart system for authenticated users.*

Users can:
```
- Add products to their cart
- View cart items
- Update product quantities
- Remove individual items
- Manage their cart before checkout
```

***The backend creates or retrieves the user's cart as required.***

**When adding a product to the cart:**

```
- The authenticated user is identified.
- The requested product is located.
- Business rules are validated.
- The user's cart is retrieved or created.
- The product is added to the cart.
- The quantity is initialized or updated.
```

---


# 🚫 Seller Product Restriction

**A specific business rule in the cart logic prevents a seller from adding their own product to their shopping cart.**

**This prevents sellers from purchasing their own listed products through the standard shopping flow.**

---

# 📦 Order Management

**Orders represent completed purchase transactions within OmniCart.**

The backend supports the purchase lifecycle from checkout to order creation.

An order is associated with relevant information such as:

```
- Customer
- Purchased products
- Quantities
- Shipping address
- Payment method
- Order information
```

*The order system allows the application to maintain a record of purchases made by users.*

---

# ⚡ Buy Now

**OmniCart supports a direct purchase flow through the Buy Now functionality.**
```
- Users can purchase a specific product directly without adding it to their regular cart first.

- The Buy Now flow allows the user to proceed toward checkout for the selected product.
```
---

# 💳 Checkout

**The checkout system handles the final stage of the purchase flow.**

Checkout requires:
```
- Shipping address
- Payment method
```

The provided information is validated before the order creation process.

---

# 📧 Email Services

**The backend includes email-related functionality using an email delivery stack.**

The project has worked with:
```
- Nodemailer
- Mailgen
- Mailtrap
```

*These services can be used for application emails such as account verification and other transactional communication.*

---

# 🔒 Security

***Security is an important part of the OmniCart backend. The application uses authentication, authorization, validation, and business-rule enforcement to protect user accounts and application resources.***

## Authentication

```
- JWT-based authentication
- Access and refresh token mechanism
- Token handling through cookies
- Authentication middleware for protecting private routes
- Authenticated user identification for protected operations
```
### Password Security
```
- Password hashing before database storage
- Secure password comparison during authentication
- Password change functionality
- forgot password and password reset functionality
```
### Authorization
```
- Protected routes require authentication
- Authorization checks ensure users have permission to perform requested operations
- Role-based access control for seller-specific functionality
```

### Resource Ownership
```
- Seller-specific resources are validated against the 
  authenticated seller
- Sellers can only modify or delete products they own
- Ownership checks prevent unauthorized access to user-specific resources
```

### Input Validation
```
- Request validation using dedicated validators
- Validation of required fields
- Validation of request body data
- Validation of parameters and user input
- Invalid requests are rejected before database operations
- Validation helps maintain data integrity and prevent malformed  data from entering the system

```
### Business Rule Validation

```
- Sellers cannot add their own products to their cart
- Users must provide required information during checkout
- Address fields must satisfy validation requirements
- Protected resources require authentication
- Seller operations require appropriate ownership validation
```

### CORS
```
CORS configuration is used to control cross-origin requests between the frontend and backend.
```
---

# 🗄️ Database

OmniCart uses:

**MongoDB as the database**

**Mongoose for object modeling and database interaction**

The database stores application data related to the e-commerce system.

Core data relationships include:
```
- Products are associated with their respective sellers.
- Carts are associated with users.
- Orders are associated with customers..
```
---

### ☁️ Media Storage

***The backend uses Cloudinary for cloud-based media and image storage associated with application resources.***

---


# 💼 Getting Started

***Prerequisites***

Make sure you have installed:

> Node.js

> npm

## Step 1 :  Clone the Repository
git clone <https://github.com/CodeUserMartin/OmniCart-Backend.git>

---

## Step 2 : Navigate into the backend directory:

Install Dependencies
```
- npm install
- Configure Environment Variables
```

---

## Step 3 :  Environment Variables

**Create a .env file in the backend root directory and configure the required environment variables.** 

Example:

```
# MongoDB Atlas
MONGODB_URL = 

# Server
PORT =
CROSS_ORIGIN = 

# JWT Credentials
ACCESS_TOKEN_SECRET = 
ACCESS_TOKEN_EXPIRY = 
REFRESH_TOKEN_SECRET = 
REFRESH_TOKEN_EXPIRY = 

# Mailtrap SMTP
MAILTRAP_SMTP_HOST = 
MAILTRAP_SMTP_PORT = 
MAILTRAP_SMTP_USERNAME = 
MAILTRAP_SMTP_PASSWORD = 

# Frontend URL
FRONTEND_URL = 

# Cloudinary
CLOUD_NAME = 
CLOUDINARY_API_KEY = 
CLOUDINARY_SECRET = 

#  Gmail SMTP (Optional)
EMAIL_ID=
EMAIL_PASSWORD=
```
>  Configure either Mailtrap SMTP or Gmail SMTP depending on your email provider.

***The exact environment variable names depend on the current implementation. Keep secret credentials outside the repository and never commit .env files containing sensitive information.***

---

## Step 4 :
## Start the Server

> npm run start

---

During development, the backend can be tested using tools such as:

```
Postman
Thunder Client
Insomnia
```

*API requests should be tested against authenticated and unauthorized scenarios to ensure that authentication, authorization, and ownership rules are working correctly.*

---

# 🛠️ Future Improvements

Potential improvements for the backend include:

```
- Payment gateway integration
- Advanced order status management
- Product reviews and ratings
- Wishlist functionality
- AI Chat Bot
- Advanced search
- Pagination and sorting
- Advanced seller analytics
- Order tracking
- Improved notification system
- Rate limiting
```

---


# 📌 Project Status

OmniCart Backend is an evolving e-commerce backend project focused on building a complete marketplace experience with:

```
- User authentication
- Seller product management
- Product ownership protection
- Shopping cart functionality
- Buy Now flow
- Checkout
- Shipping address and Payment management
- Order processing
- Email services
- MongoDB persistence
```

*The project is being developed with a focus on learning and implementing real-world backend architecture and e-commerce business logic.*

---

# 👨‍💻 OmniCart

*OmniCart — A unified shopping experience built across products, sellers, carts, and orders.*

> Frontend Repo Link : <https://github.com/CodeUserMartin/OmniCart-Frontend.git>
