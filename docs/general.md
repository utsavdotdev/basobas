# BasoBas Viva Guide

## 1. Project Introduction

### Project Name
BasoBas

### Project Type
Room and rental accommodation web application

### Main Goal
BasoBas helps landlords publish rental rooms and helps tenants find, request, and communicate about those rooms in a more organized way.

### Simple Problem Statement
Finding a room is often confusing because:

- tenants do not know which room is still available
- landlords receive calls from many people without any proper record
- there is no clear system to approve one tenant and reject others
- exact location and private contact details should not be shared with everyone immediately

BasoBas solves this by creating a clear request-based rental flow.

## 2. What The System Does In Simple Words

This system works like a digital rental assistant.

- A landlord posts a rental listing.
- A tenant explores listings and sends a booking request.
- The landlord checks the request, talks to the tenant, and decides.
- If the landlord approves one tenant, the system marks the rental as rented.
- Other pending tenants for that same room are automatically rejected.
- The landlord can privately share contact number and Google Maps location only with the selected tenant.

So the system is not only a listing website. It is also a request management system.

## 3. Main Users Of The System

### Guest User
A guest can open the website and browse public rental listings, but cannot request or manage anything.

### Tenant
A tenant is a user who wants to find a room.

Tenant can:

- browse available rentals
- save favorite rentals
- send a booking request
- view request status
- cancel request
- delete cancelled request from history
- view landlord shared contact number
- view exact location if the landlord shares it

### Landlord
A landlord is a user who owns or manages rooms.

Landlord can:

- create rental listing
- edit listing
- delete listing
- make listing inactive
- make rented listing available again
- view all incoming requests
- approve or reject requests
- share private contact number
- share Google Maps location
- see own available and rented listings

## 4. Real Life Story Of The System

You can explain the project using this simple story:

1. A landlord has one room in Baneshwor.
2. The landlord adds that room in BasoBas with rent, facilities, photos, and public location.
3. Many tenants can see the room because it is available.
4. Interested tenants send requests.
5. The landlord receives those requests in profile.
6. The landlord can call a tenant, ask questions, and compare tenants.
7. If the landlord likes one tenant, the landlord approves that request.
8. The room becomes rented automatically.
9. All other pending requests for that room are rejected automatically.
10. The landlord can now share contact number and exact map location with that tenant.
11. If the tenant later leaves the room, the landlord can mark the listing available again.

This flow is one of the strongest points of the project.

## 5. Main Features Of The Project

### Authentication

- user logs in using Supabase Auth
- user chooses a role: tenant or landlord
- each user gets a profile

### Phone Verification

- phone number is verified before important actions
- landlord needs verified phone for trusted sharing and listing actions
- tenant needs verified phone before sending booking request

### Rental Listing Management

- landlord adds room details
- landlord uploads images
- landlord adds public location text
- landlord can add exact private Google Maps pin
- landlord can update rental status later

### Booking Request System

- tenant sends request for a room
- same tenant cannot create multiple active requests for the same room
- many different tenants can request the same available room
- landlord reviews all incoming requests
- landlord approves or rejects

### Privacy Controlled Sharing

- landlord contact number is not public to everyone
- exact Google Maps location is also private
- landlord shares these only when comfortable

### Realtime Updates

- tenant and landlord can see request changes quickly using Supabase Realtime

## 6. Flow From Tenant Perspective

### Step 1: Sign Up / Login
The tenant logs in and creates an account.

### Step 2: Verify Phone
The tenant verifies phone number.

Why this matters:

- fake users are reduced
- landlord gets real contact information
- the system becomes more trustworthy

### Step 3: Explore Rentals
Tenant browses available rooms.

Tenant can check:

- location
- room type
- rent
- number of rooms
- bathroom type
- kitchen availability
- water facility
- images
- landlord information shown publicly

### Step 4: Save Favorites
If the tenant likes a room but is not ready, it can be saved in favorites.

### Step 5: Send Booking Request
Tenant opens a room and sends request with:

- move-in date
- stay duration
- optional message

### Step 6: Wait For Review
The request becomes `pending`.

Important rule:

- the same tenant cannot send another active request for the same room while one is already pending or approved

### Step 7: Check Request Status
Tenant sees request status in profile:

- pending
- approved
- rejected
- cancelled

### Step 8: If Landlord Shares Contact
If landlord shares contact number, tenant can call landlord directly from profile.

