import { GoogleGenAI, Type } from "@google/genai";
import { WorldState } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const worldStateSchema = {
    type: Type.OBJECT,
    properties: {
        threads: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'Thread-1' or 'Thread-OPT-1' for optional threads." },
                    goal: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A clear, actionable summary of the overall goal of this thread. It should explain the thread's importance and hint at the first logical step." },
                    location: { type: Type.STRING, description: "ID of associated Location" },
                    npcs: { type: Type.ARRAY, items: { type: Type.STRING, description: "Array of associated NPC IDs" } }
                },
                required: ["id", "goal", "description"]
            }
        },
        npcs: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'NPC-1' or 'NPC-OPT-1' for optional NPCs." },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Visuals and demeanor. Include details about their immediate actions and any notable gear they possess. Provide descriptors about their personality." },
                    disposition: { type: Type.STRING },
                    motivation: { type: Type.STRING, description: "Be explicit about what this NPC wants to achieve, both in the short term (within the scene) and long term (in the adventure). Insert relationships with relevant NPC (allies and/or enemies)" },
                    secrets: { type: Type.STRING },
                    statBlockSuggestion: { type: Type.STRING, description: "e.g., 'Spitalian Preservist (Katharsys p. 112)'" }
                },
                required: ["id", "name", "description", "disposition", "motivation", "secrets"]
            }
        },
        adventureFeatures: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'AF-1'" },
                    feature: { type: Type.STRING, description: "which is anything special or unique that is part of this published Adventure that could form an encounter" },
                    description: { type: Type.STRING }
                },
                required: ["id", "feature", "description"]
            }
        },
        scenes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'SCENE-01' or 'SCENE-OPT-1' for optional scenes." },
                    title: { type: Type.STRING },
                    locationId: { type: Type.STRING, description: "The ID of the Location where this scene takes place. This is a mandatory link. Every scene MUST have a locationId." },
                    setup: { type: Type.STRING, description: "Detailed, immersive setup. For scenes after the first, it MUST begin by explaining how the characters arrived, referencing the specific clue from the previous scene. It must establish the immediate situation, the player's objective, and any critical starting information. Integrate key NPC dialogue or actions from the source text to guide the player." },
                    obstacles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mechanics: { type: Type.ARRAY, items: { type: Type.STRING, description: "e.g., 'Tech (Ego + Intellect) to bypass console'" } },
                    milestones: { type: Type.ARRAY, items: { type: Type.STRING, description: "A list of specific, concrete objectives. If a milestone provides a clue to another scene, it MUST explicitly state this connection. E.g., 'By hacking the console, you find a hidden log file with coordinates to a Scrapper hideout (leads to SCENE-02)'." } },
                    encounters: {
                        type: Type.ARRAY,
                        description: "A list of specific, pre-defined encounters that can occur within this scene, extracted directly from the adventure text. These can be combat, social, or environmental.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "A concise name for the encounter, e.g., 'Ganger Ambush'." },
                                trigger: { type: Type.STRING, description: "The specific condition that causes this encounter to occur, e.g., 'Opening the crate in the corner'." },
                                description: { type: Type.STRING, description: "A detailed description of the encounter, including enemy placement, tactics, potential dialogue, and the immediate situation." },
                                statBlockSuggestions: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "Array of stat block suggestions for any enemies involved, e.g., '3x Scrapper Gangers (Primal Punk p. 250)'"
                                }
                            },
                            required: ["name", "trigger", "description"]
                        }
                    },
                    associatedNpcs: { type: Type.ARRAY, items: { type: Type.STRING, description: "Array of NPC IDs in this scene." } },
                    associatedThreads: { type: Type.ARRAY, items: { type: Type.STRING, description: "Array of Thread IDs in this scene." } },
                    enemyProfile: { type: Type.STRING },
                    branching: {
                        type: Type.ARRAY,
                        description: "An array of objects linking a milestone to the next Scene ID.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                milestone: { type: Type.STRING, description: "The EXACT milestone that triggers the branch."},
                                nextSceneId: { type: Type.STRING, description: "The ID of the scene to branch to."}
                            },
                            required: ["milestone", "nextSceneId"]
                        }
                    }
                },
                required: ["id", "title", "locationId", "setup", "obstacles", "mechanics", "milestones", "encounters", "associatedNpcs", "associatedThreads", "branching"]
            }
        },
        locations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'LOC-01' or 'LOC-OPT-1' for optional locations." },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A functional and atmospheric description. Mention key features, potential points of interaction, and any obvious, immediately visible entry or exit points." },
                    tone: { type: Type.STRING, description: "Atmosphere of the location, e.g., 'Desperate, primal, and decaying'" },
                    associatedNpcs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    associatedThreads: { type: Type.ARRAY, items: { type: Type.STRING } },
                    secrets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    links: {
                        type: Type.ARRAY,
                        description: "An array of objects describing exits to other locations. The description MUST be informative, e.g., 'A rusted service hatch that leads to the lower maintenance tunnels (LOC-02)'",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING, description: "The description of the exit, e.g., 'Rusted door North'"},
                                locationId: { type: Type.STRING, description: "The ID of the location this exit leads to."}
                            },
                            required: ["description", "locationId"]
                        }
                    },
                    sublocations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                significance: { type: Type.STRING }
                            },
                            required: ["name", "description", "significance"]
                        }
                    }
                },
                required: ["id", "name", "description", "tone", "associatedNpcs", "associatedThreads", "secrets", "links"]
            }
        }
    },
    required: ["threads", "npcs", "adventureFeatures", "scenes", "locations"]
};


