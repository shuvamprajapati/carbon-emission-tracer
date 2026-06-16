"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Search, Github, ExternalLink, Leaf } from "lucide-react"

// TypeScript interface for API response
interface AirQualityResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  hourly_units: {
    time: string
    carbon_monoxide: string
    pm2_5: string
    ozone: string
  }
  hourly: {
    time: string[]
    carbon_monoxide: (number | null)[]
    pm2_5: (number | null)[]
    ozone: (number | null)[]
  }
}

interface ChartDataPoint {
  time: string
  CO: number
  PM25: number
  ozone: number
}

// Add this new interface after the existing interfaces
interface GeocodeResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Mock data for the chart (fallback) - based on real API response format
const mockChartData: ChartDataPoint[] = [
  { time: "00:00", CO: 145, PM25: 3.4, ozone: 63 },
  { time: "04:00", CO: 157, PM25: 4.1, ozone: 44 },
  { time: "08:00", CO: 168, PM25: 5.0, ozone: 40 },
  { time: "12:00", CO: 149, PM25: 3.4, ozone: 68 },
  { time: "16:00", CO: 153, PM25: 3.3, ozone: 69 },
  { time: "20:00", CO: 151, PM25: 3.4, ozone: 68 },
]

// Default suggestions as fallback
const defaultSuggestions = [
  {
    number: 1,
    title: "Plant Trees & Gardens",
    description: "Add rooftop gardens or plant trees in your area to absorb CO₂",
  },
  {
    number: 2,
    title: "Use Public Transport",
    description: "Switch to bicycles, buses, or trains to reduce vehicle emissions",
  },
  {
    number: 3,
    title: "Renewable Energy",
    description: "Transition to solar, wind, or other clean energy sources",
  },
]

// Interface for AI suggestion response
interface AISuggestion {
  heading: string;
  description: string;
}

interface OpenRouterResponse {
  suggestions: AISuggestion[];
}

// Function to call OpenRouter API for AI suggestions
const fetchAISuggestions = async (pm25: number, co: number, ozone: number): Promise<OpenRouterResponse | null> => {
  try {
    const openRouterToken = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!openRouterToken) {
      console.warn('OpenRouter API key not found. Using default suggestions.');
      return null;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "model": "openai/gpt-oss-20b:free",
        "messages": [
          {
            "role": "system",
            "content": "You are an assistant that generates eco-friendly recommendations based on air quality data."
          },
          {
            "role": "user",
            "content": `Input: PM2.5=${pm25}, CO=${co}ppm, Ozone=${ozone}.\n\nTask:\n- Provide exactly 3 suggestions to reduce carbon emissions or improve air quality.\n- Return ONLY a valid JSON response.\n- Each suggestion must contain:\n   - "heading": A short title (maximum 4 words).\n   - "description": A concise sentence (1–2 lines).\n\nOutput format example:\n{\n  "suggestions": [\n    {\n      "heading": "Plant Trees",\n      "description": "Add rooftop gardens or plant trees to absorb CO₂."\n    },\n    {\n      "heading": "Public Transport",\n      "description": "Use buses, trains, or bicycles to reduce vehicle emissions."\n    },\n    {\n      "heading": "Clean Energy",\n      "description": "Switch to solar or wind energy for sustainable power."\n    }\n  ]\n}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the content from the OpenRouter response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenRouter API');
    }

    // Parse the JSON content
    const parsedContent = JSON.parse(content);
    
    console.log('AI suggestions received:', parsedContent);
    return parsedContent;
    
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return null;
  }
};

// Function to consume the Air Quality API
const fetchAirQualityData = async (latitude: number, longitude: number): Promise<AirQualityResponse | null> => {
  try {
    const apiResponse = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=carbon_monoxide,pm2_5,ozone&timezone=auto`
    )
    
    if (!apiResponse.ok) {
      throw new Error(`API request failed with status: ${apiResponse.status}`)
    }
    
    const data: AirQualityResponse = await apiResponse.json()
    
    // Log the API response data to console
    console.log('API Response Status:', apiResponse.status)
    console.log('API Response Headers:', Object.fromEntries(apiResponse.headers.entries()))
    console.log('API Response Data:', data)
    
    return data
  } catch (error) {
    console.error('Error fetching air quality data:', error)
    return null
  }
}



// AQI calculation functions
const calculatePM25AQI = (pm25: number): number => {
  if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25)
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301)
}

