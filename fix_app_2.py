import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'    const updatedProfile: UserProfile = \{\n      \.\.\.profile,\n      customBiomarkers: updatedCustomBiomarkers\n    \};',
    r'    const updatedProfile: UserProfile = {\n      ...profile,\n      customBiomarkers: updatedCustomBiomarkers,\n      deletedCustomBiomarkerKeys\n    };',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

