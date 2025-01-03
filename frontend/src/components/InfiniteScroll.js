import React, { useState, useEffect } from 'react';
import InfiniteScroll from "react-infinite-scroll-component";

const InfiniteScrollScreen = ({ fetchColleges, renderItem }) => {
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        // Initial fetch
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await fetchColleges(page);
            if (!result || !result.colleges) {
                throw new Error(`Invalid API response for page ${page}`);
            }
            setItems(prevItems => page === 1 ? result.colleges : [...prevItems, ...result.colleges]);
            setHasMore(result.hasMore);
            setPage(page + 1);
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = (error) => {
        setError(error);
        setHasMore(false);
        console.error("Error fetching data:", error);
    };

    return (
        <InfiniteScroll
            dataLength={items.length}
            next={fetchData}
            hasMore={hasMore}
            loader={<div>Loading...</div>}
            endMessage={<div>No more colleges to show</div>}
        >
            {items.map(renderItem)}
            {error && <div>Error: {error.message}</div>}
        </InfiniteScroll>
    );
};

export default InfiniteScrollScreen;