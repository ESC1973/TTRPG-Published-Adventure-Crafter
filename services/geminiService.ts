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
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'Thread-1'" },
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
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'NPC-1'" },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Visuals and demeanor. Include details about their immediate actions and any notable gear they possess." },
                    disposition: { type: Type.STRING },
                    motivation: { type: Type.STRING, description: "Be explicit about what this NPC wants to achieve, both in the short term (within the scene) and long term (in the adventure)." },
                    secrets: { type: Type.STRING },
                    statBlockSuggestion: { type: Type.STRING, description: "e.g., 'Heretek (Core Rulebook p. 346)'" }
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
                    feature: { type: Type.STRING },
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
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'SCENE-01'" },
                    title: { type: Type.STRING },
                    setup: { type: Type.STRING, description: "Detailed, immersive setup. For scenes after the first, it MUST begin by explaining how the Acolytes arrived, referencing the specific clue from the previous scene. It must establish the immediate situation, the player's objective, and any critical starting information. Integrate key NPC dialogue or actions from the source text to guide the player." },
                    obstacles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mechanics: { type: Type.ARRAY, items: { type: Type.STRING, description: "e.g., 'Tech-Use (-10) to bypass cogitator'" } },
                    milestones: { type: Type.ARRAY, items: { type: Type.STRING, description: "A list of specific, concrete objectives. If a milestone provides a clue to another scene, it MUST explicitly state this connection. E.g., 'By hacking the cogitator, you find a hidden log file with coordinates to a warehouse in the lower hive (leads to SCENE-02)'." } },
                    encounters: {
                        type: Type.ARRAY,
                        description: "A list of specific, pre-defined encounters that can occur within this scene, extracted directly from the adventure text. These can be combat, social, or environmental.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "A concise name for the encounter, e.g., 'Scavvy Ambush'." },
                                trigger: { type: Type.STRING, description: "The specific condition that causes this encounter to occur, e.g., 'Opening the crate in the corner'." },
                                description: { type: Type.STRING, description: "A detailed description of the encounter, including enemy placement, tactics, potential dialogue, and the immediate situation." },
                                statBlockSuggestions: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "Array of stat block suggestions for any enemies involved, e.g., '3x Scavvy Gangers (Core Rulebook p. 350)'"
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
                required: ["id", "title", "setup", "obstacles", "mechanics", "milestones", "encounters", "associatedNpcs", "associatedThreads", "branching"]
            }
        },
        locations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID, e.g., 'LOC-01'" },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A functional and atmospheric description. Mention key features, potential points of interaction, and any obvious, immediately visible entry or exit points." },
                    tone: { type: Type.STRING, description: "Atmosphere of the location, e.g., 'Oppressive, industrial dread'" },
                    associatedNpcs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    associatedThreads: { type: Type.ARRAY, items: { type: Type.STRING } },
                    secrets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    links: {
                        type: Type.ARRAY,
                        description: "An array of objects describing exits to other locations. The description MUST be informative, e.g., 'A grime-covered service hatch that leads to the lower maintenance tunnels (LOC-02)'",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING, description: "The description of the exit, e.g., 'Archway North'"},
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

