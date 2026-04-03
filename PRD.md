# Product Requirement Document (PRD)

## OmniCart 

### 1. Product Overview

**Product Name:** OmniCart

**Version:** 1.0.0

**Product Type:** Multi-Domain E-commerce Platform (Backend API)

**OmniCart — A Multi-Domain Unified E-commerce Platform**

A unified platform that allows users to browse and purchase products across multiple domains such as:

**Electronics** |
**Clothing** | 
**Groceries**

*The platform also supports sellers to manage and list their products.*

## 2. Target Users

- **End-Users :**  Browse, purchase, and track products  across sections.
 - **Product-Sellers :** Register, Manage inventory, add/update/delete products


### 3. Core Features

### 3.1 User Authentication & Authorization

- **User Registration :** Account Creation with Email Verification.
- **Email Verification :** Account Verification via Email Tokens.
- **User Login :** Secure authentication with JWT Tokens.
- **Password Management :** Change password, forgot/reset password
- **Role-Based Access Control :** Two-Tier Permission System (End-Users, Sellers).


### 3.2. Multi-Section System

- Electronics Section
- Clothing Section
- Groceries Section
- Seller Admin Portal

*Each section behaves like an independent module*

### 3.3. Items Management

- Add Item (Seller Only)
- Update Item (Seller Only)
- Delete Item (Seller Only)
- View Items (All Users)
- Purchase Item (End Users)


### 3.4. Unified Cart System

*Single cart across all sections*

*Users can add:* 
- Electronics + Clothes + Groceries together

### 3.5. Single notification center for all sections

- *Single notification center for all sections*

- Notifications include:
    - Order updates
    - Price drops
    - Promotions
- Features:
    - Notification history
    - Mark as read/unread
    - Section tagging (Electronics / Clothing / Groceries)

### 3.8 Order Management

- Place Order
- Track Order
- View Order History

### 3.7 System Health

- **Health Check:** API endpoint for system status monitoring

-----------------------------------------------------------

### 4. Technical Specifications

#### 4.1 API Endpoints Structure

---

**Authentication Routes** (`/api/v1/auth`)

- `POST /register` - User Registration
- `POST /login` - User Login
- `POST /logout` - User Logout (secured)
- `GET /current-user` - Get Current User Info (Secured)
- `POST /change-password` - Change User password (Secured)
- `POST /refresh-token` - Refresh access Token
- `GET /verify-email/:verificationToken` - Email Verification
- `POST /forget-password` - Request password reset
- `POST /reset-password/:resetToken` - Reset forgotten password
- `POST /resent-email-verification` - Resend Email Verification (Secure)

---

**Products Routes** (`api/v1/products`)

*ONE system + filter:*
- `GET ?section=`  - Filter by section for all products

---

- `POST /` - Product Add
- `GET /` - Shows all products List
- `PUT /:productId` - Product Update
- `DELETE /:productId` - Product Delete
- `GET /current-product/:id` - Current Product Info
- `GET /recently-view` - Shows Recently View Products

---
- `GET /?section=` - Perticular Section
- `Get /?search=`  - Searches the Product
- `Get /section=&search=`  - Searches the Product in particular Section


---

**Cart** (`/api/v1/cart`)


*Cart*


- `GET /` - Shows all the products inside the Cart
- `POST /`  - Adds Product to the Cart
- `PUT /:productId` - Update the product in the cart
- `DELETE /:productId`  - Removes the product form the Cart
- `DELETE /`  - Removes all the Items from the cart 

---

**Order** (`/api/v1/orders`)

- `GET /` - Shows all the orders
- `GET /:orderID` - Get specific Order
- `POST /` - place Orders
- `PATCH /:orderId/status` - Order status update


*Order Status Flow*

```
Pending | Confirmed | Shipped | Delivered | Cancelled |
```
---

**Centralized Notification System** (`/api/v1/notifications`)

*Types of Notifications*

- Order Notifications
    - Order placed
    - Order shipped
    - Order delivered

    ---

- Product Notifications
    - Price drop
    - Back in stock

    ---

- System Notifications
    - New offers
    - Promotions
    ---


**Notificatation** (`/api/v1/notifications`)

- `GET /` - Shows all the notifications
- `PATCH /:notificationId/read` - Notification Read
- `DELETE /`   - Clear all the notifications 

---

**Sellers Portal** 

---

*Seller Product Management* | 
*(Connected to /products API)*

- `GET /product/sellers/my-products` - Seller's Product
- `POST /products` - Add Products
- `PUT /products/:id` - Update Products
- `DELETE /products/:id` - Removes the Products 

---

*Seller Orders View* | 
*Sellers should see orders related to THEIR products*

**Seller Orders** (`/api/v1/seller/orders`)

- `GET  /` - Get all orders
- `GET /:orderId` - Get Specific Order
- `PATCH /:orderID/status` - Update Order Status

---


#### 4.2 Data Models

**User roles** 

- `Sellers` - Seller's Portal
- `End Users` - Normal Users

**Order Status**

```
Pending | Confirmed | Shipped | Delivered | Cancelled |
```

`PENDING`     → Order placed, waiting for seller approval  
`CONFIRMED`   → Seller accepted the order  
`SHIPPED`     → Order dispatched  
`DELIVERED`   → Order successfully delivered  
`CANCELLED`   → Order cancelled  


*NOTE* : 
- User can cancel the order when status is `CONFIRMED`
- User can mark order as `DELIVERED` (Order Received) only when status is `SHIPPED`

---

### 5. Security Features

- JWT-based authentication with refresh tokens
- Role-based authorization middleware
- Input validation on all endpoints
- Email verification for account security
- Secure password reset functionality
- File upload security with Multer middleware
- CORS configuration for cross-origin requests


