# Elriel 1.0 Forum - Enhanced Profile System Design

## 1. Current Profile System Analysis

### Backend (routes/profile.js)
- **Data Storage**: Uses Supabase 'profiles' table with fields like status (bio-like), custom_css, custom_html, blog_layout (enum: feed/grid), district_id, background_image, header_image, theme_template, glyph_id, glyph_3d, glyph_rotation_speed, widgets_data (JSON string for basic widgets).
- **Profile Containers**: Separate 'profile_containers' table for widgets (id, profile_id, container_type e.g., text/image/iframe, title, content, position, settings JSON).
- **Routes**:
  - GET /profile: Dashboard fetches profile, glyph, posts.
  - GET /profile/user/:username?enhanced=1: View profile with containers, rewards, posts.
  - GET /profile/edit: Edit form with basics (status, district, layout), background/header upload, glyph selection, custom code, widgets.
  - POST /profile/update: Handles form data, file uploads (multer to /public/uploads/backgrounds), updates profile (sanitizes inputs), logs activity.
  - Container CRUD: POST/PUT/DELETE /profile/container for widgets.
  - Other: Glyph set, background options, reward toggle.
- **Authentication**: Session-based via isAuthenticated middleware.
- **File Handling**: Multer for images (5MB limit, images only).

### Frontend (views/profile/edit.html, view-enhanced.html)
- **Edit Page**: Tabbed sections (Basics: status/district/layout; Background: uploads/theme; Sigil: glyph preview/selection/3D options; Custom: CSS/HTML; Widgets: Add/select type (text/image/video/iframe), basic form inputs, no drag/drop).
  - Form submission via fetch to /update, injects __DATA__ JSON for population.
  - JS: Handles nav tabs, form submit, glyph selection, theme preview (via profile-themes.js), basic widget add (no positions).
- **View Page (Enhanced)**: Header with background/header image, avatar placeholder, info (username/status/district/repute bar/rewards), sigil (2D/3D via glyph3d.js), containers grid (renders based on type: list/gallery/paragraph/iframe), recent posts list, activity log stub.
  - JS: Applies theme, renders containers/widgets, 3D glyph, nav tabs (scroll to sections), delete handlers.
- **No Avatar**: Uses default placeholder; no upload.
- **Bio**: Limited to 'status' field (100 chars).

### Styling (public/css/profile.css)
- Terminal/cyberpunk theme: Green text, glows, glitches, Win98 elements (outset borders, pixelated images).
- Responsive: Media queries for mobile (stack layouts, smaller fonts).
- Profile-specific: Headers with backgrounds, avatar squares, sections with dashed borders, nav bars Win98-style.

### Widgets JS (public/js/profile-widgets.js)
- Manages add/edit/delete/move (up/down) for widgets in edit.
- Types: text (HTML textarea), image (URLs list), video (URL/autoplay), iframe (code/height).
- Stores as array in widgets_data JSON; renders in view via generateContainerContent (legacy, uses containers table).
- No drag/drop; manual move buttons.

## 2. Identified Gaps in Customization/Editing
- **Avatar**: No upload/display; fixed placeholder. Gap: Missing profile picture upload to Supabase storage, display in sidebar.
- **Bio**: 'status' is short (100 chars); no rich bio. Gap: Need longer bio field with markdown support.
- **Layout Choice**: Fixed grid/single column for containers/posts. Gap: No user choice for 1-column (full markdown) vs 2-column (widgets); no sidebar customization.
- **Widgets**: Basic add/edit via forms; stored in containers table or widgets_data JSON inconsistently. Gap: No drag/drop reordering; limited to main area; no sidebar slot; no markdown widget; positions not flexible.
- **Editing Flow**: Tabs cover basics but no layout selector, avatar/bio inputs, integrated drag/drop for widgets. Gap: Separate container-edit.html; no unified editor with preview.
- **Storage**: Mix of flat fields and containers table; no JSON for overall layout/widgets config. Gap: Need jsonb for layout (type, sidebar config, main zones) to enable flexible saving.
- **Mobile/Theme**: Partial responsive (stacks); themes apply broadly but not to new elements. Gap: Ensure sidebar collapses on mobile; extend profile-themes.js to new components.
- **Markdown**: No support in 1-column; views use plain HTML. Gap: Integrate markdown editor/renderer (e.g., textarea + marked.js preview).
- **Security**: Basic escapeHTML; uploads to disk (not Supabase). Gap: Move to Supabase storage for scalability.

## 3. Backend Design: Supabase Schema Extensions
Extend 'profiles' table for core customizations; enhance 'profile_containers' for widgets.

### SQL for Schema Updates
```sql
-- Add to profiles table
ALTER TABLE profiles 
ADD COLUMN avatar_url TEXT,  -- URL from Supabase storage
ADD COLUMN bio TEXT,  -- Longer bio, supports markdown
ADD COLUMN layout_type TEXT DEFAULT 'two-column' CHECK (layout_type IN ('one-column', 'two-column')),  -- Layout choice
ADD COLUMN sidebar_config JSONB DEFAULT '{}',  -- e.g., {widget_id: null, bio_visible: true}
ADD COLUMN main_content JSONB DEFAULT '[]';  -- Array of widget IDs or markdown for 1-column

-- Update profile_containers for better widget support
ALTER TABLE profile_containers 
ADD COLUMN zone TEXT DEFAULT 'main' CHECK (zone IN ('sidebar', 'main-left', 'main-right')),  -- Position in layout
ADD COLUMN is_markdown BOOLEAN DEFAULT FALSE;  -- Flag for markdown content

-- Enable Row Level Security if not already
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
```

