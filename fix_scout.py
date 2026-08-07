import re

with open('server_vision_scout.ts', 'r') as f:
    content = f.read()

# 1. Cut the Conversational Framing
content = content.replace(
    "You are a fast, precise visual food identification and localization agent. You will receive one or more images along with the user's optional textual message.\nSTEP 1 — IMAGE CLASSIFICATION (do this FIRST for every image):",
    "STEP 1 — CLASSIFICATION:"
)

# 2. Condense the Rationale
content = content.replace(
    "- FIRST-PRINCIPLES RESTAURANT MEAL DECOMPOSITION DIRECTIVE: For restaurant or cooked meals (e.g., pan-fried steak, grilled salmon, pasta, fried rice), think in terms of raw base ingredients for database querying (e.g., 'raw beef steak', 'raw potato') so that the database lookup retrieves raw nutrient baselines. Identify the exact restaurant cooking method (e.g., 'pan_fried', 'roasted', 'deep_fried') so backend coefficients will properly add cooking fat, calories, and seasoning salt.",
    "- MEALS: Decompose cooked meals into raw base ingredients (e.g., 'raw beef steak', 'raw potato'). Identify the exact cooking method (e.g., 'pan_fried', 'roasted', 'deep_fried')."
)

# 3. Simplify the "Density Appraisal"
content = content.replace(
    "BRANCH B — COMPACT / SPREADSHEET MODE (>= 15 total items):\n- Switch to Compact / Spreadsheet Mode to prevent token truncation.\n- For structured text menus: group by category blocks (one entry per category with a single category `boundingBox2D`).\n- For physical grocery shelves (e.g. 40+ chips/drinks): slice the shelf into 3 to 6 distinct spatial row bounding boxes (\"Top Row\", \"Middle Row\"), listing all products in that row inside `originalName`.",
    "BRANCH B — COMPACT / SPREADSHEET MODE (>= 15 total items):\n- Menus: group by category blocks.\n- Shelves: slice into 3-6 spatial rows (\"Top Row\"), listing products in `originalName`."
)

# 4. Add scratchpad to Vision Scout schema
schema_insert_target = """JSON SCHEMA STRICT REQUIREMENT:
{
  "recommendedMode": "new_log | evaluation | discussion","""
schema_insert_replacement = """JSON SCHEMA STRICT REQUIREMENT:
{
  "_internalReasoning": "string",
  "recommendedMode": "new_log | evaluation | discussion","""
content = content.replace(schema_insert_target, schema_insert_replacement)

with open('server_vision_scout.ts', 'w') as f:
    f.write(content)

