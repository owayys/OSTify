import { useEffect, useState } from "react";
import BookCard from "./BookCard";

const BookSearch = ({ setSelectedBook }) => {
    const [query, setQuery] = useState("");
    const [books, setBooks] = useState([]);

    // console.log(props);

    const handleSearch = async () => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${query}&limit=5`
            );
            const data = await response.json();
            console.log(data.items);
            setBooks(data.items);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search books..."
            />
            <button onClick={handleSearch}>Search</button>
            <div>
                {books?.map(
                    (book) =>
                        book && (
                            <BookCard
                                key={book.id}
                                book={book}
                                setSelectedBook={setSelectedBook}
                            />
                        )
                )}
            </div>
        </div>
    );
};

export default BookSearch;
