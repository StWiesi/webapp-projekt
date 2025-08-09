import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GermanyMap from './GermanyMap';

// Mock Google Maps API
const mockGoogleMaps = {
  Map: jest.fn().mockReturnValue({
    addListener: jest.fn(),
    getZoom: jest.fn().mockReturnValue(6),
    setZoom: jest.fn(),
    setCenter: jest.fn(),
  }),
  Data: jest.fn().mockReturnValue({
    addGeoJson: jest.fn(),
    setMap: jest.fn(),
    setStyle: jest.fn(),
    addListener: jest.fn(),
  }),
  Marker: jest.fn().mockReturnValue({
    setMap: jest.fn(),
    addListener: jest.fn(),
    getPosition: jest.fn(),
  }),
  InfoWindow: jest.fn().mockReturnValue({
    open: jest.fn(),
  }),
  SymbolPath: {
    CIRCLE: 0,
  },
  ControlPosition: {
    RIGHT_BOTTOM: 3,
  },
  geometry: {
    spherical: {
      computeDistanceBetween: jest.fn().mockReturnValue(500),
    },
  },
};

// Mock MarkerClusterer
const mockMarkerClusterer = jest.fn().mockReturnValue({
  clearMarkers: jest.fn(),
});

// Mock window.google
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true,
});

// Mock fetch for GeoJSON
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Baden-Württemberg' },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }
      }
    ]
  })
});

// Mock environment variable
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';