### Step 9: If Landlord Shares Exact Location
If landlord shares Google Maps pin, tenant sees `View in Google Maps`.

### Step 10: Cancel Or Continue
Tenant can cancel an active request.

If a request is cancelled:

- it can be deleted from history
- it does not block future requests

## 7. Flow From Landlord Perspective

### Step 1: Sign Up / Login
Landlord logs in and chooses landlord role.

### Step 2: Verify Phone
Landlord verifies phone number.

Why this matters:

- trusted landlord identity
- phone sharing works properly
- communication becomes safer

### Step 3: Create Rental Listing
Landlord enters:

- rental type
- area/location
- description
- rent
- room count or flat configuration
- bathroom type
- water facility
- kitchen information
- images
- optional private Google Maps pin

### Step 4: Receive Tenant Requests
When tenants request a rental, those requests appear in landlord profile.

Landlord sees:

- tenant name
- tenant email
- tenant phone
- move-in date
- stay duration
- tenant message

### Step 5: Call And Review
The landlord can call the tenant and ask:

- job or student status
- number of people staying
- move-in plan
- budget details
- house rule compatibility

This is an important non-technical part of the project. The system supports decision making, not just data entry.

### Step 6: Share Contact Number
While request is pending or approved, landlord can share personal contact number with that tenant.

This is useful when:

- landlord wants the tenant to call back later
- landlord wants direct conversation
- landlord is interested but has not approved yet

### Step 7: Approve Or Reject

If approved:

- rental becomes rented automatically
- other pending requests on same rental are rejected automatically

If rejected:

- tenant is informed through request status

### Step 8: Share Exact Map Location
After or during communication, landlord can share the exact Google Maps location.

This keeps privacy safer because:

- not every visitor sees the exact address
- only selected tenant gets the exact location

### Step 9: Manage Listing Later
Landlord can:

- edit details
- delete listing
- mark inactive
- make rented room available again when tenant leaves

## 8. Important Business Rules

These rules are important for viva because they show system logic clearly.

### Rule 1
Only landlords can create and manage rental listings.

### Rule 2
Only verified tenants can send booking requests.

### Rule 3
Many tenants can request the same room while it is still available.

### Rule 4
The same tenant cannot have more than one active request for the same rental.

### Rule 5
If one tenant is approved, that room becomes rented.

### Rule 6
If one tenant is approved, other pending requests for the same room are rejected automatically.

### Rule 7
Private contact number and exact location are not shown publicly.

### Rule 8
Cancelled requests can be deleted from tenant history.

### Rule 9
Landlord can make rented room available again if tenant leaves.

## 9. Public Information Vs Private Information

### Public Information
These are visible in listing pages:

- general location
- rent
- room type
- facilities
- images
- landlord basic public details

### Private Information
These are not visible to everyone:

- exact Google Maps pin
- shared landlord phone number
- internal request details between landlord and tenant

This is a good point to explain data privacy in your project.

## 10. Main Database Tables

You do not need to explain every column in viva. Focus on why each table exists.

### `profiles`
Stores user profile information such as role and phone verification.

### `rentals`
Stores all rental listings posted by landlords.

### `booking_requests`
Stores all booking requests sent by tenants.

### `rental_favorites`
Stores tenant favorite rentals.

### `phone_verification_challenges`
Stores OTP verification records.

### `rental_private_details`
Stores private landlord-only details like exact Google Maps pin.

## 11. Table Relationships

This is a simple relation explanation.

- One user can have one profile.
- One landlord can post many rentals.
- One rental can receive many booking requests.
- One tenant can send many requests, but only one active request per rental.
- One tenant can save many favorite rentals.
- One rental can have one private details row.

You can describe it as:

- `profiles` is connected to user identity
- `rentals` is connected to landlords
- `booking_requests` connects tenant and landlord around one rental

## 12. DBMS Concepts Used In This Project

This is one of the most important viva sections.

### 1. Table Design
The system is divided into multiple related tables instead of putting everything in one table.

Why it is good:

- data is organized
- repeated data is reduced
- maintenance is easier

### 2. Primary Key
Each main table has a primary key.

Examples:

- `profiles.id`
- `rentals.rental_id`
- `booking_requests.booking_request_id`

Why it matters:

- every row can be identified uniquely

### 3. Foreign Key
Tables are connected using foreign keys.

