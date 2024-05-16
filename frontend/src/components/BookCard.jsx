import { useEffect, useState } from "react";

const BookCard = ({ book, setSelectedBook }) => {
    const [bookCover, setBookCover] = useState(
        book.volumeInfo.imageLinks.thumbnail
    );

    // useEffect(() => {
    //     const isbn = book?.isbn?.filter((isbn) => {
    //         // Check if the ISBN is 13 digits long and starts with 978 or 979
    //         return (
    //             isbn.length === 13 &&
    //             (isbn.startsWith("978") || isbn.startsWith("979"))
    //         );
    //     })[0];

    //     const apiUrl = `http://bookcover.longitood.com/bookcover/${isbn}`;

    //     // Make a request to the API endpoint
    //     fetch(apiUrl)
    //         .then((response) => response.json())
    //         .then((data) => {
    //             // Check if a cover is found
    //             if (data.url) {
    //                 // Once cover is found, break out of the loop
    //                 setBookCover(data.url);
    //             }
    //         })
    //         .catch((err) => {
    //             const mute = err;
    //         });
    // });

    return (
        <div
            onClick={() => {
                console.log("setting book:" + book.volumeInfo.title);
                setSelectedBook(book);
            }}
            className="bg-primary/30 dark:bg-dark-primary/30 flex flex-row p-4 m-4 rounded-md"
        >
            <img
                className="w-1/5 h-auto mr-4"
                src={book.volumeInfo.imageLinks.thumbnail}
            />
            <div className="text-left w-4/5">
                <span className="font-bold text-large">
                    {book.volumeInfo.title}
                </span>
                {book.volumeInfo.authors && (
                    <p className="truncate">
                        {book.volumeInfo.authors.join(", ")}
                    </p>
                )}
                <p>{book.volumeInfo.publishedDate}</p>
                {/* {book.subject && <p>Description: {book.subject}</p>} */}
            </div>
        </div>
    );
};

export default BookCard;
