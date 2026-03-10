# Proposal Report: User and Rental Entity Core Attributes

## Purpose

This document extracts the core attributes of the **User** and **Rental** entities from the current BasoBas implementation so they can be described accurately in a proposal report.

It is based on the current schema and app model in:

- `supabase/migrations/20260304121000_create_profiles_auth.sql`
- `supabase/migrations/20260304152000_add_role_locked_to_profiles.sql`
- `supabase/migrations/20260306170000_add_phone_verification_challenges.sql`
- `supabase/migrations/20260306110000_create_rentals.sql`
- `supabase/migrations/20260306123000_add_images_to_rentals.sql`
- `supabase/migrations/20260306133000_add_description_to_rentals.sql`
- `supabase/migrations/20260306153000_replace_bhk_with_configuration_fields.sql`
- `lib/mock-data.ts`
- `lib/auth-context.tsx`

## Entity Overview

### User entity

In BasoBas, the user entity is a **composite business entity** built from two sources:

1. **Supabase Auth (`auth.users`)**
   Stores authentication identity such as user ID, email, and OAuth metadata.
2. **Application profile (`public.profiles`)**
   Stores domain-specific attributes such as role, phone number, and verification status.

This means the proposal report should describe the user as a single conceptual entity, while also noting that its data is split between authentication data and profile data.

### Rental entity

The rental entity is stored in the **`public.rentals`** table and represents a rental listing posted by a landlord. Each rental belongs to one landlord user and contains the listing's category, location, pricing, physical configuration, facilities, media, and availability status.

## 1. User Entity

### 1.1 Proposal-ready description

The User entity represents every authenticated participant in BasoBas. A user can act either as a **tenant** or a **landlord**. Authentication is handled through Supabase Auth, while application-specific user information is stored in a profile record. The system uses role control to differentiate what actions a user may perform. For example, landlords can publish rental listings, while tenants can browse, save, and request rentals. Phone verification is also tracked as part of the user profile to support trust and gated actions.

### 1.2 Core attributes

| Attribute | Type | Source | Required | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | `auth.users.id` and `profiles.id` | Yes | Unique identifier of the user. The `profiles.id` value matches the authenticated user ID. |
| `name` | `text` | Auth user metadata | Yes at app level | Display name used across the UI. Derived from OAuth metadata such as `full_name` or `name`; falls back to the email prefix if missing. |
| `email` | `text` | `auth.users.email` | Yes | Primary email address used for login and communication. |
| `avatar` | `text` / URL | Auth user metadata | No | Profile image URL from OAuth metadata such as `avatar_url` or `picture`. |
| `role` | `enum('tenant', 'landlord')` | `profiles.role` | Yes | Defines the business role of the user and controls access to features. |
| `role_locked` | `boolean` | `profiles.role_locked` | Yes | Prevents the same authenticated account from switching between tenant and landlord after the role is fixed. |
| `phone` | `text` | `profiles.phone` | No | User phone number stored for contact and verification workflows. |
| `phone_verified` | `boolean` | `profiles.phone_verified` | Yes | Indicates whether the phone number has been verified. |
| `phone_verified_at` | `timestamptz` | `profiles.phone_verified_at` | No | Timestamp of successful phone verification. |
| `created_at` | `timestamptz` | `profiles.created_at` | Yes | Timestamp when the profile record was created. |
| `updated_at` | `timestamptz` | `profiles.updated_at` | Yes | Timestamp when the profile record was last updated. |

### 1.3 Business meaning of user attributes

- `id` is the anchor key used across the system and links the business profile to the authentication account.
- `role` is the most important authorization attribute.
- `role_locked` enforces role consistency and avoids one email being reused as both a tenant and a landlord.
- `phone`, `phone_verified`, and `phone_verified_at` support trust, contactability, and workflow gating.
- `name`, `email`, and `avatar` are user-facing identity attributes used for profile display and landlord snapshots.

### 1.4 User validation and rules

- A profile is automatically created when a new auth user is created.
- Allowed user roles are only `tenant` and `landlord`.
- Users may read and update only their own profile through row-level security.
- The app resolves the role from `profiles.role`; if missing, it falls back to the selected pending role and defaults to `tenant`.
- When role locking is active, a user cannot authenticate with the same email as a different role.
- Phone verification is used by the app to unlock sensitive actions such as posting a rental or sending a rental request.

