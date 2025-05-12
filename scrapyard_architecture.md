# Scrapyard Architecture Design

## Overview

This document outlines the architectural design for enhancing the Scrapyard section of 2133.lol, transforming it into a user-driven repository for art, PNGs, and web development assets.

## Requirements

The enhanced Scrapyard will include the following features:

1.  Categorization and tagging system
2.  Rating mechanism for assets
3.  Contributor profiles
4.  Search and filter functionalities

## Database Schema

The following database schema will be used:

*   **scrapyard\_assets:**
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `user_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE
    *   `title` TEXT NOT NULL
    *   `description` TEXT NOT NULL
    *   `file_path` TEXT NOT NULL  // Store the S3 URL
    *   `thumbnail_path` TEXT  // Store the S3 URL
    *   `asset_type` TEXT
    *   `category_id` INTEGER REFERENCES `asset_categories` (`id`)
    *   `tags` TEXT  // Comma-separated list of tag IDs
    *   `download_count` INTEGER DEFAULT 0
    *   `likes_count` INTEGER DEFAULT 0
    *   `is_free` INTEGER DEFAULT 1
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `rating` REAL DEFAULT 0.0 // Average rating
    *   `rating_count` INTEGER DEFAULT 0 // Number of ratings

*   **asset\_categories:**
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `name` TEXT NOT NULL UNIQUE
    *   `display_name` TEXT NOT NULL
    *   `description` TEXT
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

*   **asset\_tags:**
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `name` TEXT NOT NULL UNIQUE
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

*   **asset\_ratings:**
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `asset_id` INTEGER NOT NULL REFERENCES `scrapyard_assets` (`id`) ON DELETE CASCADE
    *   `user_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE
    *   `rating` INTEGER NOT NULL  // 1-5
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   UNIQUE (`asset_id`, `user_id`)

*   **junkers:** (No changes needed)
    *   `id` INTEGER PRIMARY KEY AUTOINCREMENT
    *   `user_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE
    *   `junker_name` TEXT NOT NULL
    *   `bio` TEXT
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `reputation` INTEGER DEFAULT 0

*   **users:**
    *   `id` INTEGER PRIMARY KEY
    *   `username` TEXT

## API Endpoints

The following API endpoints will be implemented:

*   `GET /scrapyard`:  List all assets (with optional filters and search)
    *   Query parameters: `category`, `tags`, `search`, `sort`
*   `GET /scrapyard/asset/:id`:  Get a specific asset
*   `POST /scrapyard/upload`:  Upload a new asset (requires Junker status)
*   `POST /scrapyard/asset/:id/comment`:  Add a comment to an asset (requires authentication)
*   `POST /scrapyard/asset/:id/favorite`:  Toggle favorite status (requires authentication)
*   `POST /scrapyard/asset/:id/rate`: Rate an asset (requires authentication)
*   `GET /scrapyard/categories`:  List all asset categories
*   `GET /scrapyard/tags`:  List all asset tags
*   `GET /scrapyard/junker/:id`: Get a specific junker profile

## File Storage

*   Use AWS S3 (or a similar cloud storage service) to store asset files and thumbnails.
*   Store the S3 URLs in the `file_path` and `thumbnail_path` columns in the `scrapyard_assets` table.
*   Implement a mechanism to upload files directly to S3 from the client-side (e.g., using presigned URLs).

## Search Implementation

*   Implement a simple database query for searching assets.
*   Use the `LIKE` operator to search for assets whose `title` or `description` contains the search term.
*   Consider using full-text search capabilities of SQLite (if available) for more advanced search functionality.

## UI/UX Flow

*   **Asset Submission:**
    1.  Junkers can access the asset submission page (`/scrapyard/upload`).
    2.  The page includes a form to upload the asset file, thumbnail, title, description, category, and tags.
    3.  Files are uploaded directly to S3.
    4.  Upon successful upload, the asset is added to the database.
*   **Asset Browsing:**
    11. Users can browse assets on the main Scrapyard page (`/scrapyard`).
    12. Assets are displayed in a grid or list format, with thumbnails, titles, and descriptions.
    13. Users can filter assets by category and tags.
    14. Users can search for assets using a search bar.
    15. Clicking on an asset takes the user to the asset details page.
*   **Asset Details:**
    1.  The asset details page displays the asset file (if viewable in the browser), thumbnail, title, description, category, tags, and comments.
    2.  Users can add comments, favorite the asset, and rate the asset (if authenticated).
    3.  The page also displays the Junker's profile information.

## Database Schema Diagram

```mermaid
erDiagram
    scrapyard_assets {
        INTEGER id PK AI
        INTEGER user_id FK
        TEXT title
        TEXT description
        TEXT file_path
        TEXT thumbnail_path
        TEXT asset_type
        INTEGER category_id FK
        TEXT tags
        INTEGER download_count
        INTEGER likes_count
        INTEGER is_free
        TIMESTAMP created_at
        TIMESTAMP updated_at
        REAL rating
        INTEGER rating_count
    }
    asset_categories {
        INTEGER id PK AI
        TEXT name
        TEXT display_name
        TEXT description
        TIMESTAMP created_at
    }
    asset_tags {
        INTEGER id PK AI
        TEXT name
        TIMESTAMP created_at
    }
    asset_ratings {
        INTEGER id PK AI
        INTEGER asset_id FK
        INTEGER user_id FK
        INTEGER rating
        TIMESTAMP created_at
    }
    junkers {
        INTEGER id PK AI
        INTEGER user_id FK
        TEXT junker_name
        TEXT bio
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INTEGER reputation
    }
    users {
        INTEGER id PK
        TEXT username
    }

    scrapyard_assets ||--|| users : user_id
    scrapyard_assets ||--o{ asset_categories : category_id
    scrapyard_assets {o--|| asset_ratings : asset_id
    asset_ratings ||--|| users : user_id
    junkers ||--|| users : user_id