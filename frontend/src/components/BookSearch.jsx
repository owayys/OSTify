import { useState } from "react";
import BookCard from "./BookCard";
import { FiSend } from "react-icons/fi";
import { AiOutlineLoading } from "react-icons/ai";

const BookSearch = ({ setSelectedBook }) => {
    const [query, setQuery] = useState("");
    const [books, setBooks] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${query}&limit=5`
            );
            const data = await response.json();
            console.log(data.items);
            setBooks(data.items);
            setQuery("");
            setSearching(false);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    return (
        <div className="w-full flex align-middle justify-center my-[2vh] transition duration-150 ease-in-out">
            <div className=" rounded-md bg-primary/10 flex-col">
                <div className="items-center flex flex-row p-4">
                    <input
                        className="md:w-[60vw] w-[80vw] peer outline-none bg-primary/0 placeholder-primary/50"
                        type="text"
                        value={query}
                        disabled={searching}
                        onChange={(e) => setQuery(e.target.value)}
                        onSubmit={handleSearch}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch();
                                setSearching(true);
                            }
                        }}
                        placeholder="Search books..."
                    />
                    {searching ? (
                        <AiOutlineLoading className="text-primary animate-spin text-xl" />
                    ) : (
                        <FiSend
                            className={`${
                                query ? "" : "rotate-45"
                            } text-xl transition duration-200 ease-in-out text-primary`}
                            onClick={searching ? "" : handleSearch}
                        />
                    )}
                    {/* <div className="" onClick={handleSearch}></div> */}
                    {/* <button
                    className="rounded-r-full p-4 bg-accent/75 hover:bg-accent transition duration-15 ease-in-out peer-focus:rounded-r-md"
                    onClick={handleSearch}
                >
                    go!
                </button> */}
                </div>
                <div className="max-h-[80vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-primary scrollbar-track-primary/0">
                    {books?.map(
                        (book, i) =>
                            book && (
                                <span key={i}>
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        setSelectedBook={setSelectedBook}
                                    />

                                    {i < books.length - 1 ? (
                                        <hr className="m-4 border-primary/25 border-y-1"></hr>
                                    ) : null}
                                </span>
                            )
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookSearch;
