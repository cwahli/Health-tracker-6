import re

with open('server.ts', 'r') as f:
    content = f.read()

schema_insert_target = """JSON SCHEMA STRICT REQUIREMENT:
{
  "mode": "new_log | discussion | modify | evaluation | origin","""
schema_insert_replacement = """JSON SCHEMA STRICT REQUIREMENT:
{
  "_internalReasoning": "string",
  "mode": "new_log | discussion | modify | evaluation | origin","""
content = content.replace(schema_insert_target, schema_insert_replacement)

with open('server.ts', 'w') as f:
    f.write(content)

