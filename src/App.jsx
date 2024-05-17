import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { getTokenfromURL } from "./utils/getTokenfromURL";
import BookSearch from "./components/BookSearch";
import "./index.css";
import SelectedBook from "./components/SelectedBook";
import { Spotify } from "react-spotify-embed";
import { generateFlow } from "./utils/generateFlow";

const spotifyApi = new SpotifyWebApi();

const fetchNewAccessToken = async (refreshToken) => {
    try {
        const response = await fetch(
            `https://nervous-clam-drawers.cyclic.app/refresh_token?refresh_token=${refreshToken}`
        );
        const data = await response.json();
        const tokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided, else retain old one
            expires_in: 3600, // set to 3600 seconds
            timestamp: new Date().getTime(),
        };
        localStorage.setItem("tokens", JSON.stringify(tokens));
        return tokens;
    } catch (error) {
        console.error("Error fetching new access token:", error);
    }
};

function App() {
    const [accessToken, setAccessToken] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState("");
    const [playlist, setPlaylist] = useState(null);

    useEffect(() => {
        // Function to get access token from localStorage
        const getStoredToken = async () => {
            const storedTokens = localStorage.getItem("tokens");
            if (storedTokens) {
                const tokens = JSON.parse(storedTokens);
                const currentTime = new Date().getTime();
                const expiryTime = tokens.timestamp + tokens.expires_in * 1000;
                if (currentTime > expiryTime) {
                    // Token has expired, refresh it
                    const newTokens = await fetchNewAccessToken(
                        tokens.refresh_token
                    );
                    setAccessToken(newTokens.access_token);
                    spotifyApi.setAccessToken(newTokens.access_token);
                } else {
                    // Token is still valid
                    setAccessToken(tokens.access_token);
                    spotifyApi.setAccessToken(tokens.access_token);
                }
                setLoggedIn(true);
            }
        };

        // Check if there is a token in the URL
        const tokens = getTokenfromURL();
        if (tokens.access_token) {
            // If token is in URL, store it in localStorage
            const timestamp = new Date().getTime();
            const newTokens = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: 3600, // set to 3600 seconds
                timestamp,
            };
            setAccessToken(tokens.access_token);
            spotifyApi.setAccessToken(tokens.access_token);
            setLoggedIn(true);
            localStorage.setItem("tokens", JSON.stringify(newTokens));
            window.location.hash = ""; // Clear URL
        } else {
            // If no token in URL, try to get it from localStorage
            getStoredToken();
        }
    }, []);

    return (
        <div className="bg-background text-text font-inter min-w-full min-h-full">
            <h1 className="text-4xl text-text font-semibold py-2 md:px-12 px-4">
                <a href="/">
                    <span className="color-effect">ost</span>
                    ify
                </a>
            </h1>
            <hr className="border-primary/15 border-y-1"></hr>
            {!loggedIn && (
                <div className="w-full flex text-center">
                    <a
                        href="https://nervous-clam-drawers.cyclic.app/login"
                        className="bg-[#1DB954] p-4 rounded-md m-auto my-12"
                    >
                        Login to Spotify
                    </a>
                </div>
            )}
            {loggedIn && (
                // <button onClick={getRecentTracks}>Get Recent Tracks</button>
                <>
                    {!selectedBook && (
                        <BookSearch setSelectedBook={setSelectedBook} />
                    )}
                    {selectedBook && (
                        <SelectedBook
                            book={selectedBook}
                            setSelectedBook={setSelectedBook}
                            status={status}
                            setStatus={setStatus}
                            setPlaylist={setPlaylist}
                            generatePlaylist={generateFlow}
                            generating={generating}
                            setGenerating={setGenerating}
                            spotifyApi={spotifyApi}
                        />
                    )}
                    {playlist && (
                        <Spotify
                            className="m-auto md:w-1/3 w-[93vw]"
                            link={playlist.external_urls.spotify}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;
