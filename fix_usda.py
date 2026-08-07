import re

with open('server_pure_helpers.ts', 'r') as f:
    content = f.read()

content = content.replace('setVal("addedSugar", ["added sugar"]);', 'setVal("addedSugar", ["added sugar"]);\n  setVal("sugar", ["sugars, total including nlea", "sugars, total", "sugar", "total sugars"]);')

content = content.replace('setNum("addedSugar", "sugars_100g");', 'setNum("addedSugar", "added_sugars_100g");\n  setNum("sugar", "sugars_100g");')

with open('server_pure_helpers.ts', 'w') as f:
    f.write(content)
