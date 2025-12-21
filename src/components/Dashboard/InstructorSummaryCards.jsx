import React, { useState, useEffect } from 'react';
import Widgets from '../ui/Widgets';
import { useAuth } from '../../context/AuthContext';
import { lessonService } from '../../api/services/lessonService';

const InstructorSummaryCards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFlightHours: 0,
    totalGroundHours: 0,
    singleEngineHours: 0,
    multiEngineHours: 0,
  });

  useEffect(() => {
    const fetchInstructorStats = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all lessons for this instructor
        const response = await lessonService.getUserLessons(user.id, {
          type: 'instructor',
          per_page: 1000, // Get all lessons to calculate stats
        });

        if (response.success) {
          const lessons = response.data || [];
          
          // Calculate statistics from lessons
          let totalFlight = 0;
          let totalGround = 0;
          let singleEngine = 0;
          let multiEngine = 0;

          lessons.forEach((lesson) => {
            // Total flight hours (sum of all flight time types)
            // Access from lesson object (API response)
            const flightDual = parseFloat(lesson.flight_dual_hours || 0);
            const flightSolo = parseFloat(lesson.flight_solo_hours || 0);
            const flightCrossCountryDual = parseFloat(lesson.flight_cross_country_dual_hours || 0);
            const flightCrossCountrySolo = parseFloat(lesson.flight_cross_country_solo_hours || 0);
            const flightInstrument = parseFloat(lesson.flight_instrument_hours || 0);
            const flightAtd = parseFloat(lesson.flight_atd_hours || 0);
            const flightNight = parseFloat(lesson.flight_night_hours || 0);
            
            // Calculate total flight hours
            const lessonFlightHours = flightDual + flightSolo + flightCrossCountryDual + 
                          flightCrossCountrySolo + flightInstrument + flightAtd + flightNight;
            
            totalFlight += lessonFlightHours;

            // Ground training hours
            totalGround += parseFloat(lesson.ground_hours || 0);

            // Single Engine vs Multi Engine (based on aircraft category or flight type)
            const aircraftCategory = (lesson.aircraft_category || '').toLowerCase();
            const flightType = (lesson.flight_type || '').toLowerCase();
            
            // Calculate engine-specific hours (only dual, solo, and cross country count)
            const engineHours = flightDual + flightSolo + flightCrossCountryDual + flightCrossCountrySolo;
            
            if (aircraftCategory.includes('multi') || flightType.includes('multi')) {
              multiEngine += engineHours;
            } else {
              // Default: assume single engine if not specified
              singleEngine += engineHours;
            }
          });

          setStats({
            totalFlightHours: Math.round(totalFlight * 10) / 10, // Round to 1 decimal
            totalGroundHours: Math.round(totalGround * 10) / 10,
            singleEngineHours: Math.round(singleEngine * 10) / 10,
            multiEngineHours: Math.round(multiEngine * 10) / 10,
          });
        }
      } catch (error) {
        console.error('Error fetching instructor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorStats();
  }, [user?.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Widgets
        bgColor="#E9F0FC"
        textColor="#1751D0"
        label="Total Flight Hours"
        count={loading ? '...' : stats.totalFlightHours}
        viewLink="#"
      />
      <Widgets
        bgColor="#E6F7E6"
        textColor="#10B981"
        label="Total Ground Training Hours"
        count={loading ? '...' : stats.totalGroundHours}
        viewLink="#"
      />
      <Widgets
        bgColor="#FEE2E2"
        textColor="#EF4444"
        label="Single Engine Hours"
        count={loading ? '...' : stats.singleEngineHours}
        viewLink="#"
      />
      <Widgets
        bgColor="#FFF1DA"
        textColor="#EC980C"
        label="Multi Engine Hours"
        count={loading ? '...' : stats.multiEngineHours}
        viewLink="#"
      />
    </div>
  );
};

export default InstructorSummaryCards;

