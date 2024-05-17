import { FiArrowLeft } from "react-icons/fi";

const SelectedBook = ({
    book,
    setSelectedBook,
    status,
    setStatus,
    setPlaylist,
    generatePlaylist,
    generating,
    setGenerating,
    spotifyApi,
}) => {
    return (
        <>
            <div className="md:w-1/2 w-full m-auto mt-12">
                <button
                    onClick={() => setSelectedBook(null)}
                    className="m-4 text-primary flex flex-row text-xl gap-2 hover:underline transition duration-150 ease-in-out"
                >
                    <FiArrowLeft className="text-2xl" /> Back
                </button>
            </div>
            <div className="flex flex-row mx-auto bg-primary/10 rounded-md p-4 md:w-fit  w-[93vw] max-h-[35vh] mb-4">
                <img
                    className="w-[20vh] h-auto mr-4"
                    src={book.volumeInfo.imageLinks.thumbnail}
                />
                <div className="text-left w-4/5 flex flex-col justify-between">
                    <div>
                        <p className="font-bold md:text-3xl text-md truncate">
                            {book.volumeInfo.title.length > 50
                                ? book.volumeInfo.title.slice(0, 50) + "..."
                                : book.volumeInfo.title}
                        </p>
                        {book.volumeInfo.authors && (
                            <p className="truncate text-primary">
                                {book.volumeInfo.authors.join(", ")}
                            </p>
                        )}
                        {book.volumeInfo.publishedDate && (
                            <p className="text-primary">
                                {book.volumeInfo.publishedDate}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setGenerating(true);
                            generatePlaylist(
                                book,
                                setStatus,
                                setPlaylist,
                                spotifyApi
                            );
                        }}
                        disabled={generating}
                        className={`
                        ${
                            generating
                                ? "bg-primary/15 border-primary/70 border-[1px] cursor-not-allowed w-full"
                                : "bg-accent/75 hover:bg-accent hover:scale-105 w-fit"
                        } rounded-md px-4 py-2 transition duration-150 ease-in-out`}
                    >
                        {generating ? status : "Generate OST"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default SelectedBook;
