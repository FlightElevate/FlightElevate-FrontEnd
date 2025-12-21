import React from 'react';
import Widgets from '../ui/Widgets';

const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Widgets
        bgColor="#E9F0FC"
        textColor="#1751D0"
        label="Total Flights"
        count={76}
        viewLink="#"
      />
      <Widgets
        bgColor="#E6F7E6"
        textColor="#10B981"
        label="Upcoming Bookings"
        count={12}
        viewLink="#"
      />
      <Widgets
        bgColor="#FEE2E2"
        textColor="#EF4444"
        label="Aircraft In Use"
        count={4}
        viewLink="#"
      />
      <Widgets
        bgColor="#FFF1DA"
        textColor="#EC980C"
        label="Payments Today"
        count="$1,520"
        viewLink="#"
      />
    </div>
  );
};

export default SummaryCards;
