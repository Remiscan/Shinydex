<?php

/**
 * PHP Script to parse Pokémon evolution chain JSON files and extract parent-child relationships.
 * * The script iterates over all JSON files in the specified directory, assuming they follow
 * the PokeAPI evolution chain format.
 * * The output is an array of arrays, where each inner array contains one key-value pair:
 * [$idEvolvedPokemon => $idPokemonThatEvolvesIntoIt]
 */

// --- Configuration ---
// Set the directory where your JSON files are located.
$json_directory = __DIR__.'/data/';

// The final array to store all evolution pairs.
$all_evolution_pairs = [];

// --- Helper Functions ---

/**
 * Extracts the numerical ID from a PokeAPI species URL.
 * e.g., "https://pokeapi.co/api/v2/pokemon-species/1/" -> 1
 *
 * @param string $url The species URL.
 * @return int|null The extracted ID or null if parsing fails.
 */
function getIdFromUrl(string $url): ?string {
    // Remove the trailing slash, then extract the last segment.
    $parts = explode('/', rtrim($url, '/'));
    $id = end($parts);
    
    // Ensure the ID is a valid integer.
    return is_numeric($id) ? (string) $id : null;
}

/**
 * Recursively traverses the evolution chain structure to extract all parent-child pairs.
 *
 * @param array $chain_node The current node in the evolution chain (e.g., $data['chain'] or evolves_to item).
 * @param int $parent_id The ID of the Pokémon that evolves (the current chain node's species ID).
 * @param array &$evolution_pairs The array to store the results (passed by reference).
 * @return void
 */
function extractEvolutions(array $chain_node, int $parent_id, array &$evolution_pairs): void {
    
    // Check if there are any evolutions from this species.
    if (isset($chain_node['evolves_to']) && is_array($chain_node['evolves_to'])) {
        
        foreach ($chain_node['evolves_to'] as $evolves_to_item) {
            
            // 1. Get the evolved Pokemon's ID (the child ID).
            $evolved_url = $evolves_to_item['species']['url'] ?? null;
            $evolved_id = $evolved_url ? getIdFromUrl($evolved_url) : null;

            if ($evolved_id !== null) {
                // 2. Add the relationship to the result array in the requested format: [[child_id => parent_id]]
                $evolution_pairs[] = ["$evolved_id" => "$parent_id"];

                // 3. Recurse into the next level, where the current evolved_id becomes the new parent_id.
                extractEvolutions($evolves_to_item, $evolved_id, $evolution_pairs);
            }
        }
    }
}

// --- Main Script Execution ---

echo "--- Starting Evolution Chain Parsing ---\n";

$processed_count = 0;

try {
    // Initialize the DirectoryIterator
    $iterator = new DirectoryIterator($json_directory);
} catch (Exception $e) {
    // Handle case where directory doesn't exist or is inaccessible
    die("Error: Could not open directory '{$json_directory}': " . $e->getMessage() . "\n");
}

$ordered_files = [];

foreach ($iterator as $fileinfo) {
    // Filter: Skip current/parent directory references, directories, and non-json files
    if ($fileinfo->isDot() || !$fileinfo->isFile() || $fileinfo->getExtension() !== 'json') {
        continue;
    }

    $ordered_files[] = $fileinfo;
}

foreach ($iterator as $fileinfo) {
    // Filter: Skip current/parent directory references, directories, and non-json files
    if ($fileinfo->isDot() || !$fileinfo->isFile() || $fileinfo->getExtension() !== 'json') {
        continue;
    }
    
    $filepath = $fileinfo->getRealPath();
    $filename = $fileinfo->getFilename();
    
    echo "Processing file: " . $filename . "\n";
    
    // 1. Read the file content
    $json_content = file_get_contents($filepath);
    
    if ($json_content === false) {
        echo "Warning: Could not read file content for " . $filename . ". Skipping.\n";
        continue;
    }

    // 2. Decode the JSON into a PHP associative array
    $data = json_decode($json_content, true);
    
    if ($data === null) {
        echo "Warning: Invalid JSON format in " . $filename . ". Skipping.\n";
        continue;
    }
    
    // 3. Validate the main evolution chain structure
    if (
        !isset($data['chain']['species']['url']) || 
        !isset($data['chain']['evolves_to']) || 
        !is_array($data['chain']['evolves_to'])
    ) {
        echo "Warning: File " . $filename . " does not contain the expected 'chain' structure. Skipping.\n";
        continue;
    }

    // 4. Get the ID of the base/root Pokémon in the chain (the initial parent)
    $base_id = getIdFromUrl($data['chain']['species']['url']);

    if ($base_id === null) {
        echo "Warning: Could not determine base species ID for " . $filename . ". Skipping.\n";
        continue;
    }
    
    // 5. Start the recursive extraction process
    extractEvolutions($data['chain'], $base_id, $all_evolution_pairs);
    
    $processed_count++;
}

echo "--- Parsing Complete ---\n\n";

if ($processed_count === 0) {
    echo "Note: No JSON files meeting the criteria were processed in the directory: " . $json_directory . "\n\n";
} else {
    echo "Successfully processed " . $processed_count . " JSON files.\n\n";
}


usort($all_evolution_pairs, function($a, $b) {
    // Get the Evolved ID (the key) for comparison
    $evolved_id_a = key($a);
    $evolved_id_b = key($b);
    
    // Primary sort: by Evolved ID
    if ($evolved_id_a !== $evolved_id_b) {
        return $evolved_id_a <=> $evolved_id_b;
    }

    // Secondary sort: by Pre-Evolved ID (the value) if Evolved IDs are the same
    $pre_evolved_id_a = current($a);
    $pre_evolved_id_b = current($b);

    return $pre_evolved_id_a <=> $pre_evolved_id_b;
});


// --- Grouping Logic ---

$grouped_evolutions = [];

foreach ($all_evolution_pairs as $evolution_pair) {
    // Get the full key (e.g., "2" or "3:alolan")
    $evolved_id_key = key($evolution_pair); 

    // Extract the numerical Pokedex ID part for the grouping key (e.g., just "2" or "3")
    $parts = explode(':', $evolved_id_key);
    $grouping_key = $parts[0] ?? $evolved_id_key;

    // Ensure integer keys are used for numerical IDs
    $grouping_key = is_numeric($grouping_key) ? (int)$grouping_key : $grouping_key;

    // Append the original pair to the group under the extracted key
    $grouped_evolutions[$grouping_key][] = $evolution_pair;
}



// --- Output the final result ---

file_put_contents(__DIR__.'/array.json', json_encode($grouped_evolutions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// Example output based on 1.json (Bulbasaur -> Ivysaur -> Venusaur):
// Array
// (
//     [0] => Array
//         (
//             [2] => 1  // Ivysaur (2) evolves from Bulbasaur (1)
//         )
// 
//     [1] => Array
//         (
//             [3] => 2  // Venusaur (3) evolves from Ivysaur (2)
//         )
// 
//     // ... other pairs from other files ...
// )