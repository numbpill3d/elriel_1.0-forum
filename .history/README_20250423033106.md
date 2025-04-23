# Elriel Forum

Elriel is a haunted terminal-based social network with ARG (Alternate Reality Game) elements. The platform features a cyberpunk aesthetic with glitchy terminals, corrupted data, and other unique visual effects.

## Features

- User authentication and profile management
- Post creation and management with optional encryption
- Glyphs system (visual/audio representations tied to users)
- Districts (aesthetic sub-networks)
- Whispers (anonymous messages)
- Terminal-based UI with glitch effects

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: Custom session-based auth

## Development

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Set up environment variables in `.env`
   ```
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your_session_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```
4. Run the development server
   ```
   npm run dev
   ```

## Production Deployment

The application is configured for deployment to Render.com or similar platforms.

## License

ISC