const calculateOzoneAQI = (ozone: number): number => {
  // Convert μg/m³ to ppm (approximate: 1 ppm ≈ 2000 μg/m³ for ozone)
  const ozonePPM = ozone / 2000
  
  if (ozonePPM <= 0.054) return Math.round((50 / 0.054) * ozonePPM)
  if (ozonePPM <= 0.070) return Math.round(((100 - 51) / (0.070 - 0.055)) * (ozonePPM - 0.055) + 51)
  if (ozonePPM <= 0.085) return Math.round(((150 - 101) / (0.085 - 0.071)) * (ozonePPM - 0.071) + 101)
  if (ozonePPM <= 0.105) return Math.round(((200 - 151) / (0.105 - 0.086)) * (ozonePPM - 0.086) + 151)
  if (ozonePPM <= 0.200) return Math.round(((300 - 201) / (0.200 - 0.106)) * (ozonePPM - 0.106) + 201)
  return 400
}

const calculateCOAQI = (co: number): number => {
  // Convert μg/m³ to ppm (approximate: 1 ppm ≈ 1145 μg/m³ for CO)
  const coPPM = co / 1145
  
  if (coPPM <= 4.4) return Math.round((50 / 4.4) * coPPM)
  if (coPPM <= 9.4) return Math.round(((100 - 51) / (9.4 - 4.5)) * (coPPM - 4.5) + 51)
  if (coPPM <= 12.4) return Math.round(((150 - 101) / (12.4 - 9.5)) * (coPPM - 9.5) + 101)
  if (coPPM <= 15.4) return Math.round(((200 - 151) / (15.4 - 12.5)) * (coPPM - 12.5) + 151)
  if (coPPM <= 30.4) return Math.round(((300 - 201) / (30.4 - 15.5)) * (coPPM - 15.5) + 201)
  return Math.round(((500 - 301) / (50.4 - 30.5)) * (coPPM - 30.5) + 301)
}

// Calculate overall AQI (highest of individual pollutant AQIs)
const calculateOverallAQI = (pm25: number, co: number, ozone: number): number => {
  const pm25AQI = calculatePM25AQI(pm25)
  const coAQI = calculateCOAQI(co)
  const ozoneAQI = calculateOzoneAQI(ozone)
  
  return Math.max(pm25AQI, coAQI, ozoneAQI)
}

// Get air quality status based on AQI
const getAirQualityStatus = (aqi: number): { status: string; color: string } => {
  if (aqi <= 50) return { status: "Good", color: "text-green-400" }
  if (aqi <= 100) return { status: "Moderate", color: "text-yellow-400" }
  if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", color: "text-orange-400" }
  if (aqi <= 200) return { status: "Unhealthy", color: "text-red-400" }
  if (aqi <= 300) return { status: "Very Unhealthy", color: "text-purple-400" }
  return { status: "Hazardous", color: "text-red-600" }
}

// Function to transform API data to chart format
const transformToChartData = (apiData: AirQualityResponse): ChartDataPoint[] => {
  const { time, carbon_monoxide, pm2_5, ozone } = apiData.hourly
  
  return time.slice(0, 24).map((timestamp, index) => {
    const hour = new Date(timestamp).getHours()
    const formattedTime = `${hour.toString().padStart(2, '0')}:00`
    
    return {
      time: formattedTime,
      CO: carbon_monoxide[index] || 0, // Keep in μg/m³ as per API response
      PM25: pm2_5[index] || 0,
      ozone: ozone[index] || 0,
    }
  })
}