Examples:

- rental belongs to a landlord
- booking request belongs to rental, tenant, and landlord
- favorites connect user and rental

Why it matters:

- relationships stay valid
- orphan records are reduced

### 4. Constraints
The system uses check constraints to stop invalid data.

Examples:

- rent must be greater than 0
- room count must be greater than 0
- tenant and landlord cannot be same user in one request
- phone number must match Nepali format
- shared fields must come in valid pairs

Why it matters:

- invalid data is blocked by database itself

### 5. Enum Types
The system uses enums for fixed values.

Examples:

- rental status
- rental type
- booking status
- bathroom type

Why it matters:

- values stay controlled
- data becomes cleaner

### 6. Indexing
Indexes are used for faster search and filtering.

Examples:

- status index
- user id index
- created date index
- booking request indexes

Why it matters:

- faster query performance

### 7. Unique Index
The project uses a partial unique index in booking requests.

Meaning:

- the same tenant cannot create more than one active request for the same rental

This is a strong DBMS point.

### 8. Trigger
The project uses triggers in multiple places.

Most important trigger:

- when landlord approves a request, rental becomes rented automatically and other pending requests are rejected automatically

This is a strong example of database automation.

### 9. Functions In PL/pgSQL
Database functions are used with triggers.

Why it matters:

- business logic is executed inside the database
- system remains consistent even if frontend changes

### 10. Row Level Security
The project uses RLS in Supabase.

Simple meaning:

- each user can access only the data they are allowed to access

Examples:

- tenants can only manage their own requests
- landlords can only manage their own listings
- private rental details are only available to owner

### 11. Realtime Database Features
Supabase Realtime is used for live update behavior.

Why it matters:

- when status changes, users see update quickly
- better user experience

### 12. Migrations
Database changes are managed with migration files.

Why it matters:

- database design evolves in a controlled way
- easy to track what changed and why

## 13. Triggers Used In This Project

### Trigger 1: Auto Create Profile After User Signup
When a new auth user is created, the system automatically creates a profile record.

Why useful:

- every logged in user gets a profile row automatically
- no manual insert needed

### Trigger 2: Auto Update `updated_at`
Several tables automatically refresh `updated_at` when row is modified.

Why useful:

- update history is maintained
- no need to set time manually every time

### Trigger 3: Booking Approval Trigger
This is the best trigger in the whole project.

When one request is approved:

- rental status becomes `rented`
- other pending requests for that rental become `rejected`

Why useful:

- avoids manual work
- prevents conflicting bookings
- keeps system consistent

## 14. Why Trigger Was Important In This Project

Without trigger:

- frontend would need to update many tables manually
- chance of mistakes would be higher
- one request may get approved but rental might still remain available
- other pending requests might not be rejected properly

With trigger:

- one approval action automatically keeps whole system correct

This is a very strong viva explanation.

## 15. Security Concepts Used

### Authentication
Only logged in users can perform sensitive actions.

### Authorization
Role decides what a user can do.

- tenant cannot post listings
- landlord cannot book own rental

### RLS
Even if someone tries to access database directly, policies restrict access.

### Privacy Control
Exact location and private contact sharing are controlled feature-by-feature.

## 16. How Realtime Is Used

Realtime is used so that when booking data changes, the latest state is reflected quickly in tenant and landlord views.

Examples:

- request status changes
- approved request appears updated
- shared location/contact appears without manual refresh in normal flow

## 17. Why This Project Is More Than A Basic CRUD Project

You can say:

“This project is not only add, edit, delete. It includes workflow management, privacy control, booking decision logic, trigger-based automation, role-based access, and realtime updates.”

That sentence is very good for viva.

## 18. Non-Technical Value Of The Project

This part is important because viva is not only about code.

### For Tenant

- saves time finding room
- request status is clear
- only serious landlords share private details
- easier communication

### For Landlord

- less confusion
- organized incoming requests
- can choose best tenant
- no need to manage everything by phone only

### For Both

- more trust
- more privacy
- more transparency

## 19. Limitations You Can Honestly Mention

You can say the project is strong, but still has normal project limitations.

- no payment module
- no admin panel
- no advanced analytics dashboard
- no chatbot or recommendation engine
- image upload can still be improved more for full production hardening if needed

Mentioning limitations makes your explanation mature and realistic.

## 20. Future Improvements

Good future scope ideas:

