# 🌱 CarbonTrack

**An intelligent air quality monitoring and carbon emission tracking platform that provides real-time insights and AI-powered recommendations for sustainable living.**

![CarbonTrack Banner](https://img.shields.io/badge/Air%20Quality-Monitoring-green?style=for-the-badge&logo=leaf)
![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## 🌍 Overview

CarbonTrack is a modern web application that helps users monitor air quality in their location and receive personalized recommendations to reduce their carbon footprint. By combining real-time environmental data with AI-powered insights, the platform empowers individuals to make informed decisions about their environmental impact.

## ✨ Features

### 🔍 **Real-Time Air Quality Monitoring**
- Live air quality data for any city worldwide
- Tracks key pollutants: Carbon Monoxide (CO), PM2.5, and Ozone
- Real-time AQI (Air Quality Index) calculations
- 24-hour pollution trend visualization

### 📊 **Interactive Data Visualization**
- Beautiful, responsive charts powered by Recharts
- Historical air quality trends
- Color-coded air quality status indicators
- Mobile-friendly responsive design

### 🤖 **AI-Powered Recommendations**
- Personalized suggestions based on local air quality data
- OpenRouter AI integration for intelligent insights
- Location-specific carbon reduction strategies
- Actionable environmental improvement tips

### 🎨 **Modern User Experience**
- Sleek, glassmorphism design with animated particles
- Smooth scrolling and hover animations
- Dark theme with gradient backgrounds
- Intuitive navigation and user flow

### 🌐 **Global Location Support**
- City search with geocoding via OpenStreetMap Nominatim
- Support for international locations
- Automatic coordinate conversion
- Location display name formatting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Amanaakash/carbon-track.git
   cd carbon-track
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables (optional)**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key" > .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework | 15.5.0 |
| **React** | UI library | 19.1.0 |
| **TypeScript** | Type safety | 5.0+ |
| **Tailwind CSS** | Styling | 4.1.12 |
| **Recharts** | Data visualization | 3.1.2 |
| **Lucide React** | Icons | 0.541.0 |
| **shadcn/ui** | UI components | Latest |

## 📡 API Integration

### Air Quality Data
- **Provider**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- **Data**: Hourly CO, PM2.5, and Ozone measurements
- **Coverage**: Global
- **Update Frequency**: Hourly

### Geocoding
- **Provider**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
- **Purpose**: Convert city names to coordinates
- **Rate Limits**: 1 request per second

### AI Recommendations
- **Provider**: [OpenRouter](https://openrouter.ai/)
- **Model**: OpenAI GPT (configurable)
- **Purpose**: Generate personalized environmental recommendations

## 🎯 Usage Guide

### 1. Search for Your Location
- Enter any city name in the search bar
- The app supports international locations
- Examples: "New York", "London, UK", "Tokyo, Japan"

### 2. View Air Quality Data
- Check your current AQI score and status
- Explore 24-hour pollution trends
- View individual pollutant levels

### 3. Get AI Recommendations
- Click "Analyse" to receive personalized suggestions
- AI considers your local air quality conditions
- Get actionable tips for reducing carbon emissions

### 4. Take Action
- Implement the suggested environmental improvements
- Share insights with your community
- Monitor changes over time

## 📋 Scripts

```bash
# Development with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 🌟 Key Components

### Air Quality Calculations
- **AQI Formulas**: EPA-standard calculations for CO, PM2.5, and Ozone
- **Unit Conversions**: Automatic μg/m³ to ppm conversions
- **Status Categories**: Good, Moderate, Unhealthy, etc.

### Data Processing
- **Real-time Updates**: Live API data integration
- **Fallback System**: Mock data for offline development
- **Error Handling**: Graceful degradation with user feedback

### UI/UX Features
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimized with Next.js and Turbopack

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | OpenRouter API key for AI features | Optional |

### Customization

- **Colors**: Modify `tailwind.config.ts` for theme changes
- **API Endpoints**: Update in component functions
- **AI Prompts**: Modify in `fetchAISuggestions` function

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Areas for Contribution
- 🌍 Additional API integrations
- 📊 New visualization types
- 🤖 Enhanced AI prompts
- 🎨 UI/UX improvements
- 🧪 Testing framework
- 📚 Documentation updates

## 📄 License

This project is built for educational and environmental awareness purposes. Feel free to use and modify according to your needs.

## 🙏 Acknowledgments

- **Open-Meteo**: Providing free air quality data
- **OpenStreetMap**: Geocoding services
- **OpenRouter**: AI recommendation capabilities
- **KIIT E-Cell**: Hackathon platform and community

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Amanaakash/carbon-track/issues)
- **Documentation**: Check this README for common questions
- **Community**: Share your experience and improvements

---

**Built with ❤️ for a sustainable future** 🌱

*Track your impact. Breathe better. Live smarter.*