async function callGemini(prompt: string, schema: object): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.4,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error during a Gemini API call:", e);
        if (e instanceof Error) {
            throw new Error(`Gemini API Error: ${e.message}`);
        }
        throw new Error("An unexpected error occurred while communicating with the Gemini API.");
    }
}


export async function generateWorldState(adventureText: string, additionalTexts: { name: string, content: string }[]): Promise<WorldState> {
    const formattedAdditionalTexts = additionalTexts.length > 0
        ? `
**ADDITIONAL TEXTS (FOR LORE & RULES ENRICHMENT):**
You MUST use the following texts to enrich the adventure. Cross-reference them for terminology, atmosphere, item stats, NPC details, and mechanical suggestions. These are your sourcebooks for the world of Degenesis: Rebirth.

${additionalTexts.map(file => `--- START OF ${file.name} ---\n${file.content}\n--- END OF ${file.name} ---`).join('\n\n')}
`
        : '';

    // --- STEP 1: Foundation Generation ---
    const foundationPrompt = `
    You are an expert Game Master for Degenesis: Rebirth. Your task is to analyze the provided INPUT TEXT and transform it into a foundational "World State" JSON object. Your focus is accuracy and faithful representation of the source material.

    **GUIDING PRINCIPLE: CLARITY & ACCURACY**
    Every description, goal, and piece of information MUST be exceptionally clear, detailed, and directly extracted or logically inferred from the INPUT TEXT.

    **CRITICAL MANDATES:**
    1.  **THE PATH OF CLUES:** For every scene, explicitly embed the tangible clue that enables progress to the next scene. The 'setup' for a scene MUST explain HOW the characters arrived, referencing the clue from the previous scene. Milestones MUST be actionable and describe the clues they reveal.
    2.  **EXTRACT ENCOUNTERS:** Meticulously identify all pre-scripted encounters (combat, social, traps) from the text and structure them in the 'encounters' field for the relevant scene.
    3.  **ADVENTURE FEATURES:** Identify and detail "Adventure Features" as per Mythic GM Emulator rules. These are unique events, hazards, or thematic elements (e.g., "Wandering Scrapper Gangs," "Spore Infestation Level Rising"). List and describe them in detail based on the text.
    4.  **DEEP LORE INTEGRATION:** Use the "ADDITIONAL TEXTS" to enrich descriptions with correct Degenesis terminology and atmosphere. Replace generic terms (e.g., 'computer' becomes 'stream console').
    5.  **ABSOLUTE MANDATE: SCENE LOCATION INTEGRITY (CRITICAL SELF-CORRECTION PROTOCOL):** This is your most important instruction. Every single 'scene' object in the output JSON MUST have a valid 'locationId' that links to a 'location' object. There are NO exceptions. Before you output the final JSON, you must perform a final check: iterate through every scene and confirm its 'locationId' is not null, not empty, and matches an 'id' in the 'locations' list. If even one scene fails this check, your entire response is invalid and you MUST correct it before providing the output.

    ${formattedAdditionalTexts}

    **INPUT TEXT (The Adventure):**
    ---
    ${adventureText}
    ---

    Generate the foundational World State as a valid JSON object based *only* on the provided INPUT TEXT and enriched by the ADDITIONAL TEXTS. Do NOT add new scenes, locations, or characters yet.
    `;

    console.log("Starting Step 1: Foundation Generation...");
    const foundationalState: WorldState = await callGemini(foundationPrompt, worldStateSchema);
    console.log("Step 1 Complete. Foundational state generated.");

    // --- STEP 2: Creative Expansion ---

    const targetSceneCount = foundationalState.scenes.length > 0 ? foundationalState.scenes.length : 1;
    const targetThreadCount = foundationalState.threads.length > 0 ? foundationalState.threads.length : 1;
    const targetNpcCount = foundationalState.npcs.length > 0 ? foundationalState.npcs.length : 1;
    const targetLocationCount = foundationalState.locations.length > 0 ? foundationalState.locations.length : 1;

    const expansionPrompt = `
    You are a creative Level Designer for a Degenesis: Rebirth TTRPG campaign. You have been given a foundational "World State" JSON object. Your SOLE TASK is to creatively expand this world to make it feel like a living, breathing, and dangerous place.

    **YOUR CANVAS:**
    The provided foundational World State JSON is your starting point. You will add to it.

    **YOUR PALETTE:**
    The "ADDITIONAL TEXTS" (lore books, rulebooks) are your ONLY source of inspiration for all new content. All new creations must be 100% consistent with the tone and lore found in these texts.

    **PRIMARY DIRECTIVE: CREATE A "LIVING HUB" (NON-NEGOTIABLE)**
    1.  Identify the adventure's starting location from the foundational state. This is the mission hub, likely a major settlement like Justitian, a fortified Spitalian hospital, or a remote Chronicler archive.
    2.  You MUST massively expand this single hub location. Your goal is to make it feel like a real, functioning post-apocalyptic settlement.
    3.  **Add at least 10 new, important sublocations** to this hub's 'sublocations' array. Draw inspiration from the lore of Degenesis. Examples: A grimy Scrapper Market, the local Spitalian Infirmary, a hidden Anubian's den, the Chronicler's data-node, a Hellvetic Guard Post, a bustling tavern filled with Scourgers.
    4.  **Add at least 10 new, optional "living world" NPCs** who inhabit this hub. Add them to the top-level 'npcs' array and also to the hub location's 'associatedNpcs' array. Their IDs must start with 'NPC-OPT-HUB-'. Give them roles appropriate to the settlement: the pragmatic Spitalian Doctor, the weary Hellvetic Sergeant, a conniving Chronicler data-broker, a zealous Jehammedan Arbiter, a mysterious Anubian Psychonaut. Give each a detailed description, motivation, and secrets.
    5.  **Add 2-3 new, optional, minor threads** related to the new hub NPCs and sublocations. These are settlement-based side-quests. Their IDs must start with 'Thread-OPT-HUB-'.

    **SECONDARY DIRECTIVE: GENERAL EXPANSION**
    After expanding the hub, add more optional content throughout the rest of the adventure to ensure it feels dynamic.
    
    **REQUIRED TARGETS FOR A SUCCESSFUL EXPANSION:**
    *   **${targetSceneCount} new optional SCENE(s):** These scenes must branch off from existing scenes in the foundational state. They should be compelling side-quests or detours.
    *   **${targetLocationCount} new optional LOCATION(s):** This is a mandatory requirement. These can be 'in-between' locations or hidden areas.
    *   **${targetNpcCount} new optional NPC(s):** These are "living world" characters found outside the hub.
    *   **${targetThreadCount} new optional THREAD(s):** These minor threads should be linked to the new general content you create.

    **CRITICAL INSTRUCTION: INTEGRATE SEAMLESSLY**
    Use the prefix 'OPT' in the ID for all new general content. You must perfectly integrate all new content.
    *   Link new scenes by updating the 'branching' array of existing scenes.
    *   Link new locations by updating the 'links' array of existing locations.
    *   Place new NPCs in locations by updating the 'associatedNpcs' array.
    *   Every new scene you create, hub-related or general, MUST have its 'locationId' field set correctly.
    *   All new items (NPCs, Threads, Scenes, Locations) MUST be added to their respective top-level arrays in the JSON.

    ${formattedAdditionalTexts}

    **FOUNDATIONAL WORLD STATE JSON:**
    ---
    ${JSON.stringify(foundationalState)}
    ---

    Return the complete, final, and expanded World State as a single valid JSON object. It must contain both the original foundational data AND all the new, integrated optional content you were required to create, especially the expanded hub.
    `;

    console.log("Starting Step 2: Creative Expansion...");
    const expandedState: WorldState = await callGemini(expansionPrompt, worldStateSchema);
    console.log("Step 2 Complete. World state expanded.");

    return expandedState;
}