### 1.5 What is core vs. derived for the User entity

**Stored/core fields**

- `id`
- `role`
- `role_locked`
- `phone`
- `phone_verified`
- `phone_verified_at`
- `created_at`
- `updated_at`
- `email` as auth identity data

**Derived/UI fields**

- `name`
- `avatar`
- `verified` in the frontend user model, which is simply a UI alias for `phone_verified`

### 1.6 User entity example for the proposal

```json
{
  "id": "9e3a9b22-4d7b-4ea0-8d06-30df2fbf0e43",
  "name": "Aarav Shrestha",
  "email": "aarav@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "role": "landlord",
  "role_locked": true,
  "phone": "+9779812345678",
  "phone_verified": true,
  "phone_verified_at": "2026-03-06T11:42:00Z",
  "created_at": "2026-03-04T08:15:00Z",
  "updated_at": "2026-03-06T11:42:00Z"
}
```

## 2. Rental Entity

### 2.1 Proposal-ready description

The Rental entity represents a property listing published by a landlord in BasoBas. Each rental captures the listing type, location, room count or flat configuration, monthly rent, facilities, availability status, descriptive content, and images. A rental is owned by exactly one landlord and is the main searchable business object in the platform.

### 2.2 Core attributes

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `rental_id` | `uuid` | Yes | Unique identifier of the rental listing. Generated automatically. |
| `user_id` | `uuid` | Yes | Foreign key to the landlord user who created the listing. |
| `rental_type` | `enum('single_room', 'multiple_room', 'flat')` | Yes | Category of rental listing. |
| `location` | `text` | Yes | Rental address or area description, such as Baneshwor, Kathmandu. |
| `description` | `text` | Yes | Free-text explanation of the listing, facilities, surroundings, and rules. |
| `images` | `text[]` | Yes | List of image URLs or storage paths attached to the rental. |
| `no_of_rooms` | `integer` | Yes | Number of rooms associated with the listing. Must be greater than 0. |
| `configuration` | `enum('bhk', 'bk')` | Conditional | Flat-only configuration type. Null for non-flat rentals. |
| `config_unit` | `integer` | Conditional | Flat-only configuration size, such as `1` in `1BHK`. Null for non-flat rentals. |
| `rent` | `numeric(12,2)` | Yes | Rental price. Must be greater than 0. |
| `status` | `enum('available', 'rented', 'inactive')` | Yes | Availability state of the listing. Defaults to `available`. |
| `is_kitchen` | `boolean` | Yes | Indicates kitchen availability. Forced to `true` for flat rentals. |
| `bathroom_type` | `enum('attached', 'shared')` | Yes | Bathroom arrangement for the listing. |
| `water_facility` | `enum('supply_24x7', 'limited_supply', 'tanker')` | Yes | Type of water supply available. |
| `created_at` | `timestamptz` | Yes | Timestamp when the listing was created. |
| `updated_at` | `timestamptz` | Yes | Timestamp when the listing was last updated. |

### 2.3 Allowed values and controlled vocabularies

**Rental types**

- `single_room`
- `multiple_room`
- `flat`

**Flat configuration types**

- `bhk`
- `bk`

**Rental status**

- `available`
- `rented`
- `inactive`

**Bathroom types**

- `attached`
- `shared`

**Water facility types**

- `supply_24x7`
- `limited_supply`
- `tanker`

### 2.4 Business meaning of rental attributes

- `rental_id` identifies the rental record uniquely.
- `user_id` defines ownership and links the rental to the landlord.
- `rental_type` drives conditional behavior in the data model and UI.
- `location`, `description`, `images`, and `rent` are the main discovery and decision-making attributes for tenants.
- `configuration` and `config_unit` are specialized fields for flat listings and replace the earlier `bhk_type` model.
- `status` controls public visibility and listing lifecycle.
- `is_kitchen`, `bathroom_type`, and `water_facility` capture essential facility-related details.

### 2.5 Rental validation and rules

