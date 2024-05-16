// Function to compute mean of an array
const mean = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;

// Function to compute median of an array
const median = (arr) => {
    const sortedArr = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    if (sortedArr.length % 2 === 0) {
        return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
    } else {
        return sortedArr[mid];
    }
};

// Function to compute standard deviation of an array
const standardDeviation = (arr) => {
    const avg = mean(arr);
    const variance =
        arr.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

const filterObjects = (array, featuresToKeep) => {
    return array.map((object) => {
        const filteredObject = {};
        featuresToKeep.forEach((feature) => {
            if (feature in object) {
                filteredObject[feature] = object[feature];
            }
        });
        return filteredObject;
    });
};

// Define the subset of features to keep
const featuresToKeep = [
    "acousticness",
    "danceability",
    "duration_ms",
    "energy",
    "instrumentalness",
    "liveness",
    "loudness",
    "speechiness",
    "tempo",
    "valence",
];

// Function to compute statistics for each property
export const computeStatistics = (properties) => {
    const statistics = {};
    const track_properties = filterObjects(properties, featuresToKeep);
    for (const property in track_properties[0]) {
        const values = track_properties.map((track) => track[property]);
        statistics[property] = {
            mean: mean(values),
            median: median(values),
            standardDeviation: standardDeviation(values),
        };
    }
    return statistics;
};
