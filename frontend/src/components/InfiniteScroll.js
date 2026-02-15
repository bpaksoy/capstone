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
        // Add artificial delay for smoother UX on infinite scroll
        if (page > 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
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
            loader={
                <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
                </div>
            }
            endMessage={<div className="text-center py-4 text-gray-500">No more colleges to show</div>}
        >
            {items.map(renderItem)}
            {error && <div>Error: {error.message}</div>}
        </InfiniteScroll>
    );
};

export default InfiniteScrollScreen;