# Hong Kong Typhoon & Emergency Info Aggregator

A real-time web application that aggregates emergency information during typhoons and severe weather events in Hong Kong.

## Features

- **Real-time Typhoon Tracking**: Current warning signals, wind speed, rainfall, and forecast tracks
- **Transport Status**: MTR, bus, ferry, and tram service updates
- **Traffic Conditions**: Road closures, congestion levels, and traffic news
- **Utilities Monitoring**: Power outages, network status, emergency shelters
- **Community Services**: Open stores, healthcare facilities, school closures
- **Emergency Alerts**: Flood warnings, landslide alerts, government announcements
- **Interactive Maps**: Typhoon tracks, traffic conditions, and alert locations
- **Mobile Responsive**: Optimized for all device sizes

## Data Sources

- **Hong Kong Observatory (HKO)**: Weather data and typhoon information
- **MTR Corporation**: Railway service status
- **Transport Department**: Traffic conditions and road closures
- **CLP Power & HK Electric**: Power outage information
- **Social Welfare Department**: Emergency shelter status
- **Government Information Services**: Official announcements

## Setup Instructions

### Option 1: Static Hosting (Recommended)

1. **Download the project files**
   ```bash
   git clone <repository-url>
   cd hk-typhoon-tracker
   ```

2. **Deploy to GitHub Pages**
   - Push code to GitHub repository
   - Go to Settings > Pages
   - Select source branch (main/master)
   - Access via `https://yourusername.github.io/hk-typhoon-tracker`

3. **Deploy to Netlify**
   - Drag and drop the project folder to Netlify
   - Or connect GitHub repository for automatic deployments
   - Access via provided Netlify URL

### Option 2: Local Development

1. **Serve locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Access the application**
   - Open browser to `http://localhost:8000`

### Option 3: Web Server Deployment

1. **Upload files to web server**
   - Copy all files to web server directory
   - Ensure proper file permissions

2. **Configure HTTPS (recommended)**
   - Enable SSL certificate for secure API calls
   - Update any HTTP references to HTTPS

## Configuration

### API Keys (if required)

Some APIs may require authentication. Create a `config.js` file:

```javascript
const API_CONFIG = {
    hko: {
        key: 'your-hko-api-key',
        baseUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/'
    },
    // Add other API configurations as needed
};
```

### Environment Variables

For production deployment, set these environment variables:

- `REFRESH_INTERVAL`: Data refresh interval in minutes (default: 5)
- `API_TIMEOUT`: API request timeout in milliseconds (default: 10000)
- `ENABLE_LOCATION`: Enable location services (default: true)

### Customization

#### Update Refresh Interval

Edit `scripts/main.js`:
```javascript
const CONFIG = {
    refreshIntervalMin: 3, // Change from 5 to 3 minutes
    // ...
};
```

#### Modify Color Scheme

Edit `styles/style.css`:
```css
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
}
```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**: Fetch API, CSS Grid, Flexbox, ES6+

## Performance Optimization

### Caching Strategy

The application implements:
- Browser caching for static assets
- API response caching (5-minute intervals)
- Offline fallback with mock data

### Data Usage

- Initial load: ~500KB
- Refresh updates: ~50KB
- Hourly usage: ~600KB (with 5-min refresh)

## API Endpoints

### Primary Sources
- **HKO Weather API**: `https://data.weather.gov.hk/weatherAPI/opendata/`
- **MTR Service Status**: `https://rt.data.gov.hk/v1/transport/mtr/`
- **Traffic Data**: `https://api.data.gov.hk/v1/historical-archive/`
- **Government RSS**: `https://www.info.gov.hk/gia/general/today/rss.xml`

### Fallback Behavior
When APIs are unavailable:
- Display cached data with timestamp
- Show mock data for demonstration
- Display error messages with retry options

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Use HTTPS hosting
   - Implement server-side proxy if needed
   - Check browser console for specific errors

2. **Maps Not Loading**
   - Verify internet connection
   - Check Leaflet.js CDN availability
   - Ensure proper container sizing

3. **Data Not Updating**
   - Check API endpoint availability
   - Verify refresh interval settings
   - Clear browser cache

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application aggregates data from various government and public sources. While every effort is made to ensure accuracy, users should verify critical information through official channels during emergency situations.

For official emergency information, always refer to:
- Hong Kong Observatory: https://www.hko.gov.hk
- Government Information Services: https://www.info.gov.hk
- Emergency Hotline: 999

## Support

For issues and questions:
- Create GitHub issue for bugs/features
- Check existing documentation
- Contact emergency services for urgent situations