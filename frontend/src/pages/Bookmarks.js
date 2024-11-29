import React, { useEffect, useState } from 'react';
import InfiniteScroll from '../components/InfiniteScroll';
import College from '../components/College';
import axios from 'axios';
import { baseUrl } from '../shared';


function Bookmarks() {
  const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
  //console.log("Bookmarked Colleges", bookmarkedColleges);

  useEffect(() => {
    const fetchBookmarkedColleges = async () => {
      try {
        const response = await axios.get(`${baseUrl}api/bookmarks`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access')}`,
          },
        });
        //console.log("response", response)
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        const data = await response.data;
        //console.log("Bookmarked Colleges", data);
        setBookmarkedColleges(data);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    };

    fetchBookmarkedColleges();
  }, [bookmarkedColleges]);



  return (
    <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div>Bookmarks</div>
      <InfiniteScroll />
      <div className="flex flex-wrap justify-center">

        {bookmarkedColleges.map((college) => {
          const name = college["name"];
          const city = college["city"];
          const state = college["state"];
          const cost_of_attendance = college["cost_of_attendance"]
          const acceptance_rate = college["admission_rate"]
          const average_sat = college["sat_score"]

          return (
            <College
              key={college.id}
              id={college.id}
              name={name}
              city={city}
              state={state}
              acceptance_rate={acceptance_rate}
              average_sat={average_sat}
              cost_of_attendance={cost_of_attendance}
              img={college.img}
            />
          );
        })}
      </div>
    </div >);
}

export default Bookmarks;