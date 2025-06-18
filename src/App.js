import React, { useState, useEffect, Fragment } from 'react';
import { Calendar, Clock, Droplet, Zap, Scissors, Heart, ChevronLeft, ChevronRight, Syringe, Waves, Bell, Star } from 'lucide-react';

// Main App Component
const HairTreatmentApp = () => {
  // --- STATE MANAGEMENT ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [showPRPNotification, setShowPRPNotification] = useState(null);

  // --- DATE & SCHEDULE CONSTANTS ---
  const startDate = new Date(2025, 5, 23); // June 23, 2025
  const endDate = new Date(2026, 5, 23);   // June 23, 2026

  // Hardcoded PRP Dates
  const prpDates = [
    new Date(2025, 7, 2),  // August 2, 2025
    new Date(2025, 8, 6),  // September 6, 2025
    new Date(2025, 9, 11), // October 11, 2025
    new Date(2026, 2, 14), // March 14, 2026
  ];
  
  // --- HOOKS ---
  // Effect to update the current date every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Effect to check for upcoming PRP appointments
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const upcomingPRP = prpDates.find(prpDate => {
      const timeDiff = prpDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff > 0 && daysDiff <= 14;
    });

    setShowPRPNotification(upcomingPRP || null);
  }, [currentDate]);


  // --- CORE LOGIC: GET TREATMENTS FOR A GIVEN DATE ---
  const getTreatments = (date) => {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const treatments = {
      morning: [],
      midday: [],
      evening: [],
    };

    // Helper to check if a date is a PRP day
    const isPRPDay = prpDates.some(prpDate => prpDate.toDateString() === date.toDateString());
    
    // Helper to check if it's a PRP week (for skipping microneedling)
    const isPRPWeek = prpDates.some(prpDate => {
        const weekStart = new Date(prpDate);
        weekStart.setDate(prpDate.getDate() - prpDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return date >= weekStart && date <= weekEnd;
    });

    // --- PRP DAY OVERRIDE ---
    if (isPRPDay) {
        treatments.morning.push({ name: 'PRP Treatment', icon: Syringe, color: 'text-purple-400' });
        treatments.evening.push({ name: 'Gentle Care & Rest', icon: Heart, color: 'text-pink-400' });
        return treatments;
    }

    // --- DAILY SCHEDULE LOGIC ---
    
    // Morning (Default)
    if (dayOfWeek !== 6) { // No minoxidil on Saturday morning
        treatments.morning.push({ name: 'Minoxidil', icon: Droplet, color: 'text-blue-400' });
    }
    
    // Midday (Red Light Therapy)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon - Fri
        treatments.midday.push({ name: 'Red Light Therapy', icon: Zap, color: 'text-red-400'});
    }

    // Evening (Default)
    if (dayOfWeek !== 6) { // No minoxidil or serum on Saturday evening
        treatments.evening.push({ name: 'Minoxidil', icon: Droplet, color: 'text-blue-400' });
        treatments.evening.push({ name: 'Hair Serum', icon: Star, color: 'text-yellow-400' });
    }

    // Day-specific logic
    switch (dayOfWeek) {
      case 2: // Tuesday
      case 4: // Thursday
        treatments.evening.push({ name: 'RU58841', icon: Droplet, color: 'text-indigo-400' });
        break;
      
      case 3: // Wednesday
        // Special morning routine
        treatments.morning.push({ type: 'divider', text: 'After Gym Session' });
        treatments.morning.push({ name: "Carol's Daughter Shampoo", icon: Waves, color: 'text-teal-400' });
        // Evening
        treatments.evening.push({ name: 'RU58841', icon: Droplet, color: 'text-indigo-400' });
        break;
      
      case 6: // Saturday
        if (!isPRPWeek) {
            treatments.morning.push({ name: 'Nizoral Shampoo', icon: Waves, color: 'text-green-400' });
            treatments.morning.push({ name: 'Microneedling (1.25mm)', icon: Scissors, color: 'text-orange-400' });
        } else {
            treatments.morning.push({ name: 'Rest Day (PRP Week)', icon: Heart, color: 'text-purple-400' });
        }
        // Hair mask on all Saturdays in the evening
        const weeksSinceStart = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
        const hairMask = weeksSinceStart % 2 === 0 ? 'K18 Treatment' : 'Deep Conditioning';
        treatments.evening.push({ name: hairMask, icon: Heart, color: 'text-pink-400' });
        break;
    }

    return treatments;
  };
  
  // --- HELPER FUNCTIONS ---
  const formatDate = (date, options) => date.toLocaleDateString('en-US', options);
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        week.push(day);
    }
    return week;
  };

  // --- NAVIGATION ---
  const navigate = (direction) => {
    const newDate = new Date(selectedDate);
    if (view === 'day') newDate.setDate(selectedDate.getDate() + direction);
    else if (view === 'week') newDate.setDate(selectedDate.getDate() + direction * 7);
    else newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
    setView('day');
  };
  
  // --- RENDER METHODS ---
  const renderCurrentView = () => {
    switch (view) {
      case 'week': return <WeekView />;
      case 'month': return <MonthView />;
      default: return <DayView />;
    }
  };
  
  // --- SUB-COMPONENTS ---

  const PRPNotification = () => {
    if (!showPRPNotification) return null;
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md p-2 mt-2 z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-4 py-2 flex items-center justify-center space-x-2 text-sm shadow-lg">
                <Bell className="text-purple-400 animate-pulse" size={16} />
                <span className="font-semibold">Time to book PRP!</span>
                <span className="text-gray-300">Next session: {formatDate(showPRPNotification, { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
  };

  const DayView = () => {
    const treatments = getTreatments(selectedDate);
    const isToday = selectedDate.toDateString() === currentDate.toDateString();

    const TreatmentItem = ({ treatment }) => (
      <div className="flex items-center space-x-4">
        <treatment.icon className={`${treatment.color} flex-shrink-0`} size={22} />
        <span className="text-lg text-gray-200">{treatment.name}</span>
      </div>
    );
    
    const DividerItem = ({ text }) => (
        <div className="flex items-center text-gray-500 my-3">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-3 text-xs uppercase tracking-widest">{text}</span>
            <div className="flex-grow border-t border-white/10"></div>
        </div>
    );
    
    const renderSection = (title, items) => {
        if (items.length === 0) return null;
        return (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-300 flex items-center"><Clock size={18} className="mr-2"/>{title}</h3>
              <div className="space-y-4 pl-2 border-l-2 border-white/10">
                {items.map((item, index) => {
                    if (item.type === 'divider') {
                        return <DividerItem key={`${title}-divider-${index}`} text={item.text} />;
                    }
                    return <TreatmentItem key={`${title}-${item.name}`} treatment={item} />;
                })}
              </div>
            </div>
        );
    };

    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-white">
            {isToday ? "Today's Schedule" : formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <div className="space-y-8">
            {renderSection('Morning', treatments.morning)}
            {renderSection('Midday', treatments.midday)}
            {renderSection('Evening', treatments.evening)}
        </div>
      </div>
    );
  };
  
  const WeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date) => {
                    const treatments = getTreatments(date);
                    const allTreatments = [...treatments.morning, ...treatments.midday, ...treatments.evening].filter(t => t.type !== 'divider');
                    const isToday = date.toDateString() === currentDate.toDateString();
                    return (
                        <div key={date.toISOString()} onClick={() => { setSelectedDate(date); setView('day'); }} className={`rounded-2xl p-3 cursor-pointer h-32 flex flex-col transition-all duration-300 ${isToday ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                            <div className="text-center font-bold text-sm">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className={`text-center font-semibold mb-2 ${isToday ? 'text-white' : 'text-gray-300'}`}>{date.getDate()}</div>
                            <div className="space-y-1 flex-grow overflow-hidden">
                                {allTreatments.slice(0, 3).map((t, i) => <t.icon key={i} className={t.color} size={16} />)}
                                {allTreatments.length > 3 && <div className="text-xs text-gray-400 mt-1">+{allTreatments.length - 3}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };
  
  const MonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];

    for (let i = firstDay.getDay(); i > 0; i--) {
        dates.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    while (dates.length % 7 !== 0) {
        dates.push({ date: new Date(year, month + 1, dates.length - lastDay.getDate() - firstDay.getDay() + 1), isCurrentMonth: false });
    }
    
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => <div key={index}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {dates.map((item) => {
                    const isToday = item.date.toDateString() === currentDate.toDateString();
                    const hasPRP = prpDates.some(d => d.toDateString() === item.date.toDateString());
                    return (
                        <div key={item.date.toISOString()} onClick={() => { if(item.isCurrentMonth) {setSelectedDate(item.date); setView('day');} }} className={`rounded-lg p-2 h-16 transition-all duration-200 ${item.isCurrentMonth ? 'cursor-pointer hover:bg-white/10' : 'opacity-30'} ${isToday ? 'bg-white/20' : ''}`}>
                            <div className={`font-semibold text-sm ${item.isCurrentMonth ? 'text-white' : 'text-gray-600'}`}>
                                {item.date.getDate()}
                            </div>
                            {hasPRP && item.isCurrentMonth && <Syringe className="text-purple-400 mx-auto" size={14} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };
  

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased p-4 relative">
      <PRPNotification />
      <div className="max-w-3xl mx-auto mt-10 sm:mt-20">
        <header className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold">Hair Schedule</h1>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-1">
                 {['day', 'week', 'month'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${view === v ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
        </header>

        <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><ChevronLeft size={24} /></button>
            <div className="text-center">
                <h2 className="text-xl font-semibold capitalize">
                    {view === 'day' ? formatDate(selectedDate, {month: 'long', year: 'numeric'}) : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={goToToday} className="text-sm text-blue-400 hover:underline">
                    Go to Today
                </button>
            </div>
            <button onClick={() => navigate(1)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><ChevronRight size={24} /></button>
        </div>
        
        <main>
            {renderCurrentView()}
        </main>

        <footer className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
             <h3 className="text-lg font-bold mb-4 text-gray-200">Treatment Legend</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                 <div className="flex items-center space-x-2"><Droplet className="text-blue-400" size={18} /><span className="text-gray-300">Minoxidil</span></div>
                 <div className="flex items-center space-x-2"><Droplet className="text-indigo-400" size={18} /><span className="text-gray-300">RU58841</span></div>
                 <div className="flex items-center space-x-2"><Zap className="text-red-400" size={18} /><span className="text-gray-300">Red Light</span></div>
                 <div className="flex items-center space-x-2"><Scissors className="text-orange-400" size={18} /><span className="text-gray-300">Microneedling</span></div>
                 <div className="flex items-center space-x-2"><Waves className="text-green-400" size={18} /><span className="text-gray-300">Nizoral</span></div>
                 <div className="flex items-center space-x-2"><Waves className="text-teal-400" size={18} /><span className="text-gray-300">Carol's Daughter</span></div>
                 <div className="flex items-center space-x-2"><Heart className="text-pink-400" size={18} /><span className="text-gray-300">Hair Mask</span></div>
                 <div className="flex items-center space-x-2"><Syringe className="text-purple-400" size={18} /><span className="text-gray-300">PRP</span></div>
                 <div className="flex items-center space-x-2"><Star className="text-yellow-400" size={18} /><span className="text-gray-300">Hair Serum</span></div>
             </div>
        </footer>
      </div>
    </div>
  );
};

export default HairTreatmentApp;