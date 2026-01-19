# Cyber Log Management - Frontend

A modern, responsive web application for security log aggregation, analysis, and alerting.

## Overview

The frontend is built with React + TypeScript and provides a comprehensive dashboard for security operations teams to monitor, analyze, and respond to security events from multiple sources.

## Tech Stack

- **Framework**: React 19.2 + TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Routing**: React Router 7.12
- **UI Components**: Radix UI + TailwindCSS 4.1
- **Charts**: Recharts 3.6
- **Forms**: React Hook Form 7.71 + Zod 4.3
- **HTTP Client**: Axios 1.13
- **Icons**: Lucide React
- **Utilities**: date-fns 4.1, clsx, class-variance-authority

## Features

### Dashboard

- Real-time event statistics and metrics
- Interactive charts:
  - Timeline chart (event volume over time)
  - Severity distribution (bar chart)
  - Source distribution (pie chart)
  - Top 10 source IPs and users
- Time range selector (1h, 6h, 24h, 7d, 30d)
- Open alerts count

### Events Management

- Advanced filtering:
  - By severity (0-10)
  - By source (firewall, crowdstrike, aws, m365, ad, network, api)
  - By IP address (source/destination)
  - By username
  - By time range
  - Full-text search
- Sortable columns
- Configurable pagination (10, 25, 50, 100 items per page)
- Event detail modal with full raw data
- CSV export functionality

### Alerts Management

- Alert status tracking (Open, Acknowledged, Resolved, Closed)
- Alert cards with detailed information
- Status update with notes
- Pagination
- Filter by status

### Alert Rules (Admin Only)

- View all alert rules
- Toggle rule enabled/disabled status
- Discord webhook integration
- Threshold and condition display
- Create default rules

### Event Ingestion (Admin Only)

- Single event form submission with validation
- Batch JSON upload (up to 1000 events)
- File upload support:
  - JSON files
  - Syslog files
  - Plain text files
  - Maximum file size: 10MB

### Settings

- User profile information
- Storage statistics:
  - Total events count
  - Events by age (7d, 30d, 90d, 180d, 365d)
  - Data age display
- Retention policy configuration (admin only)
- Manual cleanup trigger (admin only)

### Security

- JWT-based authentication
- Role-based access control (Admin, Viewer)
- Multi-tenant data isolation
- Protected routes

## Project Structure

```
Frontend/
├── src/
│   ├── api/              # API client modules
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── events.ts     # Events endpoints
│   │   ├── alerts.ts     # Alerts endpoints
│   │   ├── ingest.ts     # Ingestion endpoints
│   │   ├── tenants.ts    # Tenant management
│   │   ├── retention.ts  # Retention policies
│   │   └── client.ts     # Axios configuration
│   ├── components/       # React components
│   │   ├── layout/       # Layout components (Header, Sidebar, Layout)
│   │   ├── charts/       # Chart components (Timeline, Severity, Source, TopItems)
│   │   ├── events/       # Event-related components
│   │   ├── alerts/       # Alert-related components
│   │   ├── common/       # Shared components (Pagination, StatsCard)
│   │   └── ui/           # Radix UI-based components (25+ components)
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── AlertsPage.tsx
│   │   ├── AlertRulesPage.tsx
│   │   ├── IngestPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── types/            # TypeScript type definitions
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── Dockerfile            # Docker configuration
├── nginx.conf            # Nginx configuration for production
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.0+
- Backend API running (see Backend README)

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Configuration

Create a `.env` file in the Frontend directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api
```

For production, update this to your deployed backend URL.

### Development

```bash
# Start development server
npm run dev
# or
bun run dev
```

The application will be available at http://localhost:5173

### Build

```bash
# Build for production
npm run build
# or
bun run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
# Preview production build locally
npm run preview
# or
bun run preview
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t cyber-frontend .
```

### Run Container

```bash
docker run -p 80:80 -e VITE_API_URL=http://localhost:3000/api cyber-frontend
```

The application will be available at http://localhost

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint
# or
bun run lint
```

### Type Checking

```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit
```

## Environment Variables

| Variable       | Description          | Default                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Key Dependencies

- **@radix-ui/\***: Accessible, unstyled UI primitives
- **@tailwindcss/vite**: Utility-first CSS framework
- **axios**: Promise-based HTTP client
- **react-router-dom**: Client-side routing
- **react-hook-form**: Performant form handling
- **zod**: TypeScript-first schema validation
- **recharts**: Composable charting library
- **lucide-react**: Beautiful icon set
- **next-themes**: Dark mode support
- **date-fns**: Modern date utility library

## Component Library

The application uses a custom component library built on top of Radix UI and Tailwind CSS. All components are located in `src/components/ui/` and include:

- Button, Input, Textarea
- Card, Alert, Badge
- Dialog, AlertDialog, Popover
- Select, Checkbox, Switch
- Tabs, Separator, ScrollArea
- Table, Avatar, Label
- And more...

## Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Write meaningful component and function names
4. Keep components small and focused
5. Use React hooks appropriately
6. Test your changes in both light and dark mode

## Troubleshooting

### API Connection Issues

If you're experiencing connection issues:

1. Verify the backend is running at the URL specified in `VITE_API_URL`
2. Check CORS settings in the backend configuration
3. Verify the JWT token is being sent in request headers

### Build Errors

If you encounter build errors:

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf .vite`
3. Verify TypeScript version compatibility

## License

See the main project README for license information.
