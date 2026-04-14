#!/usr/bin/env python3
"""
Clean mantras.sql:
1. Remove prayer fragments (parts of longer prayers)
2. Remove duplicates (keep first occurrence)
3. Remove too-long combined prayers
4. Renumber day_of_year sequentially
5. Output clean SQL
"""

import re

# Days to remove
REMOVE_DAYS = {
    # Gayatri fragments (keep full version day 141)
    137, 138, 139, 140,
    # Ganesha Gayatri fragments
    129, 130, 131,
    # Vakratunda shloka fragments
    132, 133, 134, 135,
    # Aditya Hridayam fragments
    170, 171, 172,
    # Universal salutation fragment
    179,
    # Metta prayer fragments
    196, 197,
    # Vajrasattva fragment
    212,
    # Stainless beam fragment (too long)
    223,
    # Isha Upanishad fragments + combined
    284, 285, 286,
    # Anusara invocation fragments
    302, 303, 304, 305,
    # Universal prayer fragments (keep 309 as standalone)
    310, 311, 312, 313, 314,
    # Pavamana mantra fragments
    315, 316, 317,
    # Devi stuti fragments
    319, 320, 321, 322,
    # Guru stotram fragment
    342,
    # Guru Brahma stotram fragments (keep 349 as standalone)
    350, 351, 352,
    # Year-end combined prayers (too long / duplicates)
    354, 355, 356, 357, 358, 359, 360,
    # Duplicate Lokah Samastah
    364,
    # Full Gayatri (too long to chant in 1 min)
    141,
}

with open('seeds/mantras.sql', 'r') as f:
    content = f.read()

# Extract the header
header = content[:content.index('VALUES') + len('VALUES')]

# Extract individual entries - each starts with (number, and ends with ),  or );
# Split on the pattern that separates entries
values_section = content[content.index('VALUES') + len('VALUES'):]

# Parse entries more carefully - split by the day_of_year pattern
entries = []
current = ''
for line in values_section.split('\n'):
    stripped = line.strip()
    if not stripped:
        continue
    # Check if this starts a new entry
    match = re.match(r'\s*\((\d+),', stripped)
    if match:
        if current:
            entries.append(current)
        current = stripped
    elif current:
        current += '\n' + stripped

if current:
    entries.append(current)

# Parse day numbers and filter
kept = []
seen_translits = set()

for entry in entries:
    match = re.match(r'\s*\((\d+),', entry)
    if not match:
        continue
    day = int(match.group(1))
    
    if day in REMOVE_DAYS:
        continue
    
    # Extract transliteration for duplicate check
    translit_match = re.search(r"^\s*\(\d+,\s*'[^']*',\s*'([^']*)'", entry)
    if translit_match:
        translit = translit_match.group(1)
        if translit in seen_translits:
            print(f"  Skipping duplicate: Day {day} - {translit}")
            continue
        seen_translits.add(translit)
    
    kept.append(entry)

print(f"\nOriginal entries: {len(entries)}")
print(f"Removed: {len(entries) - len(kept)}")
print(f"Remaining: {len(kept)}")

# Renumber sequentially
renumbered = []
for i, entry in enumerate(kept, 1):
    # Replace the day_of_year number
    new_entry = re.sub(r'^\s*\((\d+),', f'  ({i},', entry)
    # Clean trailing comma/semicolon
    new_entry = new_entry.rstrip().rstrip(',').rstrip(';')
    renumbered.append(new_entry)

# Build output
output = "-- Minute Mantra — Mantra Records (cleaned)\n"
output += "-- Prayer fragments, duplicates, and too-long sutras removed\n\n"
output += "INSERT INTO mantras\n"
output += "  (day_of_year, original_script, transliteration, english_translation,\n"
output += "   tradition, intention, phonetic_guide, audio_filename, go_deeper_url,\n"
output += "   go_deeper_teaser, context_note, sacred_geometry_type)\n"
output += "VALUES\n"

for i, entry in enumerate(renumbered):
    if i < len(renumbered) - 1:
        output += entry + ',\n'
    else:
        output += entry + ';\n'

with open('seeds/mantras.sql', 'w') as f:
    f.write(output)

print(f"\nWrote {len(renumbered)} mantras to seeds/mantras.sql")