export async function generateWorldState(adventureText: string, additionalTexts: { name: string, content: string }[]): Promise<WorldState> {
  const formattedAdditionalTexts = additionalTexts.length > 0 
    ? `
**ADDITIONAL TEXTS (FOR LORE & RULES ENRICHMENT):**
You MUST use the following texts to enrich the adventure. Cross-reference them for terminology, atmosphere, item stats, NPC details, and mechanical suggestions.

${additionalTexts.map(file => `--- START OF ${file.name} ---\n${file.content}\n--- END OF ${file.name} ---`).join('\n\n')}
`
    : '';

  const prompt = `
    You are an expert Game Master for the Dark Heresy 1st Edition TTRPG. Your task is become a Table Top Roleplaying Game level designer to transform the provided adventure text into a structured "World State" for solo roleplaying.

    **GUIDING PRINCIPLE: CLARITY FOR THE AI GAME MASTER**
    The generated World State will be used as a script for another AI to run the adventure. Therefore, every description, goal, and piece of information MUST be exceptionally clear, detailed, and unambiguous. The goal is to provide a comprehensive guide that leaves no room for misinterpretation, giving the Acolytes (and the AI GM) a clear understanding of what to do, why it's important, and how to proceed.

    **CRITICAL INSTRUCTION: THE PATH OF CLUES (NON-NEGOTIABLE)**
    This is the absolute most important rule. Failure to follow this with extreme precision will render the output useless. You must act as a forensic analyst. For every single scene, you MUST identify the specific, tangible clue, item, or piece of information that enables progress to the next logical scene. This information MUST be embedded directly and explicitly.
    1.  **Justify Progression Explicitly (MANDATORY):** The 'setup' for every scene after the first **MUST** begin by explaining HOW the Acolytes arrived, referencing the **SPECIFIC** clue from the previous scene. You should almost quote the discovery.
        *   **FAILURE:** "You arrive at the warehouse."
        *   **CORRECT:** "Using the shipping address ('K-14, Secundus Hab-Block') found on the dead cultist's note from the alleyway, you now stand before the correct warehouse..."
    2.  **Embed Actionable Clues (MANDATORY):** Information that links scenes **MUST** be an explicit part of the 'setup', 'milestones', or 'obstacles'. The clue must be described in a way that the player understands its significance.
        *   **VAGUE MILESTONE:** "Find the data-slate."
        *   **ACTIONABLE MILESTONE:** "Find the cracked data-slate. On its flickering screen is a partial astropathic coordinate set and a frantic message mentioning the 'Charnel Pit Chapel' (this is the clue that leads to SCENE-03)."
        *   **VAGUE LINK:** "A door to the north."
        *   **ACTIONABLE LINK:** "A heavy, rust-stained blast door to the north, humming faintly. It is sealed with a cog-and-skull symbol matching the one on the key you recovered from the cultist leader (this opens the way to LOC-03)."
    3.  **Frame Milestones as Discoveries:** The "milestones" for each scene must be specific, concrete actions or discoveries. Frame them as clear objectives that explicitly state what is gained (e.g., 'Discover the heretical pict-log on the cogitator, revealing the cult's secret meeting point (LOC-05)').
    4. The Starting or First SCENE is one of the most important SCENES. It should be able to provide all evidences,who are and where they could be the possible suspects/criminals/heretics/enemies of the empire related to the adventure. It does not matter if they are really the baddies, but point towards them and teh Acolytes should determine through the investigation if they are or not involved in the Heresy,

    **CRITICAL INSTRUCTION: EXTRACT ENCOUNTERS**
    Adventures contain pre-scripted encounters (ambushes, social challenges, traps, environmental hazards). You MUST identify these and place them within the new 'encounters' field for the corresponding scene.
    1.  **Identify Encounters:** Read the adventure text carefully to find any section that describes a specific, pre-planned event or challenge for the players. This is distinct from the general scene 'obstacles'.
    2.  **Detail the Trigger:** For each encounter, you must specify the exact trigger. What action do the players take that initiates this encounter? (e.g., "Opening the large shipping container," "Attempting to hack the security terminal," "Walking down the main corridor").
    3.  **Provide Full Description:** The encounter's description must include all relevant details from the text: the number and type of enemies, their starting positions and tactics, any important environmental features, or key dialogue for social encounters.

    **GENERAL INSTRUCTIONS:**
    1.  **Detailed and Instructive Descriptions:** Do not just describe what something looks like. Explain its purpose, its current state, and its relevance to the Acolytes' mission.
        *   **Scene Setups:** Must act as a direct mission briefing for the player. Integrate key NPC dialogue or actions from the source text immersively.
        *   **NPCs:** Descriptions should include demeanor, current actions, and notable gear. Motivations must be explicit.
        *   **Threads:** Descriptions must be a clear, actionable summary of the overall goal.
        *   **Locations:** Descriptions must be functional, not just atmospheric. Mention key features and points of interaction.
    2.  **Enrich with Lore:** You MUST cross-reference your extensive knowledge of the Dark Heresy 1st Edition setting and the provided "ADDITIONAL TEXTS" to enrich all descriptions.
        2.1 For exmaple if Enemies of the Imperium are mentioned throught the Input text, deep-dive through the Additional Files (corebooks, rules, context knowledge) to insert new motivations, hidden-plans, references.
        2.2. Insert he possibility of conflict, encounters, tension with other opponent branches of the Ordo Inquisition, radical or orthodox Inquisitor rivals (depends on the starting Inquisitor boss of the acolyte cell). You will find sufficient information in the extensive knowledge of the system provided in the additional texts. Insert them as possible appearing NPCS, Scene and encounter inetraction. With this respect, it can be either an ally or an opponent, randomly create them and insert them in the adventure structure.
    3.  **Terminology & Atmosphere:** Replace generic terms with specific Dark Heresy vernacular (e.g., 'computer' becomes 'cogitator'). Infuse every description with grimdark, gothic sensory details.
    4.  **Mechanics:** For any challenge, suggest appropriate Dark Heresy 1st Edition Skill Tests with difficulty modifiers (e.g., "Tech-Use (-20) Test to placate the machine spirit").
    5.  **Output Format:** Your ENTIRE output MUST be a single, valid JSON object that strictly conforms to the provided schema. Do not include any explanatory text, markdown formatting, or anything outside the JSON structure.

    ${formattedAdditionalTexts}

    **INPUT TEXT (The Adventure):**
    ---
    ${adventureText}
    ---

    Now, generate the complete World State as a valid JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: worldStateSchema,
                temperature: 0.1, // Lower temperature for more deterministic and fact-based output
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as WorldState;

    } catch (e) {
        console.error("Error during Gemini API call or parsing:", e);
        if (e instanceof Error) {
            throw new Error(`Gemini API Error: ${e.message}`);
        }
        throw new Error("An unexpected error occurred while communicating with the Gemini API.");
    }
}