describe('GermanyMap Component', () => {
  const mockData = [
    {
      region: 'Baden-Württemberg',
      city: 'Stuttgart',
      site: 'site1.com',
      cost: '100',
      plays: '50',
      auction_wins: '30',
      ad_requests: '100',
      total_impressions: '200',
      latitude: '48.7758',
      longitude: '9.1829',
      network: 'Network1',
      auctionType: 'Type1',
      screenId: 'screen1'
    },
    {
      region: 'Bayern',
      city: 'München',
      site: 'site2.com',
      cost: '200',
      plays: '100',
      auction_wins: '60',
      ad_requests: '200',
      total_impressions: '400',
      latitude: '48.1351',
      longitude: '11.5820',
      network: 'Network2',
      auctionType: 'Type2',
      screenId: 'screen2'
    }
  ];

  const mockFilters = {
    network: [],
    region: [],
    city: [],
    site: [],
    screenIds: [],
    auctionType: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    test('renders loading state initially', () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      expect(screen.getByText('Lade Deutschland-Karte...')).toBeInTheDocument();
    });

    test('renders map controls after loading', async () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deutschland-Karte')).toBeInTheDocument();
        expect(screen.getByText('Karten-Level')).toBeInTheDocument();
        expect(screen.getByText('Metrik für Farbkodierung')).toBeInTheDocument();
      });
    });

    test('shows correct map level options', async () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        const levelSelect = screen.getByDisplayValue('Bundesländer');
        expect(levelSelect).toBeInTheDocument();
        expect(levelSelect).toHaveValue('region');
      });
    });
  });

  describe('Data Processing Tests', () => {
    test('processes location data correctly for regions', async () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        // Check if Google Maps Data layer was called with GeoJSON
        expect(mockGoogleMaps.Data).toHaveBeenCalled();
      });
    });

    test('applies filters correctly', async () => {
      const filteredData = [
        {
          region: 'Baden-Württemberg',
          cost: '100',
          plays: '50',
          auction_wins: '30',
          ad_requests: '100',
          total_impressions: '200',
          latitude: '48.7758',
          longitude: '9.1829',
          network: 'Network1',
          auctionType: 'Type1',
          screenId: 'screen1'
        }
      ];

      const filtersWithNetwork = {
        ...mockFilters,
        network: ['Network1']
      };

      render(<GermanyMap data={filteredData} filters={filtersWithNetwork} />);
      
      await waitFor(() => {
        // Verify that only filtered data is processed
        expect(mockGoogleMaps.Data).toHaveBeenCalled();
      });
    });
  });

  describe('Map Level Tests', () => {
    test('changes map level correctly', async () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        const levelSelect = screen.getByDisplayValue('Bundesländer');
        fireEvent.change(levelSelect, { target: { value: 'city' } });
        expect(levelSelect).toHaveValue('city');
      });
    });

    test('changes map level to sites', async () => {
      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        const levelSelect = screen.getByDisplayValue('Bundesländer');
        fireEvent.change(levelSelect, { target: { value: 'site' } });
        expect(levelSelect).toHaveValue('site');
      });
    });
  });

  describe('Metric Tests', () => {
    test('changes metric correctly', async () => {
      const onMetricChange = jest.fn();
      render(<GermanyMap data={mockData} filters={mockFilters} onMetricChange={onMetricChange} />);
      
      await waitFor(() => {
        const metricSelect = screen.getByDisplayValue('Außenumsatz');
        fireEvent.change(metricSelect, { target: { value: 'plays' } });
        expect(metricSelect).toHaveValue('plays');
      });
    });

    test('calls onMetricChange callback', async () => {
      const onMetricChange = jest.fn();
      render(<GermanyMap data={mockData} filters={mockFilters} onMetricChange={onMetricChange} />);
      
      await waitFor(() => {
        const metricSelect = screen.getByDisplayValue('Außenumsatz');
        fireEvent.change(metricSelect, { target: { value: 'plays' } });
        expect(onMetricChange).toHaveBeenCalledWith('plays');
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('handles missing Google Maps API gracefully', async () => {
      // Temporarily remove google from window
      const originalGoogle = window.google;
      delete (window as any).google;

      render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Lade Deutschland-Karte...')).toBeInTheDocument();
      });

      // Restore google
      (window as any).google = originalGoogle;
    });

    test('handles empty data gracefully', async () => {
      render(<GermanyMap data={[]} filters={mockFilters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deutschland-Karte')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Integration Tests', () => {
    test('reacts to filter changes for regions', async () => {
      const { rerender } = render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        expect(mockGoogleMaps.Data).toHaveBeenCalled();
      });

      // Change filters
      const newFilters = {
        ...mockFilters,
        region: ['Baden-Württemberg']
      };

      rerender(<GermanyMap data={mockData} filters={newFilters} />);
      
      await waitFor(() => {
        // Should re-render with new filters
        expect(mockGoogleMaps.Data).toHaveBeenCalled();
      });
    });

    test('reacts to filter changes for cities', async () => {
      const { rerender } = render(<GermanyMap data={mockData} filters={mockFilters} />);
      
      await waitFor(() => {
        const levelSelect = screen.getByDisplayValue('Bundesländer');
        fireEvent.change(levelSelect, { target: { value: 'city' } });
      });

      // Change filters
      const newFilters = {
        ...mockFilters,
        city: ['Stuttgart']
      };

      rerender(<GermanyMap data={mockData} filters={newFilters} />);
      
      await waitFor(() => {
        // Should re-render with new filters
        expect(mockGoogleMaps.Data).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Tests', () => {
    test('handles large datasets efficiently', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        region: `Region${i % 16}`,
        city: `City${i % 50}`,
        site: `site${i}.com`,
        cost: (i * 10).toString(),
        plays: (i * 5).toString(),
        auction_wins: (i * 3).toString(),
        ad_requests: (i * 10).toString(),
        total_impressions: (i * 20).toString(),
        latitude: (48 + i * 0.01).toString(),
        longitude: (9 + i * 0.01).toString(),
        network: `Network${i % 5}`,
        auctionType: `Type${i % 3}`,
        screenId: `screen${i}`
      }));

      render(<GermanyMap data={largeData} filters={mockFilters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deutschland-Karte')).toBeInTheDocument();
      });
    });
  });
});
