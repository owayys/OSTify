import { pipeline, env } from "@xenova/transformers";
import { computeStatistics } from "./trackStatistics";
import { dotProduct } from "./dotProduct";
import { genre_seeds } from "../assets/seedTracks";
env.allowLocalModels = false;

export const generateFlow = async (
    book,
    setStatus,
    setPlaylist,
    spotifyApi
) => {
    setStatus("Fetching model...");

    const generateEmbeddings = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
    );

    setStatus("Analyzing your taste...");

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

    setStatus("Analyzing the book...");

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

    const genres = Object.keys(genre_seeds);

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
    console.log(top_genres);
    let seed_tracks = [];
    for (let i = 0; i < 3; i++) {
        seed_tracks.push(
            genre_seeds[top_genres[0]][
                Math.floor(Math.random() * genre_seeds[top_genres[0]].length)
            ]
        );
    }
    seed_tracks.push(
        genre_seeds[top_genres[1]][
            Math.floor(Math.random() * genre_seeds[top_genres[1]].length)
        ]
    );
    seed_tracks.push(
        genre_seeds[top_genres[2]][
            Math.floor(Math.random() * genre_seeds[top_genres[2]].length)
        ]
    );

    setStatus("Generating playlist...");

    console.log(top_track_features);

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
                        description: `Based on the book ${book.volumeInfo.title}, generated by ostify`,
                        public: false,
                    })
                    .then((playlist) => {
                        const uris = response.tracks.map((track) => track.uri);
                        spotifyApi
                            .addTracksToPlaylist(playlist.id, uris)
                            .then(() => {
                                console.log(playlist);
                                setStatus("Playlist generated!");
                                setPlaylist(playlist);
                            });
                    });
            });
        });
};