export default function CarbonTracker() {
  const [location, setLocation] = useState("")
  const [showDashboard, setShowDashboard] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [apiResponse, setApiResponse] = useState<AirQualityResponse | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>(mockChartData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [locationDisplayName, setLocationDisplayName] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(defaultSuggestions);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const [particles, setParticles] = useState<Array<{
    id: number;
    size: number;
    opacity: number;
    left: number;
    top: number;
    animationDelay: number;
    animationDuration: number;
  }>>([])

  const [heroParticles, setHeroParticles] = useState<Array<{
    id: number;
    left: number;
    top: number;
    animationDelay: number;
    animationDuration: number;
  }>>([])

  // Calculate current AQI and air quality status
  const currentAirQualityData = useMemo(() => {
    let pm25Value = 0;
    let coValue = 0;
    let ozoneValue = 0;

    if (apiResponse) {
      // Get the first non-null values from the API response
      pm25Value = apiResponse.hourly.pm2_5.find(v => v !== null) || 0;
      coValue = apiResponse.hourly.carbon_monoxide.find(v => v !== null) || 0;
      ozoneValue = apiResponse.hourly.ozone.find(v => v !== null) || 0;
    } else {
      // Use mock data values if no API response
      pm25Value = mockChartData[0].PM25;
      coValue = mockChartData[0].CO;
      ozoneValue = mockChartData[0].ozone;
    }

    const aqi = calculateOverallAQI(pm25Value, coValue, ozoneValue);
    const qualityInfo = getAirQualityStatus(aqi);

    return {
      aqi,
      status: qualityInfo.status,
      statusColor: qualityInfo.color,
      pm25: pm25Value,
      co: coValue,
      ozone: ozoneValue
    };
  }, [apiResponse]);

  useEffect(() => {
    // Generate particles on client side to avoid hydration mismatch
    const generatedParticles = [...Array(80)].map((_, i) => {
      const size = Math.random() * 6 + 2 // 2px to 8px
      const opacity = Math.random() * 0.6 + 0.1 // 0.1 to 0.7
      return {
        id: i,
        size,
        opacity,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 15,
        animationDuration: 10 + Math.random() * 8,
      }
    })
    setParticles(generatedParticles)

    // Generate hero particles on client side
    const generatedHeroParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 10,
      animationDuration: 8 + Math.random() * 4,
    }))
    setHeroParticles(generatedHeroParticles)
  }, [])

  // Enhanced geocoding function with better error handling
  const geocodeLocation = async (cityName: string): Promise<{ lat: number; lon: number; displayName: string } | null> => {
    try {
      // Clean the input
      const cleanCityName = cityName.trim();
      if (!cleanCityName) {
        throw new Error('Please enter a city name');
      }
      
      // Using OpenStreetMap Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCityName)}&limit=3&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CarbonTracker/1.0' // Nominatim requires a User-Agent
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding service unavailable (${response.status})`);
      }
      
      const data: GeocodeResponse[] = await response.json();
      
      if (data.length === 0) {
        throw new Error(`"${cleanCityName}" not found. Try using a different city name or include country (e.g., "Paris, France")`);
      }
      
      // Prefer results that are cities, towns, or villages
      const cityResult = data.find(item => 
        item.display_name.includes('city') || 
        item.display_name.includes('town') || 
        item.display_name.includes('village') ||
        data.length === 1
      ) || data[0];
      
      return {
        lat: parseFloat(cityResult.lat),
        lon: parseFloat(cityResult.lon),
        displayName: cityResult.display_name
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Update the handleLocationSubmit function
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please enter a city name');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Geocode the location
      const geocodeResult = await geocodeLocation(location);
      
      if (!geocodeResult) {
        throw new Error('Failed to geocode location');
      }
      
      console.log('Geocoded location:', geocodeResult);
      
      // Extract city name from the full display name
      const cityName = geocodeResult.displayName.split(',')[0];
      setLocationDisplayName(cityName);
      
      // Fetch air quality data
      const airQualityData = await fetchAirQualityData(geocodeResult.lat, geocodeResult.lon);
      
      if (airQualityData) {
        setApiResponse(airQualityData);
        const transformedData = transformToChartData(airQualityData);
        setChartData(transformedData);
        setShowDashboard(true);
      } else {
        setError('Failed to fetch air quality data for this location. Using sample data.');
        setChartData(mockChartData);
        setShowDashboard(true);
      }
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToLocation = () => {
    document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToTracker = () => {
    document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToFooter = () => {
    document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleAnalyze = async () => {
    setIsLoadingAI(true);
    setShowInsights(true);
    
    try {
      // Use the calculated values from currentAirQualityData
      const { pm25, co, ozone } = currentAirQualityData;
      
      console.log('Fetching AI suggestions with values:', { pm25, co, ozone });
      
      // Fetch AI suggestions
      const aiResponse = await fetchAISuggestions(pm25, co, ozone);
      
      if (aiResponse && aiResponse.suggestions && aiResponse.suggestions.length === 3) {
        // Transform AI response to match our component structure
        const transformedSuggestions = aiResponse.suggestions.map((suggestion, index) => ({
          number: index + 1,
          title: suggestion.heading,
          description: suggestion.description,
        }));
        
        setAiSuggestions(transformedSuggestions);
      } else {
        // Fallback to default suggestions if AI response is invalid
        console.warn('Invalid AI response, using default suggestions');
        setAiSuggestions(defaultSuggestions);
      }
    } catch (error) {
      console.error('Error in handleAnalyze:', error);
      // Fallback to default suggestions on error
      setAiSuggestions(defaultSuggestions);
    } finally {
      setIsLoadingAI(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-radial from-teal-400 via-teal-600 to-slate-900 -z-10"></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-white rounded-full animate-float"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              opacity: particle.opacity,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-green-400" />
              <span className="text-white font-bold text-lg">CarbonTrack</span>
            </div>
            <div className="flex items-center space-x-8">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-white hover:text-green-300 transition-colors font-medium"
              >
                Home
              </button>
              <button
                onClick={scrollToTracker}
                className="text-white hover:text-green-300 transition-colors font-medium"
              >
                Tracker
              </button>
              <button
                onClick={scrollToFooter}
                className="text-white hover:text-green-300 transition-colors font-medium"
              >
                About Us
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center text-white relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="absolute inset-0 overflow-hidden">
          {heroParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">Breathe Better. Live Smarter.</h1>
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
            Get live air quality insights, visualize pollution levels, and receive AI-driven suggestions to reduce your
            impact.
          </p>
          <Button
            onClick={scrollToLocation}
            size="lg"
            className="bg-white/15 backdrop-blur-md border border-white/30 text-white hover:bg-white/25 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 text-lg px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out"
          >
            Start Exploring ↓
          </Button>
        </div>
      </section>

      {/* Location Selection Section */}
      <section id="location-section" className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-white font-bold mb-8 text-2xl">Enter your location to check live carbon emissions.</p>
            <form onSubmit={handleLocationSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter your city..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-2xl shadow-lg border-0 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-green-400"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 text-white shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Check Air Quality'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Air Quality Dashboard */}
      {showDashboard && (
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Location & AQI Card */}
              <Card className="mb-12 rounded-2xl shadow-lg border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/30 hover:scale-[1.02] transition-all duration-300 ease-in-out">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-3xl font-bold text-white">{locationDisplayName || location}</CardTitle>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-400">{currentAirQualityData.aqi}</div>
                      <div className="text-sm text-white/70">AQI</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${currentAirQualityData.statusColor}`}>{currentAirQualityData.status}</div>
                      <div className="text-sm text-white/70">Air Quality</div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Chart */}
              <Card className="mb-8 rounded-2xl shadow-lg border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/30 hover:scale-[1.01] transition-all duration-300 ease-in-out">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center text-white">24-Hour Pollution Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="time" tick={{ fill: "white" }} />
                        <YAxis tick={{ fill: "white" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            backdropFilter: "blur(8px)",
                            color: "white",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="CO"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                          name="Carbon Monoxide (μg/m³)"
                        />
                        <Line
                          type="monotone"
                          dataKey="PM25"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                          name="PM2.5 (μg/m³)"
                        />
                        <Line
                          type="monotone"
                          dataKey="ozone"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                          name="Ozone (μg/m³)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <Card className="mb-6 rounded-2xl shadow-lg border border-yellow-400/30 bg-gradient-to-br from-yellow-500/25 via-white/15 to-yellow-500/10 backdrop-blur-md">
                  <CardContent className="p-6 text-center">
                    <div className="text-yellow-300 mb-2">⚠️ Notice</div>
                    <div className="text-white">{error}</div>
                  </CardContent>
                </Card>
              )}

              {/* Pollutant Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card className="rounded-2xl shadow-lg border border-red-400/30 bg-gradient-to-br from-red-500/25 via-white/15 to-red-500/10 backdrop-blur-md hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:border-red-400/50 hover:scale-105 transition-all duration-300 ease-in-out">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-red-300 mb-2">
                      {currentAirQualityData.co.toFixed(1)}
                    </div>
                    <div className="text-lg font-semibold text-white">CO</div>
                    <div className="text-sm text-white/70">μg/m³</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/25 via-white/15 to-orange-500/10 backdrop-blur-md hover:shadow-[0_0_25px_rgba(249,115,22,0.3)] hover:border-orange-400/50 hover:scale-105 transition-all duration-300 ease-in-out">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-orange-300 mb-2">
                      {currentAirQualityData.pm25.toFixed(1)}
                    </div>
                    <div className="text-lg font-semibold text-white">PM2.5</div>
                    <div className="text-sm text-white/70">μg/m³</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-lg border border-green-400/30 bg-gradient-to-br from-green-500/25 via-white/15 to-green-500/10 backdrop-blur-md hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:border-green-400/50 hover:scale-105 transition-all duration-300 ease-in-out">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      {currentAirQualityData.ozone.toFixed(1)}
                    </div>
                    <div className="text-lg font-semibold text-white">Ozone</div>
                    <div className="text-sm text-white/70">μg/m³</div>
                  </CardContent>
                </Card>
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoadingAI}
                  size="lg"
                  className="px-12 py-4 text-lg rounded-2xl bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:scale-105 text-white shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAI ? 'Analyzing...' : 'Analyse'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Insights Section */}
      {showInsights && (
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4 text-white">AI-Powered Recommendations</h2>
              <p className="text-center text-white/80 mb-12 text-lg">
                Based on your location&apos;s air quality data, here are personalized suggestions to reduce carbon emissions:
              </p>

              {isLoadingAI && (
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span className="text-white">Generating AI-powered recommendations...</span>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-8">
                {aiSuggestions.map((suggestion, index) => {
                  return (
                    <Card
                      key={index}
                      className="rounded-2xl shadow-lg border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/30 hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-in-out"
                      style={{
                        animationDelay: `${index * 200}ms`,
                        animation: "fadeInUp 0.6s ease-out forwards",
                      }}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{suggestion.number}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">{suggestion.title}</h3>
                        <p className="text-white/80 leading-relaxed">{suggestion.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-8">Carbon Emission Tracker</h3>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <a href="https://github.com/Amanaakash/carbon-track.git" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
                GitHub Repo
              </a>
              <a href="https://kiitecell.org" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <ExternalLink className="h-5 w-5" />
                Hackathon Credits
              </a>
            </div>
            <div className="text-sm text-gray-400">
              <p className="mb-2">APIs used: Open Meteo, HuggingFace</p>
              <p>&copy; 2024 Carbon Emission Tracker. Built for sustainability.</p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
