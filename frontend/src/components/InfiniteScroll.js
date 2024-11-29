import React, { useState, useEffect, useRef } from "react";
import { baseUrl } from "../shared";

const InfiniteScroll = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);

    const observer = useRef(null);

    useEffect(() => {
        // Initialize observer for infinite scroll
        const options = {
            root: null,
            rootMargin: "20px",
            threshold: 1.0,
        };

        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(handleObserver, options);

        if (observer.current) {
            observer.current.observe(document.querySelector(".scroll-container"));
        }

        return () => observer.current.disconnect();
    }, []); // Runs only once when component mounts

    // Fetch data for each page
    useEffect(() => {
        if (pageNumber > 1) {
            setIsLoading(true);
            fetchItems();
        }
    }, [pageNumber]);

    // Fetch items based on pageNumber
    const fetchItems = async () => {
        try {
            // Replace with your actual API call
            const response = await fetch(
                `${baseUrl}api/colleges/?page=${pageNumber}`
            );
            const data = await response.json();
            //console.log("Infinite scroll data:", data.colleges);

            // Update items state
            setItems((prevItems) => [...prevItems, ...data.colleges]);

            // Check if there are more items to load
            setHasMore(data.colleges.length > 0);

            setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    // Callback for IntersectionObserver
    const handleObserver = (entries) => {
        if (entries[0].isIntersecting && hasMore) {
            setPageNumber((prevPageNumber) => prevPageNumber + 1);
        }
    };

    return (
        <div className="scroll-container">
            {/* Display items */}
            {items.map((item, index) => (
                <div key={index}>{item.name}</div>
            ))}
            <p>Data</p>

            {/* Display loading spinner */}
            {isLoading && <div>Loading...</div>}
        </div>
    );
};

export default InfiniteScroll;