# July 2025 Roster Generator

A Next.js application for generating and managing employee rosters for July 2025. The application allows for creating fair and balanced shift schedules while considering various constraints and employee preferences.

## Features

- Generate monthly rosters with fair shift distribution
- Support for different shift types (day, mid, night)
- Employee availability and preferences management
- Weekly and monthly view of the roster
- Export roster to Excel with detailed statistics
- Validation of roster constraints
- Color-coded shift display
- Employee statistics tracking

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- XLSX for Excel export

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Generate Roster" to create a new roster for July 2025
2. View the roster in either weekly or monthly format
3. Navigate between weeks using the navigation buttons
4. Export the roster to Excel for offline use
5. View employee statistics and validation warnings

## Project Structure

- `/src/app` - Main application pages
- `/src/components` - Reusable UI components
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions for roster generation and Excel export

## License

MIT 