- Only authenticated users with the `landlord` role may create, update, or delete rentals.
- A rental always belongs to exactly one landlord through `user_id`.
- Public users can read rentals only when `status = 'available'`; owners can still read their own rentals.
- `rent` must be greater than `0`.
- `no_of_rooms` must be greater than `0`.
- For `flat` rentals:
  - `configuration` is required.
  - `config_unit` is required and must be greater than `0`.
  - `is_kitchen` must be `true`.
- For non-flat rentals:
  - `configuration` must be `null`.
  - `config_unit` must be `null`.
- In the posting UI, users are required to provide location, description, rent, bathroom type, water facility, and at least 3 images.
- In the current UI:
  - `single_room` listings are fixed to `1` room.
  - `multiple_room` listings must have more than `1` room.
  - flat configuration size is currently limited to `1` to `3`.

### 2.6 What is core vs. derived for the Rental entity

**Stored/core fields**

- `rental_id`
- `user_id`
- `rental_type`
- `location`
- `description`
- `images`
- `no_of_rooms`
- `configuration`
- `config_unit`
- `rent`
- `status`
- `is_kitchen`
- `bathroom_type`
- `water_facility`
- `created_at`
- `updated_at`

**Derived/UI fields**

- `title`, which is generated in the frontend as a label such as "Flat in Baneshwor"
- `landlord` display snapshot, which is assembled from the user entity for presentation
- `id` in the frontend `Room` type, which mirrors `rental_id` for route compatibility

### 2.7 Rental entity example for the proposal

```json
{
  "rental_id": "d62404d5-7f28-4c41-8686-07ee6efe6d5b",
  "user_id": "9e3a9b22-4d7b-4ea0-8d06-30df2fbf0e43",
  "rental_type": "flat",
  "location": "Baneshwor, Kathmandu",
  "description": "Well-lit 2BHK flat near the main road with attached bathroom and 24/7 water supply.",
  "images": [
    "https://example.com/rentals/flat-1.jpg",
    "https://example.com/rentals/flat-2.jpg",
    "https://example.com/rentals/flat-3.jpg"
  ],
  "no_of_rooms": 2,
  "configuration": "bhk",
  "config_unit": 2,
  "rent": 25000.0,
  "status": "available",
  "is_kitchen": true,
  "bathroom_type": "attached",
  "water_facility": "supply_24x7",
  "created_at": "2026-03-06T12:00:00Z",
  "updated_at": "2026-03-06T12:00:00Z"
}
```

## 3. Relationship Between User and Rental

The core relationship is:

- **One landlord user can create many rentals.**
- **Each rental belongs to one landlord user.**
- Tenants do not own rentals, but they interact with rentals through supporting features such as favorites and rental requests.

For proposal wording, this can be described as a **one-to-many relationship from User to Rental**.

## 4. Supporting but Non-core Entities

These entities support the main workflow but should not be confused with the core User and Rental attributes:

- `phone_verification_challenges`
  Stores OTP verification workflow state such as OTP hash, expiration time, send count, and attempts.
- `rental_favorites`
  Stores many-to-many tenant favorite relationships between users and rentals.
- booking requests
  The current app has a booking/request model in frontend state, but it is not yet backed by a persisted database table.

## 5. Short Version for the Proposal Report

### User entity summary

The User entity in BasoBas combines authentication identity and application profile data. Its main attributes are user ID, name, email, avatar, role, role lock status, phone number, phone verification status, verification timestamp, and profile timestamps. The role attribute classifies the user as either a tenant or landlord and controls access to major features. Phone verification is used to improve trust and to gate protected actions.

### Rental entity summary

The Rental entity represents a landlord-owned rental listing. Its main attributes are rental ID, owner user ID, rental type, location, description, image list, number of rooms, flat configuration fields, rent amount, availability status, kitchen availability, bathroom type, water facility, and timestamps. This entity is the main searchable listing object in the system and supports different rental categories such as single rooms, multi-room listings, and flats.

## 6. Recommended wording to use in the proposal

You can use the following wording directly in a report:

> The BasoBas platform is centered around two primary entities: User and Rental. The User entity captures the identity, role, and verification status of participants in the system, distinguishing tenants from landlords. The Rental entity captures the details of property listings published by landlords, including category, location, price, facilities, media, and availability. A one-to-many relationship exists between User and Rental, where one landlord can publish multiple rental listings, while each rental belongs to exactly one landlord.
