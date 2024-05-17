const BookCard = ({ book, setSelectedBook }) => {
    return (
        <div
            onClick={() => {
                console.log("setting book:" + book.volumeInfo.title);
                setSelectedBook(book);
            }}
            className="flex flex-row m-4 max-w-[80vw] hover:cursor-pointer hover:scale-[101%] transition duration-150 ease-in-out"
        >
            <img
                className="md:w-[10vh] w-[5vh] mr-4"
                src={
                    book.volumeInfo.imageLinks
                        ? book.volumeInfo.imageLinks.thumbnail
                        : "https://www.arlanandrews.com/wp-content/uploads/2020/10/book-cover-generic.jpg"
                }
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src =
                        "https://www.arlanandrews.com/wp-content/uploads/2020/10/book-cover-generic.jpg";
                }}
            />
            <div className="text-left overflow-hidden">
                <p className="font-bold md:text-xl text-lg truncate">
                    {book.volumeInfo.title}
                </p>
                {book.volumeInfo.authors && (
                    <p className="truncate text-primary text-ellipsis">
                        {book.volumeInfo.authors.join(", ")}
                    </p>
                )}
                {book.volumeInfo.publishedDate && (
                    <p className="text-primary">
                        {book.volumeInfo.publishedDate}
                    </p>
                )}
            </div>
        </div>
    );
};

export default BookCard;
