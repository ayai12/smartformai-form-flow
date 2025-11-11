import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

interface CountriesBreakdownProps {
  responses: Array<{
    location?: {
      lat: number;
      lng: number;
    };
  }>;
}

// Simple country detection from coordinates (approximate)
// Note: This is a simplified version. For production, consider using a geocoding API
const getCountryFromCoordinates = (lat: number, lng: number): string => {
  // Approximate geographic regions
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return 'United States';
  if (lat >= 41 && lat <= 84 && lng >= -141 && lng <= -52) return 'Canada';
  if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) return 'United Kingdom';
  if (lat >= 35 && lat <= 71 && lng >= 5 && lng <= 32) return 'Europe';
  if (lat >= -10 && lat <= 44 && lng >= 113 && lng <= 154) return 'Australia';
  if (lat >= 20 && lat <= 30 && lng >= 72 && lng <= 97) return 'India';
  if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) return 'China';
  if (lat >= -40 && lat <= -10 && lng >= 165 && lng <= 180) return 'New Zealand';
  if (lat >= -35 && lat <= 5 && lng >= -75 && lng <= -35) return 'South America';
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return 'Africa';
  if (lat >= 25 && lat <= 50 && lng >= 100 && lng <= 145) return 'East Asia';
  if (lat >= 10 && lat <= 30 && lng >= 90 && lng <= 140) return 'Southeast Asia';
  return 'Unknown';
};

const CountriesBreakdown: React.FC<CountriesBreakdownProps> = ({ responses }) => {
  const [isOpen, setIsOpen] = useState(false);

  const countryData = useMemo(() => {
    const countryMap: Record<string, number> = {};
    let totalWithLocation = 0;

    responses.forEach((response) => {
      const lat = response.location?.lat;
      const lng = response.location?.lng;
      const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
      if (hasCoords) {
        const country = getCountryFromCoordinates(lat as number, lng as number);
        countryMap[country] = (countryMap[country] || 0) + 1;
        totalWithLocation++;
      }
    });

    const countries: CountryData[] = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalWithLocation > 0 ? (count / totalWithLocation) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { countries, totalWithLocation };
  }, [responses]);

  if (countryData.totalWithLocation === 0) {
    return (
      <Card className="bg-white border border-gray-200 mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <MapPin className="h-4 w-4" />
            <p className="text-sm">No geographic data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gray-300 bg-white text-[#2E2E2E] hover:bg-gray-50 mt-4"
        >
          <Globe className="h-4 w-4" />
          See Countries ({countryData.countries.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-[#2E2E2E]">Geographic Distribution by Country</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {countryData.countries.map((item, index) => (
              <div
                key={item.country}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-[#8F00FF]/10 flex items-center justify-center">
                    <span className="text-[#8F00FF] font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#2E2E2E]">{item.country}</p>
                    <p className="text-xs text-gray-500">
                      {item.percentage.toFixed(1)}% of responses with location
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20">
                    <Users className="h-3 w-3 mr-1" />
                    {item.count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total responses with location:</span>
              <span className="font-semibold text-[#2E2E2E]">{countryData.totalWithLocation}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CountriesBreakdown;

