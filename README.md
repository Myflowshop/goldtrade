# Gold Trade Journal

Track and analyze your XAUUSD trading performance with a comprehensive trading journal application.

## Features

- **Trade Recording**: Record your buy/sell prices, dates, and times
- **Performance Analytics**: View detailed trading statistics including:
  - Win Rate
  - Profit Factor
  - Max Drawdown
  - Average Trade P/L
  - Gross Profit/Loss
  - Expectancy
- **Equity Curve**: Visualize your trading performance over time
- **Monthly Summary**: Track your monthly P/L
- **Export/Import**: Save and load your trading data in JSON format
- **Multi-Currency**: Support for USD and THB calculations
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign in with GitHub
3. Click "New Project" and select your repository
4. Vercel will automatically detect Next.js and configure the build settings
5. Click "Deploy"

Your application will be live at `https://your-project-name.vercel.app`

## Usage

1. **Add Trade**: Fill in the date, time, buy price, sell price, and notes, then click "บันทึก" (Save)
2. **View Statistics**: Check the Dashboard tab for detailed trading statistics
3. **View Charts**: Go to Charts tab to see equity curve and P/L distribution
4. **View History**: Check History tab to see all your trades
5. **Export Data**: Click Export to download your trading data as JSON
6. **Import Data**: Click Import to load previously saved trading data

## Data Storage

- Data is stored in browser's localStorage
- For production use, consider migrating to a database (PostgreSQL, MongoDB, etc.)

## Technologies Used

- **Next.js 14**: React framework for production
- **React 18**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: React charting library
- **Lucide React**: Icon library

## License

MIT

## Support

For issues or feature requests, please open an issue on GitHub.

