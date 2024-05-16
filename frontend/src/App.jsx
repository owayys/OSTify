import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { getTokenfromURL } from "./utils/getTokenfromURL";
import BookSearch from "./components/BookSearch";
import { pipeline, env } from "@xenova/transformers";
import { computeStatistics } from "./utils/trackStatistics";
import { genre_seeds } from "./assets/seedTracks";
import { dotProduct } from "./utils/dotProduct";

env.allowLocalModels = false;

// Create a feature-extraction pipeline
const generateEmbeddings = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
);

const genres = Object.keys(genre_seeds);

const spotifyApi = new SpotifyWebApi();

const getTopTracks = async (book) => {
    let top_track_features = [];

    spotifyApi
        .getMyTopTracks({ limit: 20, time_range: "long_term" })
        .then((response) => {
            spotifyApi
                .getAudioFeaturesForTracks(
                    response.items.map((item) => item.id)
                )
                .then((audioFeatures) => {
                    top_track_features = computeStatistics(
                        audioFeatures.audio_features
                    );
                });
        });

    let data;

    try {
        const response = await fetch(
            `https://openlibrary.org/search.json?q=isbn:${book.volumeInfo.industryIdentifiers[0].identifier}&fields=subject,subject_facet&limit=1`
        );
        data = await response.json();

        if (data.docs.length == 0) {
            try {
                const response = await fetch(
                    `https://openlibrary.org/search.json?q=${book.volumeInfo.title}&author=${book.volumeInfo.authors[0]}&fields=subject,subject_facet&limit=1`
                );
                data = await response.json();
            } catch (error) {
                console.error("Error fetching from OpenLibrary:", error);
            }
        }
    } catch (error) {
        console.error("Error fetching from OpenLibrary:", error);
    }
    if (data.docs.length == 0) {
        console.log("No data found");
        return;
    }

    const book_embedding = await generateEmbeddings(
        `${book.volumeInfo.title} ${book.volumeInfo.authors} ${
            book.volumeInfo.description
        } ${book.volumeInfo.categories.join(" ")} ${data.docs[0].subject.join(
            " "
        )} ${data.docs[0].subject_facet.join(" ")}`,
        {
            pooling: "mean",
            normalize: true,
        }
    );

    let genre_embeddings = {};

    for (const genre of genres) {
        genre_embeddings[genre] = await generateEmbeddings(genre, {
            pooling: "mean",
            normalize: true,
        });
    }

    let genre_scores = {};
    for (const genre in genre_embeddings) {
        genre_scores[genre] = dotProduct(
            book_embedding.data,
            genre_embeddings[genre].data
        );
    }

    const sortedGenreScoresArray = Object.entries(genre_scores)
        // Sort the array by the value (score) in descending order
        .sort((a, b) => b[1] - a[1]);

    // Convert the sorted array back to an object
    const sortedGenreScores = Object.fromEntries(
        sortedGenreScoresArray.slice(0, 3)
    );

    console.log(sortedGenreScores);

    const top_genres = Object.keys(sortedGenreScores);
    let seed_tracks = [];
    for (let i = 0; i < 2; i++) {
        seed_tracks.push(
            genre_seeds[top_genres[0]][
                Math.floor(Math.random() * genre_seeds[top_genres[0]].length)
            ]
        );
    }
    for (let i = 0; i < 2; i++) {
        seed_tracks.push(
            genre_seeds[top_genres[1]][
                Math.floor(Math.random() * genre_seeds[top_genres[1]].length)
            ]
        );
    }
    seed_tracks.push(
        genre_seeds[top_genres[2]][
            Math.floor(Math.random() * genre_seeds[top_genres[2]].length)
        ]
    );

    spotifyApi
        .getRecommendations({
            seed_tracks: seed_tracks,
            target_acousticness: top_track_features.acousticness.mean,
            target_energy: top_track_features.energy.mean,
            target_instrumentalness:
                top_track_features.instrumentalness.mean +
                top_track_features.instrumentalness.standardDeviation / 2,
            target_danceability: top_track_features.danceability.mean,
            target_speechiness:
                top_track_features.speechiness.mean -
                top_track_features.speechiness.standardDeviation / 2,
            target_loudness: top_track_features.loudness.mean,
            target_tempo: top_track_features.tempo.mean,
            target_valence: top_track_features.valence.mean,
        })
        .then((response) => {
            console.log(response);
            spotifyApi.getMe().then((user) => {
                spotifyApi
                    .createPlaylist(user.id, {
                        name: `${book.volumeInfo.title}`,
                        description: `Based on the book ${book.volumeInfo.title}, generated by dokushOST`,
                        public: false,
                    })
                    .then((playlist) => {
                        const uris = response.tracks.map((track) => track.uri);
                        spotifyApi
                            .addTracksToPlaylist(playlist.id, uris)
                            .then(() => {
                                console.log("Tracks added to playlist");
                            });
                    });
            });
        });
};

const fetchNewAccessToken = async (refreshToken) => {
    try {
        const response = await fetch(
            `http://localhost:8080/refresh_token?refresh_token=${refreshToken}`
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
        <div className="bg-background dark:bg-dark-background text-text dark:text-dark-text font-inter min-w-full min-h-full text-center">
            {!loggedIn && (
                <a
                    href="http://localhost:8080/login"
                    className="bg-[#1DB954] p-8 rounded-full"
                >
                    Login to Spotify
                </a>
            )}
            {loggedIn && (
                // <button onClick={getRecentTracks}>Get Recent Tracks</button>
                <>
                    <h1 className="text-4xl font-bold">
                        dokush
                        <span className="text-accent dark:text-dark-accent">
                            ost
                        </span>
                    </h1>
                    {!selectedBook && (
                        <BookSearch setSelectedBook={setSelectedBook} />
                    )}
                    {selectedBook && (
                        <div>
                            <button
                                onClick={() => {
                                    console.log(selectedBook.volumeInfo);
                                    getTopTracks(selectedBook);
                                }}
                            >
                                get top
                            </button>
                            <span>{selectedBook.author_name}</span>
                            <span>{selectedBook.subject}</span>
                            <span>{selectedBook.subject_facet}</span>
                            <span>{selectedBook.first_sentence}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