- payment integration
- admin verification panel
- complaint and report system
- landlord rating or tenant rating
- chat system inside app
- recommendation system based on area and budget
- search by map radius

## 21. Short System Flow Summary

### Overall Flow

1. User logs in
2. Role is decided
3. Landlord posts rental
4. Tenant explores rental
5. Tenant sends booking request
6. Landlord reviews request
7. Landlord may share contact and later location
8. Landlord approves or rejects
9. On approval, rental becomes rented automatically
10. If tenant leaves later, landlord can make it available again

## 22. Simple Architecture Explanation

Frontend:

- Next.js app

Backend services:

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase RLS

Database side:

- tables
- constraints
- indexes
- triggers
- functions
- policies

## 23. Best Viva Points To Highlight

If you get very little time, focus on these:

1. The system supports two main roles: tenant and landlord.
2. It is not just a listing site, it manages complete booking request flow.
3. Trigger automatically marks rental as rented and rejects competing requests.
4. Partial unique index prevents duplicate active request from same tenant for same rental.
5. RLS protects private data and role-based access.
6. Contact number and exact map location are shared privately, not publicly.
7. Realtime is used so request updates are seen quickly.

## 24. Viva Questions And Simple Answers

### Q1. What problem does your project solve?
It solves the difficulty of finding rooms and managing rental requests in an organized, trackable, and privacy-aware way.

### Q2. Who are the users of your system?
Mainly tenants and landlords. Guests can browse public listings.

### Q3. Why did you use database triggers?
To automate important business rules inside the database. For example, when a booking is approved, the rental becomes rented automatically and other pending requests are rejected.

### Q4. Why did you use RLS?
To make sure each user only accesses data they are allowed to access.

### Q5. What is the most important DBMS concept used?
Trigger, foreign key relationships, constraints, indexes, enum types, and row level security.

### Q6. Why not manage everything from frontend only?
Because frontend-only logic is weaker and easier to break. Database rules make the system more consistent and secure.

### Q7. How do you stop one tenant from requesting same room many times?
By using business logic and a unique active-request index in the booking request table.

### Q8. How do you protect landlord privacy?
Exact location and private contact number are shared only with selected tenant requests, not with all users.

### Q9. What happens when one tenant is approved?
Rental status becomes rented automatically, other pending requests are rejected, and the selected tenant can continue communication.

### Q10. Is this project only CRUD?
No. It includes workflow logic, request approval system, trigger-based automation, RLS security, and realtime updates.

## 25. One Minute Viva Answer

If teacher asks: “Explain your project.”

You can say:

“Our project is BasoBas, a rental accommodation management web application for tenants and landlords. Landlords can post room listings, manage them, and receive booking requests from multiple tenants. Tenants can browse rooms, save favorites, and send booking requests after phone verification. The landlord reviews requests, can share contact number and exact location privately, and then approve or reject the request. A major DBMS feature in our project is the use of triggers. When one request is approved, the database automatically marks the rental as rented and rejects all other pending requests for the same rental. We also used foreign keys, constraints, enum types, indexes, row level security, and Supabase Realtime. So the project is not only CRUD, but a complete workflow-based rental management system.”

## 26. Three Minute Viva Answer

If teacher asks for more detail, say:

“BasoBas is designed to solve a real rental problem. In normal room searching, landlords and tenants communicate in an unorganized way. Our system creates a proper process. First, users log in and choose role as tenant or landlord. Landlords can create rental listings with room details, facilities, rent, photos, and optional private Google Maps location. Tenants can browse available rooms and send a booking request. Multiple tenants can request one available rental, but the same tenant cannot create multiple active requests for the same room. The landlord sees all incoming requests in the dashboard, can review tenant details, call them, share contact number, and later share exact map location if comfortable. When the landlord approves one request, a database trigger automatically changes that rental status to rented and rejects all other pending requests. This is an important DBMS concept because it enforces business logic inside the database. We also used primary keys, foreign keys, check constraints, enum types, indexes, row level security, and realtime updates using Supabase. From a user point of view, the project improves trust, privacy, and clarity in the room rental process.”

## 27. Final Conclusion

BasoBas is a practical DBMS project because it shows:

- real world problem solving
- multiple user roles
- structured relational database design
- trigger-based automation
- secure access control
- private and public data separation
- realtime workflow

This makes it a strong project both technically and functionally.
