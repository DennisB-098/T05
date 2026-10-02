import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// List the files explicitly because a browser cannot discover files in a folder.
const CSV_FILES = [
    "Ex5_ARE_Spot_Prices.csv",
    "Ex5_TV_energy.csv",
    "Ex5_TV_energy_55inchtv_byScreenType.csv",
    "Ex5_TV_energy_Allsizes_byScreenType.csv",
];

export async function loadAllCsvData() {
    // Fetch all CSVs at once; D3 turns each row into an object keyed by its header.
    const entries = await Promise.all(
        CSV_FILES.map(async (filename) => {
            const rows = await d3.csv(
                new URL(`./data/${filename}`, import.meta.url),
                // Convert numeric-looking cells to numbers so charts can use them directly.
                d3.autoType,
            );
            // Use the filename (without .csv) as the key for this file's rows.
            return [filename.replace(/\.csv$/i, ""), rows];
        }),
    );

    return Object.fromEntries(entries);
}

export const csvDataReady = loadAllCsvData();

// Keep the data available to other modules and announce when every file has loaded.
csvDataReady.then((data) => {
    window.csvData = data;
    window.dispatchEvent(new CustomEvent("csvdataready", { detail: data }));
}).catch((error) => {
    console.error("Failed to load CSV data:", error);
});