### Route Updates
- **GET /profile/edit**: Fetch extended profile fields; include layout_type, sidebar_config, main_content; populate form with JSON parsing.
- **POST /profile/update**: Handle new fields (avatar upload to Supabase storage via @supabase/supabase-js, bio sanitization with markdown allowed via marked), parse/update JSONB fields (validate layout/widget arrays).
- **Widget Routes**: Extend /container to set zone; add endpoint for reordering (update positions via array).
- **Avatar Upload**: New multer or direct Supabase upload; store public URL.
- **Markdown Sanitization**: Use DOMPurify on server-side render for security.

## 4. Frontend Layout Design
- **Overall Structure**: Flexbox container with left sidebar (20% width, fixed/sticky on desktop), main content (80%).
- **Left Sidebar**:
  - Top: Avatar (100x100px, upload button for owner; display img or default).
  - Middle: Bio (rendered markdown, 200-300px height; textarea in edit).
  - Bottom: Optional widget slot (single container from profile_containers where zone='sidebar').
- **Main Content**:
  - If layout_type='one-column': Full-width markdown renderer (preview/edit toggle); save as main_content[0].markdown.
  - If 'two-column': Side-by-side (main-left/main-right zones, 50% each); drag/drop widgets from pool to zones (use SortableJS).
- **Wireframe (Mermaid Diagram)**:
```
graph TD
    A[Profile Container] --> B[Left Sidebar]
    A --> C[Main Content]
    B --> D[Avatar Upload/Display]
    B --> E[Bio Markdown Render/Edit]
    B --> F[Optional Sidebar Widget]
    C --> G{Layout Type?}
    G -->|one-column| H[Full Markdown Editor/Renderer]
    G -->|two-column| I[Left Zone<br/>Drag/Drop Widgets]
    G -->|two-column| J[Right Zone<br/>Drag/Drop Widgets]
    H --> K[Save as main_content JSONB]
    I --> L[Widgets from profile_containers zone=main-left]
    J --> M[Widgets from profile_containers zone=main-right]
```
- **CSS Additions**: 
  - `.profile-sidebar { flex: 0 0 20%; } .profile-main { flex: 1; }`
  - `.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }`
  - `.markdown-render { border: 1px solid var(--terminal-green); padding: 1rem; }`

## 5. Editing Flow Design
- **Updated edit.html**:
  - New tab: "Layout" - Radio for one/two-column; preview toggle.
  - Basics tab: Add avatar file input, bio textarea (with live markdown preview via marked.js + DOMPurify).
  - Widgets tab: Widget pool list; drag/drop zones for sidebar/main-left/main-right; integrate SortableJS for reordering.
  - Add preview button to render full layout.
- **Flow (Mermaid)**:
```
sequenceDiagram
    participant U as User
    participant E as Edit Page
    participant B as Backend
    U->>E: Load /profile/edit
    E->>B: Fetch profile + containers
    B-->>E: JSON data
    E->>U: Render tabs/form with populated fields
    U->>E: Select layout, upload avatar, edit bio, add/drag widgets
    E->>U: Live preview (markdown render, zones)
    U->>E: Submit form
    E->>B: POST /update with FormData (files, JSONB strings)
    B->>B: Upload avatar to Supabase storage
    B->>B: Parse/save JSONB (layout, configs, widget positions)
    B-->>E: Success JSON
    E->>U: Show message, optional redirect to view
```
- **Save Logic**: Serialize zones to main_content JSONB (e.g., {type: 'two-column', zones: {sidebar: [widget_id], main: {left: [ids], right: [ids]}}}); for one-column: {type: 'one-column', markdown: bio_content}.

## 6. Mobile-Responsiveness and Theme Integration
- **Mobile**:
  - @media (max-width: 768px): Stack sidebar above main (flex-direction: column); sidebar full-width; two-column becomes single stack; avatar/bio/widgets vertical.
  - Touch-friendly: Larger buttons for drag/drop (fallback to buttons if no JS).
- **Themes**: Extend public/js/profile-themes.js to apply CSS vars to new elements (.profile-sidebar, .markdown-render, zones); e.g., theme.default.sidebar-bg = rgba(0,20,0,0.7); Load via <link> or inline styles on save.

## 7. Testing Steps
- **Backend**:
  1. Run SQL migrations; verify new columns in Supabase dashboard.
  2. Test /update: POST with avatar file (check storage bucket), bio/markdown, layout JSON; query profiles for jsonb validity.
  3. Widget routes: Create container with zone='sidebar'; reorder via position update.
  4. Auth: Ensure RLS blocks unauthorized access.
- **Frontend**:
  1. Load edit/view: Verify population of new fields, layout selector, drag/drop (add SortableJS).
  2. Edit flow: Upload avatar (preview), bio markdown (render), switch layouts (zones update), save/reload.
  3. View: Render sidebar (avatar/bio/widget), conditional main (markdown or columns), 3D glyph intact.
- **Responsive/Integration**:
  1. Browser dev tools: Mobile view - check stacking, no overflow.
  2. Themes: Switch templates; verify new elements styled (e.g., cyberpunk green avatar border).
  3. Edge: Empty bio/widget, invalid markdown (sanitize), large files (error handling).
- **E2E**: Use Cypress: Simulate user edit/save/view cycle; assert DOM elements/JSON.

This design addresses gaps by adding flexible JSONB storage for layouts/widgets, unified editing with drag/drop, avatar/bio support, markdown for 1-column, while maintaining existing themes/responsiveness.