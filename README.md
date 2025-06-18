# Atrocity Watch Canada

Atrocity Watch Canada is a Node.js/Express web application for tracking, managing, and visualizing atrocities, publications, and press releases. It features an admin dashboard for managing live atrocities, atrocity types, publications, and press releases, with user authentication and permission-based access control.

## Features

- **Live Atrocity Tracking:**
  - Add, edit, and view atrocities with location, severity, type, and detailed descriptions.
  - Visualize atrocities on a map (Leaflet.js integration in the frontend).
  - Log all changes for audit purposes.

- **Atrocity Types Management:**
  - Add, edit, and delete atrocity types (with image and type name).
  - Prevent deletion if types are in use.

- **Publications & Press Releases:**
  - Add, edit, and delete publications and press releases.
  - Only supervisor can delete publications/press releases.
  - All changes are logged.

- **User Authentication & Permissions:**
  - Session-based login for admin users.
  - Permission-based access (e.g., MANAGE_LIVE_ATROCITIES, MANAGE_PUBLICATIONS).
  - Supervisor account is created on first run if not present.

- **Admin Dashboard:**
  - Manage atrocities, types, publications, press releases, and view logs.
  - Change password and security settings.

- **Frontend:**
  - Modern, responsive UI using Tailwind CSS and EJS templates.
  - Interactive map and statistics on the homepage.

## Project Structure

```
app.js                # Main Express app
index.html            # Main landing page (static)
models/               # Mongoose models (Atrocity, AtrocityType, User, etc.)
partials/             # EJS partials
views/                # EJS views (admin dashboard, public pages)
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account (or local MongoDB)

### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd atrocitywatchcanada
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure MongoDB connection:
   - The connection string is in `app.js`. Update it if needed.

4. Start the server:
   ```sh
   node app.js
   ```
5. Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin
- On first run, a `supervisor` user is created with username `supervisor` and password `supervisorpassword`.
- Change the password after first login for security.

## Usage
- **Public pages:** `/` (home), `/aboutus`, `/get-involved`, `/bylaws`, `/publications`, `/press-releases`
- **Admin dashboard:** `/admin` (login required)

## Technologies Used
- Node.js, Express.js
- MongoDB, Mongoose
- EJS (templating)
- Tailwind CSS, FontAwesome
- Leaflet.js (map visualization)
- bcrypt (password hashing)

## License
MIT License

## Credits
- [Unsplash](https://unsplash.com/) for hero images
- [Leaflet.js](https://leafletjs.com/) for map

---

For questions or contributions, please open an issue or pull request.