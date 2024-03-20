import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function Events() {
  const [events, setEvents] = useState([]);
  const [searchParams] = useSearchParams();

  const profileId = searchParams.get("profileId");

  useEffect(() => {
    if (profileId) {
      const eventSource = new EventSource(`http://localhost:3000/api/events?profileId=${profileId}`);

      eventSource.onmessage = function (event) {
        const newEvent = JSON.parse(event.data);
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      };

      return () => {
        eventSource.close();
      };
    }
  }, [profileId]);

  return (
    <div className="">
      <header className="App-header">
        <h1>Received events:</h1>
        <ul>
          {events.map((event, index) => (
            <li key={index}>{event.message}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default Events;
